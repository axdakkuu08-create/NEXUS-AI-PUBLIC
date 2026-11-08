import { Header } from "@/components/layout/Header";
import { Card, CardHeader } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Progress } from "@/components/ui/Progress";
import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";
import {
  mockActivity,
  mockAgents,
  mockProjects,
  mockTasks,
} from "@/data/mock";
import { formatRelativeTime } from "@/lib/utils";
import Link from "next/link";\nimport { RelativeTime } from "@/components/ui/RelativeTime";

export const metadata = { title: "Dashboard" };

const stats = [
  {
    label: "Active projects",
    value: String(mockProjects.filter((p) => p.status === "active").length),
    icon: "projects" as const,
    tone: "accent" as const,
  },
  {
    label: "Open tasks",
    value: String(
      mockTasks.filter((t) => t.status !== "done").length
    ),
    icon: "tasks" as const,
    tone: "cyan" as const,
  },
  {
    label: "Agents online",
    value: String(
      mockAgents.filter((a) => a.status !== "offline").length
    ),
    icon: "agents" as const,
    tone: "success" as const,
  },
  {
    label: "Runs today",
    value: String(mockAgents.reduce((s, a) => s + a.runsToday, 0)),
    icon: "activity" as const,
    tone: "default" as const,
  },
];

export default function DashboardPage() {
  const recentProjects = mockProjects.slice(0, 3);
  const urgentTasks = mockTasks
    .filter((t) => t.status !== "done")
    .slice(0, 4);

  return (
    <div className="animate-fade-in">
      <Header
        title="Dashboard"
        description="Overview of projects, agents and recent activity"
        actions={
          <Link href="/chat">
            <Button size="sm">
              <Icon name="sparkles" size={16} />
              New chat
            </Button>
          </Link>
        }
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label} padding="md" className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/6 text-indigo-300">
              <Icon name={s.icon} size={18} />
            </div>
            <div>
              <p className="text-2xl font-semibold tracking-tight">{s.value}</p>
              <p className="text-xs text-muted">{s.label}</p>
            </div>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <div className="space-y-6 lg:col-span-3">
          <Card padding="md">
            <CardHeader
              title="Recent projects"
              description="Your active workspaces"
              action={
                <Link
                  href="/projects"
                  className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                >
                  View all
                </Link>
              }
            />
            <ul className="space-y-3">
              {recentProjects.map((p) => (
                <li key={p.id}>
                  <Link
                    href="/projects"
                    className="flex items-center gap-3 rounded-xl border border-white/6 bg-white/[0.03] p-3 transition hover:bg-white/[0.06]"
                  >
                    <div
                      className="h-9 w-1.5 rounded-full shrink-0"
                      style={{ background: p.color }}
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium">{p.name}</p>
                        <Badge
                          tone={
                            p.status === "active"
                              ? "success"
                              : p.status === "paused"
                                ? "warning"
                                : "muted"
                          }
                          dot
                        >
                          {p.status}
                        </Badge>
                      </div>
                      <div className="mt-2 flex items-center gap-2">
                        <Progress value={p.progress} className="flex-1" />
                        <span className="text-[11px] text-muted tabular-nums">
                          {p.progress}%
                        </span>
                      </div>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md">
            <CardHeader
              title="Priority tasks"
              action={
                <Link
                  href="/tasks"
                  className="text-xs font-medium text-indigo-300 hover:text-indigo-200"
                >
                  View all
                </Link>
              }
            />
            <ul className="divide-y divide-white/6">
              {urgentTasks.map((t) => (
                <li
                  key={t.id}
                  className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <span
                    className={`mt-1.5 status-dot status-dot--${
                      t.status === "in_progress"
                        ? "running"
                        : t.status === "review"
                          ? "success"
                          : "idle"
                    }`}
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium leading-snug">{t.title}</p>
                    <p className="mt-0.5 text-[11px] text-muted">
                      {t.projectName}
                      {t.dueDate ? ` · due ${t.dueDate}` : ""}
                    </p>
                  </div>
                  <Badge
                    tone={
                      t.priority === "urgent"
                        ? "danger"
                        : t.priority === "high"
                          ? "warning"
                          : "muted"
                    }
                  >
                    {t.priority}
                  </Badge>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <div className="space-y-6 lg:col-span-2">
          <Card padding="md">
            <CardHeader title="Agent status" />
            <ul className="space-y-3">
              {mockAgents.map((a) => (
                <li key={a.id} className="flex items-center gap-3">
                  <span className="text-xl" aria-hidden>
                    {a.avatar}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.name}</p>
                    <p className="text-[11px] text-muted">
                      {a.runsToday} runs · {a.successRate}% success
                    </p>
                  </div>
                  <span
                    className={`status-dot status-dot--${a.status}`}
                    title={a.status}
                  />
                </li>
              ))}
            </ul>
          </Card>

          <Card padding="md">
            <CardHeader title="Activity" />
            <ul className="space-y-4">
              {mockActivity.map((item) => (
                <li key={item.id} className="flex gap-3">
                  <div className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/6">
                    <Icon
                      name={
                        item.type === "chat"
                          ? "chat"
                          : item.type === "task"
                            ? "tasks"
                            : item.type === "agent"
                              ? "agents"
                              : item.type === "workflow"
                                ? "workflows"
                                : "projects"
                      }
                      size={14}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium leading-snug">
                      {item.title}
                    </p>
                    <p className="text-[11px] text-muted">{item.description}</p>
                    <p className="mt-0.5 text-[10px] text-muted/70">
                      <RelativeTime timestamp={item.timestamp} />
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </Card>
        </div>
      </div>
    </div>
  );
}
