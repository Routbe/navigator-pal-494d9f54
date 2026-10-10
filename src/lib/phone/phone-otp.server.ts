import { sql } from "@/lib/neon";
import { runSchemaEnsure } from "@/lib/db/schema-ensure.server";
import { hitRateLimit } from "@/lib/rate-limit-db.server";
import { RATE_RULES } from "@/lib/rate-limit-rules";
import { evaluateOtp, generateOtp, maskPhone, OTP_TTL_MS } from "./otp-rules";
import { encryptText, keyedHash } from "./phone-crypto";
import { getSmsSender, missingSmsKeys } from "./sms-provider.server";

let ready: Promise<void> | null = null;
function ensure() {
  ready ??= runSchemaEnsure(async () => {
    await sql`create table if not exists public.user_phone_numbers (
      user_id uuid primary key, phone_number_enc text not null, phone_hash text not null,
      phone_last4 text not null, phone_verified boolean not null default false,
      phone_verified_at timestamptz, updated_at timestamptz not null default now())`;
    await sql`create table if not exists public.phone_otp_codes (
      id uuid primary key default gen_random_uuid(), user_id uuid not null, phone_hash text not null,
      phone_number_enc text not null, phone_last4 text not null, code_hash text not null,
      attempts int not null default 0, expires_at timestamptz not null, consumed_at timestamptz,
      created_at timestamptz not null default now())`;
  }, "phone-otp");
  return ready;
}

const secret = () => process.env["PHONE_ENCRYPTION_KEY"] ?? "";

export type PhoneStatus = { configured: boolean; verified: boolean; masked: string | null };

export async function phoneStatus(userId: string): Promise<PhoneStatus> {
  const configured = missingSmsKeys().length === 0;
  try {
    await ensure();
    const rows = (await sql`select phone_last4, phone_verified from public.user_phone_numbers
      where user_id = ${userId} limit 1`) as { phone_last4: string; phone_verified: boolean }[];
    const r = rows[0];
    return { configured, verified: Boolean(r?.phone_verified), masked: r ? maskPhone(r.phone_last4) : null };
  } catch {
    return { configured, verified: false, masked: null };
  }
}

export type RequestResult =
  | { status: "sent"; expiresAt: string; masked: string }
  | { status: "not_configured" }
  | { status: "rate_limited"; retryAfter: number }
  | { status: "send_failed" };

export async function requestPhoneCode(userId: string, phone: string, ip: string): Promise<RequestResult> {
  const sender = getSmsSender();
  if (!sender) {
    console.warn(`[phone] SMS not configured; missing ${missingSmsKeys().join(", ")}`);
    return { status: "not_configured" };
  }
  await ensure();
  const phoneHash = await keyedHash(phone, secret());
  for (const [name, subject, rule] of [
    ["sms-user", userId, RATE_RULES.smsSendUser],
    ["sms-phone", phoneHash, RATE_RULES.smsSendPhone],
    ["sms-ip", ip, RATE_RULES.smsSendIp],
  ] as const) {
    const r = await hitRateLimit(name, subject, rule);
    if (!r.ok) return { status: "rate_limited", retryAfter: r.retryAfter };
  }
  const code = generateOtp();
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();
  const last4 = phone.slice(-4);
  // Older open codes for this user stop working.
  await sql`update public.phone_otp_codes set consumed_at = now() where user_id = ${userId} and consumed_at is null`;
  await sql`insert into public.phone_otp_codes (user_id, phone_hash, phone_number_enc, phone_last4, code_hash, expires_at)
    values (${userId}, ${phoneHash}, ${await encryptText(phone, secret())}, ${last4},
            ${await keyedHash(`${userId}:${code}`, secret())}, ${expiresAt})`;
  try {
    await sender.send(phone, `Je ROUT-code: ${code}. Geldig 10 minuten. Deel deze code met niemand.`);
  } catch {
    return { status: "send_failed" };
  }
  return { status: "sent", expiresAt, masked: maskPhone(last4) };
}

export type VerifyResult = { status: "verified"; masked: string } | { status: "expired" | "too_many_attempts" | "invalid" | "no_code" | "rate_limited" };

export async function verifyPhoneCode(userId: string, code: string): Promise<VerifyResult> {
  await ensure();
  const limit = await hitRateLimit("sms-verify", userId, RATE_RULES.smsVerify);
  if (!limit.ok) return { status: "rate_limited" };
  const rows = (await sql`select * from public.phone_otp_codes where user_id = ${userId} and consumed_at is null
    order by created_at desc limit 1`) as Record<string, unknown>[];
  const row = rows[0];
  if (!row) return { status: "no_code" };
  const matches = (await keyedHash(`${userId}:${code}`, secret())) === row["code_hash"];
  const outcome = evaluateOtp(
    { expiresAt: new Date(row["expires_at"] as string).getTime(), attempts: Number(row["attempts"]), consumed: false },
    Date.now(),
    matches,
  );
  if (outcome === "invalid") {
    await sql`update public.phone_otp_codes set attempts = attempts + 1 where id = ${row["id"] as string}`;
    return { status: "invalid" };
  }
  if (outcome !== "ok") return { status: outcome === "consumed" ? "no_code" : outcome };
  await sql`update public.phone_otp_codes set consumed_at = now() where id = ${row["id"] as string}`;
  await sql`insert into public.user_phone_numbers (user_id, phone_number_enc, phone_hash, phone_last4, phone_verified, phone_verified_at)
    values (${userId}, ${row["phone_number_enc"] as string}, ${row["phone_hash"] as string}, ${row["phone_last4"] as string}, true, now())
    on conflict (user_id) do update set phone_number_enc = excluded.phone_number_enc, phone_hash = excluded.phone_hash,
      phone_last4 = excluded.phone_last4, phone_verified = true, phone_verified_at = now(), updated_at = now()`;
  return { status: "verified", masked: maskPhone(String(row["phone_last4"])) };
}

export async function removePhone(userId: string): Promise<void> {
  await ensure();
  await sql`delete from public.user_phone_numbers where user_id = ${userId}`;
  await sql`update public.phone_otp_codes set consumed_at = now() where user_id = ${userId} and consumed_at is null`;
}
