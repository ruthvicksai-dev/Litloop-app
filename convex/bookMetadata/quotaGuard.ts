import { v } from "convex/values";
import { internalMutation, internalQuery } from "../_generated/server";

const GOOGLE_BOOKS_DAILY_LIMIT = 900;

/**
 * Returns today's date key in YYYY-MM-DD format (UTC).
 */
function todayKey(): string {
    return new Date().toISOString().slice(0, 10);
}

/**
 * Builds the rate limit key for a given provider and date.
 */
function quotaKey(provider: string): string {
    return `quota:${provider}:${todayKey()}`;
}

/**
 * Internal query: check if the daily quota for a provider is still available.
 */
export const checkQuota = internalQuery({
    args: { provider: v.string() },
    handler: async (ctx, args): Promise<{ allowed: boolean; remaining: number }> => {
        const key = quotaKey(args.provider);
        const entry = await ctx.db
            .query("rate_limit_events")
            .withIndex("by_key", (q) => q.eq("key", key))
            .first();

        const currentCount = entry?.count ?? 0;
        const limit = args.provider === "googleBooks" ? GOOGLE_BOOKS_DAILY_LIMIT : 1000;
        const remaining = Math.max(0, limit - currentCount);

        return {
            allowed: currentCount < limit,
            remaining,
        };
    },
});

/**
 * Internal mutation: increment the daily quota counter for a provider.
 */
export const incrementQuota = internalMutation({
    args: { provider: v.string() },
    handler: async (ctx, args) => {
        const key = quotaKey(args.provider);
        const entry = await ctx.db
            .query("rate_limit_events")
            .withIndex("by_key", (q) => q.eq("key", key))
            .first();

        const now = Date.now();
        // Reset at midnight UTC tomorrow
        const tomorrow = new Date(todayKey());
        tomorrow.setUTCDate(tomorrow.getUTCDate() + 1);
        const resetAt = tomorrow.getTime();

        if (entry) {
            await ctx.db.patch(entry._id, {
                count: entry.count + 1,
                resetAt,
            });
        } else {
            await ctx.db.insert("rate_limit_events", {
                key,
                count: 1,
                resetAt,
            });
        }
    },
});
