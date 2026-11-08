import { EmptyState } from "@/components/states/EmptyState";
import { Bot } from "lucide-react";

export default function AgentsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Agents</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Directory of available agents, capabilities, and status.
        </p>
      </div>
      <EmptyState
        icon={<Bot className="h-6 w-6" />}
        title="No agents registered"
        description="Agent list will load from the backend. Until then, the directory is empty."
      />
    </div>
  );
}
