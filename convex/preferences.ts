import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { requireUserId } from "./lib/auth";

const theme = v.union(v.literal("dark"), v.literal("light"), v.literal("system"));
const preferencesValidator = v.object({ theme, notifications: v.boolean() });

async function findPreferences(ctx: {
  db: {
    query: (table: "userPreferences") => {
      withIndex: (
        index: "by_owner",
        builder: (q: { eq: (field: "ownerId", value: string) => unknown }) => unknown,
      ) => {
        take: (count: number) => Promise<Array<{
          _id: import("./_generated/dataModel").Id<"userPreferences">;
          theme: "dark" | "light" | "system";
          notifications: boolean;
          updatedAt: number;
        }>>;
      };
    };
  };
}, ownerId: string) {
  const rows = await ctx.db
    .query("userPreferences")
    .withIndex("by_owner", (q) => q.eq("ownerId", ownerId))
    .take(2);
  if (rows.length > 1) {
    throw new Error("Multiple preferences records found for this user; resolve duplicates before continuing.");
  }
  return rows[0] ?? null;
}

export const get = query({
  args: {},
  returns: v.union(preferencesValidator, v.null()),
  handler: async (ctx) => {
    const ownerId = await requireUserId(ctx);
    const row = await findPreferences(ctx, ownerId);
    return row ? { theme: row.theme, notifications: row.notifications } : null;
  },
});

export const update = mutation({
  args: { theme: v.optional(theme), notifications: v.optional(v.boolean()) },
  returns: preferencesValidator,
  handler: async (ctx, args) => {
    const ownerId = await requireUserId(ctx);
    const current = await findPreferences(ctx, ownerId);
    const next = {
      theme: args.theme ?? current?.theme ?? "dark",
      notifications: args.notifications ?? current?.notifications ?? true,
      updatedAt: Date.now(),
    };
    if (current) await ctx.db.patch(current._id, next);
    else await ctx.db.insert("userPreferences", { ownerId, ...next });
    return { theme: next.theme, notifications: next.notifications };
  },
});
