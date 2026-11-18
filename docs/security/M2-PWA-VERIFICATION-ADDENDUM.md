# M2 PWA verification addendum

**Applies to:** `security/m2-pwa-remediation`  
**Baseline:** `5fdeecc3400fe5ec795f275f936a123303be3c73`  
**Purpose:** Clarify the `Set-Cookie` verification boundary and record what browser tests can actually prove.

## Set-Cookie is not a service-worker-readable response header

Browsers treat `Set-Cookie` as a forbidden response header. Page and service-worker JavaScript cannot reliably inspect it through `Response.headers`. A test that creates a synthetic Node `Response` with a visible `Set-Cookie` header does not prove that a real browser service worker can detect it.

Therefore, the service worker must not claim to reject responses by checking `headers.has("Set-Cookie")`. The implementation instead enforces these controls:

1. Only explicitly enumerated public app-shell paths are eligible for Cache Storage.
2. Navigations, Next.js route data/RSC/prefetch, API, auth, session, logout, backend, and all other non-allowlisted paths remain network-only.
3. Any server response that sets a cookie or contains session-specific/private state must also carry `Cache-Control: no-store` (and must not be served from an allowlisted static-asset endpoint).
4. The worker independently rejects visible `private`, `no-store`, and `no-cache` directives, `Vary: *`, redirects, non-200 responses, opaque responses, and error responses.
5. The browser regression test demonstrates that `Set-Cookie` is not exposed to JavaScript and verifies that a cookie-setting fixture with `Cache-Control: no-store` is not stored.

This is an explicit server/route contract, not a claim that client-side code can inspect the cookie-setting header. Live candidate response-header evidence remains required before security acceptance.

## Logout cleanup and storage failures

On activation, the worker removes obsolete caches under the NEXUS-owned cache prefix and sanitizes the current public-shell cache. On `NEXUS_LOGOUT`, it advances the write epoch synchronously, removes any current-cache entry that is not both request-eligible and response-cacheable, removes obsolete NEXUS cache versions, and preserves approved public shell entries. `NEXUS_CLEAR_CACHES` removes all NEXUS-owned caches. Unrelated origin Cache Storage entries are not deleted.

CacheStorage `open`, `keys`, Cache `match`, `keys`, `put`, and response/request classification failures are treated as unavailable or non-cacheable. A cache read failure falls back to the network; a cache write failure does not replace a successful network response; an offline navigation returns the generic 503 fallback if the shell cannot be read. This is fail-closed for persistence, not a claim that browser storage is always successfully removable: cleanup failures are contained and require evidence from the actual browser run.

## Race regression

Cache writes for the same request URL are serialized. A write that began under an earlier cache generation is deleted if logout/clear advances the generation while `Cache.put()` is pending. A subsequent write from the new generation is allowed to run after the stale write and remain stored. The Node harness includes both the delayed-write deletion case and the new-generation preservation case.

## Browser-level evidence

`tests/pwa-browser-cache.test.mjs` launches Chromium, registers the actual service worker, performs real requests, and inspects Cache Storage. It covers:

- public asset caching;
- `Cache-Control: private`, `no-store`, and `no-cache`;
- `Vary: *`;
- redirected and error responses;
- API/auth/session/logout/GraphQL requests;
- Authorization, RSC, router-state, and prefetch request headers;
- a stale seeded API entry not being replayed;
- browser-inaccessible `Set-Cookie` plus the required `no-store` server contract;
- a cross-origin opaque response not entering the app cache.

`tests/pwa/m2-hardening.test.mjs` exercises logout cleanup of stale non-public entries, preservation of the public shell and unrelated origin caches, and CacheStorage/Cache API failure paths. `tests/pwa-session-lifecycle.test.mjs` uses clearly labelled test-only identity and session endpoints to exercise two identities using the same URL, BroadcastChannel delivery across two tabs, local offline logout with no false revocation success, retry after connectivity returns, stale-cache removal and session expiry/401 behavior. It does not add or simulate production authentication in the product.

The test-only lifecycle fixture verifies the service-worker cache boundary and the current cross-tab notification protocol. It does not prove a production authentication/logout implementation exists or that every protected application view consumes the broadcast. Those production integration checks remain pending until authentication is implemented.

These tests do not replace live-header inspection, independent review, or physical Android/Chrome validation. Those remain required for security acceptance.
