import { describe, expect, it } from "vitest";
import { claimsForScopes, buildAiPrompt, buildPrismaSchema, buildSqlSchema, DISCOVERY_URL } from "./integration-templates";
import { hintFor } from "./debug-hints";

const app = {
  clientId: "rout_abc",
  scopes: ["openid", "email"],
  redirectUris: ["https://x.be/cb"],
  requirePkce: true,
  richIdentityEnabled: true,
  accountDiscoveryEnabled: false,
};

describe("integration templates", () => {
  it("injects client id, discovery url and scopes, never a secret", () => {
    const p = buildAiPrompt(app, "cursor", "nextjs");
    expect(p).toContain("rout_abc");
    expect(p).toContain(DISCOVERY_URL);
    expect(p).toContain("openid email");
    expect(p).toContain("is_verified_person");
    expect(p).not.toMatch(/routsec_/);
  });
  it("adds identity link table only with auto-discovery", () => {
    expect(buildSqlSchema(app)).not.toContain("user_identities");
    expect(buildSqlSchema({ ...app, accountDiscoveryEnabled: true })).toContain("user_identities");
    expect(buildPrismaSchema({ ...app, accountDiscoveryEnabled: true })).toContain("model UserIdentity");
  });
  it("lists claims per granted scope only", () => {
    expect(claimsForScopes(["openid", "email"])).toEqual(["sub", "email", "email_verified"]);
    expect(claimsForScopes(["openid"])).not.toContain("picture");
    expect(buildAiPrompt(app, "generic", "other")).toContain("email_verified");
  });
  it("maps errors to fixes", () => {
    expect(hintFor("missing_code_challenge")?.fix).toContain("S256");
    expect(hintFor("invalid_grant", "PKCE-controle mislukt.")?.title).toContain("PKCE");
    expect(hintFor(null)).toBeNull();
  });
});
