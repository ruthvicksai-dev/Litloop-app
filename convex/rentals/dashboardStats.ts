import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertAdmin } from "../lib/authHelpers";
import { getDateKey, getMonthKey } from "../analytics/helpers";

/**
 * Lightweight dashboard stats query for the admin dashboard redesign.
 * Returns status counts, today's metrics, total books, and monthly growth
 * WITHOUT downloading all rental documents.
 *
 * Uses the existing `by_status` index for O(n) per-status counts,
 * `analytics_daily` for today's revenue, and `analytics_monthly` for growth.
 */
export const getDashboardStats = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const now = Date.now();
        const todayKey = getDateKey(now);
        const currentMonthKey = getMonthKey(now);

        // Previous month key
        const prevDate = new Date(now);
        prevDate.setMonth(prevDate.getMonth() - 1);
        const prevMonthKey = getMonthKey(prevDate.getTime());

        // 1. Status counts using by_status index (lightweight — count only)
        const statuses = [
            "requested",
            "delivery_scheduled",
            "delivered",
            "pickup_scheduled",
            "payment_pending",
            "paid",
            "returned",
        ] as const;

        const statusCounts: Record<string, number> = {
            requested: 0,
            delivery_scheduled: 0,
            delivered: 0,
            pickup_scheduled: 0,
            payment_pending: 0,
            paid: 0,
            returned: 0,
        };

        for (const status of statuses) {
            const items = await ctx.db
                .query("rentals")
                .withIndex("by_status", (q) => q.eq("status", status))
                .collect();

            statusCounts[status] = items.length;
        }

        // 2. Today's orders — count rentals created today using index range query
        const todayStart = new Date(todayKey + "T00:00:00Z").getTime();
        const todayEnd = todayStart + 24 * 60 * 60 * 1000;
        const todayRentals = await ctx.db
            .query("rentals")
            .withIndex("by_createdAt", (q) =>
                q.gte("createdAt", todayStart).lt("createdAt", todayEnd)
            )
            .take(200);
        const todayOrders = todayRentals.length;

        // 3. Today's revenue from analytics_daily
        const todayStats = await ctx.db
            .query("analytics_daily")
            .withIndex("by_date", (q) => q.eq("date", todayKey))
            .first();
        const todayRevenue = todayStats?.revenue ?? 0;

        // 4. Total books count — fetch minimal fields using query take
        const bookCountResults = await ctx.db.query("books").withIndex("by_createdAt").take(1000);
        const totalBooks = bookCountResults.length;

        // 5. Monthly growth — compare current vs previous month revenue
        const [currentMonthStats, prevMonthStats] = await Promise.all([
            ctx.db
                .query("analytics_monthly")
                .withIndex("by_month", (q) => q.eq("month", currentMonthKey))
                .first(),
            ctx.db
                .query("analytics_monthly")
                .withIndex("by_month", (q) => q.eq("month", prevMonthKey))
                .first(),
        ]);

        const currentRevenue = currentMonthStats?.revenue ?? 0;
        const prevRevenue = prevMonthStats?.revenue ?? 0;
        const monthlyGrowth =
            prevRevenue > 0
                ? Math.round(((currentRevenue - prevRevenue) / prevRevenue) * 100)
                : currentRevenue > 0
                    ? 100
                    : 0;

        return {
            statusCounts,
            todayOrders,
            todayRevenue,
            totalBooks,
            monthlyGrowth,
        };
    },
});
