# NEXUS-AI M1-M3 source verification

## Current source of truth

- Repository: `axdakkuu08-create/NEXUS-AI-PUBLIC`
- Working branch: `ci/verify-m1-m3-source`
- Supplied source: `NEXUS-AI-M1-source-for-verification.zip`
- Archive contents: 59 project files
- `package-lock.json`: absent from the supplied archive
- Android wrapper: absent (no Capacitor config or Android project)

The workflow has been corrected to extract this exact archive into `frontend/nexus-m1-review/`. It no longer expects a separate, unavailable verified ZIP or a pre-extracted source directory.

## Automated workflow

Open the Actions page and manually run **NEXUS-AI M1-M3 verification** on branch `ci/verify-m1-m3-source`.

The workflow will:
1. Extract the supplied source archive.
2. Generate an initial lockfile using the official npm registry.
3. Install the resolved dependencies with `npm ci`.
4. Run ESLint, TypeScript (`npx tsc --noEmit`) and the Next.js production build.
5. Start the production server and check the root plus all 10 application routes.
6. Run Playwright Chromium checks at 390x844, 360x800 and 768x1024 on Home, Chat and Workflows, including horizontal-overflow checks.
7. Upload the generated `package-lock.json` as a workflow artifact for review.

## Verification status

| Check | Status |
|---|---|
| Original source archive extracted locally | PASS |
| Source inspected; 59 files identified | PASS |
| Lockfile generated locally | BLOCKED — npm registry request timed out |
| Local lint / typecheck / production build | NOT RUN — dependencies unavailable |
| GitHub Actions workflow corrected to extract supplied archive | PASS — committed on verification branch |
| GitHub Actions execution | PENDING — must be manually dispatched |
| Mobile viewport checks | PENDING |
| Android APK | NOT APPLICABLE YET — no Android wrapper in supplied source |
| Physical Android device test | PENDING |

## Acceptance policy

Do not mark M1-M3 verified until the GitHub Actions web-verification job passes. The generated lockfile artifact must then be reviewed and committed to the verification branch for repeatable lockfile-based CI. Android APK and physical-device acceptance remain separate follow-up work after an Android wrapper exists.

`main` has not been changed. No deployment or merge is performed by this verification workflow.
