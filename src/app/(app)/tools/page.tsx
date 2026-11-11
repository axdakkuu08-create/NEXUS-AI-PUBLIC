import { ToolIntegrationCard } from "@/components/cards/ToolIntegrationCard";
import type { ToolIntegration } from "@/lib/types";

const placeholderTools: ToolIntegration[] = [
  {
    id: "github",
    name: "GitHub",
    description: "Repos, commits, and PRs. Commits require confirmation.",
    status: "disconnected",
    permissions: ["read", "write (ask first)"],
  },
  {
    id: "convex",
    name: "Convex",
    description: "Realtime backend for projects, conversations, and tasks.",
    status: "disconnected",
    permissions: ["data read/write"],
  },
  {
    id: "figma",
    name: "Figma",
    description: "Design context for agent workflows (optional).",
    status: "disconnected",
    permissions: ["read"],
  },
];

export default function ToolsPage() {
  return (
    <div className="ambient-glow mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)] mb-1">
          0 connected · 3 available
        </p>
        <h2 className="text-lg font-semibold">Integrations</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Connected services and permissions. Sensitive actions always ask first.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {placeholderTools.map((tool) => (
          <ToolIntegrationCard key={tool.id} tool={tool} />
        ))}
      </div>
      <p className="mt-4 text-xs text-[var(--text-tertiary)]">
        Status is local only. Live connection state will come from the backend.
      </p>
    </div>
  );
}
