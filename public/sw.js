const CACHE_NAME = "nexus-pwa-v2-m2";
const CACHE_PREFIX = "nexus-pwa-";
const OFFLINE_URL = "/offline.html";
const SHELL_ASSETS = [
  OFFLINE_URL,
  "/manifest.webmanifest",
  "/icons/nexus-192.png",
  "/icons/nexus-512.png",
];

let cacheEpoch = 0;

function isNextRouteData(request, url) {
  return (
    url.pathname.startsWith("/_next/data/") ||
    url.searchParams.has("_rsc") ||
    url.searchParams.has("__nextDataReq") ||
    request.headers.has("RSC") ||
    request.headers.has("Next-Router-State-Tree") ||
    request.headers.has("Next-Router-Prefetch") ||
    request.headers.has("x-nextjs-data") ||
    request.headers.get("Purpose")?.toLowerCase() === "prefetch" ||
    request.headers.get("Sec-Purpose")?.toLowerCase().includes("prefetch") === true
  );
}

function isPublicAssetPath(pathname) {
  return (
    pathname === OFFLINE_URL ||
    pathname === "/manifest.webmanifest" ||
    pathname === "/icons/nexus-192.png" ||
    pathname === "/icons/nexus-512.png" ||
    pathname.startsWith("/_next/static/")
  );
}

function isEligibleRequest(request) {
  if (request.method !== "GET" || request.mode === "navigate") return false;
  if (request.headers.has("Authorization")) return false;

  let url;
  try {
    url = new URL(request.url);
  } catch {
    return false;
  }

  if (url.origin !== self.location.origin) return false;
  if (isNextRouteData(request, url)) return false;
  if (/^\/(api|auth|oauth|session|logout|backend|trpc|graphql)(\/|$)/i.test(url.pathname)) {
    return false;
  }

  return isPublicAssetPath(url.pathname);
}

function isCacheableResponse(request, response) {
  if (!response || response.status !== 200 || !response.ok) return false;
  if (response.type === "opaque" || response.type === "opaqueredirect" || response.type === "error") {
    return false;
  }
  if (response.redirected) return false;

  try {
    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== self.location.origin) return false;
    if (response.url && new URL(response.url).origin !== self.location.origin) return false;
  } catch {
    return false;
  }

  const headers = response.headers;
  if (!headers || headers.has("Set-Cookie")) return false;

  const cacheControl = (headers.get("Cache-Control") || "")
    .split(",")
    .map((directive) => directive.trim().split("=")[0].toLowerCase());
  if (cacheControl.some((directive) => ["private", "no-store", "no-cache"].includes(directive))) {
    return false;
  }

  const vary = headers.get("Vary");
  if (vary && vary.split(",").some((value) => value.trim() === "*")) return false;

  return true;
}

self.addEventListener("install", (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      for (const asset of SHELL_ASSETS) {
        try {
          const request = new Request(new URL(asset, self.location.origin).toString(), {
            method: "GET",
            credentials: "same-origin",
          });
          const response = await fetch(request);
          if (isEligibleRequest(request) && isCacheableResponse(request, response)) {
            await cache.put(request, response.clone());
          }
        } catch {
          // A missing optional shell asset must not expand the cache policy.
        }
      }
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
          .filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME)
          .map((key) => caches.delete(key)),
      );
      await self.clients.claim();
    })(),
  );
});

self.addEventListener("message", (event) => {
  const type = event.data?.type;
  if (type !== "NEXUS_LOGOUT" && type !== "NEXUS_CLEAR_CACHES") return;

  // Invalidate pending writes before any asynchronous cache operation begins.
  cacheEpoch += 1;
  event.waitUntil?.(
    (async () => {
      if (type === "NEXUS_CLEAR_CACHES") {
        const keys = await caches.keys();
        await Promise.all(
          keys.filter((key) => key.startsWith(CACHE_PREFIX)).map((key) => caches.delete(key)),
        );
      }
      // NEXUS_LOGOUT deliberately preserves the generic public shell. M2 stores no private data.
    })(),
  );
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request).catch(async () => {
        const cache = await caches.open(CACHE_NAME);
        return (
          (await cache.match(OFFLINE_URL)) ||
          new Response("NEXUS is offline. Reconnect to continue.", {
            status: 503,
            headers: { "Content-Type": "text/plain; charset=utf-8" },
          })
        );
      }),
    );
    return;
  }

  if (!isEligibleRequest(request)) return;

  event.respondWith(
    (async () => {
      const cache = await caches.open(CACHE_NAME);
      const cached = await cache.match(request);
      if (cached && isCacheableResponse(request, cached)) return cached;
      if (cached) await cache.delete(request);

      const requestEpoch = cacheEpoch;
      try {
        const response = await fetch(request);
        if (
          requestEpoch === cacheEpoch &&
          isEligibleRequest(request) &&
          isCacheableResponse(request, response)
        ) {
          try {
            await cache.put(request, response.clone());
          } catch {
            // Cache quota/storage failures never change the network response.
          }
        }
        return response;
      } catch {
        return new Response("This public NEXUS asset is unavailable offline.", {
          status: 503,
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      }
    })(),
  );
});
