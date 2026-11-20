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
  sizeBytes: number;
  parameterSize?: string;
  quantizationLevel?: string;
};

export type DiscoveryEndpoint = "tags" | "version" | "configuration";

export type DiscoveryFailureReason =
  | "timeout"
  | "request-failed"
  | "http-error"
  | "invalid-content-type"
  | "invalid-json"
  | "response-too-large"
  | "invalid-payload"
  | "invalid-configuration";

export type OllamaDiscoveryResult =
  | { status: "ready"; version: string; models: OllamaModel[] }
  | { status: "no-models"; version: string; models: [] }
  | {
      status: "unreachable";
      endpoint: DiscoveryEndpoint;
      reason: DiscoveryFailureReason;
      httpStatus?: number;
    }
  | {
      status: "not-ollama";
      endpoint: "tags" | "version";
      reason: "invalid-content-type" | "invalid-json" | "invalid-payload";
    };

type JsonFetchResult =
  | { ok: true; value: unknown }
  | {
      ok: false;
      kind: "unreachable";
      reason: "timeout" | "request-failed" | "http-error" | "response-too-large";
      httpStatus?: number;
    }
  | {
      ok: false;
      kind: "invalid";
      reason: "invalid-content-type" | "invalid-json" | "invalid-payload";
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
      kind: "unreachable",
      reason: name === "TimeoutError" || name === "AbortError"
        ? "timeout"
        : "request-failed",
    };
  }

  if (!response.ok) {
    return {
      ok: false,
      kind: "unreachable",
      reason: "http-error",
      httpStatus: response.status,
    };
  }

  const contentType = response.headers.get("content-type") || "";
  if (!/^application\/json(?:\s*;|\s*$)/i.test(contentType)) {
    return { ok: false, kind: "invalid", reason: "invalid-content-type" };
  }

  const declaredLength = Number(response.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_RESPONSE_BYTES) {
    return { ok: false, kind: "unreachable", reason: "response-too-large" };
  }

  let body: string;
  try {
    body = await response.text();
  } catch {
    return { ok: false, kind: "unreachable", reason: "request-failed" };
  }

  if (new TextEncoder().encode(body).byteLength > MAX_RESPONSE_BYTES) {
    return { ok: false, kind: "unreachable", reason: "response-too-large" };
  }

  try {
    return { ok: true, value: JSON.parse(body) as unknown };
  } catch {
    return { ok: false, kind: "invalid", reason: "invalid-json" };
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
  return /(?::cloud|-cloud)$/i.test(name) || /-omb-\d+k$/i.test(name);
}

function parseModels(value: unknown): OllamaModel[] | null {
  if (!isRecord(value) || !Array.isArray(value.models)) return null;

  const models: OllamaModel[] = [];
  const seen = new Set<string>();

  for (const entry of value.models) {
    if (!isRecord(entry) || typeof entry.name !== "string") return null;

    const name = entry.name.trim().toLowerCase();
    if (!name) return null;
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

    const parameterSize =
      typeof details.parameter_size === "string"
        ? details.parameter_size.trim()
        : "";
    const quantizationLevel =
      typeof details.quantization_level === "string"
        ? details.quantization_level.trim()
        : "";

    if (seen.has(name)) continue;
    seen.add(name);

    models.push({
      name,
      sizeBytes: entry.size,
      ...(parameterSize ? { parameterSize } : {}),
      ...(quantizationLevel
        ? { quantizationLevel: quantizationLevel.toUpperCase() }
        : {}),
    });
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

function toFailure(
  endpoint: "tags" | "version",
  result: Exclude<JsonFetchResult, { ok: true }>
): OllamaDiscoveryResult {
  if (result.kind === "unreachable") {
    return {
      status: "unreachable",
      endpoint,
      reason: result.reason,
      ...(result.httpStatus === undefined
        ? {}
        : { httpStatus: result.httpStatus }),
    };
  }
  return { status: "not-ollama", endpoint, reason: result.reason };
}

/**
 * Calls only GET /api/tags and GET /api/version against the one configured
 * backend-owned Ollama origin. The caller cannot supply a host or path.
 */
export async function discoverOllama(
  fetcher: typeof fetch = fetch
): Promise<OllamaDiscoveryResult> {
  const target = getOllamaOrigin();
  if (!target.ok) {
    return {
      status: "unreachable",
      endpoint: "configuration",
      reason: "invalid-configuration",
    };
  }

  const [tagsResult, versionResult] = await Promise.all([
    fetchJson(fetcher, new URL("/api/tags", target.origin).toString()),
    fetchJson(fetcher, new URL("/api/version", target.origin).toString()),
  ]);

  // Both endpoints must be reachable. Tags alone can never establish readiness.
  if (!tagsResult.ok && tagsResult.kind === "unreachable") {
    return toFailure("tags", tagsResult);
  }
  if (!versionResult.ok && versionResult.kind === "unreachable") {
    return toFailure("version", versionResult);
  }
  if (!tagsResult.ok) return toFailure("tags", tagsResult);
  if (!versionResult.ok) return toFailure("version", versionResult);

  const models = parseModels(tagsResult.value);
  if (!models) {
    return { status: "not-ollama", endpoint: "tags", reason: "invalid-payload" };
  }

  const version = parseVersion(versionResult.value);
  if (!version) {
    return {
      status: "not-ollama",
      endpoint: "version",
      reason: "invalid-payload",
    };
  }

  return models.length > 0
    ? { status: "ready", version, models }
    : { status: "no-models", version, models: [] };
}
