import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

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

export const reportReview = mutation({
    args: {
        reviewId: v.id("reviews"),
        reason: v.string(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        // We use the same hacky approach to get the auth user as the rest of the file
        // Or in this case we'll just import getAuthenticatedUser from lib/authHelpers if it exists
        // Wait, review.ts doesn't import getAuthenticatedUser. Let me just use a simpler check:
        const { getAuthenticatedUser } = require("./lib/authHelpers");
        let caller;
        try {
            caller = await getAuthenticatedUser(ctx, args.accessToken);
        } catch (error) {
            throw new Error("Must be logged in to report a review.");
        }

        const review = await ctx.db.get(args.reviewId);
        if (!review) throw new Error("Review not found");

        if (review.userId === caller._id) {
            throw new Error("You cannot report your own review.");
        }

        // Prevent duplicate reports from the same user for the same review pending review
        const existingReport = await ctx.db
            .query("reports")
            .withIndex("by_reporterId", (q) => q.eq("reporterId", caller._id))
            .filter((q) => q.eq(q.field("targetId"), args.reviewId))
            .first();

        if (existingReport && existingReport.status === "pending") {
            throw new Error("You have already reported this review.");
        }

        await ctx.db.insert("reports", {
            reporterId: caller._id,
            targetType: "review",
            targetId: args.reviewId,
            reason: args.reason,
            status: "pending",
            createdAt: Date.now(),
        });

        return { success: true };
    },
});
