"use client";

import { SwarmMonitor } from "@/components/swarm/SwarmMonitor";

export default function SwarmPage() {
  return (
    <div className="flex h-full flex-col p-4 md:p-6">
      <SwarmMonitor />
    </div>
  );
}
