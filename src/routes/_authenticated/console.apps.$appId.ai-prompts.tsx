import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ConsoleCard, ConsolePage } from "@/components/console/ConsolePage";
import { CodeBlock } from "@/components/console/CodeBlock";
import { useAppPage } from "@/components/console/useAppPage";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { buildAiPrompt, buildBadgePrompt, buildHandleSyncPrompt, type AiTool, type Stack } from "@/lib/oauth/integration-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/console/apps/$appId/ai-prompts")({
  head: () => ({ meta: [{ title: "AI Integration Prompts — ROUT Developer Console" }] }),
  component: AiPromptsPage,
});

const TOOLS: { id: AiTool; label: string }[] = [
  { id: "cursor", label: "Cursor" }, { id: "copilot", label: "Copilot" }, { id: "lovable", label: "Lovable" }, { id: "generic", label: "Other AI" },
];
const STACKS: { id: Stack; label: string }[] = [
  { id: "nextjs", label: "Next.js" }, { id: "tanstack", label: "TanStack Start" }, { id: "express", label: "Express" }, { id: "other", label: "Other" },
];

function Pills<T extends string>({ items, value, onChange }: { items: readonly { id: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <div className="flex flex-wrap gap-2">
      {items.map((i) => (
        <button key={i.id} type="button" onClick={() => onChange(i.id)}
          className={cn("rounded-full border px-3 py-1 text-sm", value === i.id ? "border-primary bg-primary/10 text-foreground" : "border-border text-muted-foreground hover:text-foreground")}>
          {i.label}
        </button>
      ))}
    </div>
  );
}

function AiPromptsPage() {
  const { appId } = Route.useParams();
  const { app } = useAppPage(appId);
  const [tool, setTool] = useState<AiTool>("cursor");
  const [stack, setStack] = useState<Stack>("nextjs");
  if (!app) return null;
  return (
    <ConsolePage title="AI Integration Prompts" description="Paste these into Lovable, Cursor or v0. Your app name and client_id are filled in — never your secret.">
      <Accordion type="single" collapsible defaultValue="auth" className="space-y-3">
        <AccordionItem value="auth" className="rounded-xl border border-border px-4">
          <AccordionTrigger>1. Auth & Universal Handle Sync</AccordionTrigger>
          <AccordionContent className="space-y-2">
            {!app.handleSyncEnabled && <p className="text-xs text-muted-foreground">Turn on Universal Handle Sync under Scopes so <code>rout_handle</code> is sent.</p>}
            <CodeBlock label="prompt · auth + handle sync" code={buildHandleSyncPrompt(app)} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="badges" className="rounded-xl border border-border px-4">
          <AccordionTrigger>2. Badge Issuance API</AccordionTrigger>
          <AccordionContent className="space-y-2">
            <p className="text-xs text-muted-foreground">Preview: the badge endpoint is coming soon.</p>
            <CodeBlock label="prompt · badges" code={buildBadgePrompt(app)} />
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="full" className="rounded-xl border border-border px-4">
          <AccordionTrigger>3. Full integration</AccordionTrigger>
          <AccordionContent className="space-y-4">
            <ConsoleCard>
              <div className="space-y-4">
                <div><p className="mb-2 text-sm font-medium">Assistant</p><Pills<AiTool> items={TOOLS} value={tool} onChange={setTool} /></div>
                <div><p className="mb-2 text-sm font-medium">Stack</p><Pills<Stack> items={STACKS} value={stack} onChange={setStack} /></div>
              </div>
            </ConsoleCard>
            <CodeBlock label={`prompt · ${tool} · ${stack}`} code={buildAiPrompt(app, tool, stack)} />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </ConsolePage>
  );
}
