import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);

test("web manifest declares an installable standalone app and required icons", async () => {
  const manifestText = await readFile(new URL("public/manifest.webmanifest", root), "utf8");
  const manifest = JSON.parse(manifestText);

  assert.equal(manifest.name, "NEXUS-AI");
  assert.equal(manifest.start_url, "/home");
  assert.equal(manifest.display, "standalone");
  assert.ok(manifest.icons.some((icon) => icon.sizes === "192x192"));
  assert.ok(manifest.icons.some((icon) => icon.sizes === "512x512"));
});

test("Android icon assets are valid PNG files with their declared dimensions", async () => {
  for (const [file, expected] of [
    ["public/icons/nexus-192.png", 192],
    ["public/icons/nexus-512.png", 512],
  ]) {
    const bytes = await readFile(new URL(file, root));
    assert.deepEqual([...bytes.subarray(0, 8)], [137, 80, 78, 71, 13, 10, 26, 10]);
    assert.equal(bytes.readUInt32BE(16), expected);
    assert.equal(bytes.readUInt32BE(20), expected);
  }
});

test("service worker and offline fallback are present", async () => {
  const [worker, fallback] = await Promise.all([
    readFile(new URL("public/sw.js", root), "utf8"),
    readFile(new URL("public/offline.html", root), "utf8"),
  ]);

  assert.match(worker, /addEventListener\("install"/);
  assert.match(worker, /addEventListener\("fetch"/);
  assert.match(worker, /cache\.match/);
  assert.match(fallback, /You're offline/);
  assert.match(fallback, /Previously visited workspace pages/);
  assert.match(fallback, /private route responses/);
});
