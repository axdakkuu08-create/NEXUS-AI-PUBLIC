import { cn } from "@/lib/cn";
import type { Agent } from "@/lib/types";
import { Bot } from "lucide-react";

const statusColor = {
  online: "bg-[var(--success)]",
  busy: "bg-[var(--warning)]",
  offline: "bg-[var(--text-tertiary)]",
  error: "bg-[var(--danger)]",
};

export function AgentCard({ agent }: { agent: Agent }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-start gap-3">
        <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--accent-blue)]">
          <Bot className="h-5 w-5" />
          <span
            className={cn(
              "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[var(--bg-elevated)]",
              statusColor[agent.status]
            )}
          />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium truncate">{agent.name}</h3>
            <span className="text-[10px] uppercase tracking-wide text-[var(--text-tertiary)]">
              {agent.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)] line-clamp-2">
            {agent.description}
          </p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {agent.capabilities.slice(0, 3).map((c) => (
              <span
                key={c}
                className="rounded-md bg-[var(--bg-surface)] px-2 py-0.5 text-[11px] text-[var(--text-secondary)]"
              >
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
