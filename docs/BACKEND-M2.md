# NEXUS-AI M2 — authenticated chat and persistence

## What this phase adds

- Clerk session integration with the existing issuer in `convex/auth.config.ts`.
- Convex client/provider wiring for the Next.js App Router.
- Owner-scoped conversation messages with bounded history.
- A server-only OpenAI-compatible chat adapter. Provider credentials never enter client code.
- Explicit disconnected states when authentication, Convex, or model configuration is missing.

## Required deployment environment

Set these in hosting-provider environment settings, never in Git:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: publishable key for the Clerk application whose issuer matches `convex/auth.config.ts`.
- `CLERK_SECRET_KEY`: matching Clerk secret key; server-side only.
- `NEXT_PUBLIC_CONVEX_URL`: URL of the approved NEXUS Convex development deployment.
- `AI_API_BASE_URL`: HTTPS base URL for an OpenAI-compatible chat-completions API.
- `AI_API_KEY`: provider key; server-side only.
- `AI_MODEL`: exact model identifier enabled by the chosen provider.

The AI adapter intentionally does not select a provider or model automatically. It returns a clear setup error until all three AI variables are present.

## Authentication and Convex setup gates

1. Confirm the Clerk application is the same one represented by the existing issuer in `convex/auth.config.ts`.
2. Configure the Clerk JWT template/audience expected by Convex (`convex`) and verify the issuer matches exactly.
3. Configure Clerk keys in the preview environment.
4. Sync `convex/auth.config.ts` and the schema to an isolated development deployment only after its target and credentials are explicitly approved.
5. Set `NEXT_PUBLIC_CONVEX_URL` to that development deployment and test sign-in, owner isolation, create/send/reload/history.
6. Configure the AI provider variables only after selecting an OpenAI-compatible endpoint and model. Never expose `AI_API_KEY` with a `NEXT_PUBLIC_` prefix.

## Safety and validation

- Every public Convex function requires an authenticated identity.
- Messages are readable/writable only by the owner of their conversation.
- Message content is limited to 12,000 characters; history reads are bounded to the latest 100 messages.
- The API route requires a Clerk session and validates request size and message roles.
- Provider failures do not return upstream response bodies or credentials to the browser.
- No live Convex deployment, Vercel environment change, model call, merge, or production deployment is performed by this code change.
- Automated Convex tests use an isolated anonymous test backend; they do not prove real Clerk JWT validation or a live cloud deployment.
