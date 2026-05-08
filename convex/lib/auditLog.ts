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


