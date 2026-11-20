import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";
import test from "node:test";

const workerSource = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");

function createHarness({ fetchImpl } = {}) {
  const handlers = new Map();
  const cacheStores = new Map();
  const clientsNotified = [];
  const fetchCalls = [];
  const cacheKey = (request) => typeof request === "string" ? request : request instanceof URL ? request.href : request.url;
  const caches = {
    async open(name) {
      if (!cacheStores.has(name)) cacheStores.set(name, new Map());
      const store = cacheStores.get(name);
      return {
        async match(request) { const response = store.get(cacheKey(request)); return response?.clone(); },
        async put(request, response) { store.set(cacheKey(request), response.clone()); },
        async delete(request) { return store.delete(cacheKey(request)); },
        async keys() { return [...store.keys()].map((url) => new Request(url)); },
      };
    },
    async keys() { return [...cacheStores.keys()]; },
    async delete(name) { return cacheStores.delete(name); },
  };
  const clients = {
    async claim() {},
    async matchAll() { return [{ postMessage: (message) => clientsNotified.push(message) }, { postMessage: (message) => clientsNotified.push(message) }]; },
  };
  const workerFetch = async (...args) => {
    fetchCalls.push({ request: args[0], options: args[1] });
    return fetchImpl ? fetchImpl(...args) : new Response("network", { status: 200 });
  };
  const self = {
    location: { origin: "https://nexus.test" }, clients,
    addEventListener(type, handler) { handlers.set(type, handler); },
    async skipWaiting() {},
  };
  vm.runInNewContext(workerSource, {
    self, caches, fetch: workerFetch,
    Request, Response, URL, Promise, Set,
  }, { filename: "sw.js" });
  return {
    handlers, caches, cacheStores, clientsNotified, fetchCalls,
    async dispatchFetch(request) {
      let responsePromise;
      handlers.get("fetch")({ request, respondWith(value) { responsePromise = Promise.resolve(value); } });
      return responsePromise ? await responsePromise : null;
    },
    async dispatchMessage(data) {
      let pending;
      handlers.get("message")({ data, waitUntil(value) { pending = Promise.resolve(value); } });
      await pending;
    },
    async dispatchActivate() {
      let pending;
      handlers.get("activate")({ waitUntil(value) { pending = Promise.resolve(value); } });
      await pending;
    },
  };
}

const asset = (path = "/manifest.webmanifest", headers = {}) => new Request("https://nexus.test" + path, { headers });
const navigation = (path) => ({ url: "https://nexus.test" + path, method: "GET", mode: "navigate", headers: new Headers() });
const response = (body = "public", headers = {}) => new Response(body, { status: 200, headers });

async function seedOfflineShell(harness) {
  const cache = await harness.caches.open("nexus-pwa-public-v2");
  await cache.put("https://nexus.test/offline.html", response("GENERIC OFFLINE SHELL"));
}

test("install precaches only explicitly approved shell paths with safe responses", async () => {
  const requested = [];
  const h = createHarness({ fetchImpl: async (request) => { requested.push(new URL(request.url).pathname); return response("shell", { "Cache-Control": "public, max-age=60" }); } });
  let pending;
  h.handlers.get("install")({ waitUntil(value) { pending = Promise.resolve(value); } });
  await pending;
  assert.deepEqual(requested.sort(), ["/icons/nexus-192.png", "/icons/nexus-512.png", "/manifest.webmanifest", "/offline.html"].sort());
  assert.equal(h.cacheStores.get("nexus-pwa-public-v2").size, 4);
});

test("only exact public shell assets are eligible for cache storage", async () => {
  const h = createHarness({ fetchImpl: async () => response("asset") });
  const result = await h.dispatchFetch(asset());
  assert.equal(await result.text(), "asset");
  assert.equal(h.fetchCalls.at(-1).options.cache, "no-store");
  assert.deepEqual(await h.caches.keys(), ["nexus-pwa-public-v2"]);
  assert.equal(h.cacheStores.get("nexus-pwa-public-v2").size, 1);
});

test("navigation response is network-only and never persisted", async () => {
  const h = createHarness({ fetchImpl: async () => response("PRIVATE PAGE USER A") });
  const result = await h.dispatchFetch(navigation("/projects"));
  assert.match(await result.text(), /PRIVATE PAGE USER A/);
  assert.equal(h.cacheStores.get("nexus-pwa-public-v2"), undefined);
});

test("offline navigation returns only generic offline shell, not a visited page", async () => {
  const h = createHarness({ fetchImpl: async () => { throw new TypeError("offline"); } });
  await seedOfflineShell(h);
  const result = await h.dispatchFetch(navigation("/projects"));
  assert.equal(await result.text(), "GENERIC OFFLINE SHELL");
});

test("RSC, router-state and prefetch requests are network-only and not cached", async () => {
  const h = createHarness();
  for (const req of [
    new Request("https://nexus.test/home?_rsc=abc"),
    new Request("https://nexus.test/home", { headers: { RSC: "1" } }),
    new Request("https://nexus.test/home", { headers: { "Next-Router-State-Tree": "{}" } }),
  ]) {
    assert.ok(await h.dispatchFetch(req));
    assert.equal(h.fetchCalls.at(-1).options.cache, "no-store");
  }
  assert.deepEqual(await h.caches.keys(), []);
});

test("API, auth, session and backend GET requests remain network-only", async () => {
  const h = createHarness();
  for (const path of ["/api/projects", "/api/auth/session", "/auth/logout", "/backend/query"]) {
    assert.ok(await h.dispatchFetch(asset(path)));
    assert.equal(h.fetchCalls.at(-1).options.cache, "no-store");
  }
  assert.deepEqual(await h.caches.keys(), []);
});

