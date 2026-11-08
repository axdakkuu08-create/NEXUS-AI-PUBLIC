import { EmptyState } from "@/components/states/EmptyState";
import { ListTodo } from "lucide-react";

export default function TasksPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Tasks</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Pending, running, completed, and failed agent tasks.
        </p>
      </div>
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {["All", "Pending", "Running", "Completed", "Failed"].map((tab) => (
          <button
            key={tab}
            type="button"
            className="shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium bg-[var(--bg-surface)] text-[var(--text-secondary)] border border-[var(--border)]"
          >
            {tab}
          </button>
        ))}
      </div>
      <EmptyState
        icon={<ListTodo className="h-6 w-6" />}
        title="No tasks"
        description="Task execution history will appear after backend connection."
      />
    </div>
  );
}
