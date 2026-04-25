import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { recordPaymentCompleted, recordUserActivity } from "./analytics";
import { insertAuditLog } from "./lib/auditLog";
import { assertAdmin, getAuthenticatedUser } from "./lib/authHelpers";
import { getBookWithCoverUrls } from "./lib/bookHelpers";
import { assertRateLimit, buildRateLimitKey } from "./lib/rateLimit";

const PAYMENT_RATE_LIMITS = {
    submitUpiPayment: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
        message: "Too many payment submissions. Please try again later.",
    },
    selectCashPayment: {
        limit: 5,
        windowMs: 15 * 60 * 1000,
        message: "Too many payment selections. Please try again later.",
    },
    global: {
        limit: 15,
        windowMs: 30 * 60 * 1000,
        message: "Too many payment requests from this IP. Please try again later.",
    },
} as const;

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
            await assertRateLimit(ctx, globalKey, PAYMENT_RATE_LIMITS.global);
        }

        const submitPaymentKey = buildRateLimitKey(
            "payment",
            "submitUpi",
            rental.userId,
            args.ipAddress
        );
        await assertRateLimit(ctx, submitPaymentKey, PAYMENT_RATE_LIMITS.submitUpiPayment);

        if (!args.utrNumber.trim()) throw new Error("UTR number is required.");
        // M4 FIX: Accept 12–22 chars — covers UPI txn IDs (12) and NEFT/IMPS UTR (up to 22)
        const utrRegex = /^[A-Za-z0-9]{12,22}$/;
        if (!utrRegex.test(args.utrNumber.trim())) {
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

        const existingWithSameUtr = await ctx.db
            .query("rentals")
            .withIndex("by_utrNumber", (q) => q.eq("utrNumber", args.utrNumber.trim()))
            .first();
        if (existingWithSameUtr && existingWithSameUtr._id !== args.rentalId) {
            throw new Error("This UTR number has already been used for another payment. Please provide the correct transaction ID.");
        }

        await ctx.db.patch(args.rentalId, {
            paymentMethod: "upi",
            paymentStatus: "verification_pending",
            utrNumber: args.utrNumber.trim(),
            paymentScreenshot: args.paymentScreenshot,
            status: "payment_pending",
        });

        const book = await ctx.db.get(rental.bookId);
        const user = await ctx.db.get(rental.userId);

        await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminsOfPaymentSubmission, {
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
            await assertRateLimit(ctx, globalKey, PAYMENT_RATE_LIMITS.global);
        }

        const selectCashKey = buildRateLimitKey(
            "payment",
            "selectCash",
            rental.userId,
            args.ipAddress
        );
        await assertRateLimit(ctx, selectCashKey, PAYMENT_RATE_LIMITS.selectCashPayment);

        await ctx.db.patch(args.rentalId, {
            paymentMethod: "cash",
            paymentStatus: "cash_pending",
            status: "payment_pending",
        });

        const book = await ctx.db.get(rental.bookId);
        const user = await ctx.db.get(rental.userId);

        await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminsOfPaymentSubmission, {
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
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const admin = await assertAdmin(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");

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

            await recordPaymentCompleted(ctx, {
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
            await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
                userId: rental.userId,
                title: "Payment Approved ✅",
                body: `Your payment for "${book?.title ?? "your book"}" has been confirmed. Please hand over the book at the scheduled pickup.`,
                dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
            });
        } else {
            await ctx.db.patch(args.rentalId, {
                paymentStatus: "rejected",
                status: "pickup_scheduled", // Roll back to allow resubmission
            });

            await insertAuditLog(ctx, "payment_rejected", admin._id, args.rentalId, "rental", {
                method: rental.paymentMethod,
            });

            // H4: Notify user of payment rejection so they can resubmit
            await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
                userId: rental.userId,
                title: "Payment Rejected ❌",
                body: `Your ${rental.paymentMethod?.toUpperCase() ?? "payment"} for "${book?.title ?? "your book"}" was rejected. Please verify your details and resubmit within the payment window.`,
                dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
            });
        }

        await recordUserActivity(ctx, rental.userId, Date.now());
    },
});

export const generateUploadUrl = mutation({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await getAuthenticatedUser(ctx, args.accessToken);
        return await ctx.storage.generateUploadUrl();
    },
});

/**
 * M1 FIX: Added pagination so the admin payment list doesn't load unboundedly.
 */
export const getPendingPayments = query({
    args: {
        paginationOpts: paginationOptsValidator,
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const results = await ctx.db
            .query("rentals")
            .withIndex("by_status", (q) => q.eq("status", "payment_pending"))
            .order("desc")
            .paginate(args.paginationOpts);

        const rentalsWithDetails = await Promise.all(
            results.page.map(async (rental) => {
                const book = await getBookWithCoverUrls(ctx, rental.bookId);
                const user = await ctx.db.get(rental.userId);
                let screenshotUrl: string | null = null;
                if (rental.paymentScreenshot) {
                    screenshotUrl = await ctx.storage.getUrl(rental.paymentScreenshot);
                }
                return {
                    ...rental,
                    screenshotUrl,
                    coverUrl: book?.coverUrl ?? null,
                    coverUrls: book?.coverUrls ?? [],
                    book,
                    user: user
                        ? { name: user.name, email: user.email, phone: user.phone }
                        : null,
                };
            })
        );

        return { ...results, page: rentalsWithDetails };
    },
});
