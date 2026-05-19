import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertAdmin } from "../lib/authHelpers";
import { getBookWithCoverUrls } from "../lib/bookHelpers";

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
                const book = await getBookWithCoverUrls(ctx as any, rental.bookId);
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
