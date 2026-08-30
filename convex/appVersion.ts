import { v } from "convex/values";
import { query, mutation } from "./_generated/server";
import { assertAdmin } from "./lib/authHelpers";

/**
 * App Version Gate — Backend-driven minimum version enforcement.
 *
 * This is the FALLBACK layer behind Google's native In-App Updates API.
 * Use it to force-gate a specific version before Google's API propagates,
 * or to bypass staged rollouts and force ALL users to update immediately.
 *
 * Usage:
 *   1. Deploy a new app version to Play Store
 *   2. Call setMinAppVersion({ version: "1.0.2", accessToken: "..." })
 *   3. All users on older versions see a blocking update modal
 */

export const getMinAppVersion = query({
    args: {},
    handler: async (ctx) => {
        const record = await ctx.db
            .query("system_state")
            .withIndex("by_key", (q) => q.eq("key", "min_app_version"))
            .unique();

        return record?.value ?? null;
    },
});

export const setMinAppVersion = mutation({
    args: {
        version: v.string(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        // Validate semver-like format (e.g., "1.0.2")
        if (!/^\d+\.\d+\.\d+$/.test(args.version)) {
            throw new Error("Version must be in semver format (e.g., '1.0.2').");
        }

        const existing = await ctx.db
            .query("system_state")
            .withIndex("by_key", (q) => q.eq("key", "min_app_version"))
            .unique();

        if (existing) {
            await ctx.db.patch(existing._id, {
                value: args.version,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("system_state", {
                key: "min_app_version",
                value: args.version,
                updatedAt: Date.now(),
            });
        }
    },
});
