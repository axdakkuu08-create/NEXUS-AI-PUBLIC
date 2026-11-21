/**
 * Server-side, read-only Ollama discovery.
 *
 * IMPORTANT: This module must only run on the Ollama host. The default loopback
 * address is meaningful only there; browser code must never call it directly.
 * The target is controlled by server environment configuration, never by a
 * request parameter. No response is persisted.
 */

export const OLLAMA_REQUEST_TIMEOUT_MS = 2_000;
const MAX_RESPONSE_BYTES = 256 * 1024;
const DEFAULT_OLLAMA_ORIGIN = "http://127.0.0.1:11434";

export type OllamaModel = {
  name: string;
  bytes: number;
  parameters?: string;
  quantization?: string;
};

export type DiscoveryEndpoint = "tags" | "version" | "configuration";

export type DiscoveryProblem =
  | "timeout"
  | "request-failed"
  | "http-error"
  | "invalid-content-type"
  | "invalid-json"
  | "response-too-large"
  | "invalid-payload"
  | "invalid-configuration";

export type OllamaDiscoveryResult =
  | { state: "ready"; version: string; models: OllamaModel[] }
  | { state: "no-models"; version: string; models: [] }
  | {
      state: "not-running";
      endpoint: DiscoveryEndpoint;
      problem: DiscoveryProblem;
      httpStatus?: number;
    }
  | {
      state: "not-ollama";
      endpoint: "tags" | "version";
      problem: "invalid-content-type" | "invalid-json" | "invalid-payload";
    };

type JsonFetchResult =
  | { ok: true; value: unknown }
  | {
      ok: false;
      kind: "not-running";
      problem: "timeout" | "request-failed" | "http-error" | "response-too-large";
      httpStatus?: number;
    }
  | {
      ok: false;
      kind: "not-ollama";
      problem: "invalid-content-type" | "invalid-json";
    };

function getOllamaOrigin():
  | { ok: true; origin: string }
  | { ok: false } {
  const configured = process.env.NEXUS_OLLAMA_ORIGIN?.trim();
  const candidate = configured || DEFAULT_OLLAMA_ORIGIN;

  try {
    const url = new URL(candidate);
    if (
      (url.protocol !== "http:" && url.protocol !== "https:") ||
      !url.hostname ||
      url.username ||
      url.password ||
      (url.pathname !== "" && url.pathname !== "/") ||
      url.search ||
      url.hash
    ) {
      return { ok: false };
    }
    return { ok: true, origin: url.origin };
  } catch {
    return { ok: false };
  }
}

