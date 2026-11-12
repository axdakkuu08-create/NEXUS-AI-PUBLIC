# NEXUS-AI Progressive Web App

## Scope

The PWA layer keeps the existing Next.js application architecture. It adds install metadata, a service worker, an offline fallback, and a small install/offline status control. It does not add a second application or a native Android project.

## Offline behavior

- The service worker precaches the offline page, web manifest, and app icons.
- Successful same-origin page navigations and Next.js route-data responses are cached as the user visits them.
- Next.js immutable static assets are cached for repeat use.
- A previously visited page can be reopened when offline if its navigation response and required assets were cached.
- An unvisited page falls back to the offline information page.
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

The `NEXUS PWA verification` workflow runs lint, TypeScript, existing Swarm tests, PWA asset checks, a production build, and a Chromium mobile/offline smoke test.

A successful CI run is not a substitute for physical-device testing. Record the Android model, Chrome version, install result, and offline results separately.
