/**
 * Broadcast a local session-ending event to same-origin tabs and the active
 * service worker. This is an integration hook, not an authentication system.
 */
export type NexusSessionEvent = "NEXUS_SESSION_END" | "NEXUS_ACCOUNT_CHANGE";

const CHANNEL_NAME = "nexus-session-lifecycle";

export function notifyNexusSessionLifecycle(type: NexusSessionEvent): void {
  if (typeof window === "undefined") return;

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type });
    channel.close();
  } catch {
    // BroadcastChannel may be unavailable; service-worker notification remains.
  }

  if ("serviceWorker" in navigator) {
    void navigator.serviceWorker.ready
      .then((registration) => registration.active?.postMessage({ type }))
      .catch(() => undefined);
  }

  window.dispatchEvent(new CustomEvent("nexus:session-invalidated", { detail: { type } }));
}

export function subscribeToNexusSessionLifecycle(onInvalidated: (type: NexusSessionEvent) => void): () => void {
  if (typeof window === "undefined") return () => undefined;

  const onBroadcast = (event: MessageEvent<{ type?: string }>) => {
    if (event.data?.type === "NEXUS_SESSION_END" || event.data?.type === "NEXUS_ACCOUNT_CHANGE") {
      onInvalidated(event.data.type);
    }
  };
  const onWorkerMessage = (event: MessageEvent<{ type?: string; reason?: NexusSessionEvent }>) => {
    if (event.data?.type === "NEXUS_SESSION_INVALIDATED" && event.data.reason) {
      onInvalidated(event.data.reason);
    }
  };

  let channel: BroadcastChannel | undefined;
  try {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", onBroadcast);
  } catch {
    channel = undefined;
  }
  navigator.serviceWorker?.addEventListener("message", onWorkerMessage);

  return () => {
    channel?.removeEventListener("message", onBroadcast);
    channel?.close();
    navigator.serviceWorker?.removeEventListener("message", onWorkerMessage);
  };
}
