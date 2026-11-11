import { EmptyState } from "@/components/states/EmptyState";
import { Activity } from "lucide-react";

export default function ActivityPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="mb-6">
        <h2 className="text-lg font-semibold">Activity</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Agent execution history with timestamps and outcomes.
        </p>
      </div>
      <EmptyState
        icon={<Activity className="h-6 w-6" />}
        title="No activity yet"
        description="Logs will stream here once agents are connected and running tasks."
      />
    </div>
  );
}
