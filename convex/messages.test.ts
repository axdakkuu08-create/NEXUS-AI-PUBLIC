import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
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
    conversationId, content: "No anonymous writes",
  })).rejects.toThrow("Unauthenticated");
});

test("public clients can create user messages but cannot assign assistant role", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const conversationId = await alice.mutation(api.conversations.create, { title: "Role boundary" });
  await alice.mutation(api.messages.add, { conversationId, content: "A user message" });
  await expect(
    alice.mutation(api.messages.add, { conversationId, role: "assistant", content: "Forged assistant" } as never),
  ).rejects.toThrow();
});

test("assistant writes are internal and owner-scoped", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const conversationId = await alice.mutation(api.conversations.create, { title: "Server reply" });
  await t.mutation(internal.messages.addAssistant, {
    conversationId, ownerId: aliceIdentity.tokenIdentifier, content: "Trusted server response",
  });
  const history = await alice.query(api.messages.list, { conversationId });
  expect(history.map((message) => message.role)).toEqual(["assistant"]);
  await expect(t.mutation(internal.messages.addAssistant, {
    conversationId, ownerId: bobIdentity.tokenIdentifier, content: "Wrong owner",
  })).rejects.toThrow("Conversation not found");
});

test("conversation messages are private, ordered, and owner-scoped", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const bob = t.withIdentity(bobIdentity);
  const conversationId = await alice.mutation(api.conversations.create, { title: "Persistent chat" });
  await alice.mutation(api.messages.add, { conversationId, content: "First message" });
  await t.mutation(internal.messages.addAssistant, {
    conversationId, ownerId: aliceIdentity.tokenIdentifier, content: "Second message",
  });
  const history = await alice.query(api.messages.list, { conversationId });
  expect(history.map((message) => message.content)).toEqual(["First message", "Second message"]);
  await expect(bob.query(api.messages.list, { conversationId })).rejects.toThrow("Conversation not found");
  await expect(bob.mutation(api.messages.add, {
    conversationId, content: "Cross-owner write",
  })).rejects.toThrow("Conversation not found");
  expect(await bob.query(api.conversations.list, {})).toEqual([]);
});

test("message content is bounded and non-empty", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const conversationId = await alice.mutation(api.conversations.create, { title: "Validation" });
  await expect(alice.mutation(api.messages.add, {
    conversationId, content: "   ",
  })).rejects.toThrow("1–12,000");
  await expect(alice.mutation(api.messages.add, {
    conversationId, content: "x".repeat(12001),
  })).rejects.toThrow("1–12,000");
});
