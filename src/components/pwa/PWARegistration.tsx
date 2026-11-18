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
    if (!("serviceWorker" in navigator) || process.env.NODE_ENV !== "production") return;

    let channel: BroadcastChannel | undefined;
    const forwardLogout = (event: MessageEvent<{ type?: string }>) => {
      if (event.data?.type === "NEXUS_LOGOUT" || event.data?.type === "NEXUS_CLEAR_CACHES") {
        navigator.serviceWorker.controller?.postMessage(event.data);
      }
    };

    if (typeof BroadcastChannel !== "undefined") {
      channel = new BroadcastChannel("nexus-session-events");
      channel.addEventListener("message", forwardLogout);
    }

    void navigator.serviceWorker.register("/sw.js", { scope: "/" }).catch(() => {
      // The web app remains usable when service-worker registration is unavailable.
    });

    return () => {
      channel?.removeEventListener("message", forwardLogout);
      channel?.close();
    };
  }, []);

  if (isOnline) return null;

  return (
    <div
      className="fixed right-3 bottom-[calc(5.25rem+env(safe-area-inset-bottom))] z-[70] flex flex-col items-end gap-2 md:bottom-4"
      aria-live="polite"
    >
      <p className="rounded-full border border-[var(--warning)]/40 bg-[var(--bg-elevated)] px-3 py-2 text-xs font-medium text-[var(--warning)] shadow-lg">
        Offline · public shell only
      </p>
    </div>
  );
}
