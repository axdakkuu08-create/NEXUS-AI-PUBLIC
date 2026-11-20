# NEXUS-AI Progressive Web App

## Scope

The PWA layer keeps the existing Next.js application architecture. It adds install metadata, a service worker, an offline fallback, and a small install/offline status control. It does not add a second application or a native Android project.

## Security-first offline behavior

- The service worker persists only four exact same-origin public shell paths: `/offline.html`, `/manifest.webmanifest`, `/icons/nexus-192.png`, and `/icons/nexus-512.png`.
- A failed navigation returns only the generic public offline information page; a previously visited workspace page is never replayed offline.
- All Next.js route-data/RSC/prefetch, API/backend, authentication/session, and unapproved paths are network-only. Their GET fetches bypass the browser HTTP cache and are never persisted by the service worker.
- AI inference, authentication, cloud sync, and backend-dependent actions remain unavailable without connectivity.
- This is a network-assisted PWA, not an on-device AI application.

## Install and test on Android

1. Serve the production build from an HTTPS origin. Service workers and install prompts require HTTPS, except on localhost.
2. Open the HTTPS preview in Chrome on the Android device.
3. Visit `/home` and any other pages intended for offline testing while connected.
4. Use Chrome's **Install app** or **Add to Home screen** option when offered.
5. Open NEXUS from the installed icon, revisit a page already loaded, then enable Airplane mode.
6. Confirm the offline status indicator appears, a cached page opens, and an unvisited page shows the offline fallback.
7. Turn connectivity back on and confirm normal navigation resumes.

## Verification

The `NEXUS PWA verification` workflow runs lint, TypeScript, existing Swarm tests, PWA asset checks, service-worker security tests, a production build, and a Chromium mobile/offline smoke test. The smoke test inspects actual Cache Storage and verifies that visited workspace routes are not replayed offline.

A successful CI run is not a substitute for physical-device testing. Record the Android model, Chrome version, install result, and offline results separately.


## Session lifecycle boundary

Authenticated offline data is prohibited. The worker responds to `NEXUS_SESSION_END` and `NEXUS_ACCOUNT_CHANGE` by clearing only NEXUS-owned private cache namespaces and notifying same-origin tabs. `src/lib/pwa/session.ts` provides a notification/subscription hook for a future authentication integration; it does not implement authentication, server-side revocation, or a logout UI. The current frontend has no production authentication flow. Sensitive backend responses must use reviewed `Cache-Control: no-store` headers when a backend is later connected. Cookie request headers are generally unavailable to service-worker script, so cache eligibility is determined by the strict route allowlist, not by cookie inspection.
