import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { mutation, query } from "./_generated/server";
import { recordRentalCreated, recordUserActivity } from "./analytics";
import { assertAdmin, getAuthenticatedUser } from "./lib/authHelpers";
import { assertRateLimit, buildRateLimitKey } from "./lib/rateLimit";

const LATE_FEE_PER_DAY = 3; // ₹3 per day
const RENTAL_RATE_LIMITS = {
    requestRental: {
        limit: 5,
        windowMs: 30 * 60 * 1000,
        message: "Too many rental requests. Please try again later.",
    },
} as const;

function daysBetween(dateStr1: string, dateStr2: string): number {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffMs = d2.getTime() - d1.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

async function getBookWithCoverUrls(ctx: any, bookId: any) {
    const book = await ctx.db.get(bookId);
    if (!book) return null;

    let coverUrl: string | null = null;
    const coverUrls: string[] = [];

    if (book.coverImages && book.coverImages.length > 0) {
        for (const imageId of book.coverImages) {
            const url = await ctx.storage.getUrl(imageId);
            if (url) coverUrls.push(url);
        }
        if (coverUrls.length > 0) coverUrl = coverUrls[0];
    } else if (book.coverImage) {
        coverUrl = await ctx.storage.getUrl(book.coverImage);
        if (coverUrl) coverUrls.push(coverUrl);
    }

    return { ...book, coverUrl, coverUrls };
}
export const requestRental = mutation({
    args: {
        bookId: v.id("books"),
        zone: v.string(),
        deliveryLocation: v.object({
            phone: v.string(),
            landmark: v.optional(v.string()),
            area: v.optional(v.string()),
            city: v.optional(v.string()),
            roomNo: v.optional(v.string()),
            yearOfStudy: v.optional(v.string()),
            department: v.optional(v.string()),
            rollNo: v.optional(v.string()),
            latitude: v.optional(v.number()),
            longitude: v.optional(v.number()),
            formattedAddress: v.optional(v.string()),
        }),
        ipAddress: v.optional(v.string()),
        deviceInfo: v.optional(v.string()),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const userId = user._id;

        const rentalRequestKey = buildRateLimitKey("rental", "request", userId, args.ipAddress);
        assertRateLimit(rentalRequestKey, RENTAL_RATE_LIMITS.requestRental);

        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");
        if (book.availableCopies <= 0)
            throw new Error("This book is currently unavailable.");

        // Check for duplicate active rental
        const duplicate = await ctx.db
            .query("rentals")
            .withIndex("by_userId", (q) => q.eq("userId", userId))
            .filter((q) =>
                q.and(
                    q.eq(q.field("bookId"), args.bookId),
                    q.neq(q.field("status"), "returned"),
                    q.neq(q.field("status"), "paid")
                )
            )
            .first();

        if (duplicate)
            throw new Error("You already have an active rental for this book.");

        const ALLOWED_ZONES = ["Home", "College"];
        if (!ALLOWED_ZONES.includes(args.zone))
            throw new Error("Invalid zone. Must be 'Home' or 'College'.");

        const phoneRegex = /^\d{10}$/;
        if (!phoneRegex.test(args.deliveryLocation.phone.trim())) {
            throw new Error("Please provide a valid 10-digit phone number.");
        }

        if (args.zone === "College") {
            if (!args.deliveryLocation.roomNo?.trim()) throw new Error("Room number is required for College delivery.");
            if (!args.deliveryLocation.rollNo?.trim()) throw new Error("Roll number is required for College delivery.");
        } else if (args.zone === "Home") {
            if (!args.deliveryLocation.formattedAddress?.trim() && !args.deliveryLocation.area?.trim()) {
                throw new Error("Delivery address or location is required for Home delivery.");
            }
        }

        // C1: Re-read book immediately before decrement to prevent TOCTOU race condition.
        // Convex serializes mutations per-document, so this read-then-write is safe.
        const freshBook = await ctx.db.get(args.bookId);
        if (!freshBook || freshBook.availableCopies <= 0)
            throw new Error("This book is currently unavailable.");

        await ctx.db.patch(args.bookId, {
            availableCopies: freshBook.availableCopies - 1,
        });

        const rentalId = await ctx.db.insert("rentals", {
            userId: userId,
            bookId: args.bookId,
            zone: args.zone.trim(),
            deliveryLocation: {
                phone: args.deliveryLocation.phone.trim(),
                landmark: args.deliveryLocation.landmark?.trim(),
                area: args.deliveryLocation.area?.trim(),
                city: args.deliveryLocation.city?.trim(),
                roomNo: args.deliveryLocation.roomNo?.trim(),
                yearOfStudy: args.deliveryLocation.yearOfStudy?.trim(),
                department: args.deliveryLocation.department?.trim(),
                rollNo: args.deliveryLocation.rollNo?.trim(),
                latitude: args.deliveryLocation.latitude,
                longitude: args.deliveryLocation.longitude,
                formattedAddress: args.deliveryLocation.formattedAddress?.trim(),
            },
            rentPerDay: freshBook.rentPerDay,
            status: "requested",
            createdAt: Date.now(),
        });

        await recordRentalCreated(ctx, userId, Date.now());

        await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminsOfNewRental, {
            rentalId,
            bookTitle: book.title,
            userName: user?.name ?? "A user",
        });

        // Notify the user themselves
        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: userId,
            title: "Rental Requested 📚",
            body: `Your request for "${book.title}" has been received and is pending approval.`,
            dataJson: JSON.stringify({ rentalId, type: "rental" }),
        });

        return rentalId;
    },
});

