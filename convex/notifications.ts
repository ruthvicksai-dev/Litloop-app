import { v } from "convex/values";
import { internalMutation, mutation } from "./_generated/server";

/**
 * Sends a push notification via Expo's Push API.
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

/**
 * Updates the current user's push token.
 */
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

/**
 * Subscribe a user to be notified when a book becomes available.
 */
export const subscribeToBook = mutation({
    args: {
        userId: v.id("users"),
        bookId: v.id("books"),
    },
    handler: async (ctx, args) => {
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

/**
 * Internal mutation to notify a specific user.
 * data is passed as a JSON string to avoid v.any() validator issues.
 */
export const notifyUser = internalMutation({
    args: {
        userId: v.id("users"),
        title: v.string(),
        body: v.string(),
        dataJson: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const user = await ctx.db.get(args.userId);
        if (user?.pushToken) {
            const data = args.dataJson
                ? (JSON.parse(args.dataJson) as Record<string, string>)
                : undefined;
            await sendPush(user.pushToken, args.title, args.body, data);
        }
    },
});

/**
 * Notifies all admin users about a new rental.
 */
export const notifyAdminsOfNewRental = internalMutation({
    args: { rentalId: v.id("rentals"), bookTitle: v.string(), userName: v.string() },
    handler: async (ctx, args) => {
        const admins = await ctx.db
            .query("users")
            .filter((q) => q.eq(q.field("role"), "admin"))
            .collect();

        for (const admin of admins) {
            if (admin.pushToken) {
                await sendPush(
                    admin.pushToken,
                    "New Rental Request 📚",
                    `${args.userName} has requested "${args.bookTitle}".`,
                    { rentalId: args.rentalId, type: "rental" }
                );
            }
        }
    },
});

/**
 * Notifies all subscribers that a book is now available.
 */
export const notifySubscribersOfAvailability = internalMutation({
    args: { bookId: v.id("books"), bookTitle: v.string() },
    handler: async (ctx, args) => {
        const subscribers = await ctx.db
            .query("book_notifications")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .collect();

        for (const sub of subscribers) {
            const user = await ctx.db.get(sub.userId);
            if (user?.pushToken) {
                await sendPush(
                    user.pushToken,
                    "Book Available! ✨",
                    `"${args.bookTitle}" is now back in stock.`,
                    { bookId: args.bookId, type: "book" }
                );
            }
            await ctx.db.delete(sub._id);
        }
    },
});
