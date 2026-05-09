import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { assertAdmin } from "./lib/authHelpers";

const DAY_MS = 24 * 60 * 60 * 1000;

type DbCtx = {
    db: any;
};

type CounterKey = "totalUsers" | "totalRentals" | "activeRentals" | "dashboardCountersReady";
const DASHBOARD_COUNTERS_REBUILD_KEY = "dashboard_counters_rebuild";

const getDateKey = (timestamp: number) =>
    new Date(timestamp).toISOString().slice(0, 10);

const getMonthKey = (timestamp: number) =>
    new Date(timestamp).toISOString().slice(0, 7);

const getMonthRange = (monthsBack: number) => {
    const months: string[] = [];
    const current = new Date();
    current.setDate(1);

    for (let index = monthsBack - 1; index >= 0; index -= 1) {
        const date = new Date(current.getFullYear(), current.getMonth() - index, 1);
        months.push(date.toISOString().slice(0, 7));
    }

    return months;
};

const getDateRange = (days: number) => {
    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let index = days - 1; index >= 0; index -= 1) {
        dates.push(new Date(today.getTime() - index * DAY_MS).toISOString().slice(0, 10));
    }

    return dates;
};

async function ensureMonthlyAnalytics(ctx: DbCtx, month: string) {
    const existing = await ctx.db
        .query("analytics_monthly")
        .withIndex("by_month", (q: any) => q.eq("month", month))
        .first();

    if (existing) {
        return existing;
    }

    const id = await ctx.db.insert("analytics_monthly", {
        month,
        revenue: 0,
        rentals: 0,
        newUsers: 0,
        activeUsers: 0,
        createdAt: Date.now(),
    });

    return await ctx.db.get(id);
}

async function ensureDailyAnalytics(ctx: DbCtx, date: string) {
    const existing = await ctx.db
        .query("analytics_daily")
        .withIndex("by_date", (q: any) => q.eq("date", date))
        .first();

    if (existing) {
        return existing;
    }

    const id = await ctx.db.insert("analytics_daily", {
        date,
        revenue: 0,
        rentals: 0,
        createdAt: Date.now(),
    });

    return await ctx.db.get(id);
}

async function ensureBookStats(ctx: DbCtx, bookId: Id<"books">) {
    const existing = await ctx.db
        .query("book_stats")
        .withIndex("by_bookId", (q: any) => q.eq("bookId", bookId))
        .first();

    if (existing) {
        return existing;
    }

    const id = await ctx.db.insert("book_stats", {
        bookId,
        rentals: 0,
        revenue: 0,
        lastRentedAt: 0,
        createdAt: Date.now(),
    });

    return await ctx.db.get(id);
}

async function ensureGenreStats(ctx: DbCtx, genre: string) {
    const existing = await ctx.db
        .query("genre_stats")
        .withIndex("by_genre", (q: any) => q.eq("genre", genre))
        .first();

    if (existing) {
        return existing;
    }

    const id = await ctx.db.insert("genre_stats", {
        genre,
        rentals: 0,
        revenue: 0,
        createdAt: Date.now(),
    });

    return await ctx.db.get(id);
}

async function touchMonthlyActiveUser(
    ctx: DbCtx,
    userId: Id<"users">,
    month: string
) {
    const existing = await ctx.db
        .query("user_month_activity")
        .withIndex("by_user_month", (q: any) => q.eq("userId", userId).eq("month", month))
        .first();

    if (existing) {
        return false;
    }

    await ctx.db.insert("user_month_activity", {
        userId,
        month,
        createdAt: Date.now(),
    });

    return true;
}

async function getCounter(ctx: DbCtx, key: CounterKey) {
    const counter = await ctx.db
        .query("analytics_counters")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();

    return counter?.value ?? null;
}

async function incrementCounter(ctx: DbCtx, key: CounterKey, delta: number) {
    const existing = await ctx.db
        .query("analytics_counters")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();

    if (!existing) {
        await ctx.db.insert("analytics_counters", {
            key,
            value: Math.max(0, delta),
            updatedAt: Date.now(),
        });
        return;
    }

    await ctx.db.patch(existing._id, {
        value: Math.max(0, existing.value + delta),
        updatedAt: Date.now(),
    });
}

