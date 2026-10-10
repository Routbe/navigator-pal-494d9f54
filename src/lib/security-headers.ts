/** Pure security-header rules (applied in src/start.ts, covered by tests). */

/** Only rout.be and the Lovable editor may frame the app. */
export const FRAME_ANCESTORS =
  "frame-ancestors 'self' https://rout.be https://*.rout.be https://lovable.dev https://*.lovable.dev https://*.lovable.app https://*.lovableproject.com";

/** Public OIDC endpoints — the only paths that may answer cross-origin. */
export const PUBLIC_OIDC_PATHS = [
  "/.well-known/openid-configuration",
  "/.well-known/jwks.json",
  "/api/public/oauth/token",
  "/api/public/oauth/userinfo",
];

export function isPublicOidcPath(pathname: string): boolean {
  return PUBLIC_OIDC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function securityHeaders(isHttps: boolean): Record<string, string> {
  const h: Record<string, string> = {
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "X-DNS-Prefetch-Control": "off",
    "Permissions-Policy": "geolocation=(), microphone=(), payment=()",
    "Content-Security-Policy": `${FRAME_ANCESTORS}; base-uri 'self'; object-src 'none'`,
    // Popups stay usable for OAuth (Login met ROUT, social sign-in).
    "Cross-Origin-Opener-Policy": "same-origin-allow-popups",
  };
  if (isHttps) h["Strict-Transport-Security"] = "max-age=31536000; includeSubDomains";
  return h;
}

const SESSION_COOKIE = /^(rout_session|__Secure-rout_session|better-auth\.[^=]*|__Secure-better-auth\.[^=]*)=/i;

/** Returns the problems with a session Set-Cookie header (empty = fine or not a session cookie). */
export function sessionCookieProblems(setCookie: string): string[] {
  if (!SESSION_COOKIE.test(setCookie)) return [];
  const flags = setCookie.toLowerCase();
  const problems: string[] = [];
  if (!/;\s*httponly/.test(flags)) problems.push("HttpOnly");
  if (!/;\s*secure/.test(flags)) problems.push("Secure");
  if (!/;\s*samesite=(lax|strict)/.test(flags)) problems.push("SameSite=Lax");
  return problems;
}
