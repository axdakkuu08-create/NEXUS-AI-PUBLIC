import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const messageValidator = v.object({
  _id: v.id("messages"),
  _creationTime: v.number(),
  role: v.union(v.literal("user"), v.literal("assistant")),
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
      .withIndex("by_conversation_created", q => q.eq("conversationId", args.conversationId))
      .order("asc").take(500);
    return rows.map(({ _id, _creationTime, role, content, createdAt }) => ({ _id, _creationTime, role, content, createdAt }));
  },
});

export const send = mutation({
  args: { conversationId: v.id("conversations"), content: v.string() },
  returns: v.id("messages"),
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const conversation = await ctx.db.get(args.conversationId);
    if (!conversation || conversation.ownerId !== ownerId) throw new Error("Conversation not found.");
    const content = args.content.trim();
    if (!content || content.length > 20000) throw new Error("Message must contain 1–20,000 characters.");
    const now = Date.now();
    const messageId = await ctx.db.insert("messages", { ownerId, conversationId: args.conversationId, role: "user", content, createdAt: now });
    await ctx.db.patch(args.conversationId, { updatedAt: now });
    return messageId;
  },
});
