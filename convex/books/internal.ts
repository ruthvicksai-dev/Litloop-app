import { v } from "convex/values";
import { internalMutation } from "../_generated/server";
import { calculateRankingScore } from "../lib/bookHelpers";
import { normalizeNonNegativeInt, normalizeRating } from "./helpers";

export const internalIncrementBookViews = internalMutation({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.bookId);
        if (!book) return;

        const nextBookViews = normalizeNonNegativeInt(book.bookViews, 0) + 1;

        await ctx.db.patch(args.bookId, {
            bookViews: nextBookViews,
            rankingScore: calculateRankingScore({
                rating: normalizeRating(book.rating),
                bookRentals: normalizeNonNegativeInt(book.bookRentals, 0),
                bookViews: nextBookViews,
            }),
        });
    },
});
