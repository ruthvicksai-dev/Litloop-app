import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { getUserIdFromAccessToken } from "../lib/authHelpers";
import { mapBookForClient } from "../lib/bookHelpers";

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
                const mapped = await mapBookForClient(ctx as any, bookDoc);
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
