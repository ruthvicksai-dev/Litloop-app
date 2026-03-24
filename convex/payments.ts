import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { recordPaymentCompleted, recordUserActivity } from "./analytics";
import { insertAuditLog } from "./lib/auditLog";
import { assertAdmin, getAuthenticatedUser } from "./lib/authHelpers";
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

async function getBookWithCoverUrls(ctx: any, bookId: any) {
    const book = await ctx.db.get(bookId);
    if (!book) return null;

    let coverUrl: string | null = null;
    const coverUrls: string[] = [];

    if (book.coverImages && book.coverImages.length > 0) {
        for (const imageId of book.coverImages) {
            const url = await ctx.storage.getUrl(imageId);
            if (url) coverUrls.push(url);
        }
        if (coverUrls.length > 0) coverUrl = coverUrls[0];
    } else if (book.coverImage) {
        coverUrl = await ctx.storage.getUrl(book.coverImage);
        if (coverUrl) coverUrls.push(coverUrl);
    }

    return {
        title: book.title,
        author: book.author,
        coverUrl,
        coverUrls,
    };
}

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

        // C2: Idempotency guard — prevent duplicate payment submissions
        if (rental.paymentStatus === "verification_pending") {
            throw new Error("A payment submission is already pending verification.");
        }
        if (rental.paymentStatus === "paid") {
            throw new Error("This rental has already been paid.");
        }

        // Global IP rate limit
        if (args.ipAddress) {
            const globalKey = buildRateLimitKey("payment", "global", args.ipAddress);
            assertRateLimit(globalKey, PAYMENT_RATE_LIMITS.global);
        }

        const submitPaymentKey = buildRateLimitKey(
            "payment",
            "submitUpi",
            rental.userId,
            args.ipAddress
        );
        assertRateLimit(submitPaymentKey, PAYMENT_RATE_LIMITS.submitUpiPayment);

        // M4: Validate UTR number format (12 alphanumeric chars)
        const utrRegex = /^[A-Za-z0-9]{12}$/;
        if (!args.utrNumber.trim()) throw new Error("UTR number is required.");
        if (!utrRegex.test(args.utrNumber.trim())) throw new Error("Invalid UTR number. Must be exactly 12 alphanumeric characters.");

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

        // C2: Idempotency guard — prevent duplicate payment submissions
        if (rental.paymentStatus === "cash_pending") {
            throw new Error("A cash payment is already registered for this rental.");
        }
        if (rental.paymentStatus === "paid") {
            throw new Error("This rental has already been paid.");
        }

        // Global IP rate limit
        if (args.ipAddress) {
            const globalKey = buildRateLimitKey("payment", "global", args.ipAddress);
            assertRateLimit(globalKey, PAYMENT_RATE_LIMITS.global);
        }

        const selectCashKey = buildRateLimitKey(
            "payment",
            "selectCash",
            rental.userId,
            args.ipAddress
        );
        assertRateLimit(selectCashKey, PAYMENT_RATE_LIMITS.selectCashPayment);

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

        if (args.approved) {
            const book = await ctx.db.get(rental.bookId);
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

            // H5: Audit log — payment approved
            await insertAuditLog(ctx, "payment_approved", admin._id, args.rentalId, "rental", {
                amount,
                method: rental.paymentMethod,
                utrNumber: rental.utrNumber,
            });
        } else {
            await ctx.db.patch(args.rentalId, {
                paymentStatus: "rejected",
                status: "pickup_scheduled", // Roll back to allow resubmission
            });

            // H5: Audit log — payment rejected
            await insertAuditLog(ctx, "payment_rejected", admin._id, args.rentalId, "rental", {
                method: rental.paymentMethod,
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

export const getPendingPayments = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const rentals = await ctx.db
            .query("rentals")
            .withIndex("by_status", (q) => q.eq("status", "payment_pending"))
            .collect();

        const rentalsWithDetails = await Promise.all(
            rentals.map(async (rental) => {
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

        return rentalsWithDetails;
    },
});
