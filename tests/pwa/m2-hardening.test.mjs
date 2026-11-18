import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import vm from "node:vm";
import test from "node:test";

const here = dirname(fileURLToPath(import.meta.url));
const workerSource = readFileSync(join(here, "../../public/sw.js"), "utf8");
const ORIGIN = "https://nexus.test";
const CACHE_NAME = "nexus-pwa-v2-m2";

function makeRuntime(options = {}) {
  const listeners = new Map();
  const stores = new Map();
  const keyOf = (request) => (typeof request === "string" ? new URL(request, ORIGIN).href : request.url);
  const makeCache = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async put(request, response) {
        if (options.failPut) throw new Error("simulated quota/write failure");
        if (options.beforePut) await options.beforePut(request, response);
        store.set(keyOf(request), response.clone());
      },
      async match(request) {
        if (options.failMatch) throw new Error("simulated Cache.match failure");
        const value = store.get(keyOf(request));
        return value ? value.clone() : undefined;
      },
      async delete(request) { return store.delete(keyOf(request)); },
      async keys() {
        if (options.failKeys) throw new Error("simulated Cache.keys failure");
        return [...store.keys()].map((url) => new Request(url));
      },
    };
  };
  const caches = {
    async open(name) {
      if (options.failOpen) throw new Error("simulated CacheStorage.open failure");
      return makeCache(name);
    },
    async keys() {
      if (options.failStorageKeys) throw new Error("simulated CacheStorage.keys failure");
      return [...stores.keys()];
    },
    async delete(name) { return stores.delete(name); },
  };
  const self = {
    location: { origin: ORIGIN },
    clients: { claim: async () => undefined },
    skipWaiting: async () => undefined,
    addEventListener(type, callback) {
      const list = listeners.get(type) || [];
      list.push(callback);
      listeners.set(type, list);
    },
  };
  vm.runInNewContext(workerSource, {
    self, caches, fetch: options.fetch || (async () => new Response("network-public")),
    URL, Request, Response, Headers, Promise, Map, Set,
  });

  async function dispatch(type, event) {
    for (const callback of listeners.get(type) || []) callback(event);
    if (event.waiting) await Promise.all(event.waiting);
  }
  return { caches, stores, dispatch };
}

function makeEvent(request, data) {
  let responsePromise;
  const waiting = [];
  return {
    request,
    data,
    waiting,
    respondWith(promise) { responsePromise = Promise.resolve(promise); },
    waitUntil(promise) { waiting.push(Promise.resolve(promise)); },
    async response() { return responsePromise; },
  };
}

async function fetchThrough(runtime, request) {
  const event = makeEvent(request);
  await runtime.dispatch("fetch", event);
  return { event, response: await event.response() };
}

test("LOGOUT cleanup removes stale non-public entries and preserves the public shell", async () => {
  const runtime = makeRuntime();
  const cache = await runtime.caches.open(CACHE_NAME);
  const publicRequest = new Request(ORIGIN + "/icons/nexus-192.png");
  const staleApi = new Request(ORIGIN + "/api/projects");
  const staleIdentity = new Request(ORIGIN + "/test-auth/protected?account=user-a");
  await cache.put(publicRequest, new Response("public-icon"));
  await cache.put(staleApi, new Response("PRIVATE:user-a"));
  await cache.put(staleIdentity, new Response("PRIVATE:user-a"));
  await runtime.caches.open("nexus-pwa-old");
  await runtime.caches.open("unrelated-origin-cache");

  await runtime.dispatch("message", makeEvent(undefined, { type: "NEXUS_LOGOUT" }));

  const refreshed = await runtime.caches.open(CACHE_NAME);
  assert.ok(await refreshed.match(publicRequest), "approved public asset remains available");
  assert.equal(await refreshed.match(staleApi), undefined, "stale API payload is removed");
  assert.equal(await refreshed.match(staleIdentity), undefined, "stale identity payload is removed");
  assert.deepEqual((await runtime.caches.keys()).sort(), [CACHE_NAME, "unrelated-origin-cache"]);
});

test("REG-02 CacheStorage.open failure falls back to the network response", async () => {
  const runtime = makeRuntime({ failOpen: true, fetch: async () => new Response("network-after-open-failure") });
  const { response } = await fetchThrough(runtime, new Request(ORIGIN + "/icons/nexus-192.png"));
  assert.equal(await response.text(), "network-after-open-failure");
});

