# NEXUS-AI Backend — M1 Foundation

## Decisions

- Convex is the primary database and server-function platform.
- Clerk is the recommended first identity provider. The Convex auth configuration expects `CLERK_JWT_ISSUER_DOMAIN`; no issuer value, credential, or secret is committed.
- User-owned records are partitioned by Convex identity `tokenIdentifier`. Every public data query and mutation requires an authenticated identity and checks ownership of referenced records.
- AI integration remains server-side and provider-independent. M1 adds no provider SDK, API key, model call, or frontend secret. M2 should add a server-side provider adapter and keep credentials in Convex environment variables.
- Conversation metadata is stored in M1. Message history and agent threads are deferred to the Convex Agent component in M2 instead of creating a parallel custom chat-message store.

## Data model

`projects`, `conversations`, `tasks`, `agents`, `agentActivity`, `toolIntegrations`, and `userPreferences` are scoped to an authenticated owner. Read paths use explicit indexes and bounded `.take()` limits. When attachments are introduced, store Convex `_storage` IDs rather than expiring URLs.

## M1 public operations

- Projects: list, create, update.
- Conversations: list, create (metadata only).
- Tasks: list, create, update status.
- Agents: list, create (registry metadata only; no execution).
- Tools: list integration metadata only; no credentials are stored.
- Activity: list; trusted internal activity writes only.
- Preferences: get, update.

## Setup gates

Before connecting a deployment, create a Convex development deployment and configure the Clerk JWT issuer domain as `CLERK_JWT_ISSUER_DOMAIN`. Do not use production credentials or deploy production as part of M1. Frontend providers and live UI wiring are a separate M2 step.
