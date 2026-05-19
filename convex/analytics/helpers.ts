import { Id } from "../_generated/dataModel";

export const DAY_MS = 24 * 60 * 60 * 1000;

export type DbCtx = {
    db: any;
};

export type CounterKey = "totalUsers" | "totalRentals" | "activeRentals" | "dashboardCountersReady";
export const DASHBOARD_COUNTERS_REBUILD_KEY = "dashboard_counters_rebuild";

export const getDateKey = (timestamp: number) =>
    new Date(timestamp).toISOString().slice(0, 10);

export const getMonthKey = (timestamp: number) =>
    new Date(timestamp).toISOString().slice(0, 7);

export const getMonthRange = (monthsBack: number) => {
    const months: string[] = [];
    const current = new Date();
    current.setDate(1);

    for (let index = monthsBack - 1; index >= 0; index -= 1) {
        const date = new Date(current.getFullYear(), current.getMonth() - index, 1);
        months.push(date.toISOString().slice(0, 7));
    }

    return months;
};

export const getDateRange = (days: number) => {
    const dates: string[] = [];
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let index = days - 1; index >= 0; index -= 1) {
        dates.push(new Date(today.getTime() - index * DAY_MS).toISOString().slice(0, 10));
    }

    return dates;
};

export async function ensureMonthlyAnalytics(ctx: DbCtx, month: string) {
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

export async function ensureDailyAnalytics(ctx: DbCtx, date: string) {
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

export async function ensureBookStats(ctx: DbCtx, bookId: Id<"books">) {
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

export async function ensureGenreStats(ctx: DbCtx, genre: string) {
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

export async function touchMonthlyActiveUser(
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

export async function getCounter(ctx: DbCtx, key: CounterKey) {
    const counter = await ctx.db
        .query("analytics_counters")
        .withIndex("by_key", (q: any) => q.eq("key", key))
        .first();

    return counter?.value ?? null;
}

export async function incrementCounter(ctx: DbCtx, key: CounterKey, delta: number) {
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

export async function setCounter(ctx: DbCtx, key: CounterKey, value: number) {
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
