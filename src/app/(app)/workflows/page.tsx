import { Header } from "@/components/layout/Header";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Icon } from "@/components/ui/Icon";
import { mockWorkflows } from "@/data/mock";
import { RelativeTime } from "@/components/ui/RelativeTime";

export const metadata = { title: "Workflows" };

const statusTone = {
  draft: "muted" as const,
  active: "success" as const,
  paused: "warning" as const,
  archived: "muted" as const,
};

export default function WorkflowsPage() {
  return (
    <div className="animate-fade-in">
      <Header
        title="Workflow Center"
        description="Visual workflow management"
      />

      <div className="mx-4 mb-4 rounded-xl border border-amber-400/25 bg-amber-400/5 px-4 py-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="warning">Preview only</Badge>
          <p className="text-xs text-muted">These workflows are sample records. Creating, editing and running workflows are not connected yet.</p>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        {mockWorkflows.map((w) => (
          <Card key={w.id} hover>
            <div className="flex items-start justify-between gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-300">
                <Icon name="workflows" size={18} />
              </div>
              <Badge tone={statusTone[w.status]} dot>
                {w.status}
              </Badge>
            </div>
            <h3 className="mt-3 text-sm font-semibold">{w.name}</h3>
            <p className="mt-1 text-xs text-muted leading-relaxed">
              {w.description}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-[11px] text-muted">
              <span className="flex items-center gap-1">
                <Icon name="activity" size={12} />
                {w.steps} steps
              </span>
              <span className="flex items-center gap-1">
                <Icon name="clock" size={12} />
                {w.runsTotal} runs
              </span>
              {w.lastRun && (
                <span>Last <RelativeTime timestamp={w.lastRun} /></span>
              )}
            </div>
            {/* Simple visual step strip */}
            <div className="mt-4 flex items-center gap-1">
              {Array.from({ length: w.steps }).map((_, i) => (
                <div
                  key={i}
                  className="h-1.5 flex-1 rounded-full bg-gradient-to-r from-indigo-500/60 to-cyan-400/60"
                  style={{ opacity: 0.4 + (i / w.steps) * 0.6 }}
                />
              ))}
            </div>
            <p className="mt-4 border-t border-white/6 pt-3 text-[11px] text-muted">
              Workflow controls will be enabled after backend and execution integration.
            </p>
          </Card>
        ))}
      </div>
    </div>
  );
}
