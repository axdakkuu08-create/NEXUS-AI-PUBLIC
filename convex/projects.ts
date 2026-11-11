import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const statusValidator = v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("archived"));
const projectValidator = v.object({ _id: v.id("projects"), _creationTime: v.number(), name: v.string(), description: v.optional(v.string()), status: statusValidator, updatedAt: v.number() });

export const list = query({
  args: {},
  returns: v.array(projectValidator),
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
    const rows = await ctx.db.query("projects").withIndex("by_owner_updated", q => q.eq("ownerId", ownerId)).order("desc").take(50);
    return rows.map(({ _id, _creationTime, name, description, status, updatedAt }) => ({ _id, _creationTime, name, description, status, updatedAt }));
  },
});

export const create = mutation({
  args: { name: v.string(), description: v.optional(v.string()) },
  returns: v.id("projects"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const name = args.name.trim();
    const description = args.description?.trim();
    if (!name || name.length > 100) throw new Error("Project name must contain 1–100 characters.");
    if (description && description.length > 2000) throw new Error("Project description must be at most 2,000 characters.");
    return await ctx.db.insert("projects", { ownerId, name, ...(description ? { description } : {}), status: "active", updatedAt: Date.now() });
  },
});

export const update = mutation({
  args: { projectId: v.id("projects"), name: v.optional(v.string()), description: v.optional(v.string()), status: v.optional(statusValidator) },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const project = await ctx.db.get(args.projectId);
    if (!project || project.ownerId !== ownerId) throw new Error("Project not found.");
    const patch: { name?: string; description?: string; status?: "active" | "paused" | "completed" | "archived"; updatedAt: number } = { updatedAt: Date.now() };
    if (args.name !== undefined) { const name = args.name.trim(); if (!name || name.length > 100) throw new Error("Project name must contain 1–100 characters."); patch.name = name; }
    if (args.description !== undefined) { const description = args.description.trim(); if (description.length > 2000) throw new Error("Project description must be at most 2,000 characters."); patch.description = description; }
    if (args.status !== undefined) patch.status = args.status;
    await ctx.db.patch(args.projectId, patch);
    return null;
  },
});