test("query variants are network-only and excluded from the public asset cache", async () => {
  const h = createHarness();
  assert.ok(await h.dispatchFetch(asset("/manifest.webmanifest?v=2")));
  assert.equal(h.fetchCalls.at(-1).options.cache, "no-store");
  assert.deepEqual(await h.caches.keys(), []);
});

test("a newly private response invalidates an older cached copy", async () => {
  const h = createHarness({ fetchImpl: async () => response("now private", { "Cache-Control": "private, no-store" }) });
  const cache = await h.caches.open("nexus-pwa-public-v2");
  await cache.put("https://nexus.test/manifest.webmanifest", response("old public copy"));
  const result = await h.dispatchFetch(asset());
  assert.equal(await result.text(), "now private");
  assert.equal(await cache.match(asset()), undefined);
});

test("private, no-store and no-cache response directives are excluded", async (t) => {
  for (const directive of ["private", "no-store", "no-cache", "public, no-store", "MAX-AGE=60, PRIVATE"]) {
    await t.test(directive, async () => {
      const h = createHarness({ fetchImpl: async () => response("sensitive", { "Cache-Control": directive }) });
      const result = await h.dispatchFetch(asset());
      assert.equal(await result.text(), "sensitive");
      assert.equal(h.cacheStores.get("nexus-pwa-public-v2")?.size ?? 0, 0);
    });
  }
});

test("Set-Cookie, Vary star, opaque, redirected and error responses are excluded", async (t) => {
  const cases = [
    ["Set-Cookie", () => response("sensitive", { "Set-Cookie": "sid=secret" })],
    ["Vary star", () => response("variant", { Vary: "Accept-Encoding, *" })],
    ["opaque", () => ({ status: 200, ok: true, type: "opaque", redirected: false, url: "", headers: new Headers(), clone() { return this; } })],
    ["redirected", () => ({ status: 200, ok: true, type: "basic", redirected: true, url: "https://nexus.test/redirect", headers: new Headers(), clone() { return this; } })],
    ["error", () => new Response("error", { status: 500 })],
  ];
  for (const [name, make] of cases) await t.test(name, async () => {
    const h = createHarness({ fetchImpl: async () => make() });
    await h.dispatchFetch(asset());
    assert.equal(h.cacheStores.get("nexus-pwa-public-v2")?.size ?? 0, 0);
  });
});

test("Authorization-bearing requests cannot enter Cache Storage", async () => {
  const h = createHarness();
  const result = await h.dispatchFetch(asset("/manifest.webmanifest", { Authorization: "Bearer test-only" }));
  assert.ok(result);
  assert.equal(h.fetchCalls.at(-1).options.cache, "no-store");
  assert.deepEqual(await h.caches.keys(), []);
});

test("non-GET and cross-origin requests are not intercepted", async () => {
  const h = createHarness();
  assert.equal(await h.dispatchFetch(new Request("https://nexus.test/manifest.webmanifest", { method: "POST" })), null);
  assert.equal(await h.dispatchFetch(new Request("https://cdn.test/manifest.webmanifest")), null);
  assert.deepEqual(await h.caches.keys(), []);
});

test("logout/account-change clears only app-owned private caches and notifies tabs", async () => {
  const h = createHarness();
  await h.caches.open("nexus-private-user-a");
  await h.caches.open("unrelated-origin-cache");
  await h.dispatchMessage({ type: "NEXUS_SESSION_END" });
  assert.deepEqual(await h.caches.keys(), ["unrelated-origin-cache"]);
  assert.equal(h.clientsNotified.length, 2);
  assert.ok(h.clientsNotified.every((message) => message.type === "NEXUS_SESSION_INVALIDATED"));
});

test("account switch uses the same private-cache invalidation boundary", async () => {
  const h = createHarness();
  await h.caches.open("nexus-private-user-a");
  await h.dispatchMessage({ type: "NEXUS_ACCOUNT_CHANGE" });
  assert.deepEqual(await h.caches.keys(), []);
});

test("late navigation response after logout cannot repopulate a cache", async () => {
  let resolveFetch;
  const h = createHarness({ fetchImpl: () => new Promise((resolve) => { resolveFetch = resolve; }) });
  const pending = h.dispatchFetch(navigation("/private"));
  await h.dispatchMessage({ type: "NEXUS_SESSION_END" });
  resolveFetch(response("late private response"));
  assert.equal(await (await pending).text(), "late private response");
  assert.equal(h.cacheStores.get("nexus-pwa-public-v2"), undefined);
  assert.deepEqual(await h.caches.keys(), []);
});

test("cache classification and storage failures fail closed", async () => {
  const h = createHarness({ fetchImpl: async () => response("fresh") });
  const originalOpen = h.caches.open;
  h.caches.open = async () => { throw new Error("quota or storage failure"); };
  const result = await h.dispatchFetch(asset());
  assert.equal(result.status, 200, "storage failure must not block the network response");
  assert.equal(await result.text(), "fresh");
  h.caches.open = originalOpen;
});

test("activation removes only obsolete NEXUS public caches", async () => {
  const h = createHarness();
  await h.caches.open("nexus-pwa-v1");
  await h.caches.open("nexus-pwa-public-v1");
  await h.caches.open("nexus-pwa-public-v2");
  await h.caches.open("unrelated-origin-cache");
  await h.dispatchActivate();
  assert.deepEqual((await h.caches.keys()).sort(), ["nexus-pwa-public-v2", "unrelated-origin-cache"].sort());
});
