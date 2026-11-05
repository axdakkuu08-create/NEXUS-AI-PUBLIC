# Phase B — NEXUS Swarm Studio integration

This branch overlays the original Swarm workspace onto the reconciled M1 source archive.

## Included
- Original TypeScript swarm engine and canvas renderer
- Idle, Working, Waiting approval, Completed, and Failed states
- Explicit demo-only label; no live backend execution is implied
- /swarm route, desktop sidebar, mobile drawer, and mobile bottom navigation
- Reduced-motion mode stops animation and simulated state transitions
- Canvas frames draw through an engine frame subscription; React state updates only when agent states change
- Pause/resume control and responsive canvas sizing

## Verification
Run the NEXUS Swarm Phase B verification workflow manually on feat/nexus-swarm-visualization. It extracts the checked-in source archive, applies baseline M1-M3 rendering compatibility changes, overlays the Phase B files, and runs lint, TypeScript, production build, route, and mobile viewport checks.

The workflow is intentionally manual so intermediate commits do not trigger incomplete runs. No merge or deployment is performed.
