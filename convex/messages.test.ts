import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");
const aliceIdentity = {
  issuer: "https://nexus-m2-test.example",
  subject: "alice",
  tokenIdentifier: "https://nexus-m2-test.example|alice",
};
const bobIdentity = {
  issuer: "https://nexus-m2-test.example",
  subject: "bob",
  tokenIdentifier: "https://nexus-m2-test.example|bob",
};

test("message history rejects anonymous access", async () => {
  const t = convexTest(schema, modules);
  const conversationId = await t.run((ctx) => ctx.db.insert("conversations", {
    ownerId: aliceIdentity.tokenIdentifier, title: "Private", updatedAt: Date.now(),
  }));
  await expect(t.query(api.messages.list, { conversationId })).rejects.toThrow("Unauthenticated");
  await expect(t.mutation(api.messages.add, {
    conversationId, role: "user", content: "No anonymous writes",
  })).rejects.toThrow("Unauthenticated");
});

test("conversation messages are private, ordered, and owner-scoped", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const bob = t.withIdentity(bobIdentity);
  const conversationId = await alice.mutation(api.conversations.create, { title: "Persistent chat" });
  await alice.mutation(api.messages.add, { conversationId, role: "user", content: "First message" });
  await alice.mutation(api.messages.add, { conversationId, role: "assistant", content: "Second message" });
  const history = await alice.query(api.messages.list, { conversationId });
  expect(history.map((message) => message.content)).toEqual(["First message", "Second message"]);
  await expect(bob.query(api.messages.list, { conversationId })).rejects.toThrow("Conversation not found");
  await expect(bob.mutation(api.messages.add, {
    conversationId, role: "user", content: "Cross-owner write",
  })).rejects.toThrow("Conversation not found");
  expect(await bob.query(api.conversations.list, {})).toEqual([]);
});

test("message content is bounded and non-empty", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const conversationId = await alice.mutation(api.conversations.create, { title: "Validation" });
  await expect(alice.mutation(api.messages.add, {
    conversationId, role: "user", content: "   ",
  })).rejects.toThrow("1–12,000");
  await expect(alice.mutation(api.messages.add, {
    conversationId, role: "user", content: "x".repeat(12001),
  })).rejects.toThrow("1–12,000");
});
