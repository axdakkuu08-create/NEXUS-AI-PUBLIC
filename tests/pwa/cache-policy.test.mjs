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

function makeRuntime(fetchImpl = async () => new Response("asset")) {
  const listeners = new Map();
  const stores = new Map();
  const keyOf = (request) => (typeof request === "string" ? new URL(request, ORIGIN).href : request.url);
  const makeCache = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    const store = stores.get(name);
    return {
      async put(request, response) { store.set(keyOf(request), response.clone()); },
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

test("Set-Cookie response is not cached", async () => {
  const runtime = makeRuntime(async () => new Response("session", {
    headers: { "Set-Cookie": "sid=secret; HttpOnly" },
  }));
  const event = makeEvent(new Request(ORIGIN + "/icons/nexus-192.png"));
  await runtime.dispatch("fetch", event);
  await event.response();
  assert.equal(runtime.stores.get(CACHE_NAME)?.has(event.request.url) || false, false);
});

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
  assert.equal(await cache.match(request), undefined);
});

test("logout invalidates an in-flight cache write", async () => {
  let resolveFetch;
  const runtime = makeRuntime(() => new Promise((resolve) => { resolveFetch = resolve; }));
  const request = new Request(ORIGIN + "/icons/nexus-192.png");
  const fetchEvent = makeEvent(request);
  await runtime.dispatch("fetch", fetchEvent);
  for (let attempt = 0; attempt < 10 && !resolveFetch; attempt += 1) {
    await new Promise((resolve) => setImmediate(resolve));
  }
  assert.equal(typeof resolveFetch, "function");
  const messageEvent = makeEvent(undefined);
  messageEvent.data = { type: "NEXUS_LOGOUT" };
  await runtime.dispatch("message", messageEvent);
  resolveFetch(new Response("late response"));
  await fetchEvent.response();
  const cache = await runtime.caches.open(CACHE_NAME);
  assert.equal(await cache.match(request), undefined);
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
