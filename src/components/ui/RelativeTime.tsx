"use client";

import { useSyncExternalStore } from "react";

function subscribe() {
  return () => {};
}

function getRelativeTime(timestamp: string): string {
  const date = new Date(timestamp);
  const minutes = Math.floor((Date.now() - date.getTime()) / 60000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (minutes < 1440) return `${Math.floor(minutes / 60)}h ago`;
  if (minutes < 10080) return `${Math.floor(minutes / 1440)}d ago`;
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function RelativeTime({ timestamp }: { timestamp: string }) {
  const value = useSyncExternalStore(subscribe, () => getRelativeTime(timestamp), () => "—");
  return <>{value}</>;
}
