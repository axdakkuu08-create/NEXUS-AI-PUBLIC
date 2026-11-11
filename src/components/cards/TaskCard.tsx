import { cn } from "@/lib/cn";
import type { Task } from "@/lib/types";

const statusStyles = {
  pending: "text-[var(--text-tertiary)] bg-[var(--bg-surface)]",
  running: "text-[var(--warning)] bg-[var(--warning)]/15",
  completed: "text-[var(--success)] bg-[var(--success)]/15",
  failed: "text-[var(--danger)] bg-[var(--danger)]/15",
};

export function TaskCard({ task }: { task: Task }) {
  return (
    <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4">
      <div className="flex items-start justify-between gap-3">
        <h3 className="font-medium text-sm leading-snug">{task.title}</h3>
        <span
          className={cn(
            "shrink-0 rounded-md px-2 py-0.5 text-[11px] font-medium capitalize",
            statusStyles[task.status]
          )}
        >
          {task.status}
        </span>
      </div>
      {typeof task.progress === "number" && task.status === "running" && (
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--bg-surface)]">
          <div
            className="h-full rounded-full bg-[var(--accent)] transition-all"
            style={{ width: `${Math.min(100, Math.max(0, task.progress))}%` }}
          />
        </div>
      )}
      {task.logPreview && (
        <p className="mt-2 text-xs font-mono text-[var(--text-tertiary)] line-clamp-2">
          {task.logPreview}
        </p>
      )}
      <p className="mt-2 text-[11px] text-[var(--text-tertiary)]">
        {new Date(task.updatedAt).toLocaleString()}
      </p>
    </div>
  );
}
