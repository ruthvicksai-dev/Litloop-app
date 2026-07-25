import { incrementRatingCountPatch } from "../lib/reviewCounters";

export const VALID_SLOTS: Record<string, number> = {
    "Morning (9 AM - 12 PM)": 9,
    "Midday (12 PM - 3 PM)": 12,
    "Afternoon (3 PM - 6 PM)": 15,
    "Evening (6 PM - 9 PM)": 18,
};

export function getSlotStartHour(timeStr: string): number | null {
    if (timeStr in VALID_SLOTS) return VALID_SLOTS[timeStr];

    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)$/i);
    if (match) {
        let hour = parseInt(match[1], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        return hour;
    }
    return null;
}

export const LATE_FEE_PER_DAY = 3; // ₹3 per day
export const RENTAL_RATE_LIMITS = {
    requestRental: {
        limit: 5,
        windowMs: 30 * 60 * 1000,
        message: "Too many rental requests. Please try again later.",
    },
} as const;

export function daysBetween(dateStr1: string, dateStr2: string): number {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffMs = d2.getTime() - d1.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function safeRatingRollback(
    currentRating: number | undefined,
    currentCount: number | undefined,
    removedRating: number
): { rating: number; ratingCount: number; avgRating: number; totalReviews: number } {
    const safeCurrentRating = typeof currentRating === "number" && Number.isFinite(currentRating) ? currentRating : 0;
    const safeCurrentCount = typeof currentCount === "number" && Number.isFinite(currentCount) ? currentCount : 0;
    const nextCount = Math.max(0, safeCurrentCount - 1);

    if (nextCount === 0) {
        return { rating: 0, ratingCount: 0, avgRating: 0, totalReviews: 0 };
    }

    const nextRating = ((safeCurrentRating * safeCurrentCount) - removedRating) / nextCount;
    return {
        rating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
        ratingCount: nextCount,
        avgRating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
        totalReviews: nextCount,
    };
}

export async function rollbackRentalRatingAndReview(
    ctx: { db: any },
    rental: { _id: any; bookId: any; userRating?: number }
) {
    // Locate any review submitted for this rental
    const review = await ctx.db
        .query("reviews")
        .withIndex("by_rentalId", (q: any) => q.eq("rentalId", rental._id))
        .first();

    const ratingToRollback = rental.userRating ?? review?.rating;

    if (ratingToRollback) {
        const book = await ctx.db.get(rental.bookId);
        if (book) {
            const { rating, ratingCount, avgRating, totalReviews } = safeRatingRollback(
                book.rating,
                book.ratingCount,
                ratingToRollback
            );
            await ctx.db.patch(rental.bookId, {
                rating,
                ratingCount,
                avgRating,
                totalReviews,
                ...incrementRatingCountPatch(book, ratingToRollback, -1),
                ...(review?.isFlagged ? { flaggedCount: Math.max(0, (book.flaggedCount ?? 0) - 1) } : {}),
            });
        }
    }

    if (review) {
        // Clean up review votes
        const votes = await ctx.db
            .query("review_votes")
            .withIndex("by_reviewId", (q: any) => q.eq("reviewId", review._id))
            .take(100);
        for (const vote of votes) {
            await ctx.db.delete(vote._id);
        }

        // Clean up reports for this review
        const reports = await ctx.db
            .query("reports")
            .withIndex("by_targetId", (q: any) => q.eq("targetId", review._id))
            .take(100);
        for (const report of reports) {
            await ctx.db.delete(report._id);
        }

        await ctx.db.delete(review._id);
    }
}
