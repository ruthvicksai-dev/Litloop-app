type RateLimitOptions = {
    limit: number;
    windowMs: number;
    message: string;
};

type RateLimitBucket = {
    count: number;
    resetAt: number;
};

const RATE_LIMIT_BUCKETS = new Map<string, RateLimitBucket>();
const MAX_BUCKETS = 5000;

function pruneExpiredBuckets(now: number) {
    for (const [key, bucket] of RATE_LIMIT_BUCKETS.entries()) {
        if (bucket.resetAt <= now) {
            RATE_LIMIT_BUCKETS.delete(key);
        }
    }
}

function pruneOverflowBuckets() {
    if (RATE_LIMIT_BUCKETS.size <= MAX_BUCKETS) {
        return;
    }

    const sortedEntries = [...RATE_LIMIT_BUCKETS.entries()].sort(
        (a, b) => a[1].resetAt - b[1].resetAt
    );

    const overflowCount = RATE_LIMIT_BUCKETS.size - MAX_BUCKETS;
    for (let index = 0; index < overflowCount; index += 1) {
        RATE_LIMIT_BUCKETS.delete(sortedEntries[index][0]);
    }
}

export function buildRateLimitKey(scope: string, ...parts: Array<string | number>) {
    return [scope, ...parts.map((part) => String(part))].join(":");
}

export function assertRateLimit(key: string, options: RateLimitOptions) {
    const now = Date.now();
    pruneExpiredBuckets(now);

    const bucket = RATE_LIMIT_BUCKETS.get(key);
    if (!bucket || bucket.resetAt <= now) {
        RATE_LIMIT_BUCKETS.set(key, {
            count: 1,
            resetAt: now + options.windowMs,
        });
        pruneOverflowBuckets();
        return;
    }

    if (bucket.count >= options.limit) {
        throw new Error(options.message);
    }

    bucket.count += 1;
}

export function clearRateLimit(key: string) {
    RATE_LIMIT_BUCKETS.delete(key);
}
