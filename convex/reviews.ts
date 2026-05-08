import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";

export const getBookReviews = query({
    args: {
        bookId: v.id("books"),
        accessToken: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        // L1: Capped at 50 to prevent unbounded reads for popular books
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .take(50);

        // Sort newest first
        reviews.sort((a, b) => b.createdAt - a.createdAt);

        let callerId: Id<"users"> | null = null;
        if (args.accessToken) {
            const { getAuthenticatedUser } = require("./lib/authHelpers");
            try {
                const user = await getAuthenticatedUser(ctx, args.accessToken);
                callerId = user._id;
            } catch (e) {
                // Ignore auth error for read-only query
            }
        }

        // Enrich with user info
        const enrichedReviews = await Promise.all(
            reviews.map(async (review) => {
                const user = await ctx.db.get(review.userId);
                
                let userVote: "helpful" | "unhelpful" | null = null;
                if (callerId) {
                    const vote = await ctx.db
                        .query("review_votes")
                        .withIndex("by_user_review", (q) => q.eq("userId", callerId!).eq("reviewId", review._id))
                        .first();
                    userVote = vote?.voteType ?? null;
                }

                return {
                    _id: review._id,
                    rating: review.rating,
                    reviewText: review.reviewText,
                    createdAt: review.createdAt,
                    userName: user?.name ?? "Anonymous",
                    userAvatar: user?.avatarUrl,
                    userId: review.userId,
                    rentalId: review.rentalId,
                    helpfulCount: review.helpfulCount ?? 0,
                    unhelpfulCount: review.unhelpfulCount ?? 0,
                    userVote,
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

export const updateReview = mutation({
    args: {
        reviewId: v.id("reviews"),
        rating: v.number(),
        reviewText: v.optional(v.string()),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const { getAuthenticatedUser } = require("./lib/authHelpers");
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        
        const review = await ctx.db.get(args.reviewId);
        if (!review) throw new Error("Review not found");
        if (review.userId !== user._id) throw new Error("Unauthorized");

        const book = await ctx.db.get(review.bookId);
        if (book && review.rating !== args.rating) {
            // Rollback old rating and add new one
            const currentRating = book.rating ?? 0;
            const currentCount = book.ratingCount ?? 0;
            
            // New rating = ((sum - old) + new) / count
            const nextRating = ((currentRating * currentCount) - review.rating + args.rating) / currentCount;
            
            await ctx.db.patch(review.bookId, {
                rating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
                avgRating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
            });
        }

        await ctx.db.patch(args.reviewId, {
            rating: args.rating,
            reviewText: args.reviewText?.trim() || undefined,
        });

        return { success: true };
    },
});

export const deleteReview = mutation({
    args: {
        reviewId: v.id("reviews"),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const { getAuthenticatedUser } = require("./lib/authHelpers");
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        const review = await ctx.db.get(args.reviewId);
        if (!review) throw new Error("Review not found");
        if (review.userId !== user._id && user.role !== "admin") throw new Error("Unauthorized");

        const book = await ctx.db.get(review.bookId);
        if (book) {
            const safeCurrentRating = typeof book.rating === "number" && Number.isFinite(book.rating) ? book.rating : 0;
            const safeCurrentCount = typeof book.ratingCount === "number" && Number.isFinite(book.ratingCount) ? book.ratingCount : 0;
            const nextCount = Math.max(0, safeCurrentCount - 1);

            if (nextCount === 0) {
                await ctx.db.patch(review.bookId, { 
                    rating: 0, 
                    ratingCount: 0,
                    avgRating: 0,
                    totalReviews: 0,
                    flaggedCount: Math.max(0, (book.flaggedCount ?? 0) - (review.isFlagged ? 1 : 0)),
                });
            } else {
                const nextRating = ((safeCurrentRating * safeCurrentCount) - review.rating) / nextCount;
                await ctx.db.patch(review.bookId, {
                    rating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
                    ratingCount: nextCount,
                    avgRating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
                    totalReviews: nextCount,
                    flaggedCount: Math.max(0, (book.flaggedCount ?? 0) - (review.isFlagged ? 1 : 0)),
                });
            }
        }

        await ctx.db.delete(args.reviewId);
        
        // Also clean up any reports for this review
        const reports = await ctx.db
            .query("reports")
            .withIndex("by_targetId", (q) => q.eq("targetId", args.reviewId))
            .collect();
        for (const report of reports) {
            await ctx.db.delete(report._id);
        }

        return { success: true };
    },
});

export const getReviewsByBook = query({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .collect();

        // Sort by createdAt desc
        const sorted = reviews.sort((a, b) => b.createdAt - a.createdAt);

        const enriched = await Promise.all(sorted.map(async (r) => {
            const user = await ctx.db.get(r.userId);
            return {
                ...r,
                userName: user?.name ?? "Unknown",
                userAvatar: user?.avatarUrl,
            };
        }));

        return {
            recentReviews: enriched.slice(0, 10),
            flaggedReviews: enriched.filter(r => r.isFlagged),
        };
    },
});

export const getAllFlaggedReviews = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const { assertAdmin } = require("./lib/authHelpers");
        await assertAdmin(ctx, args.accessToken);

        const flagged = await ctx.db
            .query("reviews")
            .withIndex("by_isFlagged", (q) => q.eq("isFlagged", true))
            .collect();

        return Promise.all(flagged.map(async (r) => {
            const user = await ctx.db.get(r.userId);
            const book = await ctx.db.get(r.bookId);
            return {
                ...r,
                userName: user?.name ?? "Unknown",
                userAvatar: user?.avatarUrl,
                bookTitle: book?.title ?? "Unknown Book",
            };
        }));
    },
});

export const flagReview = mutation({
    args: { reviewId: v.id("reviews"), accessToken: v.string() },
    handler: async (ctx, args) => {
        const { assertAdmin } = require("./lib/authHelpers");
        await assertAdmin(ctx, args.accessToken);

        const review = await ctx.db.get(args.reviewId);
        if (!review) throw new Error("Review not found");
        if (review.isFlagged) return { success: true };

        await ctx.db.patch(args.reviewId, { isFlagged: true });

        const book = await ctx.db.get(review.bookId);
        if (book) {
            await ctx.db.patch(review.bookId, {
                flaggedCount: (book.flaggedCount ?? 0) + 1,
            });
        }

        return { success: true };
    },
});

export const unflagReview = mutation({
    args: { reviewId: v.id("reviews"), accessToken: v.string() },
    handler: async (ctx, args) => {
        const { assertAdmin } = require("./lib/authHelpers");
        await assertAdmin(ctx, args.accessToken);

        const review = await ctx.db.get(args.reviewId);
        if (!review) throw new Error("Review not found");
        if (!review.isFlagged) return { success: true };

        await ctx.db.patch(args.reviewId, { isFlagged: false });

        const book = await ctx.db.get(review.bookId);
        if (book) {
            await ctx.db.patch(review.bookId, {
                flaggedCount: Math.max(0, (book.flaggedCount ?? 0) - 1),
            });
        }

        return { success: true };
    },
});

export const voteReview = mutation({
    args: {
        reviewId: v.id("reviews"),
        voteType: v.union(v.literal("helpful"), v.literal("unhelpful")),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const { getAuthenticatedUser } = require("./lib/authHelpers");
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        const review = await ctx.db.get(args.reviewId);
        if (!review) throw new Error("Review not found");

        const existingVote = await ctx.db
            .query("review_votes")
            .withIndex("by_user_review", (q) => q.eq("userId", user._id).eq("reviewId", args.reviewId))
            .first();

        if (existingVote) {
            if (existingVote.voteType === args.voteType) {
                // Remove vote if tapping the same button
                await ctx.db.delete(existingVote._id);
                const field = args.voteType === "helpful" ? "helpfulCount" : "unhelpfulCount";
                const currentCount = (review as any)[field] ?? 0;
                await ctx.db.patch(args.reviewId, { [field]: Math.max(0, currentCount - 1) });
                return { success: true, removed: true };
            } else {
                // Change vote type
                const oldField = existingVote.voteType === "helpful" ? "helpfulCount" : "unhelpfulCount";
                const newField = args.voteType === "helpful" ? "helpfulCount" : "unhelpfulCount";
                
                await ctx.db.patch(existingVote._id, { voteType: args.voteType });
                await ctx.db.patch(args.reviewId, {
                    [oldField]: Math.max(0, ((review as any)[oldField] ?? 0) - 1),
                    [newField]: ((review as any)[newField] ?? 0) + 1,
                });
                return { success: true, changed: true };
            }
        }

        // New vote
        await ctx.db.insert("review_votes", {
            userId: user._id,
            reviewId: args.reviewId,
            voteType: args.voteType,
            createdAt: Date.now(),
        });

        const field = args.voteType === "helpful" ? "helpfulCount" : "unhelpfulCount";
        await ctx.db.patch(args.reviewId, { [field]: ((review as any)[field] ?? 0) + 1 });

        return { success: true };
    },
});
