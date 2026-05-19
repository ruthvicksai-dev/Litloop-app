import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertAdmin } from "../lib/authHelpers";
import { getCounter, getDateKey, getDateRange, getMonthKey, getMonthRange } from "./helpers";

export const getDashboardAnalytics = query({
    args: {
        accessToken: v.string(),
        range: v.union(
            v.literal("7d"),
            v.literal("30d"),
            v.literal("6m"),
            v.literal("1y")
        ),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const now = Date.now();
        const days = args.range === "7d" ? 7 : args.range === "30d" ? 30 : args.range === "6m" ? 180 : 365;
        const dateKeys = getDateRange(Math.min(days, 30));
        const requestedMonthKeys = getMonthRange(args.range === "1y" ? 12 : 6);

        // 1. Fetch Aggregated Metrics
        const [dailyStats, monthlyStats, topBookStats, topGenreStats] = await Promise.all([
            ctx.db.query("analytics_daily")
                .withIndex("by_date")
                .filter((q: any) => q.or(...dateKeys.map(d => q.eq(q.field("date"), d))))
                .collect(),
            ctx.db.query("analytics_monthly")
                .withIndex("by_month")
                .filter((q: any) => q.or(...requestedMonthKeys.map(m => q.eq(q.field("month"), m))))
                .collect(),
            ctx.db.query("book_stats")
                .withIndex("by_rentals")
                .order("desc")
                .take(10),
            ctx.db.query("genre_stats")
                .withIndex("by_rentals")
                .order("desc")
                .take(10),
        ]);

        const [countersReady, totalUsersCounter, totalRentalsCounter, activeRentalsCounter] = await Promise.all([
            getCounter(ctx as any, "dashboardCountersReady"),
            getCounter(ctx as any, "totalUsers"),
            getCounter(ctx as any, "totalRentals"),
            getCounter(ctx as any, "activeRentals"),
        ]);
        // B-02 FIX: Reduced fallback scan caps from 1000/500 to 200.
        // These fallbacks only fire before rebuildDashboardCounters has been run.
        // With 200-cap, worst case is 600 reads instead of the previous 2500.
        const [fallbackTotalUsers, fallbackTotalRentals, fallbackActiveRentals] = await Promise.all([
            countersReady !== 1 ? ctx.db.query("users").take(200).then((res: any[]) => res.length) : null,
            countersReady !== 1 ? ctx.db.query("rentals").take(200).then((res: any[]) => res.length) : null,
            countersReady !== 1
                ? ctx.db.query("rentals")
                    .filter((q: any) => q.neq(q.field("status"), "returned"))
                    .take(200)
                    .then((res: any[]) => res.length)
                : null,
        ]);
        const totalUsers = countersReady === 1 ? totalUsersCounter ?? 0 : fallbackTotalUsers ?? 0;
        const totalRentals = countersReady === 1 ? totalRentalsCounter ?? 0 : fallbackTotalRentals ?? 0;
        const activeRentalsCount = countersReady === 1 ? activeRentalsCounter ?? 0 : fallbackActiveRentals ?? 0;

        // 3. Process Daily/Monthly Charts
        const dailyRentals = dateKeys.map(date => ({
            label: date.slice(5),
            value: dailyStats.find((s: any) => s.date === date)?.rentals ?? 0,
        }));

        const monthlyRevenue = requestedMonthKeys.map(month => ({
            label: month.slice(5),
            value: monthlyStats.find((s: any) => s.month === month)?.revenue ?? 0,
        }));

        // 4. Resolve Book Titles for Leaderboard
        const topRentedBooks = await Promise.all(
            topBookStats.map(async (stat: any) => {
                const book = await ctx.db.get(stat.bookId);
                const bookTitle = (book as any)?.title ?? "Unknown Book";
                return {
                    bookId: stat.bookId,
                    title: bookTitle,
                    rentals: stat.rentals,
                    revenue: stat.revenue,
                };
            })
        );

        // 5. Calculate KPIs
        const totalRevenue = monthlyStats.reduce((sum: number, s: any) => sum + s.revenue, 0);
        const currentMonth = getMonthKey(now);
        const currentMonthStats = monthlyStats.find((s: any) => s.month === currentMonth);
        const todayKey = getDateKey(now);
        const todayStats = dailyStats.find((s: any) => s.date === todayKey);

        return {
            kpis: {
                totalRevenue,
                revenueThisMonth: currentMonthStats?.revenue ?? 0,
                dailyRevenue: todayStats?.revenue ?? 0,
                totalRentals,
                activeRentals: activeRentalsCount,
                totalUsers,
                newUsersThisMonth: currentMonthStats?.newUsers ?? 0,
                activeUsersThisMonth: currentMonthStats?.activeUsers ?? 0,
                userRetention: 0, // Simplified for now as full user table scan is removed
                rangeRevenue: totalRevenue,
            },
            charts: {
                monthlyRevenue,
                dailyRentals,
                rentalsByGenre: topGenreStats.slice(0, 5).map((genre: any) => ({
                    name: genre.genre,
                    rentals: genre.rentals,
                    revenue: genre.revenue,
                })),
                topBooksByRentals: topRentedBooks,
            },
            leaderboards: {
                topRentedBooks,
                topRevenueBooks: [...topRentedBooks].sort((a, b) => b.revenue - a.revenue),
                topGenres: topGenreStats.map((g: any) => ({
                    genre: g.genre,
                    rentals: g.rentals,
                    revenue: g.revenue,
                })),
            },
        };
    },
});

/**
 * Lightweight query for the admin dashboard revenue card.
 * Reads from the same pre-aggregated analytics_monthly table used by
 * the analytics dashboard, ensuring consistency.
 */
export const getDashboardRevenue = query({
    args: { accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const now = Date.now();
        const currentMonth = getMonthKey(now);
        const stats = await ctx.db
            .query("analytics_monthly")
            .withIndex("by_month", (q) => q.eq("month", currentMonth))
            .first();

        const monthDate = new Date(now);
        const monthLabel = monthDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        });

        return {
            monthlyRevenue: stats?.revenue ?? 0,
            monthlyOrders: stats?.rentals ?? 0,
            currentMonthLabel: monthLabel,
        };
    },
});