test("REG-02 Cache.match failure does not block the network response", async () => {
  const runtime = makeRuntime({ failMatch: true, fetch: async () => new Response("network-after-match-failure") });
  const { response } = await fetchThrough(runtime, new Request(ORIGIN + "/icons/nexus-192.png"));
  assert.equal(await response.text(), "network-after-match-failure");
});

test("REG-02 Cache.put quota failure does not replace a successful network response", async () => {
  const runtime = makeRuntime({ failPut: true, fetch: async () => new Response("network-after-quota-failure") });
  const { response } = await fetchThrough(runtime, new Request(ORIGIN + "/icons/nexus-192.png"));
  assert.equal(await response.text(), "network-after-quota-failure");
});

test("REG-02 request classification exceptions fail closed", async () => {
  const runtime = makeRuntime();
  const request = {
    method: "GET",
    mode: "cors",
    url: ORIGIN + "/icons/nexus-192.png",
    headers: { has() { throw new Error("simulated header inspection failure"); } },
  };
  const event = makeEvent(request);
  await runtime.dispatch("fetch", event);
  assert.equal(await event.response(), undefined, "uncertain classification is not intercepted or cached");
});

test("REG-02 CacheStorage.keys failure still sanitizes the known current cache", async () => {
  const runtime = makeRuntime({ failStorageKeys: true });
  const cache = await runtime.caches.open(CACHE_NAME);
  const publicRequest = new Request(ORIGIN + "/manifest.webmanifest");
  const staleRequest = new Request(ORIGIN + "/api/projects?legacy=1");
  await cache.put(publicRequest, new Response("public"));
  await cache.put(staleRequest, new Response("PRIVATE:legacy"));
  await assert.doesNotReject(() => runtime.dispatch(
    "message",
    makeEvent(undefined, { type: "NEXUS_LOGOUT" }),
  ));
  const current = await runtime.caches.open(CACHE_NAME);
  assert.ok(await current.match(publicRequest));
  assert.equal(await current.match(staleRequest), undefined);
});

test("offline navigation returns a generic 503 when CacheStorage is unavailable", async () => {
  const runtime = makeRuntime({ failOpen: true, fetch: async () => { throw new Error("offline"); } });
  const request = new Request(ORIGIN + "/test-auth/protected");
  Object.defineProperty(request, "mode", { value: "navigate" });
  const { response } = await fetchThrough(runtime, request);
  assert.equal(response.status, 503);
  assert.match(await response.text(), /NEXUS is offline/);
});

test("REG-01 activation removes obsolete NEXUS caches and sanitizes the current cache", async () => {
  const runtime = makeRuntime();
  const cache = await runtime.caches.open(CACHE_NAME);
  const publicRequest = new Request(ORIGIN + "/manifest.webmanifest");
  const staleRequest = new Request(ORIGIN + "/api/private?legacy=1");
  await cache.put(publicRequest, new Response("public-manifest"));
  await cache.put(staleRequest, new Response("PRIVATE:legacy"));
  await runtime.caches.open("nexus-pwa-v1");
  await runtime.caches.open("third-party-cache");

  await runtime.dispatch("activate", makeEvent(undefined));

  const current = await runtime.caches.open(CACHE_NAME);
  assert.ok(await current.match(publicRequest));
  assert.equal(await current.match(staleRequest), undefined);
  assert.deepEqual((await runtime.caches.keys()).sort(), [CACHE_NAME, "third-party-cache"]);
});

test("REG-02 response-classification exceptions prevent persistence", async () => {
  const opaqueToClassifier = {
    status: 200,
    ok: true,
    type: "basic",
    redirected: false,
    url: ORIGIN + "/icons/nexus-192.png",
    headers: { get() { throw new Error("simulated response header inspection failure"); } },
    clone() { return this; },
  };
  const runtime = makeRuntime({ fetch: async () => opaqueToClassifier });
  const request = new Request(ORIGIN + "/icons/nexus-192.png");
  await fetchThrough(runtime, request);
  const cache = await runtime.caches.open(CACHE_NAME);
  assert.equal(await cache.match(request), undefined);
});

test("Cache.keys failure deletes the current app cache rather than retaining unknown entries", async () => {
  const runtime = makeRuntime({ failKeys: true });
  const cache = await runtime.caches.open(CACHE_NAME);
  await cache.put(new Request(ORIGIN + "/api/private"), new Response("PRIVATE:unknown"));
  await assert.doesNotReject(() => runtime.dispatch(
    "message",
    makeEvent(undefined, { type: "NEXUS_LOGOUT" }),
  ));
  assert.equal(runtime.stores.has(CACHE_NAME), false);
});