export const scheduleDelivery = mutation({
    args: {
        rentalId: v.id("rentals"),
        deliveryDate: v.string(),
        deliveryTime: v.string(),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "requested")
            throw new Error("Rental must be in 'requested' status to schedule delivery.");

        if (!args.deliveryDate) throw new Error("Delivery date is required.");
        if (!args.deliveryTime) throw new Error("Delivery time is required.");
        // M6: Validate date and time format
        if (!/^\d{4}-\d{2}-\d{2}$/.test(args.deliveryDate))
            throw new Error("Invalid delivery date format. Use YYYY-MM-DD.");
        if (!/^\d{2}:\d{2}$/.test(args.deliveryTime))
            throw new Error("Invalid delivery time format. Use HH:MM.");

        await ctx.db.patch(args.rentalId, {
            deliveryDate: args.deliveryDate,
            deliveryTime: args.deliveryTime,
            status: "delivery_scheduled",
        });

        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Delivery Scheduled 🚚",
            body: `Your delivery for "${(await ctx.db.get(rental.bookId))?.title}" is scheduled for ${args.deliveryDate}.`,
            dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
        });
    },
});

export const markDelivered = mutation({
    args: { rentalId: v.id("rentals"), accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "delivery_scheduled")
            throw new Error("Rental must be 'delivery_scheduled' to mark as delivered.");

        await ctx.db.patch(args.rentalId, {
            status: "delivered",
        });

        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Book Delivered! 📖",
            body: `"${(await ctx.db.get(rental.bookId))?.title}" has been delivered. Enjoy your read!`,
            dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
        });
    },
});

export const schedulePickup = mutation({
    args: {
        rentalId: v.id("rentals"),
        pickupDate: v.string(),
        pickupTime: v.string(),
        userRating: v.number(),
        pickupLocation: v.optional(v.object({
            phone: v.string(),
            landmark: v.optional(v.string()),
            area: v.optional(v.string()),
            city: v.optional(v.string()),
            roomNo: v.optional(v.string()),
            yearOfStudy: v.optional(v.string()),
            department: v.optional(v.string()),
            rollNo: v.optional(v.string()),
            latitude: v.optional(v.number()),
            longitude: v.optional(v.number()),
            formattedAddress: v.optional(v.string()),
        })),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");

        if (rental.userId !== user._id && user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        if (rental.status !== "delivered")
            throw new Error("Book must be delivered before scheduling pickup.");

        // C5: Prevent double invocation (rating manipulation)
        if (rental.ratedAt) {
            throw new Error("Pickup has already been scheduled for this rental.");
        }

        if (!args.pickupDate) throw new Error("Pickup date is required.");
        if (!args.pickupTime) throw new Error("Pickup time is required.");
        if (!Number.isInteger(args.userRating) || args.userRating < 1 || args.userRating > 5) {
            throw new Error("Please provide a rating between 1 and 5 stars.");
        }

        if (!rental.deliveryDate)
            throw new Error("Delivery date missing for rent calculation.");

        // Validate pickup date is after delivery date
        if (new Date(args.pickupDate) <= new Date(rental.deliveryDate))
            throw new Error("Pickup date must be after delivery date.");

        const days = daysBetween(rental.deliveryDate, args.pickupDate);
        const totalRent = rental.rentPerDay * days;

        const book = await ctx.db.get(rental.bookId);
        if (!book) throw new Error("Book not found.");

        const currentRating = typeof book.rating === "number" ? book.rating : 0;
        const currentCount = typeof book.ratingCount === "number" ? book.ratingCount : 0;
        const nextCount = currentCount + 1;
        const nextRating = ((currentRating * currentCount) + args.userRating) / nextCount;

        await ctx.db.patch(rental.bookId, {
            rating: nextRating,
            ratingCount: nextCount,
        });

        await ctx.db.patch(args.rentalId, {
            pickupDate: args.pickupDate,
            pickupTime: args.pickupTime,
            pickupLocation: args.pickupLocation,
            totalRent,
            userRating: args.userRating,
            ratedAt: Date.now(),
            status: "pickup_scheduled",
        });

        // Notify admins that a pickup is scheduled
        await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminsOfPickupScheduled, {
            rentalId: args.rentalId,
            bookTitle: book?.title ?? "A book",
            userName: user?.name ?? "A user",
        });
    },
});

