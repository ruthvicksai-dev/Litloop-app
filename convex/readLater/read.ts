import { v } from "convex/values";
import { Id } from "../_generated/dataModel";
import { query } from "../_generated/server";
import { getUserIdFromAccessToken } from "../lib/authHelpers";
import { mapBookForClient } from "../lib/bookHelpers";

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
                const mapped = await mapBookForClient(ctx as any, bookDoc);
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
