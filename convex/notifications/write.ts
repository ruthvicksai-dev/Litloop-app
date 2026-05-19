import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUser, getUserIdFromAccessToken } from "../lib/authHelpers";
import { assertRateLimit, buildRateLimitKey } from "../lib/rateLimit";
import { isExpoPushToken, MARK_ALL_READ_BATCH_SIZE, NOTIFICATION_RATE_LIMITS } from "./helpers";

export const updatePushToken = mutation({
    args: {
        accessToken: v.string(),
        pushToken: v.string(),
    },
    handler: async (ctx, args) => {
        if (!isExpoPushToken(args.pushToken)) {
            return;
        }

        const userId = await getUserIdFromAccessToken(args.accessToken);

        // M1 FIX: Use by_pushToken index instead of a full table scan.
        // Previously used by_email with an open range which read ALL users.
        const existingUser = await ctx.db
            .query("users")
            .withIndex("by_pushToken", (q) => q.eq("pushToken", args.pushToken))
            .filter((q) => q.neq(q.field("_id"), userId))
            .first();

        if (existingUser) {
            await ctx.db.patch(existingUser._id, { pushToken: undefined });
        }

        await ctx.db.patch(userId, {
            pushToken: args.pushToken,
        });
    },
});

export const clearPushToken = mutation({
    args: {
        accessToken: v.string(),
        pushToken: v.string(),
    },
    handler: async (ctx, args) => {
        if (!isExpoPushToken(args.pushToken)) {
            return;
        }

        const userId = await getUserIdFromAccessToken(args.accessToken);
        const user = await ctx.db.get(userId);
        if (!user || user.pushToken !== args.pushToken) {
            return;
        }

        await ctx.db.patch(userId, {
            pushToken: undefined,
        });
    },
});

export const subscribeToBook = mutation({
    args: {
        accessToken: v.string(),
        bookId: v.id("books"),
        ipAddress: v.optional(v.string()),
        deviceInfo: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await getUserIdFromAccessToken(args.accessToken);
        const subscribeKey = buildRateLimitKey(
            "notification",
            "subscribeToBook",
            userId,
            args.ipAddress
        );
        // H1: DB-backed rate limit
        await assertRateLimit(ctx as any, subscribeKey, NOTIFICATION_RATE_LIMITS.subscribeToBook);

        const existing = await ctx.db
            .query("book_notifications")
            .withIndex("by_userId_bookId", (q) =>
                q.eq("userId", userId).eq("bookId", args.bookId)
            )
            .first();

        if (existing) {
            return;
        }

        await ctx.db.insert("book_notifications", {
            userId,
            bookId: args.bookId,
            createdAt: Date.now(),
        });
    },
});

export const markRead = mutation({
    args: {
        accessToken: v.string(),
        notificationId: v.id("user_notifications"),
    },
    handler: async (ctx, args) => {
        const userId = await getUserIdFromAccessToken(args.accessToken);
        const notification = await ctx.db.get(args.notificationId);
        if (!notification || notification.userId !== userId) {
            throw new Error("Notification not found.");
        }

        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

/**
 * M3: Mark all unread notifications as read.
 * Capped at MARK_ALL_READ_BATCH_SIZE (100) per call to prevent timeouts.
 * Sequential patches (no unbounded Promise.all).
 */
export const markAllRead = mutation({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;
        const unread = await ctx.db
            .query("user_notifications")
            .withIndex("by_userId_isRead", (q) =>
                q.eq("userId", userId).eq("isRead", false)
            )
            .take(MARK_ALL_READ_BATCH_SIZE);

        // L2: Sequential writes are correct (avoids unbounded Promise.all).
        // Capped at MARK_ALL_READ_BATCH_SIZE (100) per call.
        // NOTE: A lastReadAt timestamp approach would eliminate writes entirely
        // and is the recommended long-term solution for high-volume users.
        for (const notification of unread) {
            await ctx.db.patch(notification._id, { isRead: true });
        }
    },
});
