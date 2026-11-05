"use client";

import { useState } from "react";
import { AppSidebar } from "@/components/layout/AppSidebar";
import { MobileNavigation } from "@/components/layout/MobileNavigation";
import { AppHeader } from "@/components/layout/AppHeader";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import Link from "next/link";
import { mainNav } from "@/components/layout/nav-items";
import {
  Home,
  MessageSquare,
  FolderKanban,
  Bot,
  ListTodo,
  Wrench,
  Activity,
  Settings,
  X,
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

const titles: Record<string, string> = {
  "/home": "Home",
  "/": "Home",
  "/chat": "Chat",
  "/projects": "Projects",
  "/agents": "Agents",
  "/swarm": "Swarm",
  "/tasks": "Tasks",
  "/tools": "Tools",
  "/activity": "Activity",
  "/settings": "Settings",
};

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const pathname = usePathname();
  const title =
    titles[pathname] ??
    Object.entries(titles).find(([key]) => key !== "/" && pathname.startsWith(key))?.[1] ??
    "NEXUS-AI";

  return (
    <div className="flex h-[100dvh] overflow-hidden">
      <AppSidebar />
      {drawerOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Close navigation drawer"
            className="absolute inset-0 h-full w-full bg-black/50"
            onClick={() => setDrawerOpen(false)}
          />
          <div className="safe-top absolute inset-y-0 left-0 flex w-72 max-w-[85vw] flex-col border-r border-[var(--border)] bg-[var(--bg-elevated)]">
            <div className="flex h-14 items-center justify-between border-b border-[var(--border-subtle)] px-4">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent)]/20 text-[var(--accent)]">
                  <Sparkles className="h-4 w-4" />
                </div>
                <span className="font-semibold">NEXUS-AI</span>
              </div>
              <button type="button" onClick={() => setDrawerOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)]" aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav aria-label="Mobile drawer navigation" className="flex-1 space-y-0.5 overflow-y-auto p-3">
              {mainNav.map((item) => {
                const Icon = icons[item.icon] ?? Home;
                const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setDrawerOpen(false)}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                      active ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--text-secondary)]"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                );
              })}
              <Link
                href="/settings"
                onClick={() => setDrawerOpen(false)}
                aria-current={pathname.startsWith("/settings") ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium",
                  pathname.startsWith("/settings") ? "bg-[var(--accent-muted)] text-[var(--accent)]" : "text-[var(--text-secondary)]"
                )}
              >
                <Settings className="h-5 w-5" />
                Settings
              </Link>
            </nav>
          </div>
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <AppHeader title={title} onMenuClick={() => setDrawerOpen(true)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto pb-16 md:pb-0">{children}</main>
        <MobileNavigation />
      </div>
    </div>
  );
}
