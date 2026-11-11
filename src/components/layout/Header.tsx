"use client";

import { Icon } from "@/components/ui/Icon";
import { Button } from "@/components/ui/Button";

interface HeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function Header({ title, description, actions }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 -mx-4 mb-6 border-b border-white/6 bg-background/70 px-4 py-3 backdrop-blur-xl sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-tight sm:text-xl">
            {title}
          </h1>
          {description && (
            <p className="mt-0.5 truncate text-xs text-muted sm:text-sm">
              {description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          <Button variant="ghost" size="icon" aria-label="Notifications">
            <Icon name="bell" size={18} />
          </Button>
          <Button variant="ghost" size="icon" aria-label="Search" className="hidden sm:inline-flex">
            <Icon name="search" size={18} />
          </Button>
        </div>
      </div>
    </header>
  );
}
