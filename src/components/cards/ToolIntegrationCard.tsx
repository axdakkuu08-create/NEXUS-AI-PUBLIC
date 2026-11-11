import { cn } from "@/lib/cn";
import type { ToolIntegration } from "@/lib/types";
import { Wrench } from "lucide-react";

const statusStyles = {
  connected: "text-[var(--success)]",
  disconnected: "text-[var(--text-tertiary)]",
  pending: "text-[var(--warning)]",
  error: "text-[var(--danger)]",
};

export function ToolIntegrationCard({ tool }: { tool: ToolIntegration }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--bg-surface)] text-[var(--text-secondary)]">
          <Wrench className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{tool.name}</h3>
            <span className={cn("text-xs capitalize", statusStyles[tool.status])}>
              {tool.status}
            </span>
          </div>
          <p className="mt-0.5 text-sm text-[var(--text-secondary)]">{tool.description}</p>
          {tool.permissions && tool.permissions.length > 0 && (
            <p className="mt-2 text-xs text-[var(--text-tertiary)]">
              Permissions: {tool.permissions.join(", ")}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
