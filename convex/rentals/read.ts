import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { query } from "../_generated/server";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";
import { getBookWithCoverUrls } from "../lib/bookHelpers";

export const getUserRentals = query({
    args: { accessToken: v.string(), userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const caller = await getAuthenticatedUser(ctx, args.accessToken);
        const targetUserId = (caller.role === "admin" && args.userId) ? args.userId : caller._id;

        const rentals = await ctx.db
            .query("rentals")
            .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "requested"),
                    q.eq(q.field("status"), "delivery_scheduled"),
                    q.eq(q.field("status"), "delivered"),
                    q.eq(q.field("status"), "pickup_scheduled"),
                    q.eq(q.field("status"), "payment_pending")
                )
            )
            .take(25);

        const rentalsWithBooks = await Promise.all(
            rentals.map(async (rental) => {
                const book = await getBookWithCoverUrls(ctx, rental.bookId);
                return {
                    ...rental,
                    coverUrl: book?.coverUrl ?? null,
                    coverUrls: book?.coverUrls ?? [],
                    book,
                };
            })
        );

        return rentalsWithBooks;
    },
});

export const getRentalHistory = query({
    args: {
        userId: v.optional(v.id("users")),
        status: v.optional(
            v.union(v.literal("all"), v.literal("paid"), v.literal("returned"))
        ),
        timeframe: v.optional(
            v.union(
                v.literal("all"),
                v.literal("last_30_days"),
                v.literal("this_month"),
                v.literal("this_year")
            )
        ),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const caller = await getAuthenticatedUser(ctx, args.accessToken);
        const targetUserId = (caller.role === "admin" && args.userId) ? args.userId : caller._id;

        const now = Date.now();
        let createdAtMin: number | undefined;
        if (args.timeframe === "last_30_days") {
            createdAtMin = now - 30 * 24 * 60 * 60 * 1000;
        } else if (args.timeframe === "this_month") {
            const d = new Date();
            createdAtMin = new Date(d.getFullYear(), d.getMonth(), 1).getTime();
        } else if (args.timeframe === "this_year") {
            createdAtMin = new Date(new Date().getFullYear(), 0, 1).getTime();
        }

        let queryBuilder: any;

        if (args.status === "paid") {
            queryBuilder = ctx.db
                .query("rentals")
                .withIndex("by_userId_status", (q: any) => q.eq("userId", targetUserId).eq("status", "paid"));
        } else if (args.status === "returned") {
            queryBuilder = ctx.db
                .query("rentals")
                .withIndex("by_userId_status", (q: any) => q.eq("userId", targetUserId).eq("status", "returned"));
        } else {
            queryBuilder = ctx.db
                .query("rentals")
                .withIndex("by_userId", (q: any) => q.eq("userId", targetUserId))
                .filter((q: any) =>
                    q.or(q.eq(q.field("status"), "paid"), q.eq(q.field("status"), "returned"))
                );
        }

        if (createdAtMin !== undefined) {
            queryBuilder = queryBuilder.filter((q: any) => q.gte(q.field("createdAt"), createdAtMin));
        }

        const rentals = await queryBuilder.order("desc").take(50);

        const rentalsWithBooks = await Promise.all(
            rentals.map(async (rental: any) => {
                const book = await getBookWithCoverUrls(ctx, rental.bookId);
                return {
                    ...rental,
                    coverUrl: book?.coverUrl ?? null,
                    coverUrls: book?.coverUrls ?? [],
                    book,
                };
            })
        );

        return rentalsWithBooks;
    },
});

export const getAllRentals = query({
    args: { paginationOpts: paginationOptsValidator, accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const results = await ctx.db
            .query("rentals")
            .withIndex("by_createdAt")
            .order("desc")
            .paginate(args.paginationOpts);

        const rentalsWithDetails = await Promise.all(
            results.page.map(async (rental) => {
                const book = await getBookWithCoverUrls(ctx, rental.bookId);
                const user = await ctx.db.get(rental.userId);
                return {
                    ...rental,
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

export const getRental = query({
    args: { rentalId: v.id("rentals"), accessToken: v.string() },
    handler: async (ctx, args) => {
        const caller = await getAuthenticatedUser(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");

        if (rental.userId !== caller._id && caller.role !== "admin") {
            throw new Error("Unauthorized");
        }

        const book = await getBookWithCoverUrls(ctx, rental.bookId);
        const user = await ctx.db.get(rental.userId);
        let screenshotUrl: string | null = null;
        if (rental.paymentScreenshot) {
            screenshotUrl = await ctx.storage.getUrl(rental.paymentScreenshot);
        }

        return {
            ...rental,
            coverUrl: book?.coverUrl ?? null,
            coverUrls: book?.coverUrls ?? [],
            book,
            user: user
                ? { name: user.name, email: user.email, phone: user.phone }
                : null,
            screenshotUrl,
        };
    },
});

export const getBookRentals = query({
    args: { bookId: v.id("books"), accessToken: v.string(), limit: v.optional(v.number()) },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);

        const rentals = await ctx.db
            .query("rentals")
            .withIndex("by_bookId", (q) => q.eq("bookId", args.bookId))
            .order("desc")
            .take(args.limit ?? 50);

        const enriched = await Promise.all(
            rentals.map(async (rental) => {
                const user = await ctx.db.get(rental.userId);
                return {
                    _id: rental._id,
                    userName: user?.name ?? "Unknown",
                    userEmail: user?.email ?? "",
                    status: rental.status,
                    deliveryDate: rental.deliveryDate,
                    pickupDate: rental.pickupDate,
                    createdAt: rental.createdAt,
                };
            })
        );

        return enriched;
    },
});
