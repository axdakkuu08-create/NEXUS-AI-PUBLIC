import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { once } from "node:events";
import { chromium } from "playwright";

// These identity/session endpoints are test-only fixtures, not product authentication.
const worker = await readFile(new URL("../public/sw.js", import.meta.url), "utf8");
let revocations = 0;
const server = createServer((req, res) => {
  const url = new URL(req.url || "/", "http://127.0.0.1");
  if (url.pathname === "/sw.js") {
    res.writeHead(200, { "Content-Type": "text/javascript", "Cache-Control": "no-cache" });
    res.end(worker); return;
  }
  if (url.pathname === "/") {
    res.writeHead(200, { "Content-Type": "text/html", "Cache-Control": "no-store" });
    res.end(`<!doctype html><title>Lifecycle fixture</title><main>fixture</main><script>
      window.events = []; window.localState = "signed-in"; window.revocation = "not-requested"; window.pending = false;
      window.retryRevocation = async () => {
        if (!window.pending) return;
        if (!navigator.onLine) { window.revocation = "unconfirmed-offline"; return; }
        try { const r = await fetch("/test-auth/revoke", {method:"POST"}); if (!r.ok) throw Error(); window.pending=false; window.revocation="confirmed"; }
        catch { window.revocation="pending-retry"; }
      };
      window.addEventListener("online", () => void window.retryRevocation());
      const channel = new BroadcastChannel("nexus-session-events");
      channel.addEventListener("message", e => {
        if (["NEXUS_LOGOUT", "NEXUS_CLEAR_CACHES"].includes(e.data?.type)) {
          window.events.push(e.data.type); window.localState="signed-out";
          navigator.serviceWorker.controller?.postMessage(e.data);
        }
      });
      navigator.serviceWorker.register("/sw.js", {scope:"/"});
    </script>`); return;
  }
  if (url.pathname === "/offline.html") {
    res.writeHead(200, { "Content-Type": "text/html" });
    res.end("<!doctype html><h1>You're offline</h1><p>Public shell only.</p>"); return;
  }
  if (url.pathname === "/manifest.webmanifest") {
    res.writeHead(200, { "Content-Type": "application/manifest+json" });
    res.end(JSON.stringify({name:"NEXUS test"})); return;
  }
  if (url.pathname.startsWith("/icons/")) {
    res.writeHead(200, { "Content-Type": "text/plain" }); res.end("public-icon"); return;
  }
  if (url.pathname === "/test-auth/protected") {
    const cookie = req.headers.cookie || "";
    if (cookie.includes("nexus-test-user=expired")) {
      res.writeHead(401, { "Cache-Control":"no-store" }); res.end("session-expired"); return;
    }
    const user = /(?:^|;\s*)nexus-test-user=([^;]+)/.exec(cookie)?.[1] || "anonymous";
    res.writeHead(200, { "Cache-Control":"no-store" }); res.end("private-fixture:" + user); return;
  }
  if (url.pathname === "/test-auth/revoke" && req.method === "POST") {
    revocations += 1; res.writeHead(204, {"Cache-Control":"no-store"}); res.end(); return;
  }
  res.writeHead(404); res.end("not-found");
});

