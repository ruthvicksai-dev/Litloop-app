import { v } from "convex/values";
import { internal } from "./_generated/api";
import {
    internalAction,
    internalMutation,
    internalQuery,
    mutation,
    query,
} from "./_generated/server";
import { getAuthenticatedUser, getUserIdFromAccessToken } from "./lib/authHelpers";
import { assertRateLimit, buildRateLimitKey } from "./lib/rateLimit";

const NOTIFICATION_RATE_LIMITS = {
    subscribeToBook: {
        limit: 10,
        windowMs: 60 * 60 * 1000,
        message: "Too many notification subscriptions. Please try again later.",
    },
} as const;

/** Max notifications to mark-as-read in a single call — protects against timeouts. */
const MARK_ALL_READ_BATCH_SIZE = 100;
const RECONCILE_BOOKS_CURSOR_KEY = "reconcile_available_copies_cursor";
const RECONCILE_BOOKS_BATCH_SIZE = 50;

function isExpoPushToken(token: string) {
    return token.startsWith("ExponentPushToken") || token.startsWith("ExpoPushToken");
}

async function sendPush(
    token: string,
    title: string,
    body: string,
    data?: Record<string, string>
) {
    if (!token || !isExpoPushToken(token)) {
        return;
    }

    const message = {
        to: token,
        sound: "default",
        title,
        body,
        data: data ?? {},
        priority: "high",
        channelId: "default",
    };

    try {
        const response = await fetch("https://exp.host/--/api/v2/push/send", {
            method: "POST",
            headers: {
                Accept: "application/json",
                "Accept-encoding": "gzip, deflate",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(message),
        });

        const payload = await response.json().catch(() => null);

        if (!response.ok) {
            console.error("Expo push request failed:", payload ?? response.statusText);
            return;
        }

        if (payload?.errors?.length) {
            console.error("Expo push request errors:", payload.errors);
        }

        const tickets = Array.isArray(payload?.data)
            ? payload.data
            : payload?.data
                ? [payload.data]
                : [];

        for (const ticket of tickets) {
            if (ticket?.status === "error") {
                console.error("Expo push ticket error:", ticket);
            }
        }
    } catch (error) {
        console.error("Failed to send push notification:", error);
    }
}

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
        await assertRateLimit(ctx, subscribeKey, NOTIFICATION_RATE_LIMITS.subscribeToBook);

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

async function saveAndPushToRecipient(
    ctx: any,
    recipient: { userId: any; pushToken?: string | null } | null,
    title: string,
    body: string,
    type: string,
    dataJson?: string
) {
    if (!recipient) {
        return;
    }

    await ctx.runMutation(internal.notifications.saveNotificationRecord, {
        userId: recipient.userId,
        title,
        body,
        type,
        dataJson,
    });

    if (recipient.pushToken) {
        const data = dataJson
            ? (JSON.parse(dataJson) as Record<string, string>)
            : undefined;
        await sendPush(recipient.pushToken, title, body, data);
    }
}

export const saveNotificationRecord = internalMutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        body: v.string(),
        type: v.string(),
        dataJson: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        await ctx.db.insert("user_notifications", {
            userId: args.userId,
            title: args.title,
            body: args.body,
            type: args.type,
            dataJson: args.dataJson,
            isRead: false,
            createdAt: Date.now(),
        });
    },
});

export const getUserPushRecipient = internalQuery({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (!user) {
            return null;
        }

        return {
            userId: user._id,
            pushToken: user.pushToken ?? null,
        };
    },
});

/**
 * H3 FIX: Use the by_role index instead of a full table scan with .filter().
 * Previously: .filter(q => q.eq(q.field("role"), "admin")) — reads ALL users.
 * Now: .withIndex("by_role", ...) — reads only admin rows directly.
 */
export const getAdminRecipients = internalQuery({
    args: {},
    handler: async (ctx) => {
        const admins = await ctx.db
            .query("users")
            .withIndex("by_role", (q: any) => q.eq("role", "admin"))
            .collect();

        return admins.map((admin) => ({
            userId: admin._id,
            pushToken: admin.pushToken ?? null,
        }));
    },
});

export const getBookSubscriberRecipients = internalQuery({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const subscribers = await ctx.db
            .query("book_notifications")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .collect();

        const recipients = await Promise.all(
            subscribers.map(async (subscriber) => {
                const user = await ctx.db.get(subscriber.userId);
                return {
                    subscriptionId: subscriber._id,
                    userId: user?._id ?? null,
                    pushToken: user?.pushToken ?? null,
                };
            })
        );

        return recipients;
    },
});

export const deleteBookSubscription = internalMutation({
    args: { subscriptionId: v.id("book_notifications") },
    handler: async (ctx, args) => {
        await ctx.db.delete(args.subscriptionId);
    },
});

export const notifyUser = internalAction({
    args: {
        userId: v.id("users"),
        title: v.string(),
        body: v.string(),
        dataJson: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const recipient = await ctx.runQuery(internal.notifications.getUserPushRecipient, {
            userId: args.userId,
        });

        await saveAndPushToRecipient(ctx, recipient, args.title, args.body, "rental", args.dataJson);
    },
});

