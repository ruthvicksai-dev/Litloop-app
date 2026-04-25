import { internal } from "./_generated/api";
import { mutation } from "./_generated/server";

export const testNotify = mutation({
    args: {},
    handler: async (ctx) => {
        // Find an existing rental to spoof
        const rental = await ctx.db.query("rentals").first();
        if (!rental) throw new Error("No rentals found");

        const book = await ctx.db.get(rental.bookId);

        await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminsOfNewRental, {
            rentalId: rental._id,
            bookTitle: book?.title || "Test Book",
            userName: "Test User",
        });

        return "Scheduled";
    }
});
