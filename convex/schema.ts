import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

const projectStatus = v.union(v.literal("active"), v.literal("paused"), v.literal("completed"), v.literal("archived"));
const taskStatus = v.union(v.literal("todo"), v.literal("in_progress"), v.literal("review"), v.literal("done"));
const taskPriority = v.union(v.literal("low"), v.literal("medium"), v.literal("high"), v.literal("urgent"));
const agentStatus = v.union(v.literal("idle"), v.literal("running"), v.literal("success"), v.literal("error"), v.literal("offline"));
const activityStatus = v.union(v.literal("success"), v.literal("failure"), v.literal("info"), v.literal("warning"));

export default defineSchema({
  projects: defineTable({ ownerId: v.string(), name: v.string(), description: v.optional(v.string()), status: projectStatus, updatedAt: v.number() })
    .index("by_owner_updated", ["ownerId", "updatedAt"]),
  conversations: defineTable({ ownerId: v.string(), projectId: v.optional(v.id("projects")), title: v.string(), updatedAt: v.number() })
    .index("by_owner_updated", ["ownerId", "updatedAt"])
    .index("by_owner_project_updated", ["ownerId", "projectId", "updatedAt"]),
  tasks: defineTable({ ownerId: v.string(), projectId: v.optional(v.id("projects")), title: v.string(), description: v.optional(v.string()), status: taskStatus, priority: taskPriority, createdAt: v.number(), updatedAt: v.number() })
    .index("by_owner_updated", ["ownerId", "updatedAt"])
    .index("by_owner_status_updated", ["ownerId", "status", "updatedAt"]),
  agents: defineTable({ ownerId: v.string(), name: v.string(), description: v.string(), capabilities: v.array(v.string()), status: agentStatus, updatedAt: v.number() })
    .index("by_owner_updated", ["ownerId", "updatedAt"]),
  agentActivity: defineTable({ ownerId: v.string(), agentId: v.optional(v.id("agents")), projectId: v.optional(v.id("projects")), taskId: v.optional(v.id("tasks")), title: v.string(), detail: v.optional(v.string()), status: activityStatus, createdAt: v.number() })
    .index("by_owner_created", ["ownerId", "createdAt"]),
  toolIntegrations: defineTable({ ownerId: v.string(), name: v.string(), description: v.string(), status: v.union(v.literal("connected"), v.literal("disconnected"), v.literal("pending"), v.literal("error")), permissions: v.array(v.string()), updatedAt: v.number() })
    .index("by_owner_updated", ["ownerId", "updatedAt"]),
  userPreferences: defineTable({ ownerId: v.string(), theme: v.union(v.literal("dark"), v.literal("light"), v.literal("system")), notifications: v.boolean(), updatedAt: v.number() })
    .index("by_owner", ["ownerId"]),
});
