import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

const LATE_FEE_PER_DAY = 3; // ₹3 per day

function daysBetween(dateStr1: string, dateStr2: string): number {
    const d1 = new Date(dateStr1);
    const d2 = new Date(dateStr2);
    const diffMs = d2.getTime() - d1.getTime();
    return Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export const requestRental = mutation({
    args: {
        userId: v.id("users"),
        bookId: v.id("books"),
        zone: v.string(),
        deliveryLocation: v.object({
            area: v.string(),
            city: v.string(),
            landmark: v.string(),
            phone: v.string(),
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
        if (!args.deliveryLocation.area.trim())
            throw new Error("Area/Hostel/Apartment is required.");
        if (!args.deliveryLocation.city.trim())
            throw new Error("City is required.");
        if (!args.deliveryLocation.phone.trim())
            throw new Error("Phone number is required.");

        // Decrease available copies
        await ctx.db.patch(args.bookId, {
            availableCopies: book.availableCopies - 1,
        });

        const rentalId = await ctx.db.insert("rentals", {
            userId: args.userId,
            bookId: args.bookId,
            zone: args.zone.trim(),
            deliveryLocation: {
                area: args.deliveryLocation.area.trim(),
                city: args.deliveryLocation.city.trim(),
                landmark: args.deliveryLocation.landmark.trim(),
                phone: args.deliveryLocation.phone.trim(),
            },
            rentPerDay: book.rentPerDay,
            status: "requested",
            createdAt: Date.now(),
        });

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
    },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");
        if (rental.status !== "delivered")
            throw new Error("Book must be delivered before scheduling pickup.");

        if (!args.pickupDate) throw new Error("Pickup date is required.");
        if (!args.pickupTime) throw new Error("Pickup time is required.");

        if (!rental.deliveryDate)
            throw new Error("Delivery date missing for rent calculation.");

        // Validate pickup date is after delivery date
        if (new Date(args.pickupDate) <= new Date(rental.deliveryDate))
            throw new Error("Pickup date must be after delivery date.");

        const days = daysBetween(rental.deliveryDate, args.pickupDate);
        const totalRent = rental.rentPerDay * days;

        await ctx.db.patch(args.rentalId, {
            pickupDate: args.pickupDate,
            pickupTime: args.pickupTime,
            totalRent,
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
                const book = await ctx.db.get(rental.bookId);
                let coverUrl: string | null = null;
                if (book?.coverImage) {
                    coverUrl = await ctx.storage.getUrl(book.coverImage);
                }
                return {
                    ...rental,
                    book: book ? { ...book, coverUrl } : null,
                };
            })
        );

        return rentalsWithBooks;
    },
});

export const getRentalHistory = query({
    args: { userId: v.id("users") },
    handler: async (ctx, args) => {
        const rentals = await ctx.db
            .query("rentals")
            .withIndex("by_userId", (q) => q.eq("userId", args.userId))
            .collect();

        const completedStatuses = ["paid", "returned"];
        const completed = rentals.filter((r) =>
            completedStatuses.includes(r.status)
        );

        const rentalsWithBooks = await Promise.all(
            completed.map(async (rental) => {
                const book = await ctx.db.get(rental.bookId);
                let coverUrl: string | null = null;
                if (book?.coverImage) {
                    coverUrl = await ctx.storage.getUrl(book.coverImage);
                }
                return {
                    ...rental,
                    book: book ? { ...book, coverUrl } : null,
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
                const book = await ctx.db.get(rental.bookId);
                const user = await ctx.db.get(rental.userId);
                let coverUrl: string | null = null;
                if (book?.coverImage) {
                    coverUrl = await ctx.storage.getUrl(book.coverImage);
                }
                return {
                    ...rental,
                    book: book ? { ...book, coverUrl } : null,
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

        const book = await ctx.db.get(rental.bookId);
        const user = await ctx.db.get(rental.userId);
        let coverUrl: string | null = null;
        if (book?.coverImage) {
            coverUrl = await ctx.storage.getUrl(book.coverImage);
        }
        let screenshotUrl: string | null = null;
        if (rental.paymentScreenshot) {
            screenshotUrl = await ctx.storage.getUrl(rental.paymentScreenshot);
        }

        return {
            ...rental,
            book: book ? { ...book, coverUrl } : null,
            user: user
                ? { name: user.name, email: user.email, phone: user.phone }
                : null,
            screenshotUrl,
        };
    },
});
