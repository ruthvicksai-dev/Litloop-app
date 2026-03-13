import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { recordPaymentCompleted, recordUserActivity } from "./analytics";

export const submitUpiPayment = mutation({
    args: {
        rentalId: v.id("rentals"),
        utrNumber: v.string(),
        paymentScreenshot: v.id("_storage"),
    },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "pickup_scheduled")
            throw new Error("Pickup must be scheduled before payment.");

        if (!args.utrNumber.trim()) throw new Error("UTR number is required.");

        await ctx.db.patch(args.rentalId, {
            paymentMethod: "upi",
            paymentStatus: "verification_pending",
            utrNumber: args.utrNumber.trim(),
            paymentScreenshot: args.paymentScreenshot,
            status: "payment_pending",
        });
    },
});

export const selectCashPayment = mutation({
    args: { rentalId: v.id("rentals") },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "pickup_scheduled")
            throw new Error("Pickup must be scheduled before payment.");

        await ctx.db.patch(args.rentalId, {
            paymentMethod: "cash",
            paymentStatus: "cash_pending",
            status: "payment_pending",
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
                const book = await ctx.db.get(rental.bookId);
                const user = await ctx.db.get(rental.userId);
                let screenshotUrl: string | null = null;
                if (rental.paymentScreenshot) {
                    screenshotUrl = await ctx.storage.getUrl(rental.paymentScreenshot);
                }
                return {
                    ...rental,
                    screenshotUrl,
                    book: book ? { title: book.title, author: book.author } : null,
                    user: user
                        ? { name: user.name, email: user.email, phone: user.phone }
                        : null,
                };
            })
        );

        return rentalsWithDetails;
    },
});
