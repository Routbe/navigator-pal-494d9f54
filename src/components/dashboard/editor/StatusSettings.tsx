import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { AvatarFrameWrapper } from "@/components/profile/AvatarFrameWrapper";
import { StatusBubble } from "@/components/profile/StatusBubble";
import { PRESENCE_DEFS } from "@/lib/avatar-decorations";
import { BUBBLE_FONTS, BUBBLE_STYLES, singleEmoji, type BubblePosition } from "@/lib/status-bubble";
import type { ProfileDisplayPrefs } from "@/lib/profile-display";

type SetPref = <K extends keyof ProfileDisplayPrefs>(key: K, value: ProfileDisplayPrefs[K]) => void;
const pill = (on: boolean) =>
  cn("h-9 shrink-0 rounded-full border px-3 text-[11px] font-medium transition-colors", on ? "border-primary/50 bg-primary/10" : "border-border");

/** Links tab: what the status says (dot state + short text). */
export function StatusContentSettings({ prefs, setPref }: { prefs: ProfileDisplayPrefs; setPref: SetPref }) {
  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-4 sm:p-5">
      <div>
        <h2 className="text-lg font-medium">💬 Status</h2>
        <p className="mt-1 text-sm text-muted-foreground">Je statusbolletje en een korte tekst die als ballonnetje bij je avatar zweeft. Het uiterlijk kies je in Design &amp; styling.</p>
      </div>
      <div className="space-y-2">
        <p className="input-label">Statusbolletje</p>
        <div className="flex flex-wrap gap-2">
          {PRESENCE_DEFS.map((p) => (
            <button key={p.id} type="button" title={p.hint} aria-pressed={prefs.presence === p.id} onClick={() => setPref("presence", p.id)} className={cn(pill(prefs.presence === p.id), "flex items-center gap-2")}>
              <span aria-hidden className="h-2.5 w-2.5 rounded-full border border-border" style={{ background: p.color }} />
              {p.label}
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-1.5">
        <p className="input-label">Statuslijn</p>
        <Input value={prefs.statusLine ?? ""} maxLength={60} onChange={(e) => setPref("statusLine", e.target.value || null)} placeholder="Beschikbaar voor werk" className="h-10 text-xs" />
        <p className="text-xs text-muted-foreground">{(prefs.statusLine ?? "").length}/60 tekens · leeg = geen ballon.</p>
      </div>
    </section>
  );
}

const COMPASS: (BubblePosition | null)[] = ["top-left", "top", "top-right", "left", null, "right", "bottom-left", "bottom", "bottom-right"];
const POS_LABEL: Record<BubblePosition, string> = {
  "top-left": "Linksboven", top: "Boven", "top-right": "Rechtsboven", left: "Links", right: "Rechts",
  "bottom-left": "Linksonder", bottom: "Onder", "bottom-right": "Rechtsonder",
};

/** Design tab: how the dot and the bubble look. */
export function StatusDesignSettings({ prefs, setPref, avatarUrl, theme }: {
  prefs: ProfileDisplayPrefs; setPref: SetPref; avatarUrl: string; theme: { bg: string; card: string; text: string; border: string; muted: string; accent?: string };
}) {
  const useEmoji = prefs.presenceIndicator === "emoji";
  const previewText = prefs.statusLine || "Beschikbaar voor werk";
  return (
    <div className="space-y-5 border-t border-border pt-4">
      <div className="flex justify-center rounded-xl border border-border px-4 py-14" style={{ background: theme.bg, color: theme.text }}>
        <div className="relative inline-flex">
          <AvatarFrameWrapper frame={prefs.avatarFrame} theme={theme as never} presence={prefs.presence} indicator={prefs.presenceIndicator} emoji={prefs.presenceEmoji}>
            {avatarUrl ? <img src={avatarUrl} alt="" className="h-16 w-16 rounded-full object-cover" aria-hidden /> : <span className="block h-16 w-16 rounded-full" style={{ background: theme.card }} aria-hidden />}
          </AvatarFrameWrapper>
          <StatusBubble text={previewText} position={prefs.statusBubblePosition} bubbleStyle={prefs.statusBubbleStyle} bg={prefs.statusBubbleBg} font={prefs.statusBubbleFont} />
        </div>
      </div>

      <div className="space-y-3">
        <p className="input-label">Statusbolletje — design</p>
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-medium">Icoon toevoegen</p><p className="text-xs text-muted-foreground">Vinkje, maan of streepje over de kleur.</p></div>
          <Switch aria-label="Icoon toevoegen" checked={prefs.presenceIndicator === "color_with_icon"} onCheckedChange={(on) => setPref("presenceIndicator", on ? "color_with_icon" : "color")} />
        </div>
        <div className="flex items-center justify-between gap-4">
          <div><p className="text-sm font-medium">Eigen emoji gebruiken</p><p className="text-xs text-muted-foreground">Vervangt het gekleurde bolletje door één emoji.</p></div>
          <Switch aria-label="Eigen emoji gebruiken" checked={useEmoji} onCheckedChange={(on) => setPref("presenceIndicator", on ? "emoji" : "color")} />
        </div>
        {useEmoji && (
          <div className="flex items-center gap-3">
            <Input
              aria-label="Status-emoji"
              inputMode="text"
              defaultValue={prefs.presenceEmoji ?? ""}
              onChange={(e) => {
                const ok = singleEmoji(e.target.value);
                if (ok || !e.target.value) setPref("presenceEmoji", ok);
              }}
              placeholder="😎"
              className="h-12 w-16 text-center text-2xl"
            />
            <p className="text-xs text-muted-foreground">Precies één emoji van je toetsenbord.</p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <p className="input-label">Ballon — positie</p>
        <div className="grid w-36 grid-cols-3 gap-1.5" role="radiogroup" aria-label="Positie van de statusballon">
          {COMPASS.map((pos, i) =>
            pos ? (
              <button key={pos} type="button" role="radio" aria-checked={prefs.statusBubblePosition === pos} aria-label={POS_LABEL[pos]} title={POS_LABEL[pos]}
                onClick={() => setPref("statusBubblePosition", pos)}
                className={cn("flex h-10 items-center justify-center rounded-lg border transition-colors", prefs.statusBubblePosition === pos ? "border-primary bg-primary/15" : "border-border hover:bg-muted")}>
                <span className={cn("h-2 w-2 rounded-full", prefs.statusBubblePosition === pos ? "bg-primary" : "bg-muted-foreground/50")} />
              </button>
            ) : (
              <span key={i} aria-hidden className="flex h-10 items-center justify-center rounded-full border border-dashed border-border text-[9px] text-muted-foreground">avatar</span>
            ),
          )}
        </div>
      </div>

      <div className="space-y-2">
        <p className="input-label">Ballon — stijl</p>
        <div className="flex flex-wrap gap-2">
          {BUBBLE_STYLES.map((s) => (
            <button key={s.id} type="button" aria-pressed={prefs.statusBubbleStyle === s.id} onClick={() => setPref("statusBubbleStyle", s.id)}
              className={cn("rounded-xl border p-2 transition-colors", prefs.statusBubbleStyle === s.id ? "border-primary ring-1 ring-primary" : "border-border")}
              style={{ background: theme.bg, color: theme.text }}>
              <span className="status-bubble !animate-none !max-w-none" data-style={s.id} data-pos="top" style={{ display: "inline-block" }}>{s.label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <p className="input-label">Ballon — achtergrondkleur</p>
          <div className="flex items-center gap-2">
            <input type="color" aria-label="Achtergrondkleur ballon" value={prefs.statusBubbleBg ?? "#0d0d12"} onChange={(e) => setPref("statusBubbleBg", e.target.value)} className="h-10 w-14 cursor-pointer rounded-md border border-border bg-transparent" />
            {prefs.statusBubbleBg && <button type="button" onClick={() => setPref("statusBubbleBg", null)} className="text-xs text-muted-foreground underline">Stijlkleur gebruiken</button>}
          </div>
          <p className="text-xs text-muted-foreground">Tekstkleur past zich automatisch aan voor leesbaarheid.</p>
        </div>
        <div className="space-y-2">
          <p className="input-label">Ballon — lettertype</p>
          <div className="flex flex-wrap gap-2">
            {BUBBLE_FONTS.map((f) => (
              <button key={f.id} type="button" aria-pressed={prefs.statusBubbleFont === f.id} onClick={() => setPref("statusBubbleFont", f.id)} className={pill(prefs.statusBubbleFont === f.id)} style={{ fontFamily: f.css }}>{f.label}</button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
