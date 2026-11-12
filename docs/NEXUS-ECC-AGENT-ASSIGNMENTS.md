# NEXUS-AI — ECC Adaptation Agent Assignments

**Status:** Proposal only · Analysis and document preparation  
**Date:** 2026-11-12  
**Rule:** No GitHub access, repository edits, code execution, dependency installation, PRs, commits, merges, deployments or permission changes. Main remains untouched. No agent receives write permissions.

| Role | Priority | Assignment / deliverable |
|---|---|---|
| Architect | Critical | Phase D lifecycle matrix, actor model, Convex server-side enforcement boundaries, approval binding, one-time execution, concurrency, expiry/revocation, audit model and unresolved human decisions. |
| Security Reviewer | Critical | Adversarial threat matrix for self-approval, identity confusion, replay, scope changes, illegal transitions, concurrent execution/cancellation, privilege escalation and compromised sessions; GO/CONDITIONAL GO/NO-GO. |
| TDD Guide | Critical | Negative-test specification covering self-approval, all invalid lifecycle states, replay, concurrency, missing approvals, scope changes and unauthorized mutations. |
| Planner | High | Dependency-aware Phase A/B/D plan with objectives, deliverables, prerequisites, measurable acceptance criteria and approval gates. |
| Agent Evaluator | High | Evaluate role purpose, triggers, inputs/outputs, boundaries, overlaps and prohibited actions; ensure role docs do not imply executable permissions. |
| Build Error Resolver | High | Read-only CI audit: lockfile, lint, typecheck, tests, production build, workflow triggers and permissions; distinguish evidence by branch/SHA. |
| Docs Lookup | Medium | Verify Next.js 16, React 19, Tailwind 4 and Convex assumptions against authoritative documentation with URLs and verification dates. |
| Code Reviewer | Medium | Read-only frontend architecture, navigation, service stubs, disconnected states and misleading success/permission UI review. |
| TypeScript Reviewer | Medium | Type-safety review: unsafe casts, any, state models, API/error types and authorization state representation. |
| React Reviewer | Medium | React 19/Next.js 16 component/state/hydration review and Android-first interaction review; no device claims without evidence. |
| Silent Failure Hunter | Medium | Find false-success states, swallowed errors, stale status, missing retry/timeout visibility and disconnected-state gaps. |
| E2E Runner | Deferred | Future browser/device journey plan only; no new test runner, no execution and no Android test claims. |
| Performance Optimizer | Low | Evidence-based mobile performance review; no speculative benchmarks or new dependencies. |
| Database Reviewer | Conditional | Convex-only data and server-side authorization review when schema/design is supplied. Do not introduce PostgreSQL. |
| RAG Pipeline Reviewer | Later | Deferred review of retrieval provenance, access filtering, prompt injection, retention and evaluation when a RAG design exists. |

## Common response format
Each agent returns:
1. Scope and exact inputs reviewed.
2. Verified findings with file/line or evidence references.
3. Assumptions and unknowns, clearly separated.
4. Severity and user/security impact.
5. Actionable recommendation.
6. Acceptance criteria or required negative test.
7. Human decision required, if any.

## Shared safety rules
- Documentation roles are not deployed agents.
- No client-side check or prompt is an authorization boundary.
- No agent may approve its own request or mutate approval records.
- No consequential action without independent human approval.
- Convex remains the planned backend; no PostgreSQL assumptions.
- Main protection, merges and deployment remain human-controlled.