async function setCounter(ctx: DbCtx, key: CounterKey, value: number) {
    const existing = await ctx.db
        .query("analytics_counters")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();

    if (!existing) {
        await ctx.db.insert("analytics_counters", {
            key,
            value: Math.max(0, value),
            updatedAt: Date.now(),
        });
        return;
    }

    await ctx.db.patch(existing._id, {
        value: Math.max(0, value),
        updatedAt: Date.now(),
    });
}

export async function recordUserRegistered(
    ctx: DbCtx,
    userId: Id<"users">,
    timestamp: number
) {
    const month = getMonthKey(timestamp);
    const monthly = await ensureMonthlyAnalytics(ctx, month);
    const isNewActive = await touchMonthlyActiveUser(ctx, userId, month);

    await ctx.db.patch(monthly._id, {
        newUsers: monthly.newUsers + 1,
        activeUsers: monthly.activeUsers + (isNewActive ? 1 : 0),
    });
    await incrementCounter(ctx, "totalUsers", 1);
}

export async function recordRentalCreated(
    ctx: DbCtx,
    userId: Id<"users">,
    timestamp: number
) {
    const month = getMonthKey(timestamp);
    const date = getDateKey(timestamp);
    const monthly = await ensureMonthlyAnalytics(ctx, month);
    const daily = await ensureDailyAnalytics(ctx, date);
    const isNewActive = await touchMonthlyActiveUser(ctx, userId, month);

    await ctx.db.patch(monthly._id, {
        rentals: monthly.rentals + 1,
        activeUsers: monthly.activeUsers + (isNewActive ? 1 : 0),
    });

    await ctx.db.patch(daily._id, {
        rentals: daily.rentals + 1,
    });
    await incrementCounter(ctx, "totalRentals", 1);
    await incrementCounter(ctx, "activeRentals", 1);
}

export async function recordRentalReturned(ctx: DbCtx) {
    await incrementCounter(ctx, "activeRentals", -1);
}

export async function recordPaymentCompleted(
    ctx: DbCtx,
    args: {
        userId: Id<"users">;
        bookId: Id<"books">;
        amount: number;
        genres: string[];
        timestamp: number;
    }
) {
    const month = getMonthKey(args.timestamp);
    const date = getDateKey(args.timestamp);
    const monthly = await ensureMonthlyAnalytics(ctx, month);
    const daily = await ensureDailyAnalytics(ctx, date);
    const bookStats = await ensureBookStats(ctx, args.bookId);
    const isNewActive = await touchMonthlyActiveUser(ctx, args.userId, month);

    await ctx.db.patch(monthly._id, {
        revenue: monthly.revenue + args.amount,
        activeUsers: monthly.activeUsers + (isNewActive ? 1 : 0),
    });

    await ctx.db.patch(daily._id, {
        revenue: daily.revenue + args.amount,
    });

    await ctx.db.patch(bookStats._id, {
        rentals: bookStats.rentals + 1,
        revenue: bookStats.revenue + args.amount,
        lastRentedAt: args.timestamp,
    });

    for (const genre of args.genres) {
        const genreStats = await ensureGenreStats(ctx, genre);
        await ctx.db.patch(genreStats._id, {
            rentals: genreStats.rentals + 1,
            revenue: genreStats.revenue + args.amount,
        });
    }
}

export async function recordUserActivity(
    ctx: DbCtx,
    userId: Id<"users">,
    timestamp: number
) {
    const month = getMonthKey(timestamp);
    const monthly = await ensureMonthlyAnalytics(ctx, month);
    const isNewActive = await touchMonthlyActiveUser(ctx, userId, month);

    if (isNewActive) {
        await ctx.db.patch(monthly._id, {
            activeUsers: monthly.activeUsers + 1,
        });
    }
}

