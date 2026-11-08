import { EmptyState } from "@/components/states/EmptyState";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import {
  MessageSquare,
  FolderKanban,
  Bot,
  ListTodo,
  Sparkles,
  Wrench,
} from "lucide-react";

export default function HomePage() {
  return (
    <div className="ambient-glow mx-auto max-w-5xl px-4 py-6 space-y-6">
      <section className="rounded-2xl border border-[var(--border)] bg-[var(--bg-elevated)] p-5 sm:p-7 card-glow">
        <div className="flex items-start gap-4">
          <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-[var(--accent-muted)] text-[var(--accent)]">
            <Sparkles className="h-6 w-6" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium uppercase tracking-wider text-[var(--accent)] mb-1">
              Agent workspace
            </p>
            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
              NEXUS-AI Command Center
            </h2>
            <p className="mt-1.5 text-sm text-[var(--text-secondary)] max-w-xl">
              Orchestrate agents, run tasks, and chat in one mobile-first workspace.
              Backend sync lands in M2.
            </p>
            <div className="mt-4 flex flex-wrap gap-2">
              <Link href="/chat">
                <Button>
                  <MessageSquare className="h-4 w-4" />
                  Open chat
                </Button>
              </Link>
              <Link href="/tools">
                <Button variant="secondary">
                  <Wrench className="h-4 w-4" />
                  Integrations
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
          Quick actions
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { href: "/chat", label: "Chat", icon: MessageSquare },
            { href: "/tasks", label: "Tasks", icon: ListTodo },
            { href: "/agents", label: "Agents", icon: Bot },
            { href: "/projects", label: "Projects", icon: FolderKanban },
          ].map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 hover:border-[var(--accent)]/40 transition-colors card-glow"
            >
              <Icon className="h-5 w-5 text-[var(--accent)]" />
              <span className="text-sm font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Recent conversations
          </h3>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
            <EmptyState
              title="No conversations yet"
              description="Start a chat to see history here."
              className="py-10"
            />
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
            Active tasks
          </h3>
          <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)]">
            <EmptyState
              title="No active tasks"
              description="Tasks appear when agents are running."
              className="py-10"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="text-sm font-medium text-[var(--text-secondary)] mb-3">
          Agent status
        </h3>
        <div className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 flex items-center gap-3">
          <span className="h-2.5 w-2.5 rounded-full bg-[var(--text-tertiary)]" />
          <p className="text-sm text-[var(--text-secondary)]">
            Agents offline — connect Convex to enable live status.
          </p>
        </div>
      </section>
    </div>
  );
}
