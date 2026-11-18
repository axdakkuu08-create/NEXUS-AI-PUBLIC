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
    "the mobile home workspace should render while online",
  );

  await context.setOffline(true);
  const offlineResponse = await page.goto(baseUrl + "/home", { waitUntil: "domcontentloaded" });
  assert.ok(offlineResponse && offlineResponse.status() === 200, "offline navigation should receive the generic fallback");
  assert.equal(await page.getByRole("heading", { name: "You're offline" }).count(), 1);
  assert.equal(
    await page.getByText("NEXUS-AI Command Center").count(),
    0,
    "a previously visited workspace page must not be replayed offline",
  );

  const publicManifest = await page.evaluate(async () => {
    const result = await fetch("/manifest.webmanifest");
    return { ok: result.ok, manifest: await result.json() };
  });
  assert.equal(publicManifest.ok, true, "the explicitly approved public manifest should remain available offline");
  assert.equal(publicManifest.manifest.name, "NEXUS-AI");

  const fallbackResponse = await page.goto(baseUrl + "/pwa-offline-test-unvisited", {
    waitUntil: "domcontentloaded",
  });
  assert.ok(fallbackResponse && fallbackResponse.status() === 200, "unvisited navigation should receive the offline fallback");
  assert.equal(await page.getByRole("heading", { name: "You're offline" }).count(), 1);

  await context.setOffline(false);
  const restoredResponse = await page.goto(baseUrl + "/home", { waitUntil: "networkidle" });
  assert.ok(restoredResponse && restoredResponse.status() === 200, "home should work again after reconnecting");
  await context.close();
} finally {
  await browser.close();
}
