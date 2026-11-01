# NEXUS-AI M1-M3 verification branch

This branch is isolated from `main`. It contains the CI workflow scaffold for M1-M3 verification.

## Required source layout

Place the reviewed M1-M3 application source under:

`frontend/nexus-m1-review/`

That directory must contain:
- `package.json`
- `package-lock.json` committed from a successful install using `https://registry.npmjs.org`
- Next.js source and configuration
- A working `npm run lint`, `npm run typecheck`, and `npm run build`

## Workflow

The GitHub Actions workflow runs:
- `npm ci` using the committed lockfile and official npm registry
- ESLint
- TypeScript
- Next.js production build
- Production HTTP checks for the root and all 10 application routes
- Playwright Chromium viewport checks at 390px, 360px and 768px widths

The Android job is intentionally conditional. The current recovery ZIP does not contain a Capacitor configuration or Android project, so an APK cannot be built until that wrapper is added and tested.

## Acceptance policy

M1-M3 are not accepted until the web-verification job passes, the Android wrapper is present and produces an APK, and that APK is installed and tested on a physical Android device. A successful cloud APK build alone does not prove device acceptance.

No deployment or merge to `main` is performed by this branch.
