"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed"; platform: string }>;
};

function subscribeOnline(callback: () => void) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function PWARegistration() {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getServerOnlineSnapshot,
  );
  const [installPrompt, setInstallPrompt] = useState<InstallPromptEvent | null>(null);

  useEffect(() => {
    const handleInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallPrompt(event as InstallPromptEvent);
    };
    const handleInstalled = () => setInstallPrompt(null);

    window.addEventListener("beforeinstallprompt", handleInstallPrompt);
    window.addEventListener("appinstalled", handleInstalled);

    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // The web app remains usable when service-worker registration is unavailable.
      });
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleInstallPrompt);
      window.removeEventListener("appinstalled", handleInstalled);
    };
  }, []);

  async function installApp() {
    if (!installPrompt) return;
    await installPrompt.prompt();
    await installPrompt.userChoice;
    setInstallPrompt(null);
  }

  if (isOnline && !installPrompt) return null;

  return (
    <div
      className="fixed right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-end gap-2 md:bottom-4"
      aria-live="polite"
    >
      {!isOnline && (
        <p className="rounded-full border border-[var(--warning)]/40 bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--warning)] shadow-lg">
          Offline · saved pages only
        </p>
      )}
      {installPrompt && (
        <button
          type="button"
          onClick={() => void installApp()}
          className="rounded-full border border-[var(--accent)]/50 bg-[var(--bg-elevated)] px-4 py-2.5 text-sm font-semibold text-[var(--accent)] shadow-lg"
        >
          Install NEXUS
        </button>
      )}
    </div>
  );
}
