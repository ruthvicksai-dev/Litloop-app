import { v } from "convex/values";
import { internal } from "../_generated/api";
import { internalMutation } from "../_generated/server";
import { incrementRatingCountPatch } from "../lib/reviewCounters";
import { safeRatingRollback } from "./helpers";

export const autoCancelPickup = internalMutation({
    args: { rentalId: v.id("rentals") },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental || rental.status !== "pickup_scheduled") return;

        if (rental.userRating) {
            const book = await ctx.db.get(rental.bookId);
            if (book) {
                const { rating, ratingCount, avgRating, totalReviews } = safeRatingRollback(
                    book.rating,
                    book.ratingCount,
                    rental.userRating
                );
                await ctx.db.patch(rental.bookId, { 
                    rating, 
                    ratingCount,
                    avgRating,
                    totalReviews,
                    ...incrementRatingCountPatch(book, rental.userRating, -1),
                });
            }
        }

        await ctx.db.patch(args.rentalId, {
            pickupDate: undefined,
            pickupTime: undefined,
            pickupLocation: undefined,
            totalRent: undefined,
            userRating: undefined,
            ratedAt: undefined,
            paymentStatus: undefined,
            paymentExpiresAt: undefined,
            status: "delivered",
        });

        const book = await ctx.db.get(rental.bookId);
        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Pickup Auto-Cancelled ⏳",
            body: `Your scheduled pickup for "${book?.title ?? "your book"}" was cancelled due to incomplete payment. Your rental timer has resumed.`,
            dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
        });
    },
});
