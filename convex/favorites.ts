import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { mapBookForClient } from "./books";
import { getAuthenticatedUser, getUserIdFromAccessToken } from "./lib/authHelpers";

export const toggleFavorite = mutation({
    args: { accessToken: v.string(), bookId: v.id("books") },
    handler: async (ctx, args) => {
        // H2: Use getAuthenticatedUser so revoked sessions are rejected
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;

        // Check if favorite exists
        const existing = await ctx.db
            .query("favorites")
            .withIndex("by_user_book", (q) =>
                q.eq("userId", userId).eq("bookId", args.bookId)
            )
            .first();

        if (existing) {
            // Un-favorite
            await ctx.db.delete(existing._id);
            return false;
        }

        // M2: Validate book exists before adding to favorites
        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");

        // Favorite
        await ctx.db.insert("favorites", {
            userId,
            bookId: args.bookId,
            createdAt: Date.now(),
        });
        return true;
    },
});

export const getUserFavoriteIds = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            return [];
        }

        // L2: Capped to prevent unbounded reads
        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(200);

        return favorites.map(f => f.bookId);
    },
});

export const getUserFavoriteBooks = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            return [];
        }

        // L2: Capped to prevent unbounded reads
        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc") // newest favorites first
            .take(100);

        // Fetch each book and map it
        const books = [];
        for (const fav of favorites) {
            const bookDoc = await ctx.db.get(fav.bookId);
            if (bookDoc) {
                const mapped = await mapBookForClient(ctx, bookDoc);
                books.push(mapped);
            }
        }
        return books;
    },
});

export const getUserFavoriteCount = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            return 0;
        }

        // L3: Capped to prevent unbounded reads
        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(200);

        return favorites.length;
    },
});
