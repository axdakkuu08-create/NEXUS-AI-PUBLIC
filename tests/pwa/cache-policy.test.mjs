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

function makeRuntime(fetchImpl = async () => new Response("asset"), options = {}) {
  const listeners = new Map();
  const stores = new Map();
  const keyOf = (request) => (typeof request === "string" ? new URL(request, ORIGIN).href : request.url);
  const makeCache = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async put(request, response) {
        if (options.beforePut) await options.beforePut(request, response);
        store.set(keyOf(request), response.clone());
      },
      async match(request) {
        const value = store.get(keyOf(request));
        return value ? value.clone() : undefined;
      },
      async delete(request) { return store.delete(keyOf(request)); },
      async keys() { return [...store.keys()].map((url) => new Request(url)); },
    };
  };
  const caches = {
    async open(name) { return makeCache(name); },
    async keys() { return [...stores.keys()]; },
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
    self, caches, fetch: fetchImpl, URL, Request, Response, Headers, Promise, Map, Set,
  });
  async function dispatch(type, event) {
    for (const callback of listeners.get(type) || []) callback(event);
    if (event.waiting) await Promise.all(event.waiting);
  }
  return { caches, stores, dispatch };
}

function makeEvent(request) {
  let responsePromise;
  const waiting = [];
  return {
    request,
    waiting,
    data: undefined,
    respondWith(promise) { responsePromise = Promise.resolve(promise); },
    waitUntil(promise) { waiting.push(Promise.resolve(promise)); },
    async response() { return responsePromise; },
  };
}

async function install(runtime) {
  await runtime.dispatch("install", makeEvent(undefined));
}

test("install stores only explicitly listed public shell resources", async () => {
  const runtime = makeRuntime(async (request) => new Response(request.url));
  await install(runtime);
  const cache = await runtime.caches.open(CACHE_NAME);
  assert.ok(await cache.match(ORIGIN + "/offline.html"));
  assert.ok(await cache.match(ORIGIN + "/manifest.webmanifest"));
  assert.equal(runtime.stores.get(CACHE_NAME).size, 4);
});

test("eligible public static asset is stored after a successful network response", async () => {
  const runtime = makeRuntime(async () => new Response("public-js"));
  const event = makeEvent(new Request(ORIGIN + "/_next/static/chunks/app.js"));
  await runtime.dispatch("fetch", event);
  const response = await event.response();
  assert.equal(await response.text(), "public-js");
  const cache = await runtime.caches.open(CACHE_NAME);
  assert.ok(await cache.match(event.request));
});

test("navigation is network-only and offline fallback is the generic shell", async () => {
  const runtime = makeRuntime(async (request) => {
    if (new URL(request.url).pathname === "/offline.html") return new Response("GENERIC OFFLINE SHELL");
    throw new Error("offline");
  });
  await install(runtime);
  const navigationRequest = new Request(ORIGIN + "/home");
  Object.defineProperty(navigationRequest, "mode", { value: "navigate" });
  const event = makeEvent(navigationRequest);
  await runtime.dispatch("fetch", event);
  const response = await event.response();
  assert.match(await response.text(), /GENERIC OFFLINE SHELL/);
  assert.equal(runtime.stores.get(CACHE_NAME).has(ORIGIN + "/home"), false);
});

test("RSC and router-state requests are not intercepted or cached", async () => {
  const runtime = makeRuntime();
  const request = new Request(ORIGIN + "/_next/static/chunks/app.js", {
    headers: { RSC: "1", "Next-Router-State-Tree": "tree" },
  });
  const event = makeEvent(request);
  await runtime.dispatch("fetch", event);
  assert.equal(await event.response(), undefined);
});

test("API and authentication requests remain network-only", async () => {
  const runtime = makeRuntime();
  for (const path of ["/api/projects", "/auth/session", "/logout", "/graphql"]) {
    const event = makeEvent(new Request(ORIGIN + path));
    await runtime.dispatch("fetch", event);
    assert.equal(await event.response(), undefined, path);
  }
});

test("Authorization header excludes an otherwise public-looking asset", async () => {
  const runtime = makeRuntime();
  const event = makeEvent(new Request(ORIGIN + "/icons/nexus-192.png", {
    headers: { Authorization: "Bearer test" },
  }));
  await runtime.dispatch("fetch", event);
  assert.equal(await event.response(), undefined);
});

for (const directive of ["no-store", "private", "no-cache", "max-age=0, PRIVATE"]) {
  test("response with Cache-Control " + directive + " is not cached", async () => {
    const runtime = makeRuntime(async () => new Response("not cacheable", {
      headers: { "Cache-Control": directive },
    }));
    const event = makeEvent(new Request(ORIGIN + "/icons/nexus-192.png"));
    await runtime.dispatch("fetch", event);
    await event.response();
    assert.equal(runtime.stores.get(CACHE_NAME)?.has(event.request.url) || false, false);
  });
}

