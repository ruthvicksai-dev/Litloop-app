type RateLimitOptions = {
    limit: number;
    windowMs: number;
    message: string;
};

/**
 * DB-backed distributed rate limiter using the `rate_limit_events` table.
 *
 * H1 FIX: Replaces the previous in-memory Map implementation which was
 * non-persistent (reset on Convex cold-start) and non-distributed (not
 * shared across isolate instances or regions).
 *
 * Each rate limit bucket is a single row in `rate_limit_events`, keyed by
 * a composite string. The row is upserted atomically within the Convex
 * mutation context, which serializes writes per document — ensuring
 * correctness without external locking.
 *
 * Usage: `await assertRateLimit(ctx, key, options)` — all callers must await.
 */

export function buildRateLimitKey(
    scope: string,
    action: string,
    ...identifiers: Array<string | number | undefined | null>
) {
    const parts = identifiers
        .filter((part): part is string | number => part !== undefined && part !== null && String(part).trim() !== "")
        .map((part) => String(part));

    return [scope, action, ...parts].join(":");
}

/**
 * Asserts that the rate limit for a given key has not been exceeded.
 * Reads/writes the `rate_limit_events` table atomically.
 * Throws a user-friendly error if the limit is exceeded.
 */
export async function assertRateLimit(
    ctx: { db: any },
    key: string,
    options: RateLimitOptions
) {
    const now = Date.now();

    const existing = await ctx.db
        .query("rate_limit_events")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();

    if (!existing || existing.resetAt <= now) {
        // No bucket or expired — start a fresh window
        if (existing) {
            await ctx.db.patch(existing._id, {
                count: 1,
                resetAt: now + options.windowMs,
            });
        } else {
            await ctx.db.insert("rate_limit_events", {
                key,
                count: 1,
                resetAt: now + options.windowMs,
            });
        }
        return;
    }

    // Active window — check limit
    if (existing.count >= options.limit) {
        throw new Error(options.message);
    }

    // Increment count within current window
    await ctx.db.patch(existing._id, { count: existing.count + 1 });
}

/**
 * Clears the rate limit bucket for a key (e.g., on successful auth).
 */
export async function clearRateLimit(ctx: { db: any }, key: string) {
    const existing = await ctx.db
        .query("rate_limit_events")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();

    if (existing) {
        await ctx.db.delete(existing._id);
    }
}
