# NEXUS-AI Design System

Premium dark-first AI agent workspace. **Mobile-first (Android priority)**.  
Visual direction inspired by modern agent OS interfaces: deep black-green surfaces, neon emerald accents, glass panels, workflow-friendly density.

## Principles

- Dark-first with optional light theme
- Deep black / forest-green backgrounds
- Neon emerald (`#00E676`) primary accent
- Subtle glassmorphism + soft ambient glow (no heavy clutter)
- Rounded cards, consistent spacing, clean typography
- Accessible contrast (WCAG AA minimum)
- Lightweight motion only

## Color Tokens (Dark default)

| Token | Value | Usage |
|-------|-------|-------|
| `--bg-base` | `#050807` | Page background |
| `--bg-elevated` | `#0A100E` | Cards, panels |
| `--bg-surface` | `#101A16` | Inputs, secondary |
| `--bg-hover` | `#162420` | Hover |
| `--border` | `#1C322A` | Borders |
| `--text-primary` | `#E8F5EF` | Primary text |
| `--text-secondary` | `#8FAFA0` | Muted |
| `--text-tertiary` | `#5A7A6C` | Hints |
| `--accent` | `#00E676` | Primary (neon green) |
| `--accent-hover` | `#69F0AE` | Hover |
| `--accent-muted` | `rgba(0,230,118,0.12)` | Soft fills |
| `--accent-blue` | `#00BFA5` | Secondary teal |
| `--success` | `#00E676` | Online / success |
| `--warning` | `#FFB300` | Running |
| `--danger` | `#FF5252` | Error |
| `--info` | `#40C4FF` | Info |

## Layout cues (from reference)

- Compact mobile header with search
- Bottom tab bar: Home, Chat, Projects, Agents, Settings
- Floating primary actions (new chat / new node)
- Integration cards with connection toggles
- Chat “command center” with confidence chips
- Workflow pipeline nodes (future M1.2+)

## Typography

Geist / system-ui. Mono for logs and code.

## Spacing & radius

- Cards: `rounded-xl` / `rounded-2xl`
- Touch targets ≥ 44px
- Safe-area insets on mobile

## Glass

```css
.glass {
  background: rgba(10, 16, 14, 0.82);
  backdrop-filter: blur(16px);
  border: 1px solid rgba(28, 50, 42, 0.7);
}
```

## Accessibility

Focus rings in accent green. Respect `prefers-reduced-motion`.
