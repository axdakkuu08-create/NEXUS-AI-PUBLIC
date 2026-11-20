import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const activityStatus = v.union(v.literal("success"), v.literal("failure"), v.literal("info"), v.literal("warning"));

export const list = query({
  args: {},
  returns: v.array(v.object({ _id: v.id("agentActivity"), _creationTime: v.number(), title: v.string(), detail: v.optional(v.string()), status: activityStatus, createdAt: v.number() })),
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
    const rows = await ctx.db.query("agentActivity").withIndex("by_owner_created", q => q.eq("ownerId", ownerId)).order("desc").take(100);
    return rows.map(({ _id, _creationTime, title, detail, status, createdAt }) => ({ _id, _creationTime, title, detail, status, createdAt }));
  },
});

export const record = internalMutation({
  args: { ownerId: v.string(), title: v.string(), detail: v.optional(v.string()), status: activityStatus, agentId: v.optional(v.id("agents")), projectId: v.optional(v.id("projects")), taskId: v.optional(v.id("tasks")) },
  returns: v.id("agentActivity"),
  handler: async (ctx, args) => {
    const title = args.title.trim();
    if (!title || title.length > 160) throw new Error("Activity title must contain 1–160 characters.");
    if (args.detail && args.detail.length > 2000) throw new Error("Activity detail must be at most 2,000 characters.");
    for (const id of [args.agentId, args.projectId, args.taskId]) {
      if (id) { const document = await ctx.db.get(id); if (!document || document.ownerId !== args.ownerId) throw new Error("Activity reference not found."); }
    }
    return await ctx.db.insert("agentActivity", { ...args, title, createdAt: Date.now() });
  },
});
