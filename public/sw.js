const CACHE_NAME = "nexus-pwa-v1";
const SHELL_ASSETS = [
  "/offline.html",
  "/manifest.webmanifest",
  "/icons/nexus-192.png",
  "/icons/nexus-512.png",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      await cache.addAll(SHELL_ASSETS);
      await self.skipWaiting();
    })(),
  );
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((key) => key.startsWith("nexus-pwa-") && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;

  const isNavigation = request.mode === "navigate";
  const isNextStatic = url.pathname.startsWith("/_next/static/");
  const isNextData =
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-State-Tree") ||
    url.searchParams.has("_rsc");
  const isShellAsset =
    url.pathname === "/manifest.webmanifest" ||
    url.pathname.startsWith("/icons/") ||
    url.pathname === "/offline.html";

  if (!isNavigation && !isNextStatic && !isNextData && !isShellAsset) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);

      if (isNextStatic || isShellAsset) {
        const cached = await cache.match(request);
        if (cached) return cached;

        try {
          const response = await fetch(request);
          if (response.ok) {
            try {
              await cache.put(request, response.clone());
            } catch {
              // Some browser-managed responses cannot be stored in Cache Storage.
            }
          }
          return response;
        } catch {
          return new Response("This NEXUS resource is not available offline.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          });
        }
      }

      try {
        const response = await fetch(request);
        if (response.ok && response.type !== "opaque") {
          try {
            await cache.put(request, response.clone());
          } catch {
            // Continue serving the network response if the browser rejects caching.
          }
        }
        return response;
      } catch {
        const cached = await cache.match(request);
        if (cached) return cached;

        if (isNavigation) {
          return (
            (await cache.match("/offline.html")) ||
            new Response("NEXUS is offline. Reconnect and try again.", {
              status: 503,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }

        return new Response("This NEXUS page resource is not cached.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});
