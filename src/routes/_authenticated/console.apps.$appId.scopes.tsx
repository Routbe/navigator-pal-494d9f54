import { createFileRoute } from "@tanstack/react-router";
import { ConsoleCard, ConsolePage } from "@/components/console/ConsolePage";
import { useAppPage } from "@/components/console/useAppPage";
import { Switch } from "@/components/ui/switch";

export const Route = createFileRoute("/_authenticated/console/apps/$appId/scopes")({
  component: ScopesPage,
});

const SCOPES = [
  { id: "openid", label: "openid", text: "Verplicht. Geeft een vaste, anonieme gebruikers-ID (sub).", locked: true },
  { id: "profile", label: "profile", text: "Naam, @handle en profielfoto.", locked: false },
  { id: "email", label: "email", text: "E-mailadres en of het bevestigd is.", locked: false },
];

function ScopesPage() {
  const { appId } = Route.useParams();
  const { app, persist, saving } = useAppPage(appId);
  const origin = typeof window === "undefined" ? "https://rout.be" : window.location.origin;
  const snippet = `${origin}/oauth/authorize?response_type=code
  &client_id=${app.clientId}
  &redirect_uri=${encodeURIComponent(app.redirectUris[0] ?? "")}
  &scope=${app.scopes.join("%20")}
  &state=RANDOM&nonce=RANDOM
  &code_challenge=BASE64URL(SHA256(verifier))
  &code_challenge_method=S256`;

  return (
    <ConsolePage title="Scopes" description="Vraag enkel wat je app echt nodig heeft.">
      <ConsoleCard>
        <ul className="divide-y divide-border">
          {SCOPES.map((s) => (
            <li key={s.id} className="flex items-center gap-4 py-3">
              <div className="flex-1">
                <code className="text-sm">{s.label}</code>
                <p className="text-xs text-muted-foreground">{s.text}</p>
              </div>
              <Switch
                checked={app.scopes.includes(s.id)}
                disabled={s.locked || saving}
                onCheckedChange={(on) =>
                  persist({ scopes: on ? [...app.scopes, s.id] : app.scopes.filter((x) => x !== s.id) })
                }
              />
            </li>
          ))}
        </ul>
      </ConsoleCard>
      <ConsoleCard title="Universal Handle Sync">
        <div className="flex items-start gap-4">
          <div className="flex-1 space-y-1">
            <span className="inline-block rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Premium</span>
            <p className="text-sm text-muted-foreground">
              Opt-in to use ROUT as the Single Source of Truth for usernames. We will include the sovereign <code>@handle</code> in the OIDC UserInfo endpoint and prevent username squatting on your platform.
            </p>
            <p className="text-xs text-muted-foreground">Sent as the <code>rout_handle</code> claim when the <code>profile</code> scope is granted.</p>
          </div>
          <Switch aria-label="Universal Handle Sync" checked={app.handleSyncEnabled} disabled={saving} onCheckedChange={(on) => persist({ handleSyncEnabled: on })} />
        </div>
      </ConsoleCard>
      <ConsoleCard title="Autorisatie-URL (PKCE)" description="PKCE met S256 is verplicht.">
        <pre className="overflow-x-auto rounded-lg bg-muted p-4 text-xs">{snippet}</pre>
      </ConsoleCard>
    </ConsolePage>
  );
}
