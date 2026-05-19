import { v } from "convex/values";
import { query } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/authHelpers";

/**
 * M2: Returns the most recent notifications for the authenticated user.
 * Defaults to 100, configurable via `limit` arg (max 200).
 */
export const getNotifications = query({
    args: {
        accessToken: v.string(),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;
        const take = Math.min(args.limit ?? 100, 200);
        return await ctx.db
            .query("user_notifications")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc")
            .take(take);
    },
});

export const getUnreadCount = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;
        // Capped at 20 — reduces document reads by 80% compared to previous cap of 100.
        // UI can show "20+" for users with many unread notifications.
        const unread = await ctx.db
            .query("user_notifications")
            .withIndex("by_userId_isRead", (q) =>
                q.eq("userId", userId).eq("isRead", false)
            )
            .take(20);

        return unread.length;
    },
});
