const CACHE_NAME = "nexus-pwa-public-v2";
const PUBLIC_CACHE_PREFIX = "nexus-pwa-public-";
const PRIVATE_CACHE_PREFIX = "nexus-private-";

// Only these exact, same-origin, non-user-specific resources may be persisted.
const SHELL_ASSETS = new Set([
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/nexus-192.png",
  "/icons/nexus-512.png",
]);

function isApprovedPublicAsset(request) {
  if (request.method !== "GET") return false;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin || url.search !== "") return false;
  if (request.mode === "navigate") return false;
  if (request.headers.has("authorization") || request.headers.has("proxy-authorization")) return false;
  // Cookie is normally unavailable to service-worker script, but reject it if exposed.
  if (request.headers.has("cookie")) return false;
  return SHELL_ASSETS.has(url.pathname);
}

function hasForbiddenCacheDirective(value) {
  return (value || "")
    .split(",")
    .map((part) => part.trim().toLowerCase().split("=", 1)[0])
    .some((directive) => ["private", "no-store", "no-cache"].includes(directive));
}

function isSafePublicResponse(response) {
  if (!response || response.status !== 200 || !response.ok) return false;
  if (response.type === "opaque" || response.redirected) return false;
  if (response.url) {
    try {
      if (new URL(response.url).origin !== self.location.origin) return false;
    } catch {
      return false;
    }
  }
  if (response.headers.has("set-cookie")) return false;
  if (hasForbiddenCacheDirective(response.headers.get("cache-control"))) return false;
  if ((response.headers.get("vary") || "").split(",").some((value) => value.trim() === "*")) return false;
  return true;
}

async function cacheApprovedAsset(request, response) {
  if (!isApprovedPublicAsset(request) || !isSafePublicResponse(response)) return;
  const cache = await caches.open(CACHE_NAME);
  await cache.put(request, response.clone());
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE_NAME);
    for (const path of SHELL_ASSETS) {
      const request = new Request(new URL(path, self.location.origin), { method: "GET", cache: "reload" });
      const response = await fetch(request);
      if (isSafePublicResponse(response)) {
        await cache.put(request, response.clone());
      }
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(PUBLIC_CACHE_PREFIX) && key !== CACHE_NAME)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  const message = event.data;
  if (!message || !["NEXUS_SESSION_END", "NEXUS_ACCOUNT_CHANGE"].includes(message.type)) return;
  event.waitUntil((async () => {
    // Private offline data is prohibited. Remove only app-owned private namespaces
    // left by older/test builds; do not clear unrelated origin caches.
    const keys = await caches.keys();
    await Promise.all(keys
      .filter((key) => key.startsWith(PRIVATE_CACHE_PREFIX))
      .map((key) => caches.delete(key)));
    const clients = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const client of clients) {
      client.postMessage({ type: "NEXUS_SESSION_INVALIDATED", reason: message.type });
    }
  })());
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  if (request.mode === "navigate") {
    // Navigations are always network-only. On network failure, return only the
    // generic public offline page, never a previously visited application page.
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        const cache = await caches.open(CACHE_NAME);
        return (await cache.match(new URL("/offline.html", self.location.origin))) ||
          new Response("NEXUS is offline. Reconnect and try again.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
          });
      }
    })());
    return;
  }

  if (!isApprovedPublicAsset(request)) return;
  event.respondWith((async () => {
    let cache;
    let cached;
    try {
      cache = await caches.open(CACHE_NAME);
      cached = await cache.match(request);
    } catch {
      // Cache lookup failure must not prevent a fresh network response.
    }

    try {
      const response = await fetch(request);
      if (isSafePublicResponse(response)) {
        try {
          await cacheApprovedAsset(request, response.clone());
        } catch {
          // Persistence is optional; never fail an otherwise successful request.
        }
      } else if (cached && cache) {
        // Do not replay an older entry after the current server response becomes private.
        try { await cache.delete(request); } catch { /* fail closed for future lookups */ }
      }
      return response;
    } catch {
      if (cached) return cached;
      return new Response("This public NEXUS asset is not available offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }
  })());
});
