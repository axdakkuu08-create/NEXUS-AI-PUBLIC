# NEXUS-AI — ECC Adaptation Next Steps

**Status:** Proposed execution plan · Documentation/design phase only  
**Target repository:** `axdakkuu08-create/NEXUS-AI-PUBLIC`  
**Planning baseline:** `main` SHA `c71de8b987c032948494472c5829bbb294c4ec35` (2026-11-12 audit)  
**Governance:** `main` untouched; no merge/deploy; human approval required.

## Current decision

**CONDITIONAL GO** for read-only review and design documentation. **HOLD** for production implementation, consequential agent permissions, merge and deployment.

The audit found `main` is currently reported as unprotected. This is a critical governance gap. No branch settings are changed by this plan; the repository owner must review and explicitly authorize protection changes.

## Ordered work plan

### Gate 0 — Governance prerequisite (human owner)
- Review GitHub's current `main` protection and ruleset state.
- Decide and explicitly authorize required branch protection, PR review and required status checks.
- Confirm no automation can merge or deploy without human approval.
- **Acceptance:** current protection/rules are inspected and the intended human gate is documented. No agent may change these settings.

### Step 1 — Phase D authorization design (highest priority)
**Owner:** Architect  
**Independent challenge:** Security Reviewer  
**Test specification:** TDD Guide

Deliver:
- State-transition matrix: PENDING, APPROVED, DENIED, EXPIRED, CANCELLED.
- Principal/actor model: requester, approver, executor, auditor.
- Strict separation of request, approval and execution.
- Immutable binding to action/resource/scope/input digest.
- Server-side enforcement at execution time using planned Convex backend.
- Atomic single-use consumption, replay and concurrency handling.
- Expiry, cancellation, revocation and audit-event semantics.
- Threat model, unresolved questions and human decisions.

**Acceptance:** Security Reviewer finds no unresolved critical bypass in the design; TDD Guide provides negative cases for self-approval, illegal transitions, stale/expired/denied/cancelled approvals, replay, concurrent execute/cancel, missing approval and changed scope. No implementation begins until the design is accepted.

### Step 2 — Phase A role definitions
**Owner:** Agent Evaluator  
**Inputs:** supplied ECC agent assignment instructions  
**Review:** Architect + Security Reviewer for privileged roles

For every role document purpose, trigger, required inputs, output contract, allowed scope, prohibited actions, handoff and evidence standard. Keep roles as documentation only, not executable agents or permissions. Keep Database Reviewer conditional and Convex-only; keep RAG Pipeline Reviewer deferred.

**Acceptance:** no overlapping authority, no hidden write permission, security-critical work remains human-approved, and independent role review is recorded.

### Step 3 — Phase B read-only CI baseline
**Owner:** Build Error Resolver  
**Review:** Code Reviewer / TypeScript Reviewer as appropriate

Map current checks to exact workflow, branch and SHA. Distinguish the M1 snapshot run from integration-branch evidence and current-main evidence. Recommend minimal gates: lockfile consistency, lint, typecheck, unit/regression tests where present, production build and basic secret scanning. Review the integration workflow's `contents: write` and lockfile self-commit behavior; prefer least privilege.

**Acceptance:** a concise gap matrix identifies present, missing, deferred and evidenced checks. Do not claim current-main success without a run tied to current-main SHA.

### Step 4 — Frontend and reliability reviews (parallel, read-only)
- Code Reviewer: architecture, navigation, disconnected service handling and truthful UI status.
- TypeScript Reviewer: strictness, state types, API boundaries and unsafe casts.
- React Reviewer: React/Next compatibility, hydration, state and mobile interaction risks.
- Silent Failure Hunter: swallowed errors, stale status and false-success UX.
- Performance Optimizer: low-priority, evidence-based mobile performance recommendations.
- Docs Lookup: authoritative compatibility documentation and dated references.
- E2E Runner: future test plan only; no device test claims.

**Acceptance:** findings cite supplied files/line locations or clearly label assumptions and unverified runtime behavior.

### Step 5 — Consolidated independent review
Planner consolidates Phase A/B/D outputs. Security Reviewer independently checks Phase D. Human owner accepts, rejects or requests revisions.

**Acceptance:** all critical findings have an owner and disposition; Phase D has no unresolved critical blocker; Phase A/B evidence is traceable.

### Step 6 — Implementation authorization gate
Only after the above gates:
- Submit a separate implementation proposal with exact files, branch, tests and rollback plan.
- Obtain explicit human authorization before any code or workflow changes.
- Keep changes on a non-main branch and use a reviewable PR.
- No merge, deployment, or consequential agent permission without separate explicit human approval.

## Role assignment order
1. Architect — Phase D design.
2. Security Reviewer — adversarial design review.
3. TDD Guide — negative-test specification.
4. Agent Evaluator — Phase A role quality.
5. Planner — dependency and acceptance tracking.
6. Build Error Resolver — Phase B CI evidence audit.
7. Docs Lookup — platform/Convex documentation.
8. Code Reviewer, TypeScript Reviewer, React Reviewer and Silent Failure Hunter — read-only frontend review.
9. E2E Runner and Performance Optimizer — deferred planning.
10. Database Reviewer — conditional, Convex-only.
11. RAG Pipeline Reviewer — later phase, inactive.

## Non-negotiable boundaries
- No TinyFish AI.
- No PostgreSQL assumptions; Convex is the planned backend.
- No agent write permissions.
- No direct writes to `main`.
- No auto-merge or deployment.
- No implementation or workflow edits until separately authorized.
- Evidence must identify exact source, branch and commit SHA.
- A green workflow is not proof of correct authorization or Android device behavior.

## Tracking
Use this document as the proposed execution sequence. A GitHub milestone should be created separately when a milestone-capable GitHub operation is available. Do not substitute an issue or Linear milestone and describe it as a GitHub milestone.
