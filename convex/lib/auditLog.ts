import { Id } from "../_generated/dataModel";

/**
 * H5: Audit Log Helper
 *
 * Inserts an immutable audit log entry for sensitive actions.
 * Call this on: payment verification, book deletion, user role changes,
 * session revocation, password changes, admin-only mutations.
 *
 * Audit logs are append-only and cannot be deleted by any user or admin
 * through the public API.
 */
export async function insertAuditLog(
    ctx: { db: any },
    action: string,
    actorId: Id<"users">,
    targetId?: string,
    targetType?: string,
    metadata?: Record<string, unknown>
): Promise<void> {
    await ctx.db.insert("audit_logs", {
        action,
        actorId,
        targetId,
        targetType,
        metadata: metadata ? JSON.stringify(metadata) : undefined,
        timestamp: Date.now(),
    });
}

/**
 * H3: DB-backed rate limiter for critical paths.
 * Unlike the in-memory rate limiter, this is persisted in the Convex DB
 * and is consistent across all isolate instances.
 *
 * Use for: payment submission, sign-in, sign-up.
 */
export async function assertDbRateLimit(
    ctx: { db: any },
    key: string,
    limit: number,
    windowMs: number,
    message: string
): Promise<void> {
    const now = Date.now();
    const existing = await ctx.db
        .query("rate_limit_events")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();

    if (existing && existing.resetAt > now) {
        if (existing.count >= limit) {
            throw new Error(message);
        }
        await ctx.db.patch(existing._id, { count: existing.count + 1 });
    } else {
        if (existing) {
            await ctx.db.delete(existing._id);
        }
        await ctx.db.insert("rate_limit_events", {
            key,
            count: 1,
            resetAt: now + windowMs,
        });
    }
}
