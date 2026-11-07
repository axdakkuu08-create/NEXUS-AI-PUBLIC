import { v } from "convex/values";
import { query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const integrationStatus = v.union(v.literal("connected"), v.literal("disconnected"), v.literal("pending"), v.literal("error"));

export const list = query({
  args: {},
  returns: v.array(v.object({
    _id: v.id("toolIntegrations"),
    _creationTime: v.number(),
    name: v.string(),
    description: v.string(),
    status: integrationStatus,
    permissions: v.array(v.string()),
    updatedAt: v.number(),
  })),
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
    const rows = await ctx.db.query("toolIntegrations").withIndex("by_owner_updated", q => q.eq("ownerId", ownerId)).order("desc").take(50);
    return rows.map(({ _id, _creationTime, name, description, status, permissions, updatedAt }) => ({ _id, _creationTime, name, description, status, permissions, updatedAt }));
  },
});
