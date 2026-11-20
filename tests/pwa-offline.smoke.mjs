import assert from "node:assert/strict";
import { chromium } from "playwright";

const baseUrl = process.env.PWA_BASE_URL ?? "http://127.0.0.1:3000";
const browser = await chromium.launch({ headless: true });

try {
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
    isMobile: true,
    hasTouch: true,
  });

  // Seed the old cache before the application registers the worker. Creating
  // it after activation would test a cache created too late for activation cleanup.
  await context.addInitScript(() => {
    const serviceWorker = navigator.serviceWorker;
    const originalRegister = serviceWorker.register.bind(serviceWorker);
    serviceWorker.register = async (...args) => {
      const legacy = await caches.open("nexus-pwa-v1");
      await legacy.put(
        new URL("/home", location.origin),
        new Response("LEGACY PRIVATE CACHE FIXTURE"),
      );
      return originalRegister(...args);
    };
  });

  const page = await context.newPage();
  const response = await page.goto(baseUrl + "/home", { waitUntil: "networkidle" });
  assert.ok(response && response.status() === 200, "home route should load online");
  assert.match(await page.title(), /NEXUS-AI/);
  assert.equal(await page.locator('link[rel="manifest"]').getAttribute("href"), "/manifest.webmanifest");

  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
  });
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForFunction(() => navigator.serviceWorker.controller !== null, { timeout: 15000 });

  assert.equal(
    await page.getByText("NEXUS-AI Command Center").count(),
    1,
    "the mobile home workspace should render",
  );

  const cacheSnapshot = await page.evaluate(async () => {
    const names = await caches.keys();
    const entries = await Promise.all(names.map(async (name) => ({
      name,
      urls: (await (await caches.open(name)).keys()).map((request) => new URL(request.url).pathname),
    })));
    return { names, entries };
  });
  assert.ok(cacheSnapshot.names.includes("nexus-pwa-public-v2"), "public shell cache should exist");
  assert.equal(cacheSnapshot.names.includes("nexus-pwa-v1"), false, "legacy broad cache must be removed on activation");
  const allowed = new Set(["/offline.html", "/manifest.webmanifest", "/icons/nexus-192.png", "/icons/nexus-512.png"]);
  for (const entry of cacheSnapshot.entries) {
    assert.equal(entry.name, "nexus-pwa-public-v2", "only the designated NEXUS public cache may exist");
    for (const pathname of entry.urls) assert.ok(allowed.has(pathname), "unexpected cached path: " + pathname);
  }

  await context.setOffline(true);
  const previouslyVisited = await page.goto(baseUrl + "/home", { waitUntil: "domcontentloaded" });
  assert.ok(previouslyVisited && previouslyVisited.status() === 200, "offline navigation should receive the generic shell");
  assert.equal(await page.getByRole("heading", { name: "You're offline" }).count(), 1);
  assert.equal(await page.getByText("NEXUS-AI Command Center").count(), 0, "previously visited private page must not be replayed offline");

  const fallbackResponse = await page.goto(baseUrl + "/pwa-offline-test-unvisited", { waitUntil: "domcontentloaded" });
  assert.ok(fallbackResponse && fallbackResponse.status() === 200, "unvisited navigation should receive the offline fallback");
  assert.equal(await page.getByRole("heading", { name: "You're offline" }).count(), 1);

  await context.setOffline(false);
  const restoredResponse = await page.goto(baseUrl + "/home", { waitUntil: "networkidle" });
  assert.ok(restoredResponse && restoredResponse.status() === 200, "home should work again after reconnecting");
  await context.close();
} finally {
  await browser.close();
}
