import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const conversationValidator = v.object({ _id: v.id("conversations"), _creationTime: v.number(), title: v.string(), projectId: v.optional(v.id("projects")), updatedAt: v.number() });

export const list = query({
  args: { projectId: v.optional(v.id("projects")) },
  returns: v.array(conversationValidator),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    if (args.projectId) {
      const project = await ctx.db.get(args.projectId);
      if (!project || project.ownerId !== ownerId) throw new Error("Project not found.");
      const rows = await ctx.db.query("conversations").withIndex("by_owner_project_updated", q => q.eq("ownerId", ownerId).eq("projectId", args.projectId)).order("desc").take(50);
      return rows.map(({ _id, _creationTime, title, projectId, updatedAt }) => ({ _id, _creationTime, title, projectId, updatedAt }));
    }
    const rows = await ctx.db.query("conversations").withIndex("by_owner_updated", q => q.eq("ownerId", ownerId)).order("desc").take(50);
    return rows.map(({ _id, _creationTime, title, projectId, updatedAt }) => ({ _id, _creationTime, title, projectId, updatedAt }));
  },
});

export const create = mutation({
  args: { title: v.string(), projectId: v.optional(v.id("projects")) },
  returns: v.id("conversations"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const title = args.title.trim();
    if (!title || title.length > 160) throw new Error("Conversation title must contain 1–160 characters.");
    if (args.projectId) { const project = await ctx.db.get(args.projectId); if (!project || project.ownerId !== ownerId) throw new Error("Project not found."); }
    return await ctx.db.insert("conversations", { ownerId, title, ...(args.projectId ? { projectId: args.projectId } : {}), updatedAt: Date.now() });
  },
});
