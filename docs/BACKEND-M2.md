# NEXUS-AI M2 — authenticated chat and persistence

## What this phase adds

- Clerk session integration with the existing issuer in `convex/auth.config.ts`.
- Convex client/provider wiring for the Next.js App Router.
- Owner-scoped conversation messages with bounded history.
- A Convex server action that reads trusted conversation history, calls an OpenAI-compatible provider, and stores assistant replies internally.
- Public clients can write user messages only; assistant-role writes are restricted to an internal mutation.
- Explicit disconnected states when authentication, Convex, or model configuration is missing.

## Environment configuration

Set these in the appropriate service's environment settings; never commit secrets:

- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`: publishable key for the Clerk application whose issuer matches `convex/auth.config.ts`.
- `CLERK_SECRET_KEY`: matching Clerk secret key; server-side only.
- `NEXT_PUBLIC_CONVEX_URL`: URL of the approved NEXUS Convex development deployment.
- `AI_API_BASE_URL`: HTTPS base URL for an OpenAI-compatible chat-completions API; configure as a Convex deployment environment variable.
- `AI_API_KEY`: provider key; configure as a Convex deployment environment variable only.
- `AI_MODEL`: exact model identifier enabled by the chosen provider; configure as a Convex deployment environment variable.

The AI action returns a clear setup error until all three Convex environment variables are present. Do not place provider credentials in Next.js client variables or expose them to the browser.

## Authentication and Convex setup gates

1. Confirm the Clerk application is the same one represented by the existing issuer in `convex/auth.config.ts`.
2. Configure the Clerk JWT template/audience expected by Convex (`convex`) and verify the issuer matches exactly.
3. Configure Clerk keys in the preview environment.
4. Sync `convex/auth.config.ts` and the schema to an isolated development deployment only after its target and credentials are explicitly approved.
5. Set `NEXT_PUBLIC_CONVEX_URL` to that development deployment and test sign-in, owner isolation, create/send/reload/history.
6. Configure the AI provider variables only after selecting an OpenAI-compatible endpoint and model. Never expose `AI_API_KEY` with a `NEXT_PUBLIC_` prefix.

## Safety and validation

- Every public Convex function requires an authenticated identity.
- Browser clients can write user messages only; assistant responses are created by an internal mutation called from an authenticated Convex action.
- The chat action obtains message history from the owner-scoped database query, rather than trusting client-supplied assistant history.
- Messages are readable/writable only by the owner of their conversation.
- Message content is limited to 12,000 characters; chat context is bounded to the latest 20 messages and history reads to the latest 100.
- Provider failures do not return upstream response bodies or credentials to the browser.
- No live Convex deployment, Clerk environment change, model call, merge, or production deployment is performed by this code change.
- Automated Convex tests use an isolated test backend; they do not prove real Clerk JWT validation or a live cloud deployment.
