import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const taskStatus = v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("done"));
const taskPriority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"));
const taskValidator = v.object({ _id: v.id("tasks"), _creationTime: v.number(), title: v.string(), description: v.optional(v.string()), projectId: v.optional(v.id("projects")), status: taskStatus, priority: taskPriority, createdAt: v.number(), updatedAt: v.number() });

export const list = query({
  args: { status: v.optional(taskStatus) },
  returns: v.array(taskValidator),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const rows = args.status
      ? await ctx.db.query("tasks").withIndex("by_owner_status_updated", q => q.eq("ownerId", ownerId).eq("status", args.status!)).order("desc").take(100)
      : await ctx.db.query("tasks").withIndex("by_owner_updated", q => q.eq("ownerId", ownerId)).order("desc").take(100);
    return rows.map(({ _id, _creationTime, title, description, projectId, status, priority, createdAt, updatedAt }) => ({ _id, _creationTime, title, description, projectId, status, priority, createdAt, updatedAt }));
  },
});

export const create = mutation({
  args: { title: v.string(), description: v.optional(v.string()), projectId: v.optional(v.id("projects")), priority: v.optional(taskPriority) },
  returns: v.id("tasks"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const title = args.title.trim();
    const description = args.description?.trim();
    if (!title || title.length > 160) throw new Error("Task title must contain 1–160 characters.");
    if (description && description.length > 4000) throw new Error("Task description must be at most 4,000 characters.");
    if (args.projectId) { const project = await ctx.db.get(args.projectId); if (!project || project.ownerId !== ownerId) throw new Error("Project not found."); }
    const now = Date.now();
    return await ctx.db.insert("tasks", { ownerId, title, ...(description ? { description } : {}), ...(args.projectId ? { projectId: args.projectId } : {}), status: "todo", priority: args.priority ?? "medium", createdAt: now, updatedAt: now });
  },
});

export const updateStatus = mutation({
  args: { taskId: v.id("tasks"), status: taskStatus },
  returns: v.null(),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const task = await ctx.db.get(args.taskId);
    if (!task || task.ownerId !== ownerId) throw new Error("Task not found.");
    await ctx.db.patch(args.taskId, { status: args.status, updatedAt: Date.now() });
    return null;
  },
});
