"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Icon, type IconName } from "@/components/ui/Icon";

const nav: { href: string; label: string; icon: IconName }[] = [
  { href: "/dashboard", label: "Dashboard", icon: "dashboard" },
  { href: "/chat", label: "AI Chat", icon: "chat" },
  { href: "/projects", label: "Projects", icon: "projects" },
  { href: "/tasks", label: "Tasks", icon: "tasks" },
  { href: "/agents", label: "AI Agents", icon: "agents" },
  { href: "/workflows", label: "Workflows", icon: "workflows" },
  { href: "/settings", label: "Settings", icon: "settings" },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className={cn(
        "fixed left-0 top-0 z-40 hidden h-dvh w-[4.5rem] flex-col border-r border-white/8 bg-black/40 backdrop-blur-xl",
        "md:flex lg:w-60"
      )}
    >
      <div className="flex h-14 items-center gap-2.5 border-b border-white/8 px-4 lg:px-5">
        <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 text-sm font-bold text-white shadow-lg shadow-indigo-500/30">
          N
        </div>
        <div className="hidden lg:block">
          <p className="text-sm font-semibold tracking-tight">NEXUS-AI</p>
          <p className="text-[10px] text-muted">Workspace</p>
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1 p-2 lg:p-3">
        {nav.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-200",
                active
                  ? "bg-indigo-500/15 text-indigo-200 shadow-inner border border-indigo-400/20"
                  : "text-muted hover:bg-white/6 hover:text-foreground border border-transparent"
              )}
              title={item.label}
            >
              <Icon
                name={item.icon}
                size={18}
                className={cn(
                  "shrink-0",
                  active ? "text-indigo-300" : "text-muted group-hover:text-foreground"
                )}
              />
              <span className="hidden lg:inline truncate">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-white/8 p-2 lg:p-3">
        <div className="flex items-center gap-3 rounded-xl px-3 py-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-xs font-semibold">
            R
          </div>
          <div className="hidden min-w-0 lg:block">
            <p className="truncate text-xs font-medium">Retro</p>
            <p className="truncate text-[10px] text-muted">Frontend lead</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
