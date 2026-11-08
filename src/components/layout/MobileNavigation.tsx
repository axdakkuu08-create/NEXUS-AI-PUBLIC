"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { bottomNav } from "./nav-items";
import {
  Home,
  MessageSquare,
  Bot,
  ListTodo,
  Wrench,
  Sparkles,
} from "lucide-react";

const icons: Record<string, React.ComponentType<{ className?: string }>> = {
  Home,
  MessageSquare,
  Bot,
  ListTodo,
  Wrench,
  Sparkles,
};

export function MobileNavigation() {
  const pathname = usePathname();

  return (
    <nav aria-label="Primary mobile navigation" className="safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-[var(--border)] bg-[var(--bg-elevated)] md:hidden">
      <div className="flex h-14 items-stretch justify-around">
        {bottomNav.map((item) => {
          const Icon = icons[item.icon] ?? Home;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? "page" : undefined}
              className={cn(
                "flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium",
                active ? "text-[var(--accent)]" : "text-[var(--text-tertiary)]"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.25]")} />
              <span className="max-w-full truncate px-0.5">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
