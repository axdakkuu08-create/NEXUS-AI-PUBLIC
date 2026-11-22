# NEXUS-AI Marketing Website

An isolated React + TypeScript + Vite marketing website workspace.

## Scope

- Lives under `website/` so the marketing site does not alter the existing application branches.
- Uses the NEXUS-AI dark/emerald visual identity.
- Includes an interactive, local-only Agent Console / Task Pipeline simulator.
- Includes capability status filters and a static, illustrative security manifest.
- Does not connect to live agents, Convex, authentication, production data, or deployment services.

## Run and build

From this directory:

- `npm install`
- `npm run dev`
- `npm run build`
- `npm run preview`

Node.js 22 is the intended CI runtime.

## Truth-in-advertising rules

- Simulator activity is sample data, not live agent execution.
- The JSON security manifest is documentation-only and is not enforced by a runtime.
- No zero-data-retention, sandbox isolation, egress enforcement, production orchestration, install command, or Android release is claimed.
- The public repository link is the only external product destination currently exposed.

## Deployment

This workspace is buildable as a static Vite site. No hosting project, custom domain, production deployment, or DNS change is configured by this change.
