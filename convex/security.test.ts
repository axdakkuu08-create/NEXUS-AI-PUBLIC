import { convexTest } from "convex-test";
import { expect, test } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";

const modules = import.meta.glob("./**/*.ts");

const aliceIdentity = {
  issuer: "https://nexus-m1-test.example",
  subject: "alice",
  tokenIdentifier: "https://nexus-m1-test.example|alice",
};
const bobIdentity = {
  issuer: "https://nexus-m1-test.example",
  subject: "bob",
  tokenIdentifier: "https://nexus-m1-test.example|bob",
};

test("every public M1 query and mutation rejects anonymous callers", async () => {
  const t = convexTest(schema, modules);
  const seeded = await t.run(async (ctx) => {
    const projectId = await ctx.db.insert("projects", {
      ownerId: "seed-owner",
      name: "Seed project",
      status: "active",
      updatedAt: Date.now(),
    });
    const taskId = await ctx.db.insert("tasks", {
      ownerId: "seed-owner",
      projectId,
      title: "Seed task",
      status: "todo",
      priority: "medium",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });
    return { projectId, taskId };
  });

  const anonymousOperations: Array<() => Promise<unknown>> = [
    () => t.query(api.projects.list, {}),
    () => t.mutation(api.projects.create, { name: "Anonymous project" }),
    () => t.mutation(api.projects.update, { projectId: seeded.projectId, name: "Changed" }),
    () => t.query(api.conversations.list, {}),
    () => t.mutation(api.conversations.create, { title: "Anonymous conversation" }),
    () => t.query(api.tasks.list, {}),
    () => t.mutation(api.tasks.create, { title: "Anonymous task" }),
    () => t.mutation(api.tasks.updateStatus, { taskId: seeded.taskId, status: "done" }),
    () => t.query(api.agents.list, {}),
    () => t.mutation(api.agents.create, { name: "Anonymous agent", description: "Test", capabilities: [] }),
    () => t.query(api.activity.list, {}),
    () => t.query(api.preferences.get, {}),
    () => t.mutation(api.preferences.update, { theme: "dark" }),
    () => t.query(api.tools.list, {}),
  ];

  for (const operation of anonymousOperations) {
    await expect(operation()).rejects.toThrow("Unauthenticated");
  }
});

test("authenticated users only see records belonging to their identity", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const bob = t.withIdentity(bobIdentity);

  const projectId = await alice.mutation(api.projects.create, {
    name: "Alice private project",
  });
  await alice.mutation(api.conversations.create, {
    title: "Alice private conversation",
    projectId,
  });
  await alice.mutation(api.tasks.create, {
    title: "Alice private task",
    projectId,
  });
  await alice.mutation(api.agents.create, {
    name: "Alice private agent",
    description: "Private registry entry",
    capabilities: ["planning"],
  });
  await alice.mutation(api.preferences.update, {
    theme: "light",
    notifications: false,
  });

  await t.run(async (ctx) => {
    await ctx.db.insert("agentActivity", {
      ownerId: aliceIdentity.tokenIdentifier,
      title: "Alice private activity",
      status: "info",
      createdAt: Date.now(),
    });
    await ctx.db.insert("toolIntegrations", {
      ownerId: aliceIdentity.tokenIdentifier,
      name: "Alice private integration",
      description: "Test metadata",
      status: "disconnected",
      permissions: [],
      updatedAt: Date.now(),
    });
  });

  expect(await alice.query(api.projects.list, {})).toHaveLength(1);
  expect(await bob.query(api.projects.list, {})).toEqual([]);
  expect(await bob.query(api.conversations.list, {})).toEqual([]);
  expect(await bob.query(api.tasks.list, {})).toEqual([]);
  expect(await bob.query(api.agents.list, {})).toEqual([]);
  expect(await bob.query(api.activity.list, {})).toEqual([]);
  expect(await bob.query(api.tools.list, {})).toEqual([]);
  expect(await bob.query(api.preferences.get, {})).toBeNull();
});

