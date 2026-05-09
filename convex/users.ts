import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { assertAdmin, getAuthenticatedUser } from "./lib/authHelpers";

export const getUser = query({
    args: { accessToken: v.string(), userId: v.id("users") },
    handler: async (ctx, args) => {
        const caller = await getAuthenticatedUser(ctx, args.accessToken);

        // Users can see themselves; Admins can see any user
        if (caller._id !== args.userId && caller.role !== "admin") {
            throw new Error("Unauthorized");
        }

        return await ctx.db.get(args.userId);
    },
});

export const listUsers = query({
    args: { accessToken: v.string(), paginationOpts: paginationOptsValidator },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        return await ctx.db.query("users").order("desc").paginate(args.paginationOpts);
    },
});

export const updateUser = mutation({
    args: {
        accessToken: v.string(),
        name: v.string(),
        phone: v.string(),
    },
    handler: async (ctx, args) => {
        // H2: Use getAuthenticatedUser so revoked sessions are rejected
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        // Validate
        if (!args.name.trim()) throw new Error("Name cannot be empty.");
        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(args.phone.trim())) {
            throw new Error("Please provide a valid 10-digit phone number.");
        }

        await ctx.db.patch(user._id, {
            name: args.name.trim(),
            phone: args.phone.trim(),
        });

        return true;
    },
});

// ─── Delete Account (MANDATORY: Google Play Store policy) ─────────────────────

export const deleteAccount = mutation({
    args: {
        accessToken: v.string(),
        confirmText: v.string(), // Must equal "DELETE" to confirm
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;

        if (args.confirmText !== "DELETE") {
            throw new Error("Please type DELETE to confirm account deletion.");
        }

        // C1: Block deletion if user has active rentals to prevent orphaned records
        const activeRental = await ctx.db
            .query("rentals")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.neq(q.field("status"), "returned"),
                    q.neq(q.field("status"), "paid")
                )
            )
            .first();
        if (activeRental) {
            throw new Error("Cannot delete account with active rentals. Please return all books first.");
        }

        // 1. Revoke all active sessions first
        const sessions = await ctx.db
            .query("sessions")
            .withIndex("by_userId_active", (q) => q.eq("userId", userId).eq("isRevoked", false))
            .collect();
        for (const session of sessions) {
            await ctx.db.patch(session._id, { isRevoked: true });
        }

        // 2. Remove push tokens (user is already fetched — use getAuthenticatedUser result)
        if ((user as any).pushToken) {
            await ctx.db.patch(userId, { pushToken: undefined });
        }

        // Cache metadata for audit log before deletion
        const auditEmail = (user as any).email as string | undefined;
        const auditName = (user as any).name as string | undefined;

        // 3. Delete favorites & read-later (L6: batched to prevent timeout)
        const favorites = await ctx.db
            .query("favorites")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(500);
        for (const fav of favorites) await ctx.db.delete(fav._id);

        const readLater = await ctx.db
            .query("read_later")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(500);
        for (const rl of readLater) await ctx.db.delete(rl._id);

        // 4. Delete user notifications (L6: batched to prevent timeout)
        const notifications = await ctx.db
            .query("user_notifications")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(500);
        for (const n of notifications) await ctx.db.delete(n._id);

        // S-04 FIX: Clean up all remaining user-linked data to prevent orphaned
        // records and ensure GDPR-compliant deletion.

        // 5. Delete reviews and rollback book ratings
        const reviews = await ctx.db
            .query("reviews")
            .withIndex("by_userId_bookId", (q) => q.eq("userId", userId))
            .take(200);
        for (const review of reviews) {
            const book = await ctx.db.get(review.bookId);
            if (book) {
                const currentRating = typeof book.rating === "number" && Number.isFinite(book.rating) ? book.rating : 0;
                const currentCount = typeof book.ratingCount === "number" && Number.isFinite(book.ratingCount) ? book.ratingCount : 0;
                const nextCount = Math.max(0, currentCount - 1);
                if (nextCount === 0) {
                    await ctx.db.patch(review.bookId, { rating: 0, ratingCount: 0, avgRating: 0, totalReviews: 0 });
                } else {
                    const nextRating = ((currentRating * currentCount) - review.rating) / nextCount;
                    await ctx.db.patch(review.bookId, {
                        rating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
                        ratingCount: nextCount,
                        avgRating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
                        totalReviews: nextCount,
                    });
                }
            }
            // Delete associated review votes
            const votes = await ctx.db
                .query("review_votes")
                .withIndex("by_reviewId", (q) => q.eq("reviewId", review._id))
                .take(200);
            for (const vote of votes) await ctx.db.delete(vote._id);
            // Delete associated reports
            const reports = await ctx.db
                .query("reports")
                .withIndex("by_targetId", (q) => q.eq("targetId", review._id))
                .take(100);
            for (const report of reports) await ctx.db.delete(report._id);
            await ctx.db.delete(review._id);
        }

        // 6. Delete review votes cast by this user on other reviews
        const userVotes = await ctx.db
            .query("review_votes")
            .withIndex("by_user_review", (q) => q.eq("userId", userId))
            .take(500);
        for (const vote of userVotes) {
            const review = await ctx.db.get(vote.reviewId);
            if (review) {
                const field = vote.voteType === "helpful" ? "helpfulCount" : "unhelpfulCount";
                const currentCount = (review as any)[field] ?? 0;
                await ctx.db.patch(vote.reviewId, { [field]: Math.max(0, currentCount - 1) });
            }
            await ctx.db.delete(vote._id);
        }

        // 7. Delete book notification subscriptions
        const bookNotifs = await ctx.db
            .query("book_notifications")
            .withIndex("by_userId_bookId", (q) => q.eq("userId", userId))
            .take(200);
        for (const bn of bookNotifs) await ctx.db.delete(bn._id);

        // 8. Delete student verifications + uploaded ID card images from storage
        const verifications = await ctx.db
            .query("student_verifications")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .take(20);
        for (const verification of verifications) {
            try { await ctx.storage.delete(verification.idCardImageId); } catch { /* ignore missing files */ }
            await ctx.db.delete(verification._id);
        }

        // 9. Delete reports filed by this user
        const userReports = await ctx.db
            .query("reports")
            .withIndex("by_reporterId", (q) => q.eq("reporterId", userId))
            .take(200);
        for (const report of userReports) await ctx.db.delete(report._id);

        // 10. Delete any pending OTP requests
        const otpRequests = await ctx.db
            .query("otp_requests")
            .withIndex("by_email", (q) => q.eq("email", (user as any).email ?? ""))
            .take(10);
        for (const otp of otpRequests) await ctx.db.delete(otp._id);

        // 11. Audit log before deletion
        await ctx.db.insert("audit_logs", {
            action: "account_deleted",
            actorId: userId,
            targetId: userId,
            targetType: "user",
            metadata: JSON.stringify({ email: auditEmail, name: auditName }),
            timestamp: Date.now(),
        });

        // 12. Delete the user document
        await ctx.db.delete(userId);

        return { success: true };
    },
});