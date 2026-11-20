import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const messageRole = v.union(v.literal("user"), v.literal("assistant"));
const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  role: messageRole,
  content: v.string(),
  createdAt: v.number(),
});

export const list = query({
  args: { conversationId: v.id("conversations") },
  returns: v.array(messageValidator),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== ownerId) throw new Error("Conversation not found.");
    const rows = await ctx.db.query("messages")
      .withIndex("by_owner_conversation_created", (q) =>
        q.eq("ownerId", ownerId).eq("conversationId", args.conversationId))
      .order("desc").take(100);
    return rows.reverse().map(({ _id, _creationTime, role, content, createdAt }) =>
      ({ _id, _creationTime, role, content, createdAt }));
  },
});

export const add = mutation({
  args: { conversationId: v.id("conversations"), role: messageRole, content: v.string() },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== ownerId) throw new Error("Conversation not found.");
    const content = args.content.trim();
    if (!content || content.length > 12000) throw new Error("Message content must contain 1–12,000 characters.");
    const createdAt = Date.now();
    await ctx.db.patch(args.conversationId, { updatedAt: createdAt });
    return await ctx.db.insert("messages", {
      ownerId, conversationId: args.conversationId, role: args.role, content, createdAt,
    });
  },
});
