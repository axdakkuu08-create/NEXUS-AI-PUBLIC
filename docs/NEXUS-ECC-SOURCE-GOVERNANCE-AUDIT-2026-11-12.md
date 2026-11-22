# NEXUS-AI Source & Governance Audit

**Audit date:** 2026-11-12  
**Repository:** `axdakkuu08-create/NEXUS-AI-PUBLIC`  
**Audit base:** `main` at `c71de8b987c032948494472c5829bbb294c4ec35`  
**Method:** Read-only source and GitHub API inspection. TinyFish AI was not used.

## Executive assessment

**CONDITIONAL GO for documentation and design work. HOLD for consequential agent permissions, implementation of authorization, merges and deployment.**

The uploaded `NEXUS-AI-frontend-M1.zip` is an October 31 M1 snapshot, not the current repository source. Its `package.json` contains only `dev`, `build`, `start` and `lint`, and the archive has no lockfile or Android wrapper. The separate uploaded `package.json` matches that archive.

Live `main` has advanced: it includes a lockfile, `typecheck`, `test:swarm`, and CI workflow definitions. Do not conflate the archive verification with current-main verification.

## Verified findings

### Frontend and backend
- Live `src/lib/services.ts` identifies future Convex integration stubs; core service calls report that the backend is not connected.
- The Agents page is an empty backend-dependent state.
- Tools lists GitHub, Convex and Figma as disconnected local placeholders.
- Workflows are explicitly preview-only sample records; create/edit/run are not connected.
- No functioning Convex-backed agent execution or authorization system was established on audited `main`.

### CI evidence
- M1-M3 workflow run [#24](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/actions/runs/41610661226), branch `ci/verify-m1-m3-source`, SHA `31c588b5da43cf11f38c6ee4a917a5f61f6b69da`, concluded success on 2026-11-03. Web verification passed. The Android job only reported that packaging was not applicable because no Android wrapper existed; this is not APK evidence.
- Integration gate run [#43155556541](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/actions/runs/43155556541), branch `integration/frontend-backend-reconciliation`, SHA `85d9f83ee34831c7e37bbd44b892e709772d4446`, concluded success on 2026-11-12. Its steps included lockfile setup, Convex type generation, backend ownership/persistence tests, lint/typecheck, Swarm tests and production build. This is integration-branch evidence only, not proof those changes are on `main`.
- `.github/workflows/nexus-m1-m3-verification.yml` and `.github/workflows/nexus-swarm-phase-b.yml` declare read-only `contents: read`.
- The integration-branch workflow `.github/workflows/nexus-integration-m1.yml` declares `contents: write` and can commit a generated lockfile back to its integration branch. Review whether this write permission and self-committing behavior are necessary. Do not generalize this as a write permission on `main`.

### Governance
- GitHub branch metadata reports `main.protected = false` at audit time.
- This is a **CRITICAL governance gap** against the project requirement for protected `main` and human approval.
- No branch-protection setting was changed. A human must explicitly authorize any protection change.

### ECC adaptation phases
- **Phase A:** the supplied agent assignment artifact defines 15 role proposals. These are documentation assignments, not active executable agents or permissions. Database Reviewer remains conditional (Convex only); RAG Pipeline Reviewer remains deferred.
- **Phase B:** relevant checks exist in workflow definitions, but workflow presence is not evidence of a successful run on the current `main` SHA. Evidence must identify branch and exact commit.
- **Phase D:** BLOCKING. No complete server-side authorization lifecycle was established from inspected `main`.

## Phase D minimum design requirements

Before implementation or any consequential permission grant, the design must define:
1. Trusted principal and actor identity: requester, independent approver, executor and auditor.
2. Approval bound immutably to exact action, resource, scope and relevant input digest.
3. Server-side authorization at execution time, not just at proposal time.
4. Atomic, single-use approval consumption and concurrent replay protection.
5. Expiry, cancellation and revocation semantics.
6. Auditable actor, decision, scope, timestamp and execution outcome.
7. Negative tests for self-approval, illegal transitions, expired/denied/cancelled approvals, replay, concurrent execute/cancel, missing approvals and changed action scope.

Convex remains the planned backend direction. Do not introduce PostgreSQL assumptions. UI confirmation, client-side checks and agent prompts are not security boundaries.

## Milestone proposal

**Title:** ECC Adaptation & Verification Foundation

**Description:** Complete the NEXUS-local ECC adaptation foundation without importing ECC runtime/source or granting agents consequential permissions. Deliver independently reviewed Phase A role definitions, an evidence-based Phase B CI baseline, and a server-side Phase D authorization design with adversarial negative-test acceptance criteria. Keep Convex as the planned backend direction. No automatic merge or deployment; human approval is required before changes reach `main`.

**Completion criteria:**
- Phase A roles have purpose, triggers, input/output contracts, boundaries, prohibited actions and independent review.
- Phase B gaps are mapped to exact workflow evidence and a minimal CI recommendation.
- Phase D lifecycle, actor model, immutable approval scope, execution enforcement, concurrency, expiry/revocation and audit requirements are reviewed.
- Required negative tests are specified and independently challenged.
- Main protection and required human review gates are addressed by an explicitly authorized repository owner.
- No consequential agent permission is enabled before all security gates pass.

## Limitations

- This is a source/configuration and selected workflow-evidence audit, not a full security audit or penetration test.
- Run #24 validates the supplied M1 snapshot on its verification branch, not current `main`.
- The integration run validates the integration branch, not current `main`.
- No APK build or physical Android device test is evidenced.
- Branch protection was read, not changed.

## Evidence links
- [Audited main commit](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/commit/c71de8b987c032948494472c5829bbb294c4ec35)
- [Live package manifest](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/blob/main/package.json)
- [Service stubs](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/blob/main/src/lib/services.ts)
- [Agents page](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/blob/main/src/app/(app)/agents/page.tsx)
- [Tools page](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/blob/main/src/app/(app)/tools/page.tsx)
- [Workflows page](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/blob/main/src/app/(app)/workflows/page.tsx)
- [M1-M3 verification workflow](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/blob/main/.github/workflows/nexus-m1-m3-verification.yml)
- [Swarm Phase B workflow](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/blob/main/.github/workflows/nexus-swarm-phase-b.yml)
- [M1-M3 run #24](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/actions/runs/41610661226)
- [Integration run #43155556541](https://github.com/axdakkuu08-create/NEXUS-AI-PUBLIC/actions/runs/43155556541)
