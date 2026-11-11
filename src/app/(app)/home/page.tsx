import Link from "next/link";
import {
  Activity,
  ArrowUpRight,
  Bot,
  CheckSquare,
  CircleDashed,
  FolderGit2,
  MessageSquare,
  Network,
  ShieldCheck,
  Sparkles,
  Workflow,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const modules = [
  {
    href: "/chat",
    title: "AI conversations",
    description: "A focused space for conversations and assisted work.",
    icon: MessageSquare,
    status: "Backend connection pending",
  },
  {
    href: "/projects",
    title: "Projects",
    description: "Keep project context and work grouped together.",
    icon: FolderGit2,
    status: "Waiting for live data",
  },
  {
    href: "/tasks",
    title: "Task management",
    description: "Track work items and their progress in one place.",
    icon: CheckSquare,
    status: "Waiting for live data",
  },
  {
    href: "/agents",
    title: "Agent directory",
    description: "View registered agents and their capabilities.",
    icon: Bot,
    status: "Execution not connected",
  },
  {
    href: "/workflows",
    title: "Workflows",
    description: "Explore workflow structures and orchestration plans.",
    icon: Workflow,
    status: "Preview data",
  },
  {
    href: "/activity",
    title: "Activity",
    description: "A future unified view of workspace events and runs.",
    icon: Activity,
    status: "Awaiting backend events",
  },
];

const overview = [
  { label: "Conversations", value: "—", note: "Live data not connected", icon: MessageSquare },
  { label: "Projects", value: "—", note: "Live data not connected", icon: FolderGit2 },
  { label: "Tasks", value: "—", note: "Live data not connected", icon: CheckSquare },
  { label: "Agents", value: "—", note: "Runtime not connected", icon: Bot },
];

export default function HomePage() {
  return (
    <div className="ambient-glow relative min-h-full">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-72 workspace-grid opacity-35 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-7xl space-y-7 px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        <section className="glass card-glow relative overflow-hidden rounded-2xl p-5 sm:p-8">
          <div className="pointer-events-none absolute -right-20 -top-24 h-64 w-64 rounded-full bg-[var(--accent)]/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/25 bg-[var(--accent-muted)] px-3 py-1 text-xs font-medium text-[var(--accent)]">
                <Sparkles className="h-3.5 w-3.5" />
                Personal AI workspace
              </div>
              <h2 className="text-3xl font-semibold tracking-tight text-[var(--text-primary)] sm:text-4xl">
                One workspace.
                <span className="block text-[var(--accent)]">A clearer way to work with AI.</span>
              </h2>
              <p className="mt-4 max-w-xl text-sm leading-6 text-[var(--text-secondary)] sm:text-base">
                Bring conversations, projects, tasks and agent workflows into one
                connected workspace. Core integrations are being brought online.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/chat">
                  <Button>
                    <MessageSquare className="h-4 w-4" />
                    Open chat
                    <ArrowUpRight className="h-4 w-4" />
                  </Button>
                </Link>
                <Link href="/projects">
                  <Button variant="secondary">
                    <FolderGit2 className="h-4 w-4" />
                    View projects
                  </Button>
                </Link>
              </div>
            </div>

            <div className="w-full rounded-xl border border-[var(--border)] bg-[var(--bg-base)]/75 p-4 lg:max-w-xs">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-medium text-[var(--text-secondary)]">Workspace connection</span>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-[var(--warning)]/25 bg-[var(--warning)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--warning)]">
                  <CircleDashed className="h-3 w-3" />
                  Setup in progress
                </span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                  <Network className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold">Cloud services</p>
                  <p className="text-xs text-[var(--text-tertiary)]">Convex · Clerk · AI provider</p>
                </div>
              </div>
              <p className="mt-3 text-xs leading-5 text-[var(--text-secondary)]">
                Live synchronization and model execution are not enabled in this preview.
              </p>
            </div>
          </div>
        </section>

        <section aria-labelledby="overview-heading">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <h3 id="overview-heading" className="text-sm font-semibold">Workspace overview</h3>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Counts appear when backend sync is connected.</p>
            </div>
            <span className="rounded-full border border-[var(--border)] px-2.5 py-1 text-[10px] text-[var(--text-tertiary)]">Live metrics unavailable</span>
          </div>
          <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
            {overview.map(({ label, value, note, icon: Icon }) => (
              <div key={label} className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/90 p-4 card-glow">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-xs text-[var(--text-secondary)]">{label}</span>
                  <Icon className="h-4 w-4 text-[var(--accent)]" />
                </div>
                <p className="mt-3 text-2xl font-semibold tracking-tight">{value}</p>
                <p className="mt-1 text-[10px] text-[var(--text-tertiary)]">{note}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="modules-heading">
          <div className="mb-4 flex items-end justify-between gap-3">
            <div>
              <h3 id="modules-heading" className="text-sm font-semibold">Workspace modules</h3>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Open a module to explore its current capabilities.</p>
            </div>
            <span className="hidden items-center gap-1 text-xs text-[var(--text-tertiary)] sm:flex">
              <ShieldCheck className="h-3.5 w-3.5" />
              Status shown transparently
            </span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {modules.map(({ href, title, description, icon: Icon, status }) => (
              <Link
                key={href}
                href={href}
                className="group rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/90 p-4 transition-colors hover:border-[var(--accent)]/45 hover:bg-[var(--bg-surface)] focus-visible:outline-offset-4 card-glow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--accent-muted)] text-[var(--accent)]">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ArrowUpRight className="h-4 w-4 text-[var(--text-tertiary)] transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-[var(--accent)]" />
                </div>
                <h4 className="mt-4 text-sm font-semibold">{title}</h4>
                <p className="mt-1 min-h-10 text-xs leading-5 text-[var(--text-secondary)]">{description}</p>
                <p className="mt-3 border-t border-[var(--border-subtle)] pt-3 text-[10px] font-medium text-[var(--text-tertiary)]">{status}</p>
              </Link>
            ))}
          </div>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/90 p-5">
            <div className="flex items-center gap-2">
              <Bot className="h-4 w-4 text-[var(--accent)]" />
              <h3 className="text-sm font-semibold">Agent orchestration</h3>
              <span className="ml-auto rounded-full border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-tertiary)]">Preview</span>
            </div>
            <p className="mt-2 text-xs leading-5 text-[var(--text-secondary)]">
              The workspace is being prepared for coordinated agent runs. No agents are executing from this screen yet.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-2">
              {["Request", "Approval", "Execution"].map((step, index) => (
                <div key={step} className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-base)] p-3 text-center">
                  <div className="mx-auto flex h-7 w-7 items-center justify-center rounded-full bg-[var(--accent-muted)] text-xs font-semibold text-[var(--accent)]">{index + 1}</div>
                  <p className="mt-2 text-[11px] font-medium">{step}</p>
                </div>
              ))}
            </div>
            <Link href="/agents" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
              Open agent directory <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]/90 p-5">
            <div className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-[var(--accent)]" />
              <h3 className="text-sm font-semibold">Recent activity</h3>
              <span className="ml-auto rounded-full border border-[var(--border)] px-2 py-1 text-[10px] text-[var(--text-tertiary)]">Not connected</span>
            </div>
            <div className="mt-5 rounded-lg border border-dashed border-[var(--border)] bg-[var(--bg-base)]/60 px-4 py-8 text-center">
              <CircleDashed className="mx-auto h-6 w-6 text-[var(--text-tertiary)]" />
              <p className="mt-3 text-sm font-medium">Activity will appear here</p>
              <p className="mt-1 text-xs text-[var(--text-tertiary)]">Connect the backend to load real events and execution history.</p>
            </div>
            <Link href="/activity" className="mt-4 inline-flex items-center gap-1 text-xs font-medium text-[var(--accent)] hover:text-[var(--accent-hover)]">
              View activity <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
}
