import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { assertRateLimit, buildRateLimitKey } from "./lib/rateLimit";

const NOTIFICATION_RATE_LIMITS = {
    subscribeToBook: {
        limit: 10,
        windowMs: 60 * 60 * 1000,
        message: "Too many notification subscriptions. Please try again later.",
    },
} as const;

/**
 * Sends a push notification via Expo's Push API AND saves it to the in-app feed.
 */
async function sendPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
) {
    if (!token || !token.startsWith("ExponentPushToken")) {
        return;
    }

    const message = {
        to: token,
        sound: "default",
        title,
        body,
        data: data ?? {},
    };

    try {
        await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });
    } catch (error) {
        console.error("Failed to send push notification:", error);
    }
}

// ─── User Push Token ─────────────────────────────────────────────────────────

export const updatePushToken = mutation({
    args: {
        userId: v.id("users"),
        pushToken: v.string()
    },
    handler: async (ctx, args) => {
        if (!args.pushToken.startsWith("ExponentPushToken")) {
            return;
        }
        await ctx.db.patch(args.userId, {
            pushToken: args.pushToken,
        });
    },
});

// ─── Book Availability Subscription ──────────────────────────────────────────

export const subscribeToBook = mutation({
    args: {
        userId: v.id("users"),
        bookId: v.id("books"),
    },
    handler: async (ctx, args) => {
        const subscribeKey = buildRateLimitKey(
            "notification",
            "subscribeToBook",
            args.userId
        );
        assertRateLimit(subscribeKey, NOTIFICATION_RATE_LIMITS.subscribeToBook);

        const existing = await ctx.db
            .query("book_notifications")
            .withIndex("by_userId_bookId", (q) =>
                q.eq("userId", args.userId).eq("bookId", args.bookId)
            )
            .first();
        if (existing) return;
        await ctx.db.insert("book_notifications", {
            userId: args.userId,
            bookId: args.bookId,
            createdAt: Date.now(),
        });
    },
});

// ─── In-App Notification Feed ─────────────────────────────────────────────────

/** Get all notifications for a user, newest first. */
export const getNotifications = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const notifications = await ctx.db
            .query("user_notifications")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .order("desc")
            .collect();
        return notifications;
    },
});

/** Count of unread notifications — used for badge. */
export const getUnreadCount = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("user_notifications")
            .withIndex("by_userId_isRead", (q) =>
                q.eq("userId", args.userId).eq("isRead", false)
            )
            .collect();
        return unread.length;
    },
});

/** Mark a single notification as read. */
export const markRead = mutation({
    args: { notificationId: v.id("user_notifications") },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

/** Mark all notifications as read for a user. */
export const markAllRead = mutation({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const unread = await ctx.db
            .query("user_notifications")
            .withIndex("by_userId_isRead", (q) =>
                q.eq("userId", args.userId).eq("isRead", false)
            )
            .collect();
        await Promise.all(unread.map((n) => ctx.db.patch(n._id, { isRead: true })));
    },
});

// ─── Internal: Save + Push ────────────────────────────────────────────────────

/**
 * Internal helper: saves to in-app feed AND sends push.
 */
async function saveAndPush(
    ctx: any,
    userId: any,
    title: string,
    body: string,
    type: string,
    dataJson?: string
) {
    // Save to in-app feed
    await ctx.db.insert("user_notifications", {
        userId,
        title,
        body,
        type,
        dataJson,
        isRead: false,
        createdAt: Date.now(),
    });

    // Send push notification
    const user = await ctx.db.get(userId);
    if (user?.pushToken) {
        const data = dataJson
            ? (JSON.parse(dataJson) as Record<string, string>)
            : undefined;
        await sendPush(user.pushToken, title, body, data);
    }
}

/** Notify a specific user (rental status updates). */
export const notifyUser = internalMutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        body: v.string(),
        dataJson: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await saveAndPush(ctx, args.userId, args.title, args.body, "rental", args.dataJson);
    },
});

/** Notifies all admin users about a new rental. */
export const notifyAdminsOfNewRental = internalMutation({
    args: { rentalId: v.id("rentals"), bookTitle: v.string(), userName: v.string() },
    handler: async (ctx, args) => {
        const admins = await ctx.db
            .query("users")
            .filter((q: any) => q.eq(q.field("role"), "admin"))
            .collect();

        const dataJson = JSON.stringify({ rentalId: args.rentalId, type: "rental" });

        for (const admin of admins) {
            await saveAndPush(
                ctx,
                admin._id,
                "New Rental Request 📚",
                `${args.userName} has requested "${args.bookTitle}".`,
                "rental",
                dataJson
            );
        }
    },
});

/** Notifies all subscribers that a book is now available. */
export const notifySubscribersOfAvailability = internalMutation({
    args: { bookId: v.id("books"), bookTitle: v.string() },
    handler: async (ctx, args) => {
        const subscribers = await ctx.db
            .query("book_notifications")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .collect();

        const dataJson = JSON.stringify({ bookId: args.bookId, type: "book" });

        for (const sub of subscribers) {
            await saveAndPush(
                ctx,
                sub.userId,
                "Book Available! ✨",
                `"${args.bookTitle}" is now back in stock.`,
                "book",
                dataJson
            );
            await ctx.db.delete(sub._id);
        }
    },
});
