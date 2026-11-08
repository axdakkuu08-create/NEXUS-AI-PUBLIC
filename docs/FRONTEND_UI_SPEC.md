# NEXUS-AI Frontend UI Spec (M1)

## Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS v4 + CSS design tokens
- **Icons**: lucide-react
- **Utils**: clsx, tailwind-merge
- **Backend**: Prepared interfaces only — Convex later (M2). No fake success states.

## Project layout

```
nexus-ai-web/
├── docs/
│   ├── DESIGN_SYSTEM.md
│   └── FRONTEND_UI_SPEC.md
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── globals.css
│   │   ├── page.tsx
│   │   └── (app)/
│   │       ├── layout.tsx
│   │       ├── page.tsx          # Home
│   │       ├── chat/
│   │       ├── projects/
│   │       ├── agents/
│   │       ├── tasks/
│   │       ├── tools/
│   │       ├── activity/
│   │       └── settings/
│   ├── components/
│   │   ├── layout/
│   │   ├── chat/
│   │   ├── cards/
│   │   ├── states/
│   │   └── ui/
│   ├── hooks/
│   └── lib/
└── public/
```

## Layout

### Desktop (≥768px)
- Fixed left sidebar
- Main workspace
- Optional right panel

### Mobile (Android first)
- Compact header
- Bottom navigation
- Collapsible drawer sidebar
- Full-width content
- Floating new-chat action
- No horizontal overflow

## Screens

- Home: welcome, recent, quick actions, agent status, active tasks
- Chat: messages, streaming, code, attachments, stop, copy
- Projects: cards, create, activity
- Agents: directory, capabilities, availability
- Tasks: pending/running/completed/failed, logs
- Tools: GitHub, Convex, status, permissions
- Activity: feed with timestamps and status
- Settings: profile, theme, notifications, permissions, privacy

## States
Honest loading / empty / error / disconnected until Convex M2.

## Permissions UI
Show actions, ask before commits/deploys, history, never silent sensitive ops.
