import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { mapBookForClient } from "./books";
import { verifyToken } from "./lib/jwt";

function getJwtSecret(): string {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set.");
    }
    return secret;
}

async function getUserIdFromAccessToken(accessToken: string): Promise<Id<"users">> {
    const secret = getJwtSecret();
    const payload = await verifyToken(accessToken, secret);
    if (payload.type !== "access") {
        throw new Error("Invalid token type.");
    }
    return payload.sub as Id<"users">;
}

export const toggleReadLater = mutation({
    args: { accessToken: v.string(), bookId: v.id("books") },
    handler: async (ctx, args) => {
        let userId: Id<"users">;
        try {
            userId = await getUserIdFromAccessToken(args.accessToken);
        } catch {
            throw new Error("Unauthenticated");
        }

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
        } else {
            // Add to read later
            await ctx.db.insert("read_later", {
                userId,
                bookId: args.bookId,
                createdAt: Date.now(),
            });
            return true;
        }
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

        const readLaterItems = await ctx.db
            .query("read_later")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .collect();

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

        const readLaterItems = await ctx.db
            .query("read_later")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .order("desc") // newest first
            .collect();

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
