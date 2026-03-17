import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { recordRentalCreated, recordUserActivity } from "./analytics";

const LATE_FEE_PER_DAY = 3; // ₹3 per day

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
        userId: v.id("users"),
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
    },
    handler: async (ctx, args) => {
        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");
        if (book.availableCopies <= 0)
            throw new Error("This book is currently unavailable.");

        // Check for duplicate active rental
        const existingRentals = await ctx.db
            .query("rentals")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const duplicate = existingRentals.find(
            (r) =>
                r.bookId === args.bookId &&
                !["returned", "paid"].includes(r.status)
        );
        if (duplicate)
            throw new Error("You already have an active rental for this book.");

        if (!args.zone.trim()) throw new Error("Zone is required.");
        if (!args.deliveryLocation.phone.trim())
            throw new Error("Phone number is required.");

        if (args.zone === "College") {
            if (!args.deliveryLocation.roomNo?.trim()) throw new Error("Room number is required for College delivery.");
            if (!args.deliveryLocation.rollNo?.trim()) throw new Error("Roll number is required for College delivery.");
        } else if (args.zone === "Home") {
            if (!args.deliveryLocation.formattedAddress?.trim() && !args.deliveryLocation.area?.trim()) {
                throw new Error("Delivery address or location is required for Home delivery.");
            }
        }

        // Decrease available copies
        await ctx.db.patch(args.bookId, {
            availableCopies: book.availableCopies - 1,
        });

        const rentalId = await ctx.db.insert("rentals", {
            userId: args.userId,
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
            rentPerDay: book.rentPerDay,
            status: "requested",
            createdAt: Date.now(),
        });

        await recordRentalCreated(ctx, args.userId, Date.now());

        return rentalId;
    },
});

export const scheduleDelivery = mutation({
    args: {
        rentalId: v.id("rentals"),
        deliveryDate: v.string(),
        deliveryTime: v.string(),
    },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "requested")
            throw new Error("Rental must be in 'requested' status to schedule delivery.");

        if (!args.deliveryDate) throw new Error("Delivery date is required.");
        if (!args.deliveryTime) throw new Error("Delivery time is required.");

        await ctx.db.patch(args.rentalId, {
            deliveryDate: args.deliveryDate,
            deliveryTime: args.deliveryTime,
            status: "delivery_scheduled",
        });
    },
});

export const markDelivered = mutation({
    args: { rentalId: v.id("rentals") },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "delivery_scheduled")
            throw new Error("Rental must be 'delivery_scheduled' to mark as delivered.");

        await ctx.db.patch(args.rentalId, {
            status: "delivered",
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
    },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "delivered")
            throw new Error("Book must be delivered before scheduling pickup.");

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
    },
});

export const markReturned = mutation({
    args: { rentalId: v.id("rentals") },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "paid")
            throw new Error("Payment must be completed before marking book as returned.");

        // Increase available copies
        const book = await ctx.db.get(rental.bookId);
        if (book) {
            await ctx.db.patch(rental.bookId, {
                availableCopies: book.availableCopies + 1,
            });
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

        await recordUserActivity(ctx, rental.userId, Date.now());
    },
});

export const getUserRentals = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const rentals = await ctx.db
            .query("rentals")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const activeStatuses = [
            "requested",
            "delivery_scheduled",
            "delivered",
            "pickup_scheduled",
            "payment_pending",
        ];

        const activeRentals = rentals.filter((r) =>
            activeStatuses.includes(r.status)
        );

        // Attach book info
        const rentalsWithBooks = await Promise.all(
            activeRentals.map(async (rental) => {
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
        userId: v.id("users"),
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
    },
    handler: async (ctx, args) => {
        const rentals = await ctx.db
            .query("rentals")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const now = new Date();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
        const yearStart = new Date(now.getFullYear(), 0, 1).getTime();
        const last30DaysStart = now.getTime() - 30 * 24 * 60 * 60 * 1000;

        const completed = rentals
            .filter((r) => ["paid", "returned"].includes(r.status))
            .filter((r) => {
                if (!args.status || args.status === "all") return true;
                return r.status === args.status;
            })
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
            })
            .sort((a, b) => b.createdAt - a.createdAt);

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
    args: {},
    handler: async (ctx) => {
        const rentals = await ctx.db.query("rentals").collect();

        const rentalsWithDetails = await Promise.all(
            rentals.map(async (rental) => {
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

        return rentalsWithDetails;
    },
});

export const getRental = query({
    args: { rentalId: v.id("rentals") },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");

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