server.listen(0, "127.0.0.1");
await once(server, "listening");
const address = server.address();
assert.ok(address && typeof address === "object");
const origin = "http://127.0.0.1:" + address.port;
const browser = await chromium.launch({ headless: true });
try {
  const context = await browser.newContext();
  await context.addCookies([{name:"nexus-test-user", value:"user-a", url:origin}]);
  const a = await context.newPage(), b = await context.newPage();
  await Promise.all([a.goto(origin), b.goto(origin)]);
  await Promise.all([a.waitForFunction(() => !!navigator.serviceWorker.controller), b.waitForFunction(() => !!navigator.serviceWorker.controller)]);

  // LOGOUT-01/02: User A's protected content is network-only.
  const userA = await a.evaluate(async () => { const r=await fetch("/test-auth/protected"); return [r.status, await r.text()]; });
  assert.deepEqual(userA, [200, "private-fixture:user-a"]);
  await a.evaluate(async base => {
    const c=await caches.open("nexus-pwa-v2-m2");
    await c.put(base+"/icons/nexus-192.png", new Response("public-icon"));
    await c.put(base+"/test-auth/protected?legacy=user-a", new Response("PRIVATE:user-a"));
    await c.put(base+"/api/projects?legacy=user-a", new Response("PRIVATE:user-a"));
    await caches.open("nexus-pwa-old"); await caches.open("unrelated-origin-cache");
  }, origin);

  // LOGOUT-04/05: Offline local logout + BroadcastChannel delivery to the second tab.
  await context.setOffline(true);
  await a.evaluate(() => {
    window.localState="signed-out"; window.pending=true; void window.retryRevocation();
    navigator.serviceWorker.controller?.postMessage({type:"NEXUS_LOGOUT"});
    const ch=new BroadcastChannel("nexus-session-events"); ch.postMessage({type:"NEXUS_LOGOUT"}); ch.close();
  });
  await b.waitForFunction(() => events.includes("NEXUS_LOGOUT"));
  await b.waitForFunction(async base => {
    const c=await caches.open("nexus-pwa-v2-m2");
    return !(await c.match(base+"/test-auth/protected?legacy=user-a")) && !(await c.match(base+"/api/projects?legacy=user-a"));
  }, origin);
  assert.equal(await a.evaluate(() => localState), "signed-out");
  assert.equal(await a.evaluate(() => revocation), "unconfirmed-offline");
  assert.equal(revocations, 0, "offline logout cannot claim server revocation");
  const cacheState = await a.evaluate(async base => {
    const c=await caches.open("nexus-pwa-v2-m2");
    return [!!(await c.match(base+"/icons/nexus-192.png")), await caches.keys()];
  }, origin);
  assert.equal(cacheState[0], true);
  assert.ok(cacheState[1].includes("unrelated-origin-cache"));
  assert.ok(!cacheState[1].includes("nexus-pwa-old"));
  const offline = await b.goto(origin+"/test-auth/protected", {waitUntil:"domcontentloaded"});
  assert.ok(offline && offline.status()===200);
  assert.equal(await b.getByRole("heading", {name:"You're offline"}).count(), 1);
  assert.doesNotMatch(await b.locator("body").innerText(), /private-fixture:user-a|PRIVATE:user-a/);

  await context.setOffline(false);
  await a.waitForFunction(() => revocation === "confirmed");
  assert.equal(await a.evaluate(() => pending), false);
  assert.equal(revocations, 1, "fixture retry occurs only after reconnect");

  // LOGOUT-02: User B uses the same protected URL in the same browser profile.
  await context.addCookies([{name:"nexus-test-user", value:"user-b", url:origin}]);
  await b.goto(origin);
  await b.waitForFunction(() => !!navigator.serviceWorker.controller);
  const userB = await b.evaluate(async () => { const r=await fetch("/test-auth/protected"); return [r.status, await r.text()]; });
  assert.deepEqual(userB, [200, "private-fixture:user-b"]);
  assert.equal(await b.evaluate(async base => !!(await (await caches.open("nexus-pwa-v2-m2")).match(base+"/test-auth/protected")), origin), false);

  // LOGOUT-06: A session-expiry 401 is not replaced by a stale cache entry.
  await b.evaluate(async base => { const c=await caches.open("nexus-pwa-v2-m2"); await c.put(base+"/test-auth/protected?expired=1", new Response("PRIVATE:stale-session")); }, origin);
  await context.addCookies([{name:"nexus-test-user", value:"expired", url:origin}]);
  const expired = await b.evaluate(async () => { const r=await fetch("/test-auth/protected"); return [r.status, await r.text()]; });
  assert.deepEqual(expired, [401, "session-expired"]);
  await b.evaluate(() => navigator.serviceWorker.controller?.postMessage({type:"NEXUS_LOGOUT"}));
  await b.waitForFunction(async base => !(await (await caches.open("nexus-pwa-v2-m2")).match(base+"/test-auth/protected?expired=1")), origin);
  await context.close();
} finally {
  await browser.close();
  await new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}
