import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { mapBookForClient } from "./books";
import { getAuthenticatedUser, getUserIdFromAccessToken } from "./lib/authHelpers";

export const toggleReadLater = mutation({
    args: { accessToken: v.string(), bookId: v.id("books") },
    handler: async (ctx, args) => {
        // H2: Use getAuthenticatedUser so revoked sessions are rejected
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;

        // Check if read later exists
        const existing = await ctx.db
            .query("read_later")
            .withIndex("by_user_book", (q) =>
                q.eq("userId", userId).eq("bookId", args.bookId)
            )
            .first();

        if (existing) {
            // Remove from read later
            await ctx.db.delete(existing._id);
            return false;
        }

        // M2: Validate book exists before adding to read later
        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");

        // Add to read later
        await ctx.db.insert("read_later", {
            userId,
            bookId: args.bookId,
            createdAt: Date.now(),
        });
        return true;
    },
});

export const getUserReadLaterIds = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            return [];
        }

        // L2: Capped to prevent unbounded reads
        const readLaterItems = await ctx.db
            .query("read_later")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(200);

        return readLaterItems.map(item => item.bookId);
    },
});

export const getUserReadLaterBooks = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            return [];
        }

        // L2: Capped to prevent unbounded reads
        const readLaterItems = await ctx.db
            .query("read_later")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc") // newest first
            .take(100);

        // Fetch each book and map it
        const books = [];
        for (const item of readLaterItems) {
            const bookDoc = await ctx.db.get(item.bookId);
            if (bookDoc) {
                const mapped = await mapBookForClient(ctx, bookDoc);
                books.push(mapped);
            }
        }
        return books;
    },
});

export const getUserReadLaterCount = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            return 0;
        }

        // L3: Capped to prevent unbounded reads
        const readLaterItems = await ctx.db
            .query("read_later")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(200);

        return readLaterItems.length;
    },
});
