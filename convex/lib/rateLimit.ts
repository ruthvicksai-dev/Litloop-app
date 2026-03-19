type RateLimitOptions = {
    limit: number;
    windowMs: number;
    message: string;
};

type RateLimitBucket = {
    count: number;
    resetAt: number;
};

/**
 * Rate limiting state. In a Convex environment, this Map lives in the memory
 * of the V8 isolate. While isolates are reused across requests, they are not
 * persistent forever and are not shared across different regions or scaling units.
 *
 * For a production-ready, globally consistent distributed rate limiter,
 * replace this Map with a call to an external service like Upstash Redis
 * using `fetch` or a dedicated library.
 */
const RATE_LIMIT_BUCKETS = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 10000; // Increased for composite keys

/**
 * Prunes expired or excess buckets to maintain memory safety.
 */
function maintenance(now: number) {
    // 1. Prune expired
    for (const [key, bucket] of RATE_LIMIT_BUCKETS.entries()) {
        if (bucket.resetAt <= now) {
            RATE_LIMIT_BUCKETS.delete(key);
        }
    }

    // 2. If still too many, prune the ones that expire soonest
    if (RATE_LIMIT_BUCKETS.size > MAX_BUCKETS) {
        const sortedEntries = [...RATE_LIMIT_BUCKETS.entries()].sort(
            (a, b) => a[1].resetAt - b[1].resetAt
        );

        const toDelete = RATE_LIMIT_BUCKETS.size - MAX_BUCKETS;
        for (let i = 0; i < toDelete; i++) {
            RATE_LIMIT_BUCKETS.delete(sortedEntries[i][0]);
        }
    }
}

/**
 * Builds a composite rate limit key from multiple identifying parts.
 * Example: buildRateLimitKey("auth", "signIn", email, ipAddress)
 * Handles undefined/null parts by filtering them out.
 */
export function buildRateLimitKey(scope: string, action: string, ...identifiers: Array<string | number | undefined | null>) {
    const parts = identifiers
        .filter((part): part is string | number => part !== undefined && part !== null && String(part).trim() !== "")
        .map(part => String(part));

    return [scope, action, ...parts].join(":");
}

/**
 * Asserts that the rate limit for a given key has not been exceeded.
 * Throws an error if the limit is reached.
 */
export function assertRateLimit(key: string, options: RateLimitOptions) {
    const now = Date.now();
    maintenance(now);

    const bucket = RATE_LIMIT_BUCKETS.get(key);

    // If no bucket or it expired, start a new one
    if (!bucket || bucket.resetAt <= now) {
        RATE_LIMIT_BUCKETS.set(key, {
            count: 1,
            resetAt: now + options.windowMs,
        });
        return;
    }

    // If limit reached, throw
    if (bucket.count >= options.limit) {
        throw new Error(options.message);
    }

    // Increment count
    bucket.count += 1;
}

export function clearRateLimit(key: string) {
    RATE_LIMIT_BUCKETS.delete(key);
}
