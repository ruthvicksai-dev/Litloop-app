import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { insertAuditLog } from "../lib/auditLog";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";
import { assertRateLimit, buildRateLimitKey } from "../lib/rateLimit";
import { MAX_ID_CARD_SIZE_BYTES, REJECTION_COOLDOWN_MS, VERIFICATION_RATE_LIMITS } from "./helpers";

export const generateUploadUrl = mutation({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        const key = buildRateLimitKey("verification", "upload", user._id);
        await assertRateLimit(ctx as any, key, VERIFICATION_RATE_LIMITS.uploadUrl);

        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * Submits a student ID for verification to access the College Zone.
 * Enforces rate limits (3 per day), file size limits (1MB), and a 24-hour
 * cooldown period after a rejection.
 * 
 * @param studentIdNumber - The ID number printed on the card.
 * @param fullNameOnId - The exact name printed on the card.
 * @param idCardImageId - The Convex Storage ID of the uploaded image.
 */
export const submitVerification = mutation({
    args: {
        accessToken: v.string(),
        studentIdNumber: v.string(),
        fullNameOnId: v.string(),
        department: v.optional(v.string()),
        year: v.optional(v.string()),
        idCardImageId: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;
        const now = Date.now();

        // Rate limit: max 3 submissions per 24 hours
        const submitKey = buildRateLimitKey("verification", "submit", userId);
        await assertRateLimit(ctx as any, submitKey, VERIFICATION_RATE_LIMITS.submit);

        // Validate file size (server-side enforcement)
        const fileMetadata = await ctx.storage.getMetadata(args.idCardImageId);
        if (!fileMetadata) {
            throw new Error("Uploaded file not found. Please try uploading again.");
        }
        if (fileMetadata.size > MAX_ID_CARD_SIZE_BYTES) {
            await ctx.storage.delete(args.idCardImageId);
            throw new Error("ID card image must be under 1 MB. Please compress or resize your image.");
        }

        // Validate MIME type
        const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
        if (fileMetadata.contentType && !allowedTypes.includes(fileMetadata.contentType)) {
            await ctx.storage.delete(args.idCardImageId);
            throw new Error("Only JPEG, PNG, or WebP images are accepted for ID card uploads.");
        }

        // Validate input
        const trimmedIdNumber = args.studentIdNumber.trim();
        const trimmedName = args.fullNameOnId.trim();
        if (!trimmedIdNumber || trimmedIdNumber.length < 3) {
            throw new Error("Please enter a valid student ID number.");
        }
        if (!trimmedName || trimmedName.length < 2) {
            throw new Error("Please enter your full name as it appears on your ID card.");
        }

        // Check if already approved — no resubmission needed
        if (user.isVerifiedStudent === true) {
            await ctx.storage.delete(args.idCardImageId);
            throw new Error("Your student status is already verified.");
        }

        // Check for existing pending request
        const existingPending = await ctx.db
            .query("student_verifications")
            .withIndex("by_userId_status", (q) =>
                q.eq("userId", userId).eq("status", "pending")
            )
            .first();

        if (existingPending) {
            await ctx.storage.delete(args.idCardImageId);
            throw new Error("You already have a pending verification request. Please wait for admin review.");
        }

        // Check rejection cooldown (24 hours)
        const lastRejection = await ctx.db
            .query("student_verifications")
            .withIndex("by_userId_status", (q) =>
                q.eq("userId", userId).eq("status", "rejected")
            )
            .order("desc")
            .first();

        if (lastRejection && (now - lastRejection.updatedAt) < REJECTION_COOLDOWN_MS) {
            const remainingMs = REJECTION_COOLDOWN_MS - (now - lastRejection.updatedAt);
            const remainingHours = Math.ceil(remainingMs / (60 * 60 * 1000));
            await ctx.storage.delete(args.idCardImageId);
            throw new Error(
                `Please wait ${remainingHours} hour${remainingHours > 1 ? "s" : ""} before resubmitting. Your previous request was rejected.`
            );
        }

        // Create verification record
        await ctx.db.insert("student_verifications", {
            userId,
            studentIdNumber: trimmedIdNumber,
            fullNameOnId: trimmedName,
            department: args.department?.trim() || undefined,
            year: args.year?.trim() || undefined,
            idCardImageId: args.idCardImageId,
            status: "pending",
            createdAt: now,
            updatedAt: now,
        });

        // Audit log
        await insertAuditLog(ctx, "verification.submitted", userId, userId as unknown as string, "user", {
            studentIdNumber: trimmedIdNumber,
        });

        return { success: true };
    },
});

/**
 * Admin Action: Approves a pending student verification request.
 * Sets the user's `isVerifiedStudent` flag to true and triggers a success notification.
 * 
 * @param verificationId - The ID of the student_verifications document.
 */
export const approveVerification = mutation({
    args: {
        accessToken: v.string(),
        verificationId: v.id("student_verifications"),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const now = Date.now();

        const verification = await ctx.db.get(args.verificationId);
        if (!verification) {
            throw new Error("Verification request not found.");
        }
        if (verification.status !== "pending") {
            throw new Error("This verification has already been processed.");
        }

        // Update verification record
        await ctx.db.patch(args.verificationId, {
            status: "approved",
            verifiedAt: now,
            verifiedBy: admin._id,
            updatedAt: now,
        });

        // Mark user as verified
        await ctx.db.patch(verification.userId, {
            isVerifiedStudent: true,
        });

        // Send approval notification
        await ctx.scheduler.runAfter(0, internal.notifications.internal.saveNotificationRecord, {
            userId: verification.userId,
            title: "🎉 Student Verified!",
            body: "Your student ID has been verified. You can now place orders in the College Zone.",
            type: "general",
        });

        // Audit log
        await insertAuditLog(
            ctx,
            "verification.approved",
            admin._id,
            args.verificationId as unknown as string,
            "student_verification",
            { studentUserId: verification.userId }
        );
    },
});

/**
 * Admin Action: Rejects a pending student verification request.
 * Enforces a 24-hour cooldown before the user can submit a new request.
 * 
 * @param verificationId - The ID of the student_verifications document.
 * @param rejectionReason - Optional custom reason provided to the user.
 */
export const rejectVerification = mutation({
    args: {
        accessToken: v.string(),
        verificationId: v.id("student_verifications"),
        rejectionReason: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const now = Date.now();

        const verification = await ctx.db.get(args.verificationId);
        if (!verification) {
            throw new Error("Verification request not found.");
        }
        if (verification.status !== "pending") {
            throw new Error("This verification has already been processed.");
        }

        const reason = args.rejectionReason?.trim() || "Your student ID could not be verified. Please resubmit with a clear photo.";

        // Update verification record
        await ctx.db.patch(args.verificationId, {
            status: "rejected",
            rejectionReason: reason,
            verifiedBy: admin._id,
            updatedAt: now,
        });

        // Send rejection notification
        await ctx.scheduler.runAfter(0, internal.notifications.internal.saveNotificationRecord, {
            userId: verification.userId,
            title: "Student Verification Rejected",
            body: reason,
            type: "general",
        });

        // Audit log
        await insertAuditLog(
            ctx,
            "verification.rejected",
            admin._id,
            args.verificationId as unknown as string,
            "student_verification",
            { studentUserId: verification.userId, reason }
        );
    },
});