export const markReturned = mutation({
    args: { rentalId: v.id("rentals"), accessToken: v.string() },
    handler: async (ctx, args) => {
        await assertAdmin(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "paid")
            throw new Error("Payment must be completed before marking book as returned.");

        // C1: Re-read book immediately before increment to close TOCTOU window
        const freshBook = await ctx.db.get(rental.bookId);
        if (freshBook) {
            const nextAvailable = freshBook.availableCopies + 1;
            await ctx.db.patch(rental.bookId, {
                availableCopies: nextAvailable,
            });

            // If it was out of stock and now is available, notify
            if (freshBook.availableCopies === 0 && nextAvailable > 0) {
                await ctx.scheduler.runAfter(0, internal.notifications.notifySubscribersOfAvailability, {
                    bookId: rental.bookId,
                    bookTitle: freshBook.title,
                });
            }
        }

        // Calculate potential late fee
        let lateFee = 0;
        if (rental.pickupDate) {
            const today = new Date().toISOString().split("T")[0];
            const lateDays = daysBetween(rental.pickupDate, today);
            if (lateDays > 0) {
                lateFee = lateDays * LATE_FEE_PER_DAY;
            }
        }

        await ctx.db.patch(args.rentalId, {
            status: "returned",
            lateFee: lateFee > 0 ? lateFee : undefined,
        });

        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Return Success ✅",
            body: `Your return for "${(await ctx.db.get(rental.bookId))?.title}" has been processed.`,
            dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
        });

        await recordUserActivity(ctx, rental.userId, Date.now());
    },
});

export const getUserRentals = query({
    args: { accessToken: v.string(), userId: v.optional(v.id("users")) },
    handler: async (ctx, args) => {
        const caller = await getAuthenticatedUser(ctx, args.accessToken);
        const targetUserId = (caller.role === "admin" && args.userId) ? args.userId : caller._id;

        const activeStatuses = [
            "requested",
            "delivery_scheduled",
            "delivered",
            "pickup_scheduled",
            "payment_pending",
        ];

        // Fetch active rentals using database filtering
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
            .collect();

        // Attach book info
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
        const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1).getTime();
        const yearStart = new Date(new Date().getFullYear(), 0, 1).getTime();
        const last30DaysStart = now - 30 * 24 * 60 * 60 * 1000;

        let queryBuilder;

        // Use database filtering for status if specific
        if (args.status === "paid") {
            queryBuilder = ctx.db
                .query("rentals")
                .withIndex("by_userId_status", (q) => q.eq("userId", targetUserId).eq("status", "paid"));
        } else if (args.status === "returned") {
            queryBuilder = ctx.db
                .query("rentals")
                .withIndex("by_userId_status", (q) => q.eq("userId", targetUserId).eq("status", "returned"));
        } else {
            // "all" - filter completed statuses in DB
            queryBuilder = ctx.db
                .query("rentals")
                .withIndex("by_userId", (q) => q.eq("userId", targetUserId))
                .filter((q) =>
                    q.or(q.eq(q.field("status"), "paid"), q.eq(q.field("status"), "returned"))
                );
        }

        const rentals = await queryBuilder.order("desc").collect();

        const completed = rentals
            .filter((r) => {
                switch (args.timeframe) {
                    case "last_30_days":
                        return r.createdAt >= last30DaysStart;
                    case "this_month":
                        return r.createdAt >= monthStart;
                    case "this_year":
                        return r.createdAt >= yearStart;
                    case "all":
                    default:
                        return true;
                }
            });

        const rentalsWithBooks = await Promise.all(
            completed.map(async (rental) => {
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
