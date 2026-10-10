import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ConsoleCard, ConsolePage } from "@/components/console/ConsolePage";
import { CodeBlock } from "@/components/console/CodeBlock";
import { useAppPage } from "@/components/console/useAppPage";
import { buildAiPrompt, type AiTool, type Stack } from "@/lib/oauth/integration-templates";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/console/apps/$appId/ai-prompts")({
  head: () => ({ meta: [{ title: "AI-prompts — ROUT Developer Console" }] }),
  component: AiPromptsPage,
});

const TOOLS: { id: AiTool; label: string }[] = [
  { id: "cursor", label: "Cursor" }, { id: "copilot", label: "Copilot" }, { id: "lovable", label: "Lovable" }, { id: "generic", label: "Andere AI" },
];
const STACKS: { id: Stack; label: string }[] = [
  { id: "nextjs", label: "Next.js" }, { id: "tanstack", label: "TanStack Start" }, { id: "express", label: "Express" }, { id: "other", label: "Andere" },
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
  return (
    <ConsolePage title="AI-prompts" description="Plak deze prompt in je AI-assistent. Je client_id, Discovery URL, scopes en Superpowers zitten er al in — je geheim nooit.">
      <ConsoleCard>
        <div className="space-y-4">
          <div><p className="mb-2 text-sm font-medium">Assistent</p><Pills<AiTool> items={TOOLS} value={tool} onChange={setTool} /></div>
          <div><p className="mb-2 text-sm font-medium">Stack</p><Pills<Stack> items={STACKS} value={stack} onChange={setStack} /></div>
        </div>
      </ConsoleCard>
      <CodeBlock label={`prompt · ${tool} · ${stack}`} code={buildAiPrompt(app, tool, stack)} />
    </ConsolePage>
  );
}
