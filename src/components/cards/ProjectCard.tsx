import { cn } from "@/lib/cn";
import type { Project } from "@/lib/types";
import { FolderKanban } from "lucide-react";
import Link from "next/link";

export function ProjectCard({ project }: { project: Project }) {
  return (
    <Link
      href={`/projects?id=${project.id}`}
      className={cn(
        "block rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 transition-colors hover:border-[var(--accent)]/40 hover:bg-[var(--bg-hover)]"
      )}
    >
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--accent-muted)] text-[var(--accent)]">
          <FolderKanban className="h-5 w-5" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium truncate">{project.name}</h3>
          {project.description && (
            <p className="mt-0.5 text-sm text-[var(--text-secondary)] line-clamp-2">
              {project.description}
            </p>
          )}
          <p className="mt-2 text-xs text-[var(--text-tertiary)]">
            Updated {new Date(project.updatedAt).toLocaleDateString()}
          </p>
        </div>
      </div>
    </Link>
  );
}
