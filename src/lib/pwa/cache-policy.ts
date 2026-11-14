const CACHE_PREFIX = "nexus-pwa-";
const SESSION_CHANNEL = "nexus-session-events";

export function isPublicShellRequest(request: Request): boolean {
  if (request.method !== "GET" || request.mode === "navigate") return false;
  if (request.headers.has("Authorization")) return false;

  const url = new URL(request.url, window.location.origin);
  if (url.origin !== window.location.origin) return false;
  if (
    url.pathname.startsWith("/_next/data/") ||
    url.searchParams.has("_rsc") ||
    url.searchParams.has("__nextDataReq") ||
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("x-nextjs-data")
  ) {
    return false;
  }

  if (/^\/(api|auth|oauth|session|logout|backend|trpc|graphql)(\/|$)/i.test(url.pathname)) {
    return false;
  }

  return (
    url.pathname === "/offline.html" ||
    url.pathname === "/manifest.webmanifest" ||
    url.pathname === "/icons/nexus-192.png" ||
    url.pathname === "/icons/nexus-512.png" ||
    url.pathname.startsWith("/_next/static/")
  );
}

export function isPublicShellResponse(response: Response): boolean {
  if (!response.ok || response.status !== 200 || response.redirected) return false;
  if (["opaque", "opaqueredirect", "error"].includes(response.type)) return false;
  if (response.headers.has("Set-Cookie")) return false;

  const directives = (response.headers.get("Cache-Control") || "")
    .split(",")
    .map((part) => part.trim().split("=")[0].toLowerCase());
  if (directives.some((part) => ["private", "no-store", "no-cache"].includes(part))) return false;

  return !(response.headers.get("Vary") || "")
    .split(",")
    .some((part) => part.trim() === "*");
}

function postSessionMessage(type: "NEXUS_LOGOUT" | "NEXUS_CLEAR_CACHES") {
  if (typeof navigator !== "undefined") {
    navigator.serviceWorker?.controller?.postMessage({ type });
  }
  if (typeof BroadcastChannel !== "undefined") {
    const channel = new BroadcastChannel(SESSION_CHANNEL);
    channel.postMessage({ type });
    channel.close();
  }
}

export function notifyNexusLogout(): void {
  postSessionMessage("NEXUS_LOGOUT");
}

export async function clearNexusPublicCaches(): Promise<void> {
  postSessionMessage("NEXUS_CLEAR_CACHES");
  if (typeof caches === "undefined") return;

  const keys = await caches.keys();
  await Promise.all(
    keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)),
  );
}
