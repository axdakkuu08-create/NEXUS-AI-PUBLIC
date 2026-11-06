"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { mainNav } from "./nav-items";
import {
  Home,
  MessageSquare,
  FolderKanban,
  Bot,
  ListTodo,
  Wrench,
  Activity,
  Settings,
  Sparkles,
} from "lucide-react";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  MessageSquare,
  FolderKanban,
  Bot,
  ListTodo,
  Wrench,
  Activity,
  Settings,
  Sparkles,
};

export function AppSidebar({ className }: { className?: string }) {
  const pathname = usePathname();

  return (
    <aside className={cn(
      "hidden md:flex md:w-64 lg:w-72 flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)]",
      className
    )}>
      <div className="flex h-14 items-center gap-2 border-b border-[var(--border-subtle)] px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-[var(--accent)]">
          <Sparkles className="h-4 w-4" />
        </div>
        <span className="font-semibold tracking-tight">NEXUS-AI</span>
      </div>
      <nav aria-label="Primary navigation" className="flex-1 space-y-0.5 overflow-y-auto p-3">
        {mainNav.map((item) => {
          const Icon = icons[item.icon] ?? Home;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                active
                  ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                  : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
              )}
            >
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-[var(--border-subtle)] p-3">
        <Link
          href="/settings"
          aria-current={pathname.startsWith("/settings") ? "page" : undefined}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
            pathname.startsWith("/settings")
              ? "bg-[var(--accent-muted)] text-[var(--accent)]"
              : "text-[var(--text-secondary)] hover:bg-[var(--bg-hover)] hover:text-[var(--text-primary)]"
          )}
        >
          <Settings className="h-[18px] w-[18px]" />
          Settings
        </Link>
      </div>
    </aside>
  );
}