test("Vary star response is not cached", async () => {
  const runtime = makeRuntime(async () => new Response("vary", { headers: { Vary: "*" } }));
  const event = makeEvent(new Request(ORIGIN + "/icons/nexus-192.png"));
  await runtime.dispatch("fetch", event);
  await event.response();
  assert.equal(runtime.stores.get(CACHE_NAME)?.has(event.request.url) || false, false);
});

test("opaque response is not cached", async () => {
  const runtime = makeRuntime(async () => ({
    ok: true, status: 200, type: "opaque", redirected: false,
    url: ORIGIN + "/icons/nexus-192.png", headers: new Headers(),
    clone() { return this; },
  }));
  const event = makeEvent(new Request(ORIGIN + "/icons/nexus-192.png"));
  await runtime.dispatch("fetch", event);
  await event.response();
  assert.equal(runtime.stores.get(CACHE_NAME)?.has(event.request.url) || false, false);
});

test("redirected and error responses are not cached", async () => {
  for (const response of [
    Response.redirect(ORIGIN + "/elsewhere", 302),
    Response.error(),
  ]) {
    const runtime = makeRuntime(async () => response);
    const event = makeEvent(new Request(ORIGIN + "/icons/nexus-192.png"));
    await runtime.dispatch("fetch", event);
    await event.response();
    assert.equal(runtime.stores.get(CACHE_NAME)?.has(event.request.url) || false, false);
  }
});

test("a stale cached response with private headers is deleted, not replayed", async () => {
  const runtime = makeRuntime();
  const cache = await runtime.caches.open(CACHE_NAME);
  const request = new Request(ORIGIN + "/icons/nexus-192.png");
  await cache.put(request, new Response("stale private", {
    headers: { "Cache-Control": "private, no-store" },
  }));
  const event = makeEvent(request);
  await runtime.dispatch("fetch", event);
  const response = await event.response();
  assert.equal(await response.text(), "asset");
  const refreshed = await cache.match(request);
  assert.ok(refreshed, "the fresh network response may be cached");
  assert.equal(await refreshed.text(), "asset");
});

test("logout during an already-started cache.put removes the stale write", async () => {
  let signalPutStarted;
  const putStarted = new Promise((resolve) => { signalPutStarted = resolve; });
  let releasePut;
  const blockedPut = new Promise((resolve) => { releasePut = resolve; });
  const runtime = makeRuntime(
    async () => new Response("late response"),
    { beforePut: async () => { signalPutStarted(); await blockedPut; } },
  );
  const request = new Request(ORIGIN + "/icons/nexus-192.png");
  const fetchEvent = makeEvent(request);
  await runtime.dispatch("fetch", fetchEvent);
  await putStarted;

  const messageEvent = makeEvent(undefined);
  messageEvent.data = { type: "NEXUS_LOGOUT" };
  await runtime.dispatch("message", messageEvent);
  releasePut();
  await fetchEvent.response();

  const cache = await runtime.caches.open(CACHE_NAME);
  assert.equal(await cache.match(request), undefined);
});

test("a new-generation write queued behind a stale write survives logout", async () => {
  let putCount = 0;
  let signalFirstPut;
  const firstPutStarted = new Promise((resolve) => { signalFirstPut = resolve; });
  let releaseFirstPut;
  const blockedFirstPut = new Promise((resolve) => { releaseFirstPut = resolve; });
  const runtime = makeRuntime(
    async () => new Response(++putCount === 1 ? "old generation" : "new generation"),
    { beforePut: async () => {
      if (putCount === 1) { signalFirstPut(); await blockedFirstPut; }
    } },
  );
  const request = new Request(ORIGIN + "/icons/nexus-192.png?generation-test=1");
  const firstEvent = makeEvent(request);
  await runtime.dispatch("fetch", firstEvent);
  await firstPutStarted;

  const logoutEvent = makeEvent(undefined);
  logoutEvent.data = { type: "NEXUS_LOGOUT" };
  await runtime.dispatch("message", logoutEvent);

  const secondEvent = makeEvent(request);
  await runtime.dispatch("fetch", secondEvent);
  releaseFirstPut();
  await Promise.all([firstEvent.response(), secondEvent.response()]);

  const cache = await runtime.caches.open(CACHE_NAME);
  const stored = await cache.match(request);
  assert.ok(stored);
  assert.equal(await stored.text(), "new generation");
});

test("cache cleanup removes only NEXUS-owned caches", async () => {
  const runtime = makeRuntime();
  await runtime.caches.open("unrelated-origin-cache");
  await runtime.caches.open("nexus-pwa-old");
  await runtime.caches.open(CACHE_NAME);
  const event = makeEvent(undefined);
  event.data = { type: "NEXUS_CLEAR_CACHES" };
  await runtime.dispatch("message", event);
  assert.deepEqual(await runtime.caches.keys(), ["unrelated-origin-cache"]);
});
