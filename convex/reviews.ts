import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { assertAdmin, getAuthenticatedUser } from "./lib/authHelpers";
import {
    getRatingCountField,
    getRatingDistributionFromBook,
    incrementRatingCountPatch,
    moveRatingCountPatch,
} from "./lib/reviewCounters";

const ADMIN_FLAGGED_REVIEWS_LIMIT = 100;

export const getBookReviews = query({
    args: {
        bookId: v.id("books"),
        accessToken: v.optional(v.string()),
        limit: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        // L1: Capped at limit or 50 to prevent unbounded reads for popular books
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .take(args.limit ?? 50);

        // Sort newest first
        reviews.sort((a, b) => b.createdAt - a.createdAt);

        let callerId: Id<"users"> | null = null;
        if (args.accessToken) {
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
        const book = await ctx.db.get(args.bookId);
        if (!book) {
            return {
                averageRating: 0,
                totalReviews: 0,
                distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            };
        }

        const totalReviews = book.totalReviews ?? book.ratingCount ?? 0;
        const averageRating = book.avgRating ?? book.rating ?? 0;

        if (totalReviews === 0) {
            return {
                averageRating: 0,
                totalReviews: 0,
                distribution: { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 },
            };
        }

        return {
            averageRating,
            totalReviews,
            distribution: getRatingDistributionFromBook(book),
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

export const getReviewsByBook = query({
    args: { bookId: v.id("books") },
    handler: async (ctx, args) => {
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .take(50);

        const flagged = await ctx.db
            .query("reviews")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .filter((q) => q.eq(q.field("isFlagged"), true))
            .take(25);

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
            flaggedReviews: await Promise.all(flagged.map(async (r) => {
                const user = await ctx.db.get(r.userId);
                return {
                    ...r,
                    userName: user?.name ?? "Unknown",
                    userAvatar: user?.avatarUrl,
                };
            })),
        };
    },
});

export const getAllFlaggedReviews = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const flagged = await ctx.db
            .query("reviews")
            .withIndex("by_isFlagged", (q) => q.eq("isFlagged", true))
            .take(ADMIN_FLAGGED_REVIEWS_LIMIT);

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