export const notifyAdminsOfNewRental = internalAction({
    args: { rentalId: v.id("rentals"), bookTitle: v.string(), userName: v.string() },
    handler: async (ctx, args) => {
        const admins = await ctx.runQuery(internal.notifications.getAdminRecipients, {});
        const dataJson = JSON.stringify({ rentalId: args.rentalId, type: "rental" });

        for (const admin of admins) {
            await saveAndPushToRecipient(
                ctx,
                admin,
                "New Rental Request",
                `${args.userName} has requested "${args.bookTitle}".`,
                "rental",
                dataJson
            );
        }
    },
});

export const notifySubscribersOfAvailability = internalAction({
    args: { bookId: v.id("books"), bookTitle: v.string() },
    handler: async (ctx, args) => {
        const subscribers = await ctx.runQuery(internal.notifications.getBookSubscriberRecipients, {
            bookId: args.bookId,
        });
        const dataJson = JSON.stringify({ bookId: args.bookId, type: "book" });

        for (const subscriber of subscribers) {
            await saveAndPushToRecipient(
                ctx,
                subscriber.userId ? subscriber : null,
                "Book Available!",
                `"${args.bookTitle}" is now back in stock.`,
                "book",
                dataJson
            );
            await ctx.runMutation(internal.notifications.deleteBookSubscription, {
                subscriptionId: subscriber.subscriptionId,
            });
        }
    },
});

export const notifyAdminsOfPaymentSubmission = internalAction({
    args: { rentalId: v.id("rentals"), bookTitle: v.string(), userName: v.string(), method: v.string() },
    handler: async (ctx, args) => {
        const admins = await ctx.runQuery(internal.notifications.getAdminRecipients, {});
        const dataJson = JSON.stringify({ rentalId: args.rentalId, type: "rental" });

        for (const admin of admins) {
            await saveAndPushToRecipient(
                ctx,
                admin,
                "Payment Submitted 💰",
                `${args.userName} submitted a ${args.method} payment for "${args.bookTitle}".`,
                "rental",
                dataJson
            );
        }
    },
});

export const notifyAdminsOfPickupScheduled = internalAction({
    args: { rentalId: v.id("rentals"), bookTitle: v.string(), userName: v.string() },
    handler: async (ctx, args) => {
        const admins = await ctx.runQuery(internal.notifications.getAdminRecipients, {});
        const dataJson = JSON.stringify({ rentalId: args.rentalId, type: "rental" });

        for (const admin of admins) {
            await saveAndPushToRecipient(
                ctx,
                admin,
                "Pickup Scheduled 📦",
                `${args.userName} scheduled a pickup for "${args.bookTitle}".`,
                "rental",
                dataJson
            );
        }
    },
});

/**
 * L4: Cleanup old notifications — called by the weekly cron in crons.ts.
 * Deletes user_notifications records older than TTL_DAYS days.
 *
 * M2 FIX: Now uses the by_createdAt index to directly target old records
 * instead of scanning all notifications via the by_userId open-range scan.
 */
export const cleanupOldNotifications = internalMutation({
    args: { ttlDays: v.number() },
    handler: async (ctx, args) => {
        const cutoff = Date.now() - args.ttlDays * 24 * 60 * 60 * 1000;
        // M2 FIX: Use by_createdAt index — skips all recent records at the DB level
        const old = await ctx.db
            .query("user_notifications")
            .withIndex("by_createdAt", (q) => q.lt("createdAt", cutoff))
            .take(500);

        for (const n of old) {
            await ctx.db.delete(n._id);
        }

        return { deleted: old.length };
    },
});

/**
 * L2: Reconcile availableCopies for all books — called by nightly cron.
 *
 * Processes a bounded batch of books per run and persists the next cursor
 * so the cron advances through the catalog instead of repeating page one.
 */
export const reconcileAvailableCopies = internalMutation({
    args: {},
    handler: async (ctx) => {
        const ACTIVE_STATUSES = new Set([
            "requested",
            "delivery_scheduled",
            "delivered",
            "pickup_scheduled",
            "payment_pending",
        ]);

        const state = await ctx.db
            .query("system_state")
            .withIndex("by_key", (q) => q.eq("key", RECONCILE_BOOKS_CURSOR_KEY))
            .first();
        const results = await ctx.db
            .query("books")
            .withIndex("by_createdAt")
            .paginate({
                cursor: state?.value ?? null,
                numItems: RECONCILE_BOOKS_BATCH_SIZE,
            });
        const books = results.page;

        let corrected = 0;

        for (const book of books) {
            const activeRentals = await ctx.db
                .query("rentals")
                .withIndex("by_bookId", (q) => q.eq("bookId", book._id))
                .filter((q) => {
                    const statuses = [...ACTIVE_STATUSES];
                    return q.or(...statuses.map((s) => q.eq(q.field("status"), s)));
                })
                .collect();

            const expected = Math.max(0, book.totalCopies - activeRentals.length);
            if (book.availableCopies !== expected) {
                await ctx.db.patch(book._id, { availableCopies: expected });
                corrected++;
                console.warn(
                    `[Reconcile] Fixed book ${book._id}: was ${book.availableCopies}, now ${expected}`
                );
            }
        }

        const nextCursor = results.isDone ? undefined : results.continueCursor;
        if (state) {
            await ctx.db.patch(state._id, {
                value: nextCursor,
                updatedAt: Date.now(),
            });
        } else {
            await ctx.db.insert("system_state", {
                key: RECONCILE_BOOKS_CURSOR_KEY,
                value: nextCursor,
                updatedAt: Date.now(),
            });
        }

        return {
            scanned: books.length,
            corrected,
            continueCursor: nextCursor ?? null,
            isDone: results.isDone,
        };
    },
});
