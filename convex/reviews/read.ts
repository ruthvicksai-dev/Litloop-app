import { v } from "convex/values";
import { query } from "../_generated/server";
import { Id } from "../_generated/dataModel";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";
import { getRatingDistributionFromBook } from "../lib/reviewCounters";

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
