"use client";

import { cn } from "@/lib/cn";
import { Menu, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import Link from "next/link";

export function AppHeader({
  title,
  onMenuClick,
  menuOpen = false,
  className,
}: {
  title?: string;
  onMenuClick?: () => void;
  menuOpen?: boolean;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-[var(--border-subtle)] bg-[var(--bg-base)]/90 backdrop-blur-md px-4 safe-top",
        className
      )}
    >
      <button
        type="button"
        onClick={onMenuClick}
        className="md:hidden flex h-10 w-10 items-center justify-center rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-hover)]"
        aria-label="Open menu"
        aria-controls="mobile-navigation-drawer"
        aria-expanded={menuOpen}
      >
        <Menu className="h-5 w-5" />
      </button>

      <div className="flex-1 min-w-0">
        <h1 className="text-base font-semibold truncate">{title ?? "NEXUS-AI"}</h1>
      </div>

      <Link href="/chat" className="md:hidden">
        <Button size="icon" variant="primary" aria-label="New chat">
          <Plus className="h-5 w-5" />
        </Button>
      </Link>

      <div className="hidden md:flex items-center gap-2">
        <Link href="/chat">
          <Button size="sm" variant="primary">
            <Plus className="h-4 w-4" />
            New chat
          </Button>
        </Link>
        <div className="h-8 w-8 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-xs font-medium text-[var(--text-secondary)]">
          U
        </div>
      </div>
    </header>
  );
}
