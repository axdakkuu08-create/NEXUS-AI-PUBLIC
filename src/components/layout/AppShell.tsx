"use client";

import { Sidebar } from "./Sidebar";
import { MobileNav } from "./MobileNav";

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative min-h-dvh">
      <div className="nexus-bg" aria-hidden />
      <Sidebar />
      <main className="min-h-dvh pb-20 md:pl-[4.5rem] md:pb-0 lg:pl-60">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>
      <MobileNav />
    </div>
  );
}
