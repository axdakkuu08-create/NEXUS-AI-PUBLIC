import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/Button";
import { FolderKanban } from "lucide-react";

export default function ProjectsPage() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-6">
      <div className="flex items-center justify-between gap-3 mb-6">
        <div>
          <h2 className="text-lg font-semibold">Projects</h2>
          <p className="text-sm text-[var(--text-secondary)]">
            Organize conversations and tasks by project.
          </p>
        </div>
        <Button size="sm" disabled title="Requires backend">
          New project
        </Button>
      </div>
      <EmptyState
        icon={<FolderKanban className="h-6 w-6" />}
        title="No projects yet"
        description="Projects will sync when Convex is connected. Create is disabled until then."
      />
    </div>
  );
}
