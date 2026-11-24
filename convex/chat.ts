import { v } from "convex/values";
import { internal } from "./_generated/api";
import { action } from "./_generated/server";

export const reply = action({
  args: { conversationId: v.id("conversations") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Unauthenticated: sign in before using NEXUS-AI chat.");
    const ownerId = identity.tokenIdentifier;
    const messages = await ctx.runQuery(internal.messages.getRecentForChat, {
      conversationId: args.conversationId,
      ownerId,
    });
    if (messages.length === 0 || messages[messages.length - 1]?.role !== "user") {
      throw new Error("Send a user message before requesting an assistant response.");
    }

    const apiKey = process.env.AI_API_KEY;
    const baseUrl = process.env.AI_API_BASE_URL;
    const model = process.env.AI_MODEL;
    if (!apiKey || !baseUrl || !model) {
      throw new Error("The server-side AI provider is not configured yet.");
    }

    let endpoint: URL;
    try {
      endpoint = new URL(baseUrl.replace(/\/+$/, "") + "/chat/completions");
    } catch {
      throw new Error("The AI provider URL is invalid.");
    }
    if (endpoint.protocol !== "https:") {
      throw new Error("The AI provider must use HTTPS.");
    }

    const upstream = await fetch(endpoint, {
      method: "POST",
      headers: { Authorization: "Bearer " + apiKey, "Content-Type": "application/json" },
      body: JSON.stringify({
        model,
        messages: messages.map(({ role, content }) => ({ role, content })),
        max_tokens: 1200,
      }),
    });
    if (!upstream.ok) throw new Error("The AI provider rejected the request. Check its server-side configuration.");

    const result: unknown = await upstream.json();
    if (!result || typeof result !== "object" || !("choices" in result) || !Array.isArray(result.choices)) {
      throw new Error("The AI provider returned an unsupported response.");
    }
    const first = result.choices[0];
    if (!first || typeof first !== "object" || !("message" in first)) {
      throw new Error("The AI provider returned no message.");
    }
    const assistantMessage = first.message;
    if (
      !assistantMessage || typeof assistantMessage !== "object" ||
      !("content" in assistantMessage) ||
      typeof assistantMessage.content !== "string" ||
      !assistantMessage.content.trim()
    ) {
      throw new Error("The AI provider returned an empty response.");
    }

    const content = assistantMessage.content.trim();
    await ctx.runMutation(internal.messages.addAssistant, {
      conversationId: args.conversationId,
      ownerId,
      content,
    });
    return content;
  },
});
