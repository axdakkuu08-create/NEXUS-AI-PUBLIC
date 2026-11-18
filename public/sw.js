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
const pendingWrites = new Map();

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
  try {
    if (!request || request.method !== "GET" || request.mode === "navigate") return false;
    if (request.headers.has("Authorization")) return false;

    const url = new URL(request.url);
    if (url.origin !== self.location.origin) return false;
    if (isNextRouteData(request, url)) return false;
    if (/^\/(api|auth|oauth|session|logout|backend|trpc|graphql)(\/|$)/i.test(url.pathname)) {
      return false;
    }

    return isPublicAssetPath(url.pathname);
  } catch {
    // Uncertain request classification must never broaden cache eligibility.
    return false;
  }
}

function isCacheableResponse(request, response) {
  try {
    if (!response || response.status !== 200 || !response.ok) return false;
    if (["opaque", "opaqueredirect", "error"].includes(response.type)) return false;
    if (response.redirected) return false;

    const requestUrl = new URL(request.url);
    if (requestUrl.origin !== self.location.origin) return false;
    if (response.url && new URL(response.url).origin !== self.location.origin) return false;

    const headers = response.headers;
    if (!headers) return false;

    // Set-Cookie is a forbidden response header and is not exposed to service-worker
    // JavaScript. Session-setting/dynamic routes are excluded by the request allowlist;
    // servers must pair any cookie-setting response with Cache-Control: no-store.
    const cacheControl = (headers.get("Cache-Control") || "")
      .split(",")
      .map((directive) => directive.trim().split("=")[0].toLowerCase());
    if (cacheControl.some((directive) => ["private", "no-store", "no-cache"].includes(directive))) {
      return false;
    }

    const vary = headers.get("Vary");
    if (vary && vary.split(",").some((value) => value.trim() === "*")) return false;

    return true;
  } catch {
    // A response that cannot be classified is network-only.
    return false;
  }
}

async function putForGeneration(cache, request, response, requestEpoch) {
  const key = request.url;
  const previous = pendingWrites.get(key) || Promise.resolve();
  const current = previous.catch(() => undefined).then(async () => {
    if (requestEpoch !== cacheEpoch) return;
    await cache.put(request, response.clone());
    // Cache.put() cannot be cancelled. Remove a result committed by an invalidated epoch.
    if (requestEpoch !== cacheEpoch) await cache.delete(request);
  });
  pendingWrites.set(key, current);

  try {
    await current;
  } finally {
    if (pendingWrites.get(key) === current) pendingWrites.delete(key);
  }
}

async function removeUnsafeEntries(cache) {
  const requests = await cache.keys();
  await Promise.all(requests.map(async (request) => {
    try {
      if (!isEligibleRequest(request)) {
        await cache.delete(request);
        return;
      }
      const response = await cache.match(request);
      if (!isCacheableResponse(request, response)) await cache.delete(request);
    } catch {
      // If classification or inspection fails, deletion is the safe choice.
      try { await cache.delete(request); } catch { /* storage is unavailable */ }
    }
  }));
}

async function cleanupOwnedCaches(preservePublicShell) {
  let keys;
  try {
    keys = await caches.keys();
  } catch {
    // Continue with the known current cache even if global cache enumeration fails.
    keys = null;
  }

  if (keys) {
    const obsolete = keys.filter((key) => key.startsWith(CACHE_PREFIX) && key !== CACHE_NAME);
    await Promise.all(obsolete.map(async (key) => {
      try { await caches.delete(key); } catch { /* best effort; other caches stay untouched */ }
    }));
  }

  if (!preservePublicShell) {
    try { await caches.delete(CACHE_NAME); } catch { /* best effort */ }
    return;
  }

  try {
    const cache = await caches.open(CACHE_NAME);
    await removeUnsafeEntries(cache);
  } catch {
    // If entries cannot be enumerated/sanitized, remove the current app cache rather
    // than leave legacy private entries behind. Offline navigation then uses 503.
    try { await caches.delete(CACHE_NAME); } catch { /* CacheStorage may be unavailable */ }
  }
}

async function offlineNavigationFallback() {
  try {
    const cache = await caches.open(CACHE_NAME);
    const fallback = await cache.match(OFFLINE_URL);
    if (fallback && isCacheableResponse(new Request(new URL(OFFLINE_URL, self.location.origin)), fallback)) {
      return fallback;
    }
  } catch {
    // Fall through to a generic response when CacheStorage is unavailable.
  }
  return new Response("NEXUS is offline. Reconnect to continue.", {
    status: 503,
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
  });
}

self.addEventListener("install", (event) => {
  event.waitUntil((async () => {
    try {
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
          // Missing assets and storage errors must not expand the cache policy.
        }
      }
    } catch {
      // Service-worker installation remains possible without CacheStorage.
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (event) => {
  event.waitUntil((async () => {
    await cleanupOwnedCaches(true);
    await self.clients.claim();
  })());
});

self.addEventListener("message", (event) => {
  const type = event.data?.type;
  if (type !== "NEXUS_LOGOUT" && type !== "NEXUS_CLEAR_CACHES") return;

  // Advance the epoch synchronously, before any asynchronous cache cleanup.
  cacheEpoch += 1;
  event.waitUntil?.(cleanupOwnedCaches(type === "NEXUS_LOGOUT"));
});

self.addEventListener("fetch", (event) => {
  const request = event.request;

  if (request.mode === "navigate") {
    event.respondWith((async () => {
      try {
        return await fetch(request);
      } catch {
        return offlineNavigationFallback();
      }
    })());
    return;
  }

  if (!isEligibleRequest(request)) return;

  event.respondWith((async () => {
    let cache;
    let cached;
    try {
      cache = await caches.open(CACHE_NAME);
      cached = await cache.match(request);
      if (cached && isCacheableResponse(request, cached)) return cached;
      if (cached) await cache.delete(request);
    } catch {
      // CacheStorage read failures are fail-open to the network, never to stale data.
      cache = undefined;
      cached = undefined;
    }

    const requestEpoch = cacheEpoch;
    let response;
    try {
      response = await fetch(request);
    } catch {
      return new Response("This public NEXUS asset is unavailable offline.", {
        status: 503,
        headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store" },
      });
    }

    try {
      if (
        requestEpoch === cacheEpoch &&
        isEligibleRequest(request) &&
        isCacheableResponse(request, response)
      ) {
        cache = cache || await caches.open(CACHE_NAME);
        await putForGeneration(cache, request, response, requestEpoch);
      }
    } catch {
      // Quota, open, classification, and write failures never change the network response.
    }
    return response;
  })());
});
