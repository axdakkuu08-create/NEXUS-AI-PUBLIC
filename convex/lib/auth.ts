import type { QueryCtx, MutationCtx } from "../_generated/server";

export async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<string> {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) throw new Error("Unauthenticated: sign in before accessing NEXUS-AI data.");
  return identity.tokenIdentifier;
}