test("public operations reject cross-owner project and task references", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const bob = t.withIdentity(bobIdentity);

  const projectId = await alice.mutation(api.projects.create, {
    name: "Alice project",
  });
  const taskId = await alice.mutation(api.tasks.create, {
    title: "Alice task",
    projectId,
  });

  await expect(
    bob.mutation(api.projects.update, {
      projectId,
      name: "Bob must not edit Alice's project",
    }),
  ).rejects.toThrow("Project not found");

  await expect(
    bob.mutation(api.tasks.updateStatus, {
      taskId,
      status: "done",
    }),
  ).rejects.toThrow("Task not found");

  await expect(
    bob.query(api.conversations.list, { projectId }),
  ).rejects.toThrow("Project not found");

  await expect(
    bob.mutation(api.conversations.create, {
      title: "Bob conversation",
      projectId,
    }),
  ).rejects.toThrow("Project not found");
});

test("internal activity writes reject references owned by another user", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);

  const projectId = await alice.mutation(api.projects.create, {
    name: "Alice project",
  });
  const taskId = await alice.mutation(api.tasks.create, {
    title: "Alice task",
    projectId,
  });
  const agentId = await alice.mutation(api.agents.create, {
    name: "Alice agent",
    description: "Private agent",
    capabilities: [],
  });

  const base = {
    ownerId: bobIdentity.tokenIdentifier,
    title: "Attempted cross-owner activity",
    status: "warning" as const,
  };

  await expect(
    t.mutation(internal.activity.record, { ...base, projectId }),
  ).rejects.toThrow("Activity reference not found");
  await expect(
    t.mutation(internal.activity.record, { ...base, taskId }),
  ).rejects.toThrow("Activity reference not found");
  await expect(
    t.mutation(internal.activity.record, { ...base, agentId }),
  ).rejects.toThrow("Activity reference not found");
});

test("preferences updates remain single-row and duplicate legacy rows fail closed", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);

  expect(await alice.query(api.preferences.get, {})).toBeNull();
  await alice.mutation(api.preferences.update, { theme: "light" });
  await alice.mutation(api.preferences.update, { notifications: false });

  const normalRows = await t.run(async (ctx) =>
    ctx.db
      .query("userPreferences")
      .withIndex("by_owner", (q) => q.eq("ownerId", aliceIdentity.tokenIdentifier))
      .collect(),
  );
  expect(normalRows).toHaveLength(1);

  const duplicateTest = convexTest(schema, modules);
  const duplicateUser = duplicateTest.withIdentity(aliceIdentity);
  await duplicateTest.run(async (ctx) => {
    await ctx.db.insert("userPreferences", {
      ownerId: aliceIdentity.tokenIdentifier,
      theme: "dark",
      notifications: true,
      updatedAt: 1,
    });
    await ctx.db.insert("userPreferences", {
      ownerId: aliceIdentity.tokenIdentifier,
      theme: "light",
      notifications: false,
      updatedAt: 2,
    });
  });

  await expect(
    duplicateUser.query(api.preferences.get, {}),
  ).rejects.toThrow("Multiple preferences records found for this user");
  await expect(
    duplicateUser.mutation(api.preferences.update, { theme: "system" }),
  ).rejects.toThrow("Multiple preferences records found for this user");

  const preservedRows = await duplicateTest.run(async (ctx) =>
    ctx.db
      .query("userPreferences")
      .withIndex("by_owner", (q) => q.eq("ownerId", aliceIdentity.tokenIdentifier))
      .collect(),
  );
  expect(preservedRows).toHaveLength(2);
});


test("messages persist per conversation and are isolated by owner", async () => {
  const t = convexTest(schema, modules);
  const alice = t.withIdentity(aliceIdentity);
  const bob = t.withIdentity(bobIdentity);

  const conversationId = await alice.mutation(api.conversations.create, {
    title: "Persistent conversation",
  });
  await alice.mutation(api.messages.send, {
    conversationId,
    content: "Persist this message",
  });

  const aliceMessages = await alice.query(api.messages.list, { conversationId });
  expect(aliceMessages).toHaveLength(1);
  expect(aliceMessages[0].content).toBe("Persist this message");
  expect(aliceMessages[0].role).toBe("user");

  await expect(
    bob.query(api.messages.list, { conversationId }),
  ).rejects.toThrow("Conversation not found.");
  await expect(
    bob.mutation(api.messages.send, {
      conversationId,
      content: "Cross-owner write",
    }),
  ).rejects.toThrow("Conversation not found.");
});
