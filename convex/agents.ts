import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const agentStatus = v.union(v.literal("idle"), v.literal("running"), v.literal("success"), v.literal("error"), v.literal("offline"));
const agentValidator = v.object({ _id: v.id("agents"), _creationTime: v.number(), name: v.string(), description: v.string(), capabilities: v.array(v.string()), status: agentStatus, updatedAt: v.number() });

export const list = query({
  args: {},
  returns: v.array(agentValidator),
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
    const rows = await ctx.db.query("agents").withIndex("by_owner_updated", q => q.eq("ownerId", ownerId)).order("desc").take(50);
    return rows.map(({ _id, _creationTime, name, description, capabilities, status, updatedAt }) => ({ _id, _creationTime, name, description, capabilities, status, updatedAt }));
  },
});

export const create = mutation({
  args: { name: v.string(), description: v.string(), capabilities: v.array(v.string()) },
  returns: v.id("agents"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const name = args.name.trim();
    const description = args.description.trim();
    if (!name || name.length > 80) throw new Error("Agent name must contain 1–80 characters.");
    if (description.length > 1000) throw new Error("Agent description must be at most 1,000 characters.");
    if (args.capabilities.length > 30 || args.capabilities.some(item => item.trim().length > 80)) throw new Error("Agent capabilities exceed the allowed limits.");
    return await ctx.db.insert("agents", { ownerId, name, description, capabilities: args.capabilities.map(item => item.trim()).filter(Boolean), status: "offline", updatedAt: Date.now() });
  },
});
