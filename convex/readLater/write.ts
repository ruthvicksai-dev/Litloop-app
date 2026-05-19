import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { getAuthenticatedUser } from "../lib/authHelpers";

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
