import assert from "node:assert/strict";
import test from "node:test";
import {
  discoverOllama,
  OLLAMA_REQUEST_TIMEOUT_MS,
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

test("ready requires both tags and a non-empty version and uses the published field names", async () => {
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
    state: "ready",
    version: "0.5.7",
    models: [{
      name: "llama3.2:latest",
      bytes: 1024,
      parameters: "3.2B",
      quantization: "Q4_K_M",
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
  assert.deepEqual(result, { state: "no-models", version: "0.5.7", models: [] });
});

test("cloud, cloud-preview, embedding families, and OpenMausBot aliases are excluded", async () => {
  const excluded = [
    "cloud",
    "llama3:cloud",
    "llama3:cloud-preview",
    "qwen3-cloud",
    "nomic-embed-text",
    "bge-m3",
    "all-minilm",
    "debertav3",
    "llama3.2-omb-4k",
  ];
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse(tags([
          ...excluded.map((name) => model(name)),
          model("llama3.2-omb-8k:latest"),
          model("mistral:latest", 2048),
        ]))
      : jsonResponse({ version: "0.5.7" })
  );
  assert.equal(result.state, "ready");
  if (result.state === "ready") {
    assert.deepEqual(result.models.map((entry) => entry.name), ["mistral:latest"]);
  }
});

test("nameless and blank-name tag entries are skipped without invalidating valid models", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse(tags([
          {},
          { name: "   ", size: 1 },
          model("mistral:latest", 2048),
        ]))
      : jsonResponse({ version: "0.5.7" })
  );
  assert.deepEqual(result, {
    state: "ready",
    version: "0.5.7",
    models: [{ name: "mistral:latest", bytes: 2048 }],
  });
});

test("tags alone never report ready when the version request fails", async () => {
  const result = await discoverOllama(async (input) => {
    if (String(input).endsWith("/api/tags")) return jsonResponse(tags([model("llama3.2")]));
    throw new TypeError("connection refused");
  });
  assert.deepEqual(result, {
    state: "not-running",
    endpoint: "version",
    problem: "request-failed",
  });
});

test("an empty or missing version is not Ollama", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse(tags([]))
      : jsonResponse({ version: "  " })
  );
  assert.deepEqual(result, {
    state: "not-ollama",
    endpoint: "version",
    problem: "invalid-payload",
  });
});

test("malformed tags are not Ollama", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse({ models: "not-an-array" })
      : jsonResponse({ version: "0.5.7" })
  );
  assert.deepEqual(result, {
    state: "not-ollama",
    endpoint: "tags",
    problem: "invalid-payload",
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
    state: "not-ollama",
    endpoint: "tags",
    problem: "invalid-content-type",
  });
});

test("HTTP failures remain typed as not-running", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? jsonResponse(tags([]))
      : jsonResponse({ error: "unavailable" }, 503)
  );
  assert.deepEqual(result, {
    state: "not-running",
    endpoint: "version",
    problem: "http-error",
    httpStatus: 503,
  });
});

test("request timeout is exactly two seconds and classified as not-running", async () => {
  const originalTimeout = AbortSignal.timeout;
  let requestedTimeout = 0;
  AbortSignal.timeout = ((milliseconds: number) => {
    requestedTimeout = milliseconds;
    return new AbortController().signal;
  }) as typeof AbortSignal.timeout;

  try {
    const result = await discoverOllama(async (_input, init) => {
      assert.ok(init?.signal);
      throw new DOMException("timed out", "TimeoutError");
    });
    assert.equal(OLLAMA_REQUEST_TIMEOUT_MS, 2_000);
    assert.equal(requestedTimeout, 2_000);
    assert.equal(result.state, "not-running");
    if (result.state === "not-running") assert.equal(result.problem, "timeout");
  } finally {
    AbortSignal.timeout = originalTimeout;
  }
});

test("timeout while reading a response body is classified as timeout", async () => {
  const originalTimeout = AbortSignal.timeout;
  const timeoutController = new AbortController();
  AbortSignal.timeout = (() => timeoutController.signal) as typeof AbortSignal.timeout;

  try {
    const result = await discoverOllama(async (input) => {
      if (!String(input).endsWith("/api/tags")) {
        return jsonResponse({ version: "0.5.7" });
      }
      return new Response(new ReadableStream<Uint8Array>({
        pull(controller) {
          timeoutController.abort(new DOMException("timed out", "TimeoutError"));
          controller.error(new DOMException("aborted", "AbortError"));
        },
      }), { headers: { "content-type": "application/json" } });
    });

    assert.deepEqual(result, {
      state: "not-running",
      endpoint: "tags",
      problem: "timeout",
    });
  } finally {
    AbortSignal.timeout = originalTimeout;
  }
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
    state: "not-running",
    endpoint: "configuration",
    problem: "invalid-configuration",
  });
  assert.equal(calls, 0);
});

test("redirect responses cannot be followed or reported as ready", async () => {
  const result = await discoverOllama(async (_input, init) => {
    assert.equal(init?.redirect, "error");
    throw new TypeError("redirect mode is error");
  });
  assert.deepEqual(result, {
    state: "not-running",
    endpoint: "tags",
    problem: "request-failed",
  });
});

test("browser execution is blocked before any loopback request", async () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: {},
  });
  let calls = 0;
  try {
    const result = await discoverOllama(async () => {
      calls++;
      return jsonResponse({});
    });
    assert.deepEqual(result, {
      state: "not-running",
      endpoint: "configuration",
      problem: "invalid-configuration",
    });
    assert.equal(calls, 0);
  } finally {
    if (previousWindow) Object.defineProperty(globalThis, "window", previousWindow);
    else Reflect.deleteProperty(globalThis, "window");
  }
});

test("declared Content-Length above 256 KiB is rejected before reading the body", async () => {
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? new Response("{}", {
          status: 200,
          headers: {
            "content-type": "application/json",
            "content-length": String(256 * 1024 + 1),
          },
        })
      : jsonResponse({ version: "0.5.7" })
  );
  assert.deepEqual(result, {
    state: "not-running",
    endpoint: "tags",
    problem: "response-too-large",
  });
});

test("response bodies larger than 256 KiB are rejected while streaming", async () => {
  const oversized = " ".repeat(256 * 1024 + 1);
  const result = await discoverOllama(async (input) =>
    String(input).endsWith("/api/tags")
      ? new Response(oversized, {
          status: 200,
          headers: { "content-type": "application/json" },
        })
      : jsonResponse({ version: "0.5.7" })
  );
  assert.deepEqual(result, {
    state: "not-running",
    endpoint: "tags",
    problem: "response-too-large",
  });
});
