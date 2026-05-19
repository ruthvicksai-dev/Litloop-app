import { v } from "convex/values";
import { internal } from "../_generated/api";
import {
    internalAction,
    internalMutation,
    internalQuery,
} from "../_generated/server";
import { RECONCILE_BOOKS_BATCH_SIZE, RECONCILE_BOOKS_CURSOR_KEY, sendPush } from "./helpers";

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

    await ctx.runMutation(internal.notifications.internal.saveNotificationRecord, {
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
            .take(20);

        return admins.map((admin: any) => ({
            userId: admin._id,
            pushToken: admin.pushToken ?? null,
        }));
    },
});

/**
 * B-03 FIX: Replaced unbounded .collect() with .take(200) to prevent
 * timeouts when a popular book accumulates hundreds of subscribers.
 */
export const getBookSubscriberRecipients = internalQuery({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const subscribers = await ctx.db
            .query("book_notifications")
            .withIndex("by_bookId", (q: any) => q.eq("bookId", args.bookId))
            .take(200);

        const recipients = await Promise.all(
            subscribers.map(async (subscriber: any) => {
                const user = await ctx.db.get(subscriber.userId);
                return {
                    subscriptionId: subscriber._id,
                    userId: user?._id ?? null,
                    pushToken: (user as any)?.pushToken ?? null,
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
        const recipient = await ctx.runQuery(internal.notifications.internal.getUserPushRecipient, {
            userId: args.userId,
        });

        await saveAndPushToRecipient(ctx, recipient as any, args.title, args.body, "rental", args.dataJson);
    },
});

export const notifyAdminsOfNewRental = internalAction({
    args: { rentalId: v.id("rentals"), bookTitle: v.string(), userName: v.string() },
    handler: async (ctx, args) => {
        const admins = await ctx.runQuery(internal.notifications.internal.getAdminRecipients, {});
        const dataJson = JSON.stringify({ rentalId: args.rentalId, type: "rental" });

        for (const admin of admins as any[]) {
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
        const subscribers = await ctx.runQuery(internal.notifications.internal.getBookSubscriberRecipients, {
            bookId: args.bookId,
        });
        const dataJson = JSON.stringify({ bookId: args.bookId, type: "book" });

        for (const subscriber of subscribers as any[]) {
            await saveAndPushToRecipient(
                ctx,
                subscriber.userId ? subscriber : null,
                "Book Available!",
                `"${args.bookTitle}" is now back in stock.`,
                "book",
                dataJson
            );
            await ctx.runMutation(internal.notifications.internal.deleteBookSubscription, {
                subscriptionId: subscriber.subscriptionId,
            });
        }
    },
});

export const notifyAdminsOfPaymentSubmission = internalAction({
    args: { rentalId: v.id("rentals"), bookTitle: v.string(), userName: v.string(), method: v.string() },
    handler: async (ctx, args) => {
        const admins = await ctx.runQuery(internal.notifications.internal.getAdminRecipients, {});
        const dataJson = JSON.stringify({ rentalId: args.rentalId, type: "rental" });

        for (const admin of admins as any[]) {
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
        const admins = await ctx.runQuery(internal.notifications.internal.getAdminRecipients, {});
        const dataJson = JSON.stringify({ rentalId: args.rentalId, type: "rental" });

        for (const admin of admins as any[]) {
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
            .withIndex("by_createdAt", (q: any) => q.lt("createdAt", cutoff))
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
            .withIndex("by_key", (q: any) => q.eq("key", RECONCILE_BOOKS_CURSOR_KEY))
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

        for (const book of books as any[]) {
            // B-04 FIX: Replaced unbounded .collect() with .take(50).
            // A book can't have more active rentals than totalCopies (typically <10).
            // This caps reads at 50 per book × 50 books = 2500 max per cron run.
            const activeRentals = await ctx.db
                .query("rentals")
                .withIndex("by_bookId", (q: any) => q.eq("bookId", book._id))
                .filter((q: any) => {
                    const statuses = [...ACTIVE_STATUSES];
                    return q.or(...statuses.map((s) => q.eq(q.field("status"), s)));
                })
                .take(50);

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
