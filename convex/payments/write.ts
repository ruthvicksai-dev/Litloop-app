import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { recordPaymentCompleted, recordUserActivity } from "../analytics";
import { insertAuditLog } from "../lib/auditLog";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";
import { assertRateLimit, buildRateLimitKey } from "../lib/rateLimit";
import { MAX_UPLOAD_SIZE_BYTES, PAYMENT_RATE_LIMITS } from "./helpers";

export const submitUpiPayment = mutation({
    args: {
        rentalId: v.id("rentals"),
        utrNumber: v.string(),
        paymentScreenshot: v.id("_storage"),
        ipAddress: v.optional(v.string()),
        deviceInfo: v.optional(v.string()),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await getAuthenticatedUser(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");

        if (rental.userId !== caller._id && caller.role !== "admin") {
            throw new Error("Unauthorized");
        }

        if (rental.status !== "pickup_scheduled")
            throw new Error("Pickup must be scheduled before payment.");

        if (rental.paymentStatus === "verification_pending") {
            throw new Error("A payment submission is already pending verification.");
        }
        if (rental.paymentStatus === "paid") {
            throw new Error("This rental has already been paid.");
        }

        // H1: DB-backed rate limiting
        if (args.ipAddress) {
            const globalKey = buildRateLimitKey("payment", "global", args.ipAddress);
            await assertRateLimit(ctx as any, globalKey, PAYMENT_RATE_LIMITS.global);
        }

        const submitPaymentKey = buildRateLimitKey(
            "payment",
            "submitUpi",
            rental.userId,
            args.ipAddress
        );
        await assertRateLimit(ctx as any, submitPaymentKey, PAYMENT_RATE_LIMITS.submitUpiPayment);

        // Normalize UTR: uppercase + trim for consistent duplicate detection
        const normalizedUtr = args.utrNumber.trim().toUpperCase();
        if (!normalizedUtr) throw new Error("UTR number is required.");
        // M4 FIX: Accept 12–22 chars — covers UPI txn IDs (12) and NEFT/IMPS UTR (up to 22)
        const utrRegex = /^[A-Za-z0-9]{12,22}$/;
        if (!utrRegex.test(normalizedUtr)) {
            throw new Error("Invalid UTR/transaction ID. Must be 12–22 alphanumeric characters.");
        }

        // C3 FIX: Validate MIME type of the uploaded screenshot before accepting it
        const fileMetadata = await ctx.storage.getMetadata(args.paymentScreenshot);
        if (!fileMetadata) {
            throw new Error("Uploaded file not found. Please try again.");
        }
        const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
        if (!ALLOWED_IMAGE_TYPES.includes(fileMetadata.contentType ?? "")) {
            throw new Error(
                "Invalid file type. Payment screenshot must be a JPEG, PNG, or WebP image."
            );
        }

        // File size enforcement — protect Convex Free Tier storage
        if (fileMetadata.size > MAX_UPLOAD_SIZE_BYTES) {
            throw new Error("File too large. Payment screenshot must be under 10 MB.");
        }

        const existingWithSameUtr = await ctx.db
            .query("rentals")
            .withIndex("by_utrNumber", (q) => q.eq("utrNumber", normalizedUtr))
            .first();
        if (existingWithSameUtr && existingWithSameUtr._id !== args.rentalId) {
            // Audit: log duplicate UTR attempt for fraud detection
            await insertAuditLog(ctx, "duplicate_utr_attempt", caller._id, args.rentalId, "rental", {
                utrNumber: normalizedUtr,
                conflictingRentalId: existingWithSameUtr._id,
            });
            throw new Error("This UTR number has already been used for another payment. Please provide the correct transaction ID.");
        }

        await ctx.db.patch(args.rentalId, {
            paymentMethod: "upi",
            paymentStatus: "verification_pending",
            utrNumber: normalizedUtr,
            paymentScreenshot: args.paymentScreenshot,
            status: "payment_pending",
        });

        // Audit: log payment submission for traceability
        await insertAuditLog(ctx, "payment_submitted", caller._id, args.rentalId, "rental", {
            method: "upi",
            utrNumber: normalizedUtr,
            amount: rental.totalRent ?? 0,
        });

        const book = await ctx.db.get(rental.bookId);
        const user = await ctx.db.get(rental.userId);

        await ctx.scheduler.runAfter(0, internal.notifications.internal.notifyAdminsOfPaymentSubmission, {
            rentalId: args.rentalId,
            bookTitle: book?.title ?? "A book",
            userName: user?.name ?? "A user",
            method: "UPI",
        });
    },
});

export const selectCashPayment = mutation({
    args: {
        rentalId: v.id("rentals"),
        ipAddress: v.optional(v.string()),
        deviceInfo: v.optional(v.string()),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await getAuthenticatedUser(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");

        if (rental.userId !== caller._id && caller.role !== "admin") {
            throw new Error("Unauthorized");
        }

        if (rental.status !== "pickup_scheduled")
            throw new Error("Pickup must be scheduled before payment.");

        if (rental.paymentStatus === "cash_pending") {
            throw new Error("A cash payment is already registered for this rental.");
        }
        if (rental.paymentStatus === "paid") {
            throw new Error("This rental has already been paid.");
        }

        // H1: DB-backed rate limiting
        if (args.ipAddress) {
            const globalKey = buildRateLimitKey("payment", "global", args.ipAddress);
            await assertRateLimit(ctx as any, globalKey, PAYMENT_RATE_LIMITS.global);
        }

        const selectCashKey = buildRateLimitKey(
            "payment",
            "selectCash",
            rental.userId,
            args.ipAddress
        );
        await assertRateLimit(ctx as any, selectCashKey, PAYMENT_RATE_LIMITS.selectCashPayment);

        await ctx.db.patch(args.rentalId, {
            paymentMethod: "cash",
            paymentStatus: "cash_pending",
            status: "payment_pending",
        });

        const book = await ctx.db.get(rental.bookId);
        const user = await ctx.db.get(rental.userId);

        await ctx.scheduler.runAfter(0, internal.notifications.internal.notifyAdminsOfPaymentSubmission, {
            rentalId: args.rentalId,
            bookTitle: book?.title ?? "A book",
            userName: user?.name ?? "A user",
            method: "Cash",
        });
    },
});

export const verifyPayment = mutation({
    args: {
        rentalId: v.id("rentals"),
        approved: v.boolean(),
        rejectionReason: v.optional(v.string()),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");

        // Convex mutations are serialized per-document — no TOCTOU risk.
        // A second mutation on the same rental will queue behind this one.
        if (
            rental.paymentStatus !== "verification_pending" &&
            rental.paymentStatus !== "cash_pending"
        ) {
            throw new Error("Payment is not pending verification.");
        }

        const book = await ctx.db.get(rental.bookId);

        if (args.approved) {
            const genres = book?.genres ?? [];
            const amount = (rental.totalRent ?? 0) + (rental.lateFee ?? 0);

            await ctx.db.patch(args.rentalId, {
                paymentStatus: "paid",
                status: "paid",
            });

            await recordPaymentCompleted(ctx as any, {
                userId: rental.userId,
                bookId: rental.bookId,
                amount,
                genres,
                timestamp: Date.now(),
            });

            await insertAuditLog(ctx, "payment_approved", admin._id, args.rentalId, "rental", {
                amount,
                method: rental.paymentMethod,
                utrNumber: rental.utrNumber,
            });

            // Notify user of payment approval
            await ctx.scheduler.runAfter(0, internal.notifications.internal.notifyUser, {
                userId: rental.userId,
                title: "Payment Approved ✅",
                body: `Your payment for "${book?.title ?? "your book"}" has been confirmed. Please hand over the book at the scheduled pickup.`,
                dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
            });
        } else {
            const reason = args.rejectionReason?.trim() || undefined;
            await ctx.db.patch(args.rentalId, {
                paymentStatus: "rejected",
                rejectionReason: reason,
                status: "pickup_scheduled", // Roll back to allow resubmission
            });

            await insertAuditLog(ctx, "payment_rejected", admin._id, args.rentalId, "rental", {
                method: rental.paymentMethod,
                rejectionReason: reason,
            });

            // H4: Notify user of payment rejection so they can resubmit
            await ctx.scheduler.runAfter(0, internal.notifications.internal.notifyUser, {
                userId: rental.userId,
                title: "Payment Rejected ❌",
                body: reason
                    ? `Your ${rental.paymentMethod?.toUpperCase() ?? "payment"} for "${book?.title ?? "your book"}" was rejected: ${reason}. Please resubmit within the payment window.`
                    : `Your ${rental.paymentMethod?.toUpperCase() ?? "payment"} for "${book?.title ?? "your book"}" was rejected. Please verify your details and resubmit within the payment window.`,
                dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
            });
        }

        await recordUserActivity(ctx as any, rental.userId, Date.now());
    },
});

export const generateUploadUrl = mutation({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);

        // Rate-limit uploads to protect Convex Free Tier storage
        const uploadKey = buildRateLimitKey("payment", "upload", user._id);
        await assertRateLimit(ctx as any, uploadKey, PAYMENT_RATE_LIMITS.uploadUrl);

        return await ctx.storage.generateUploadUrl();
    },
});
