import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { query } from "./_generated/server";

const DAY_MS = 24 * 60 * 60 * 1000;

type DbCtx = {
    db: any;
};

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

export const getDashboardAnalytics = query({
    args: {
        range: v.union(
            v.literal("7d"),
            v.literal("30d"),
            v.literal("6m"),
            v.literal("1y")
        ),
    },
    handler: async (ctx, args) => {
        const now = Date.now();
        const days = args.range === "7d" ? 7 : args.range === "30d" ? 30 : args.range === "6m" ? 180 : 365;
        const rangeStart = now - days * DAY_MS;
        const dateKeys = getDateRange(Math.min(days, 30));

        const [users, rentals, books] = await Promise.all([
            ctx.db.query("users").collect(),
            ctx.db.query("rentals").collect(),
            ctx.db.query("books").collect(),
        ]);

        const firstTimestamps = [
            ...users.map((user: any) => user.createdAt),
            ...rentals.map((rental: any) => rental.createdAt),
            ...books.map((book: any) => book.createdAt),
        ].filter((timestamp: any) => typeof timestamp === "number");
        const firstAvailableTimestamp =
            firstTimestamps.length > 0 ? Math.min(...firstTimestamps) : now;
        const firstAvailableMonth = getMonthKey(firstAvailableTimestamp);
        const requestedMonthKeys = getMonthRange(args.range === "1y" ? 12 : 6);
        const monthKeys = requestedMonthKeys.filter((month) => month >= firstAvailableMonth);

        const completedStatuses = new Set(["paid", "returned"]);
        const activeStatuses = new Set([
            "requested",
            "delivery_scheduled",
            "delivered",
            "pickup_scheduled",
            "payment_pending",
        ]);
        const getRentalAmount = (rental: any) => (rental.totalRent ?? 0) + (rental.lateFee ?? 0);

        const rentalsInRange = rentals.filter((rental: any) => rental.createdAt >= rangeStart);
        const completedRentals = rentals.filter((rental: any) => completedStatuses.has(rental.status));
        const completedRentalsInRange = completedRentals.filter((rental: any) => rental.createdAt >= rangeStart);

        const dailyRentalCounts = new Map<string, number>();
        rentalsInRange.forEach((rental: any) => {
            const date = getDateKey(rental.createdAt);
            dailyRentalCounts.set(date, (dailyRentalCounts.get(date) ?? 0) + 1);
        });

        const monthlyRevenueTotals = new Map<string, number>();
        completedRentals.forEach((rental: any) => {
            const month = getMonthKey(rental.createdAt);
            monthlyRevenueTotals.set(month, (monthlyRevenueTotals.get(month) ?? 0) + getRentalAmount(rental));
        });

        const monthlyRevenue = monthKeys.map((month) => ({
            label: month.slice(5),
            value: monthlyRevenueTotals.get(month) ?? 0,
        }));

        const dailyRentals = dateKeys.map((date) => ({
            label: date.slice(5),
            value: dailyRentalCounts.get(date) ?? 0,
        }));

        const booksById = new Map(books.map((book: any) => [book._id, book]));
        const bookAggregates = new Map<
            Id<"books">,
            { bookId: Id<"books">; rentals: number; revenue: number }
        >();
        const genreAggregates = new Map<string, { genre: string; rentals: number; revenue: number }>();

        rentals.forEach((rental: any) => {
            const bookId = rental.bookId as Id<"books">;
            const amount = getRentalAmount(rental);
            const isCompleted = completedStatuses.has(rental.status);
            const currentBook = bookAggregates.get(bookId) ?? { bookId, rentals: 0, revenue: 0 };

            currentBook.rentals += 1;
            if (isCompleted) {
                currentBook.revenue += amount;
            }
            bookAggregates.set(bookId, currentBook);

            const genresForBook = booksById.get(bookId)?.genres ?? [];
            genresForBook.forEach((genre: string) => {
                const currentGenre = genreAggregates.get(genre) ?? { genre, rentals: 0, revenue: 0 };
                currentGenre.rentals += 1;
                if (isCompleted) {
                    currentGenre.revenue += amount;
                }
                genreAggregates.set(genre, currentGenre);
            });
        });

        const topRentedBooks = Array.from(bookAggregates.values())
            .sort((a, b) => b.rentals - a.rentals)
            .slice(0, 10);

        const topRevenueBooks = Array.from(bookAggregates.values())
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        const mapBook = (entry: { bookId: Id<"books">; rentals: number; revenue: number }) => ({
            bookId: entry.bookId,
            title: booksById.get(entry.bookId)?.title ?? "Unknown Book",
            rentals: entry.rentals,
            revenue: entry.revenue,
        });

        const topGenres = Array.from(genreAggregates.values())
            .sort((a, b) => b.rentals - a.rentals)
            .slice(0, 10);

        const totalRevenue = completedRentals.reduce(
            (sum: number, rental: any) => sum + (rental.totalRent ?? 0) + (rental.lateFee ?? 0),
            0
        );
        const rangeRevenue = completedRentalsInRange.reduce(
            (sum: number, rental: any) => sum + getRentalAmount(rental),
            0
        );
        const totalUsers = users.length;
        const activeRentals = rentals.filter((rental: any) => activeStatuses.has(rental.status)).length;
        const totalRentals = rentals.length;

        const currentMonth = getMonthKey(now);
        const previousMonth = getMonthKey(new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1).getTime());
        const currentMonthActive = new Set(
            rentals
                .filter((rental: any) => getMonthKey(rental.createdAt) === currentMonth)
                .map((rental: any) => rental.userId)
        );
        const previousMonthActive = new Set(
            rentals
                .filter((rental: any) => getMonthKey(rental.createdAt) === previousMonth)
                .map((rental: any) => rental.userId)
        );
        const retainedUsers = Array.from(currentMonthActive).filter((userId) => previousMonthActive.has(userId)).length;
        const userRetention =
            previousMonthActive.size > 0
                ? Math.round((retainedUsers / previousMonthActive.size) * 100)
                : 0;

        const currentMonthCompletedRentals = completedRentals.filter(
            (rental: any) => getMonthKey(rental.createdAt) === currentMonth
        );
        const rentalRevenueThisMonth = currentMonthCompletedRentals.reduce(
            (sum: number, rental: any) => sum + (rental.totalRent ?? 0) + (rental.lateFee ?? 0),
            0
        );

        const newUsersThisMonth = users.filter(
            (user: any) => getMonthKey(user.createdAt) === currentMonth
        ).length;
        const todayKey = getDateKey(now);
        const dailyRevenue = completedRentals
            .filter((rental: any) => getDateKey(rental.createdAt) === todayKey)
            .reduce((sum: number, rental: any) => sum + getRentalAmount(rental), 0);

        return {
            kpis: {
                totalRevenue,
                revenueThisMonth: rentalRevenueThisMonth,
                dailyRevenue,
                totalRentals,
                activeRentals,
                totalUsers,
                newUsersThisMonth,
                activeUsersThisMonth: currentMonthActive.size,
                userRetention,
                rangeRevenue,
            },
            charts: {
                monthlyRevenue,
                dailyRentals,
                rentalsByGenre: topGenres.slice(0, 5).map((genre) => ({
                    name: genre.genre,
                    rentals: genre.rentals,
                    revenue: genre.revenue,
                })),
                topBooksByRentals: topRentedBooks.map(mapBook),
            },
            leaderboards: {
                topRentedBooks: topRentedBooks.map(mapBook),
                topRevenueBooks: topRevenueBooks.map(mapBook),
                topGenres,
            },
        };
    },
});
