import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverOllama,
  OLLAMA_REQUEST_TIMEOUT_MS,
  type OllamaDiscoveryResult,
} from "../src/lib/server/ollama/discovery.ts";

const originalOrigin = process.env.NEXUS_OLLAMA_ORIGIN;
const DEFAULT_ORIGIN = "http://127.0.0.1:11434";

function jsonResponse(value: unknown, status = 200): Response {
  return new Response(JSON.stringify(value), {
    status,
    headers: { "content-type": "application/json" },
  });
}

function tags(models: unknown[] = []) {
  return { models };
}

function model(name: string, size = 1234, details: Record<string, unknown> = {}) {
  return { name, size, details };
}

function setOrigin(value?: string) {
  if (value === undefined) delete process.env.NEXUS_OLLAMA_ORIGIN;
  else process.env.NEXUS_OLLAMA_ORIGIN = value;
}

test.beforeEach(() => setOrigin());
test.after(() => {
  if (originalOrigin === undefined) delete process.env.NEXUS_OLLAMA_ORIGIN;
  else process.env.NEXUS_OLLAMA_ORIGIN = originalOrigin;
});

test("ready requires both tags and a non-empty version", async () => {
  const calls: Array<{ url: string; init?: RequestInit }> = [];
  const result = await discoverOllama(async (input, init) => {
    const url = String(input);
    calls.push({ url, init });
    return url.endsWith("/api/tags")
      ? jsonResponse(tags([
          model("Llama3.2:Latest", 1024, {
            parameter_size: "3.2B",
            quantization_level: "q4_k_m",
          }),
        ]))
      : jsonResponse({ version: "0.5.7" });
  });

  assert.deepEqual(result, {
    status: "ready",
    version: "0.5.7",
    models: [{
      name: "llama3.2:latest",
      sizeBytes: 1024,
      parameterSize: "3.2B",
      quantizationLevel: "Q4_K_M",
    }],
  });
  assert.deepEqual(calls.map((call) => call.url).sort(), [
    `${DEFAULT_ORIGIN}/api/tags`,
    `${DEFAULT_ORIGIN}/api/version`,
  ]);
  assert.equal(calls.length, 2);
  for (const call of calls) {
    assert.equal(call.init?.method, "GET");
    assert.equal(call.init?.redirect, "error");
    assert.equal(call.init?.cache, "no-store");
    assert.equal(call.init?.credentials, "omit");
    assert.ok(call.init?.signal);
  }
});

test("no-models requires a valid non-empty version", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse(tags([]))
      : jsonResponse({ version: "0.5.7" })
  );
  assert.deepEqual(result, { status: "no-models", version: "0.5.7", models: [] });
});

test("cloud tags and OpenMausBot aliases are excluded", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse(tags([
          model("llama3.2:cloud"),
          model("qwen3-cloud"),
          model("llama3.2-omb-4k"),
          model("mistral:latest", 2048),
        ]))
      : jsonResponse({ version: "0.5.7" })
  );
  assert.equal(result.status, "ready");
  if (result.status === "ready") {
    assert.deepEqual(result.models.map((entry) => entry.name), ["mistral:latest"]);
  }
});

test("tags alone never report ready when the version request fails", async () => {
  const result = await discoverOllama(async (input) => {
    if (String(input).endsWith("/api/tags")) return jsonResponse(tags([model("llama3.2")]));
    throw new TypeError("connection refused");
  });
  assert.deepEqual(result, {
    status: "unreachable",
    endpoint: "version",
    reason: "request-failed",
  });
});

test("an empty or missing version is not Ollama", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse(tags([]))
      : jsonResponse({ version: "  " })
  );
  assert.deepEqual(result, {
    status: "not-ollama",
    endpoint: "version",
    reason: "invalid-payload",
  });
});

test("malformed tags are not Ollama", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse({ models: "not-an-array" })
      : jsonResponse({ version: "0.5.7" })
  );
  assert.deepEqual(result, {
    status: "not-ollama",
    endpoint: "tags",
    reason: "invalid-payload",
  });
});

test("non-JSON responses are rejected as not Ollama", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? new Response("<html>not Ollama</html>", {
          status: 200,
          headers: { "content-type": "text/html" },
        })
      : jsonResponse({ version: "0.5.7" })
  );
  assert.deepEqual(result, {
    status: "not-ollama",
    endpoint: "tags",
    reason: "invalid-content-type",
  });
});

test("HTTP failures remain typed as unreachable", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse(tags([]))
      : jsonResponse({ error: "unavailable" }, 503)
  );
  assert.deepEqual(result, {
    status: "unreachable",
    endpoint: "version",
    reason: "http-error",
    httpStatus: 503,
  });
});

test("request timeout is two seconds and classified", async () => {
  const result = await discoverOllama(async (_input, init) => {
    assert.ok(init?.signal);
    assert.equal(OLLAMA_REQUEST_TIMEOUT_MS, 2_000);
    throw new DOMException("timed out", "TimeoutError");
  });
  assert.equal(result.status, "unreachable");
  if (result.status === "unreachable") assert.equal(result.reason, "timeout");
});

test("backend origin comes only from server configuration", async () => {
  setOrigin("https://ollama-host.internal:11434");
  const calls: string[] = [];
  await discoverOllama(async (input) => {
    calls.push(String(input));
    return String(input).endsWith("/api/tags")
      ? jsonResponse(tags([]))
      : jsonResponse({ version: "0.5.7" });
  });
  assert.deepEqual(calls.sort(), [
    "https://ollama-host.internal:11434/api/tags",
    "https://ollama-host.internal:11434/api/version",
  ]);
});

test("invalid origin configuration fails closed without network requests", async () => {
  setOrigin("https://user:secret@example.com/path?x=1");
  let calls = 0;
  const result = await discoverOllama(async () => {
    calls++;
    return jsonResponse({});
  });
  assert.deepEqual(result, {
    status: "unreachable",
    endpoint: "configuration",
    reason: "invalid-configuration",
  });
  assert.equal(calls, 0);
});
