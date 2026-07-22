/**
 * S-03 FIX: Rate limit constants for review mutations.
 * Prevents rapid-fire voting and reporting across many reviews.
 */
export const REVIEW_RATE_LIMITS = {
    vote: {
        limit: 30,
        windowMs: 60 * 60 * 1000, // 30 votes per hour per user
        message: "Too many votes. Please try again later.",
    },
    report: {
        limit: 5,
        windowMs: 60 * 60 * 1000, // 5 reports per hour per user
        message: "Too many reports. Please try again later.",
    },
} as const;
