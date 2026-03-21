import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { recordPaymentCompleted, recordUserActivity } from "./analytics";
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
    },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "pickup_scheduled")
            throw new Error("Pickup must be scheduled before payment.");

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

        if (!args.utrNumber.trim()) throw new Error("UTR number is required.");

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
    },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "pickup_scheduled")
            throw new Error("Pickup must be scheduled before payment.");

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
    },
    handler: async (ctx, args) => {
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
        } else {
            await ctx.db.patch(args.rentalId, {
                paymentStatus: "rejected",
                status: "pickup_scheduled", // Roll back to allow resubmission
            });
        }

        await recordUserActivity(ctx, rental.userId, Date.now());
    },
});

export const generateUploadUrl = mutation({
    args: {},
    handler: async (ctx) => {
        return await ctx.storage.generateUploadUrl();
    },
});

export const getPendingPayments = query({
    args: {},
    handler: async (ctx) => {
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
