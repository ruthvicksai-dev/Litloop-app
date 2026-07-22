import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation } from "../_generated/server";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";
import { assertRateLimit, buildRateLimitKey } from "../lib/rateLimit";
import {
    getRatingCountField,
    incrementRatingCountPatch,
    moveRatingCountPatch,
} from "../lib/reviewCounters";
import { REVIEW_RATE_LIMITS } from "./helpers";

export const reportReview = mutation({
    args: {
        reviewId: v.id("reviews"),
        reason: v.string(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        let caller;
        try {
            caller = await getAuthenticatedUser(ctx, args.accessToken);
        } catch (error) {
            throw new Error("Must be logged in to report a review.");
        }

        // S-03 FIX: Rate limit reports to prevent spam
        const reportKey = buildRateLimitKey("review", "report", caller._id);
        await assertRateLimit(ctx, reportKey, REVIEW_RATE_LIMITS.report);

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
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        // S-06 FIX: Validate rating bounds to prevent aggregate corruption
        if (!Number.isFinite(args.rating) || args.rating < 1 || args.rating > 5) {
            throw new Error("Rating must be between 1 and 5.");
        }
        
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
                ...moveRatingCountPatch(book, review.rating, args.rating),
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
                    rating1Count: 0,
                    rating2Count: 0,
                    rating3Count: 0,
                    rating4Count: 0,
                    rating5Count: 0,
                    flaggedCount: Math.max(0, (book.flaggedCount ?? 0) - (review.isFlagged ? 1 : 0)),
                });
            } else {
                const nextRating = ((safeCurrentRating * safeCurrentCount) - review.rating) / nextCount;
                await ctx.db.patch(review.bookId, {
                    rating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
                    ratingCount: nextCount,
                    avgRating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
                    totalReviews: nextCount,
                    ...incrementRatingCountPatch(book, review.rating, -1),
                    flaggedCount: Math.max(0, (book.flaggedCount ?? 0) - (review.isFlagged ? 1 : 0)),
                });
            }
        }

        await ctx.db.delete(args.reviewId);
        
        // Also clean up any reports for this review
        const reports = await ctx.db
            .query("reports")
            .withIndex("by_targetId", (q) => q.eq("targetId", args.reviewId))
            .take(100);
        for (const report of reports) {
            await ctx.db.delete(report._id);
        }

        return { success: true };
    },
});

export const rebuildBookReviewCounters = mutation({
    args: {
        accessToken: v.string(),
        bookId: v.id("books"),
        paginationOpts: paginationOptsValidator,
        reset: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const stateKey = `book_review_counters_${args.bookId}`;
        const existingState = await ctx.db
            .query("system_state")
            .withIndex("by_key", (q) => q.eq("key", stateKey))
            .first();

        if (args.reset && existingState) {
            await ctx.db.delete(existingState._id);
        }

        const state = args.reset
            ? null
            : existingState?.value
                ? JSON.parse(existingState.value)
                : null;
        const nextState = state ?? {
            cursor: null,
            totalReviews: 0,
            ratingTotal: 0,
            rating1Count: 0,
            rating2Count: 0,
            rating3Count: 0,
            rating4Count: 0,
            rating5Count: 0,
            flaggedCount: 0,
        };

        const results = await ctx.db
            .query("reviews")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .paginate({
                ...args.paginationOpts,
                cursor: nextState.cursor,
            });

        for (const review of results.page) {
            nextState.totalReviews += 1;
            nextState.ratingTotal += review.rating;
            nextState[getRatingCountField(review.rating)] += 1;
            if (review.isFlagged) {
                nextState.flaggedCount += 1;
            }
        }

        if (results.isDone) {
            const averageRating =
                nextState.totalReviews > 0
                    ? nextState.ratingTotal / nextState.totalReviews
                    : 0;
            await ctx.db.patch(args.bookId, {
                rating: averageRating,
                avgRating: averageRating,
                ratingCount: nextState.totalReviews,
                totalReviews: nextState.totalReviews,
                rating1Count: nextState.rating1Count,
                rating2Count: nextState.rating2Count,
                rating3Count: nextState.rating3Count,
                rating4Count: nextState.rating4Count,
                rating5Count: nextState.rating5Count,
                flaggedCount: nextState.flaggedCount,
            });

            const savedState = await ctx.db
                .query("system_state")
                .withIndex("by_key", (q) => q.eq("key", stateKey))
                .first();
            if (savedState) {
                await ctx.db.delete(savedState._id);
            }
        } else {
            nextState.cursor = results.continueCursor;
            const payload = JSON.stringify(nextState);
            const savedState = await ctx.db
                .query("system_state")
                .withIndex("by_key", (q) => q.eq("key", stateKey))
                .first();

            if (savedState) {
                await ctx.db.patch(savedState._id, {
                    value: payload,
                    updatedAt: Date.now(),
                });
            } else {
                await ctx.db.insert("system_state", {
                    key: stateKey,
                    value: payload,
                    updatedAt: Date.now(),
                });
            }
        }

        return {
            scanned: results.page.length,
            totals: {
                totalReviews: nextState.totalReviews,
                rating1Count: nextState.rating1Count,
                rating2Count: nextState.rating2Count,
                rating3Count: nextState.rating3Count,
                rating4Count: nextState.rating4Count,
                rating5Count: nextState.rating5Count,
                flaggedCount: nextState.flaggedCount,
            },
            isDone: results.isDone,
        };
    },
});

export const flagReview = mutation({
    args: { reviewId: v.id("reviews"), accessToken: v.string() },
    handler: async (ctx, args) => {
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
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        // S-03 FIX: Rate limit votes to prevent rapid-fire voting across reviews
        const voteKey = buildRateLimitKey("review", "vote", user._id);
        await assertRateLimit(ctx, voteKey, REVIEW_RATE_LIMITS.vote);

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