async function fetchJson(
  fetcher: typeof fetch,
  url: string
): Promise<JsonFetchResult> {
  let response: Response;
  try {
    response = await fetcher(url, {
      method: "GET",
      headers: { accept: "application/json" },
      cache: "no-store",
      credentials: "omit",
      redirect: "error",
      signal: AbortSignal.timeout(OLLAMA_REQUEST_TIMEOUT_MS),
    });
  } catch (error) {
    const name =
      error && typeof error === "object" && "name" in error
        ? String(error.name)
        : "";
    return {
      ok: false,
      kind: "not-running",
      problem: name === "TimeoutError" || name === "AbortError"
        ? "timeout"
        : "request-failed",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: "not-running",
      problem: "http-error",
      httpStatus: response.status,
    };
  }

  const contentType = response.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    return { ok: false, kind: "not-ollama", problem: "invalid-content-type" };
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    return { ok: false, kind: "not-running", problem: "response-too-large" };
  }

  let body = "";
  try {
    const reader = response.body?.getReader();
    if (reader) {
      const decoder = new TextDecoder();
      let totalBytes = 0;
      while (true) {
        const chunk = await reader.read();
        if (chunk.done) break;
        totalBytes += chunk.value.byteLength;
        if (totalBytes > MAX_RESPONSE_BYTES) {
          await reader.cancel();
          return { ok: false, kind: "not-running", problem: "response-too-large" };
        }
        body += decoder.decode(chunk.value, { stream: true });
      }
      body += decoder.decode();
    }
  } catch {
    return { ok: false, kind: "not-running", problem: "request-failed" };
  }

  try {
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return { ok: false, kind: "not-ollama", problem: "invalid-json" };
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parseVersion(value: unknown): string | null {
  if (!isRecord(value) || typeof value.version !== "string") return null;
  const version = value.version.trim();
  return version.length > 0 ? version : null;
}

function isExcludedModelName(name: string): boolean {
  const baseName = name.split(":")[0] ?? name;
  const isCloud =
    name === "cloud" ||
    baseName === "cloud" ||
    /(?:^|:)cloud(?:$|-)/i.test(name) ||
    /-cloud$/i.test(baseName);
  const isEmbedding =
    /embed|bge-|minilm|bert(?=[:/]|$)/i.test(name);
  const isOpenMausBotAlias = /-omb-\d+k$/i.test(name);
  return isCloud || isEmbedding || isOpenMausBotAlias;
}

function parseModels(value: unknown): OllamaModel[] | null {
  if (!isRecord(value) || !Array.isArray(value.models)) return null;

  const models: OllamaModel[] = [];
  const seen = new Set<string>();

  for (const entry of value.models) {
    // Upstream tags can contain incomplete records; skip entries without a usable name.
    if (!isRecord(entry) || typeof entry.name !== "string") continue;

    const name = entry.name.trim().toLowerCase();
    if (!name) continue;
    if (isExcludedModelName(name)) continue;

    if (
      typeof entry.size !== "number" ||
      !Number.isSafeInteger(entry.size) ||
      entry.size < 0
    ) {
      return null;
    }

    const details = entry.details === undefined ? {} : entry.details;
    if (!isRecord(details)) return null;

    const parameters =
      typeof details.parameter_size === "string"
        ? details.parameter_size.trim()
        : "";
    const quantization =
      typeof details.quantization_level === "string"
        ? details.quantization_level.trim()
        : "";

    if (seen.has(name)) continue;
    seen.add(name);

    models.push({
      name,
      bytes: entry.size,
      ...(parameters ? { parameters } : {}),
      ...(quantization ? { quantization: quantization.toUpperCase() } : {}),
    });
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

function toFailure(
  endpoint: "tags" | "version",
  result: Exclude<JsonFetchResult, { ok: true }>
): OllamaDiscoveryResult {
  if (result.kind === "not-running") {
    return {
      state: "not-running",
      endpoint,
      problem: result.problem,
      ...(result.httpStatus === undefined ? {} : { httpStatus: result.httpStatus }),
    };
  }
  return { state: "not-ollama", endpoint, problem: result.problem };
}

/**
 * Calls only GET /api/tags and GET /api/version against the one configured
 * backend-owned Ollama origin. The caller cannot supply a host or path.
 */
export async function discoverOllama(
  fetcher: typeof fetch = fetch
): Promise<OllamaDiscoveryResult> {
  // Defense in depth: even an accidental client import must never probe browser loopback.
  if (typeof window !== "undefined") {
    return {
      state: "not-running",
      endpoint: "configuration",
      problem: "invalid-configuration",
    };
  }

  const target = getOllamaOrigin();
  if (!target.ok) {
    return {
      state: "not-running",
      endpoint: "configuration",
      problem: "invalid-configuration",
    };
  }

  const [tagsResult, versionResult] = await Promise.all([
    fetchJson(fetcher, new URL("/api/tags", target.origin).toString()),
    fetchJson(fetcher, new URL("/api/version", target.origin).toString()),
  ]);

  // Both endpoints must be reachable. Tags alone can never establish readiness.
  if (!tagsResult.ok && tagsResult.kind === "not-running") {
    return toFailure("tags", tagsResult);
  }
  if (!versionResult.ok && versionResult.kind === "not-running") {
    return toFailure("version", versionResult);
  }
  if (!tagsResult.ok) return toFailure("tags", tagsResult);
  if (!versionResult.ok) return toFailure("version", versionResult);

  const models = parseModels(tagsResult.value);
  if (!models) {
    return { state: "not-ollama", endpoint: "tags", problem: "invalid-payload" };
  }

  const version = parseVersion(versionResult.value);
  if (!version) {
    return {
      state: "not-ollama",
      endpoint: "version",
      problem: "invalid-payload",
    };
  }

  return models.length > 0
    ? { state: "ready", version, models }
    : { state: "no-models", version, models: [] };
}
