import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { chromium } from "playwright";

const workerSource = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
const hits = new Map();
const count = (key) => hits.set(key, (hits.get(key) || 0) + 1);

const server = createServer((request, response) => {
  const url = new URL(request.url || "/", "http://127.0.0.1");
  count(url.pathname + url.search);

  if (url.pathname === "/sw.js") {
    response.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-cache" });
    response.end(workerSource);
    return;
  }
  if (url.pathname === "/") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><title>NEXUS PWA browser cache tests</title><main>ready</main>");
    return;
  }
  if (url.pathname === "/offline.html") {
    response.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    response.end("<!doctype html><title>Offline</title><h1>You're offline</h1>");
    return;
  }
  if (url.pathname === "/manifest.webmanifest") {
    response.writeHead(200, { "Content-Type": "application/manifest+json" });
    response.end(JSON.stringify({ name: "NEXUS test shell" }));
    return;
  }
  if (url.pathname.startsWith("/icons/") || url.pathname.startsWith("/_next/static/")) {
    if (url.searchParams.has("redirect")) {
      response.writeHead(302, { Location: "/icons/nexus-192.png?redirect-target=1" });
      response.end();
      return;
    }
    if (url.searchParams.get("status") === "404") {
      response.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
      response.end("not found");
      return;
    }
    const headers = { "Content-Type": "text/plain; charset=utf-8" };
    const cacheControl = url.searchParams.get("cache-control");
    if (cacheControl) headers["Cache-Control"] = cacheControl;
    if (url.searchParams.get("vary") === "star") headers.Vary = "*";
    if (url.searchParams.get("set-cookie") === "1") {
      headers["Set-Cookie"] = "nexus-session=fixture; HttpOnly; SameSite=Lax";
      headers["Cache-Control"] = "no-store";
    }
    response.writeHead(200, headers);
    response.end("public-network-asset");
    return;
  }

  response.writeHead(url.pathname === "/missing" ? 404 : 200, {
    "Content-Type": "text/plain; charset=utf-8",
  });
  response.end("network:" + url.pathname);
});

server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const origin = "http://127.0.0.1:" + address.port;
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext();
  const page = await context.newPage();
  await page.goto(origin);
  await page.evaluate(async () => {
    await navigator.serviceWorker.register("/sw.js");
    await navigator.serviceWorker.ready;
  });
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null);

  const cacheName = "nexus-pwa-v2-m2";
  const cacheState = async (url) => page.evaluate(async (target) => {
    const cache = await caches.open("nexus-pwa-v2-m2");
    return (await cache.match(target)) !== undefined;
  }, url);
  const fetchFromPage = async (path, headers = {}) => page.evaluate(async ({ path, headers }) => {
    const response = await fetch(path, { headers });
    return { status: response.status, body: await response.text(), setCookieVisible: response.headers.has("Set-Cookie"), redirected: response.redirected };
  }, { path, headers });

  // Only public assets are eligible; private/cache-control variants must never persist.
  for (const directive of ["private", "no-store", "no-cache"]) {
    const path = "/icons/nexus-192.png?cache-control=" + directive;
    const result = await fetchFromPage(path);
    assert.equal(result.status, 200);
    assert.equal(await cacheState(origin + path), false, directive + " response must not enter Cache Storage");
  }

  const varyPath = "/icons/nexus-192.png?vary=star";
  await fetchFromPage(varyPath);
  assert.equal(await cacheState(origin + varyPath), false, "Vary: * response must not enter Cache Storage");

  const redirectPath = "/icons/nexus-192.png?redirect=1";
  const redirected = await fetchFromPage(redirectPath);
  assert.equal(redirected.redirected, true);
  assert.equal(await cacheState(origin + redirectPath), false, "redirected response must not enter Cache Storage");

  const cookiePath = "/icons/nexus-192.png?set-cookie=1";
  const cookieResponse = await fetchFromPage(cookiePath);
  assert.equal(cookieResponse.setCookieVisible, false, "Set-Cookie must be browser-inaccessible to page/service-worker JavaScript");
  assert.equal(await cacheState(origin + cookiePath), false, "server must pair cookie/session-setting responses with no-store");

  const errorPath = "/icons/nexus-192.png?status=404";
  const errorResponse = await fetchFromPage(errorPath);
  assert.equal(errorResponse.status, 404);
  assert.equal(await cacheState(origin + errorPath), false, "error response must not enter Cache Storage");

  // Request classes outside the positive allowlist remain network-only even when 2xx.
  const excludedRequests = [
    ["/api/projects?case=api", {}],
    ["/auth/session?case=session", {}],
    ["/logout?case=logout", {}],
    ["/graphql?case=graphql", {}],
    ["/icons/nexus-192.png?case=authorization", { Authorization: "Bearer fixture" }],
    ["/icons/nexus-192.png?case=rsc", { RSC: "1" }],
    ["/icons/nexus-192.png?case=router-state", { "Next-Router-State-Tree": "fixture" }],
    ["/icons/nexus-192.png?case=prefetch", { "Next-Router-Prefetch": "1" }],
  ];
  for (const [path, headers] of excludedRequests) {
    const result = await fetchFromPage(path, headers);
    assert.equal(result.status, 200, path);
    assert.equal(await cacheState(origin + path), false, path + " must not enter Cache Storage");
    assert.ok(hits.get(path) >= 1, path + " must reach the network");
  }

  // Seed a stale API entry to prove the worker never replays it for a network-only route.
  const apiPath = "/api/projects?case=stale";
  await page.evaluate(async (target) => {
    const cache = await caches.open("nexus-pwa-v2-m2");
    await cache.put(target, new Response("stale-private-fixture"));
  }, origin + apiPath);
  const apiResult = await fetchFromPage(apiPath);
  assert.match(apiResult.body, /^network:/);
  assert.equal(apiResult.body, "network:/api/projects");
  assert.equal(await cacheState(origin + apiPath), true, "the test fixture remains seeded but is not replayed");

  // A cross-origin no-cors response is opaque and must never enter this origin's cache.
  const otherOriginServer = createServer((_request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("opaque");
  });
  otherOriginServer.listen(0, "127.0.0.1");
  await once(otherOriginServer, "listening");
  const otherAddress = otherOriginServer.address();
  assert.ok(otherAddress && typeof otherAddress === "object");
  const opaqueUrl = "http://127.0.0.1:" + otherAddress.port + "/opaque";
  const opaqueType = await page.evaluate(async (url) => (await fetch(url, { mode: "no-cors" })).type, opaqueUrl);
  assert.equal(opaqueType, "opaque");
  assert.equal(await cacheState(opaqueUrl), false);
  await new Promise((resolve, reject) => otherOriginServer.close((error) => error ? reject(error) : resolve()));

  // Confirm an ordinary public asset is genuinely written to Cache Storage.
  const publicPath = "/icons/nexus-192.png?case=public";
  await fetchFromPage(publicPath);
  assert.equal(await cacheState(origin + publicPath), true, "approved public asset should be cached");

  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
}
