"use client";

import { Button } from "@/components/ui/Button";

export default function SettingsPage() {
  return (
    <div className="mx-auto max-w-2xl px-4 py-6 space-y-8">
      <div>
        <h2 className="text-lg font-semibold">Settings</h2>
        <p className="text-sm text-[var(--text-secondary)]">
          Profile, theme, notifications, and permissions.
        </p>
      </div>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-4">
        <h3 className="text-sm font-medium">Profile</h3>
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-full bg-[var(--bg-surface)] border border-[var(--border)] flex items-center justify-center text-sm font-medium">
            U
          </div>
          <div>
            <p className="font-medium">User</p>
            <p className="text-xs text-[var(--text-tertiary)]">Local preview</p>
          </div>
        </div>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-3">
        <h3 className="text-sm font-medium">Appearance</h3>
        <div className="flex gap-2">
          <Button size="sm" variant="primary">
            Dark
          </Button>
          <Button size="sm" variant="secondary" disabled>
            Light
          </Button>
          <Button size="sm" variant="secondary" disabled>
            System
          </Button>
        </div>
        <p className="text-xs text-[var(--text-tertiary)]">
          Theme persistence requires backend (M2).
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-3">
        <h3 className="text-sm font-medium">Agent permissions</h3>
        <ul className="text-sm text-[var(--text-secondary)] space-y-2">
          <li>• Safe tasks may run automatically within configured limits</li>
          <li>• Ask before GitHub commits</li>
          <li>• Ask before deployments</li>
          <li>• Always show execution history</li>
        </ul>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2">
        <h3 className="text-sm font-medium">Connected accounts</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          No accounts connected. Link GitHub and other services after backend setup.
        </p>
      </section>

      <section className="rounded-xl border border-[var(--border)] bg-[var(--bg-elevated)] p-4 space-y-2">
        <h3 className="text-sm font-medium">Privacy & security</h3>
        <p className="text-sm text-[var(--text-secondary)]">
          Data stays local until Convex is connected. No secrets are stored in the frontend.
        </p>
      </section>
    </div>
  );
}
