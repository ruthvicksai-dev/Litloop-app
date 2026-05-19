import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/authHelpers";

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
