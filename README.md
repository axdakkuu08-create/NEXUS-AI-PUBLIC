# NEXUS-AI Frontend (M1)

Premium **mobile-first** AI agent workspace.  
Visual direction: dark black-green surfaces, neon emerald accents (AgentOS-inspired).

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4
- lucide-react

## Setup

```bash
npm install
npm run dev
```

Open http://localhost:3000

## Screens

Home · Chat (Command Center) · Projects · Agents · Tasks · Integrations · Activity · Settings

## Design

See `docs/DESIGN_SYSTEM.md` and `docs/FRONTEND_UI_SPEC.md`.

## Backend

`src/lib/services.ts` — interfaces only until Convex M2.  
Planned URL: https://shocking-salamander-814.convex.cloud/

Honest empty / loading / disconnected states only — no fake success.
