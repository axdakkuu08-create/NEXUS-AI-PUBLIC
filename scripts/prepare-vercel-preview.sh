#!/usr/bin/env bash
set -euo pipefail

ROOT="frontend/nexus-m1-review"
mkdir -p "$ROOT"
unzip -q NEXUS-AI-M1-source-for-verification.zip -d "$ROOT"

python3 <<'PY'
from pathlib import Path
root = Path("frontend/nexus-m1-review")
dashboard = root / "src/app/(app)/dashboard/page.tsx"
text = dashboard.read_text()
text = text.replace('import { connection } from "next/server";\n', "")
text = text.replace('export default async function DashboardPage() {\n  await connection();', "export default function DashboardPage() {")
if "export const instant = false;" not in text:
    text = "export const instant = false;\n" + text
text = text.replace('import { formatRelativeTime } from "@/lib/utils";\n', "")
text = text.replace('import Link from "next/link";', 'import Link from "next/link";\nimport { RelativeTime } from "@/components/ui/RelativeTime";')
text = text.replace('{formatRelativeTime(item.timestamp)}', '<RelativeTime timestamp={item.timestamp} />')
dashboard.write_text(text)

workflows = root / "src/app/(app)/workflows/page.tsx"
text = workflows.read_text()
text = text.replace('import { formatRelativeTime } from "@/lib/utils";\n', "")
text = text.replace('import { mockWorkflows } from "@/data/mock";', 'import { mockWorkflows } from "@/data/mock";\nimport { RelativeTime } from "@/components/ui/RelativeTime";')
text = text.replace('{formatRelativeTime(w.lastRun)}', '<RelativeTime timestamp={w.lastRun} />')
workflows.write_text(text)

relative = root / "src/components/ui/RelativeTime.tsx"
relative.parent.mkdir(parents=True, exist_ok=True)
relative.write_text('''"use client";
import { useSyncExternalStore } from "react";
function subscribe() { return () => {}; }
function getRelativeTime(timestamp: string) {
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
''')
PY

cp -R phase-b-swarm/src/. "$ROOT/src/"
test -f "$ROOT/package.json"
test -f "$ROOT/src/app/(app)/swarm/page.tsx"
cp -R "$ROOT"/. .
test -f package.json
grep -q '"next": "16.4.3"' package.json
npm install --no-package-lock --ignore-scripts --no-audit --no-fund --registry=https://registry.npmjs.org
