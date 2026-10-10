/** Pure generators for AI prompts and database schema templates (Developer Console). */
export const ROUT_ISSUER = "https://rout.be";
export const DISCOVERY_URL = `${ROUT_ISSUER}/.well-known/openid-configuration`;

export type AppType = "web" | "spa" | "native";
export type AiTool = "cursor" | "copilot" | "lovable" | "generic";
export type Stack = "nextjs" | "tanstack" | "express" | "other";

export type TemplateApp = {
  clientId: string;
  scopes: string[];
  redirectUris: string[];
  requirePkce: boolean;
  richIdentityEnabled: boolean;
  accountDiscoveryEnabled: boolean;
};

const STACKS: Record<Stack, string> = {
  nextjs: "Next.js (App Router, route handlers)",
  tanstack: "TanStack Start (createServerFn + server routes)",
  express: "Node.js / Express",
  other: "my current stack",
};

const TOOLS: Record<AiTool, string> = {
  cursor: "You are working inside Cursor on my codebase.",
  copilot: "You are GitHub Copilot Chat working in my repository.",
  lovable: "You are Lovable, building my app.",
  generic: "You are an expert full-stack engineer.",
};

/** Claims returned per scope (mirrors identityClaims in provider.server.ts). */
export const SCOPE_CLAIMS: Record<string, string[]> = {
  openid: ["sub"],
  profile: ["preferred_username", "name", "picture"],
  email: ["email", "email_verified"],
  linked_accounts: ["linked_accounts[].provider", "linked_accounts[].account_id"],
};

export function claimsForScopes(scopes: string[]): string[] {
  const out = new Set<string>(["sub"]);
  for (const s of scopes) for (const c of SCOPE_CLAIMS[s] ?? []) out.add(c);
  return [...out];
}

export function buildAiPrompt(app: TemplateApp, tool: AiTool, stack: Stack): string {
  const scopes = app.scopes.join(" ");
  const redirect = app.redirectUris[0] ?? "https://yourapp.com/auth/callback";
  const lines = [
    TOOLS[tool],
    `Implement "Login with ROUT" (OpenID Connect) in ${STACKS[stack]}.`,
    "",
    "## Configuration",
    `- Discovery URL: ${DISCOVERY_URL}`,
    `- client_id: ${app.clientId}`,
    "- client_secret: read from env var ROUT_CLIENT_SECRET (server-side only, never ship to the browser)",
    `- Scopes: ${scopes}`,
    `- Redirect URI: ${redirect}`,
    `- PKCE: ${app.requirePkce ? "REQUIRED (S256)" : "recommended (S256)"}`,
    `- Claims you will receive (userinfo / id_token): ${claimsForScopes(app.scopes).join(", ")}`,
    "",
    "## Flow requirements",
    "1. Fetch endpoints from the Discovery URL (do not hardcode them).",
    "2. Authorization Code flow with PKCE S256: generate code_verifier, state and nonce per attempt; store them in an HttpOnly, Secure, SameSite=Lax cookie.",
    "3. On the callback, verify `state`, then exchange the code at the token endpoint ON THE SERVER with the code_verifier.",
    "4. Validate the id_token: signature via JWKS (ES256), iss, aud === client_id, exp, and nonce.",
    "5. Create a session for the user; never expose tokens to client-side JavaScript.",
    "6. Map ROUT errors (?error=...) to friendly UI messages.",
    "",
    "## Database changes",
    "- Add a unique `rout_id` (text, the `sub` claim) to the users table.",
    "- Add `email_verified` boolean from the email_verified claim.",
  ];
  if (app.richIdentityEnabled) {
    lines.push(
      "- Rich Identity is enabled: add booleans `is_verified_person`, `is_verified_business`, `is_influencer` and update them from claims on every login (never trust client input for these).",
    );
  }
  if (app.accountDiscoveryEnabled) {
    lines.push(
      "- Account Auto-Discovery is enabled: when a ROUT login arrives with a verified email that matches an existing user, LINK it to that user (insert into `user_identities` with provider='rout') instead of creating a duplicate. Only merge when email_verified is true.",
      "- Support silent sign-in with `prompt=none`; handle `login_required` by falling back to the normal button.",
    );
  }
  lines.push(
    "",
    "## Deliverables",
    "- A 'Login with ROUT' button, callback handler, logout, and the migration.",
    "- No analytics or tracking scripts on the auth pages.",
  );
  return lines.join("\n");
}

export function buildSqlSchema(app: TemplateApp): string {
  const rich = app.richIdentityEnabled
    ? `,
  is_verified_person   boolean not null default false,
  is_verified_business boolean not null default false,
  is_influencer        boolean not null default false`
    : "";
  let out = `-- Users: one row per person in your app
create table users (
  id             uuid primary key default gen_random_uuid(),
  email          text unique,
  email_verified boolean not null default false,
  rout_id        text unique,           -- ROUT 'sub' claim${rich},
  created_at     timestamptz not null default now()
);`;
  if (app.accountDiscoveryEnabled) {
    out += `

-- Account Auto-Discovery: link ROUT to existing accounts instead of duplicating
create table user_identities (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references users(id) on delete cascade,
  provider    text not null,             -- 'rout', 'password', ...
  provider_id text not null,             -- ROUT 'sub'
  linked_at   timestamptz not null default now(),
  unique (provider, provider_id),        -- one ROUT account → one user
  unique (user_id, provider)             -- one ROUT link per user
);
-- Merge rule: only link when the id_token says email_verified = true.`;
  }
  return out;
}

export function buildPrismaSchema(app: TemplateApp): string {
  const rich = app.richIdentityEnabled
    ? `
  isVerifiedPerson   Boolean @default(false) @map("is_verified_person")
  isVerifiedBusiness Boolean @default(false) @map("is_verified_business")
  isInfluencer       Boolean @default(false) @map("is_influencer")`
    : "";
  let out = `model User {
  id            String   @id @default(uuid())
  email         String?  @unique
  emailVerified Boolean  @default(false) @map("email_verified")
  routId        String?  @unique @map("rout_id")${rich}
  createdAt     DateTime @default(now()) @map("created_at")${app.accountDiscoveryEnabled ? "\n  identities    UserIdentity[]" : ""}
}`;
  if (app.accountDiscoveryEnabled) {
    out += `

model UserIdentity {
  id         String   @id @default(uuid())
  userId     String   @map("user_id")
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  provider   String
  providerId String   @map("provider_id")
  linkedAt   DateTime @default(now()) @map("linked_at")

  @@unique([provider, providerId])
  @@unique([userId, provider])
}`;
  }
  return out;
}
