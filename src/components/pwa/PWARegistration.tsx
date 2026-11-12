"use client";

import { useEffect, useSyncExternalStore } from "react";

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

  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
        // The web app remains usable when service-worker registration is unavailable.
      });
    }
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-end gap-2 md:bottom-4"
      aria-live="polite"
    >
      <p className="rounded-full border border-[var(--warning)]/40 bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--warning)] shadow-lg">
        Offline · saved pages only
      </p>
    </div>
  );
}