export const rebuildDashboardCounters = mutation({
    args: {
        accessToken: v.string(),
        paginationOpts: paginationOptsValidator,
        reset: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const existingState = await ctx.db
            .query("system_state")
            .withIndex("by_key", (q) => q.eq("key", DASHBOARD_COUNTERS_REBUILD_KEY))
            .first();

        if (args.reset && existingState) {
            await ctx.db.delete(existingState._id);
        }

        const state = args.reset
            ? null
            : existingState?.value
                ? JSON.parse(existingState.value)
                : null;
        const startingState = state ?? {
            usersCursor: null,
            rentalsCursor: null,
            totalUsers: 0,
            totalRentals: 0,
            activeRentals: 0,
            usersDone: false,
            rentalsDone: false,
        };

        let nextState = { ...startingState };
        let scannedUsers = 0;
        let scannedRentals = 0;

        if (!nextState.usersDone) {
            const userResults = await ctx.db
                .query("users")
                .withIndex("by_createdAt")
                .paginate({
                    ...args.paginationOpts,
                    cursor: nextState.usersCursor,
                });
            scannedUsers = userResults.page.length;
            nextState = {
                ...nextState,
                usersCursor: userResults.isDone ? null : userResults.continueCursor,
                totalUsers: nextState.totalUsers + userResults.page.length,
                usersDone: userResults.isDone,
            };
        }

        if (!nextState.rentalsDone) {
            const rentalResults = await ctx.db
                .query("rentals")
                .withIndex("by_createdAt")
                .paginate({
                    ...args.paginationOpts,
                    cursor: nextState.rentalsCursor,
                });
            scannedRentals = rentalResults.page.length;
            nextState = {
                ...nextState,
                rentalsCursor: rentalResults.isDone ? null : rentalResults.continueCursor,
                totalRentals: nextState.totalRentals + rentalResults.page.length,
                activeRentals:
                    nextState.activeRentals +
                    rentalResults.page.filter((r: any) => r.status !== "returned").length,
                rentalsDone: rentalResults.isDone,
            };
        }

        const isDone = nextState.usersDone && nextState.rentalsDone;
        if (isDone) {
            await setCounter(ctx, "totalUsers", nextState.totalUsers);
            await setCounter(ctx, "totalRentals", nextState.totalRentals);
            await setCounter(ctx, "activeRentals", nextState.activeRentals);
            await setCounter(ctx, "dashboardCountersReady", 1);

            const savedState = await ctx.db
                .query("system_state")
                .withIndex("by_key", (q) => q.eq("key", DASHBOARD_COUNTERS_REBUILD_KEY))
                .first();
            if (savedState) {
                await ctx.db.delete(savedState._id);
            }
        } else {
            const payload = JSON.stringify(nextState);
            const savedState = await ctx.db
                .query("system_state")
                .withIndex("by_key", (q) => q.eq("key", DASHBOARD_COUNTERS_REBUILD_KEY))
                .first();

            if (savedState) {
                await ctx.db.patch(savedState._id, {
                    value: payload,
                    updatedAt: Date.now(),
                });
            } else {
                await ctx.db.insert("system_state", {
                    key: DASHBOARD_COUNTERS_REBUILD_KEY,
                    value: payload,
                    updatedAt: Date.now(),
                });
            }
        }

        return {
            scannedUsers,
            scannedRentals,
            totals: {
                totalUsers: nextState.totalUsers,
                totalRentals: nextState.totalRentals,
                activeRentals: nextState.activeRentals,
            },
            isDone,
        };
    },
});

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
            getCounter(ctx, "dashboardCountersReady"),
            getCounter(ctx, "totalUsers"),
            getCounter(ctx, "totalRentals"),
            getCounter(ctx, "activeRentals"),
        ]);
        const [fallbackTotalUsers, fallbackTotalRentals, fallbackActiveRentals] = await Promise.all([
            countersReady !== 1 ? ctx.db.query("users").take(1000).then((res: any[]) => res.length) : null,
            countersReady !== 1 ? ctx.db.query("rentals").take(1000).then((res: any[]) => res.length) : null,
            countersReady !== 1
                ? ctx.db.query("rentals")
                    .filter((q: any) => q.neq(q.field("status"), "returned"))
                    .take(500)
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
    args: {},
    handler: async (ctx) => {
        const now = Date.now();
        const currentMonth = getMonthKey(now);
        const stats = await ensureMonthlyAnalytics(ctx, currentMonth);

        const monthDate = new Date(now);
        const monthLabel = monthDate.toLocaleDateString("en-US", {
            month: "short",
            year: "numeric",
        });

        return {
            monthlyRevenue: stats.revenue,
            monthlyOrders: stats.rentals,
            currentMonthLabel: monthLabel,
        };
    },
});
