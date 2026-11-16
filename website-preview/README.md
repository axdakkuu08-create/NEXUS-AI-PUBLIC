# NEXUS-AI website preview source

This directory contains the standalone static NEXUS-AI marketing/preview page.

- `index.html` — page markup
- `styles.css` — page styling
- `main.js` — navigation and progressive-enhancement behavior

This is separate from the Next.js application under `src/`. It is not the RETRO Technologies corporate website and is not configured as the application's root route. The page keeps its existing NEXUS-AI product content and attribution.

For a local static preview, serve the repository root and open `/website-preview/`. Asset paths are scoped to this directory. No production routing or deployment configuration is changed.
