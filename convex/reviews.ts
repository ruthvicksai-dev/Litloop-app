import { v } from "convex/values";
import { query } from "./_generated/server";

export const getBookReviews = query({
    args: {
        bookId: v.id("books"),
    },
    handler: async (ctx, args) => {
        // L1: Capped at 50 to prevent unbounded reads for popular books
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .take(50);

        // Sort newest first
        reviews.sort((a, b) => b.createdAt - a.createdAt);

        // Enrich with user info
        const enrichedReviews = await Promise.all(
            reviews.map(async (review) => {
                const user = await ctx.db.get(review.userId);
                return {
                    _id: review._id,
                    rating: review.rating,
                    reviewText: review.reviewText,
                    createdAt: review.createdAt,
                    userName: user?.name ?? "Anonymous",
                    userAvatar: user?.avatarUrl,
                };
            })
        );

        return enrichedReviews;
    },
});

export const getBookReviewSummary = query({
    args: {
        bookId: v.id("books"),
    },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .collect();

        if (reviews.length === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            };
        }

        const distribution: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
        let totalRating = 0;

        for (const review of reviews) {
            totalRating += review.rating;
            const star = Math.round(review.rating);
            if (star >= 1 && star <= 5) {
                distribution[star]++;
            }
        }

        return {
            averageRating: totalRating / reviews.length,
            totalReviews: reviews.length,
            distribution,
        };
    },
});
