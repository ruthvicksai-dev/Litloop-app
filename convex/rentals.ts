import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import {
    ALLOWED_AREAS,
    getDeliveryAreaByName,
    validateDeliveryAreaSelection,
} from "../utils/areaUtils";
import { internal } from "./_generated/api";
import { internalMutation, mutation, query } from "./_generated/server";
import { recordRentalCreated, recordUserActivity } from "./analytics";
import { assertAdmin, getAuthenticatedUser } from "./lib/authHelpers";
import { getBookWithCoverUrls } from "./lib/bookHelpers";
import { assertRateLimit, buildRateLimitKey } from "./lib/rateLimit";

const VALID_SLOTS: Record<string, number> = {
    "Morning (9 AM - 12 PM)": 9,
    "Midday (12 PM - 3 PM)": 12,
    "Afternoon (3 PM - 6 PM)": 15,
    "Evening (6 PM - 9 PM)": 18,
};

function getSlotStartHour(timeStr: string): number | null {
    if (timeStr in VALID_SLOTS) return VALID_SLOTS[timeStr];

    // Legacy support for older HH:MM AM/PM format
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s?(AM|PM|am|pm)$/i);
    if (match) {
        let hour = parseInt(match[1], 10);
        const ampm = match[3].toUpperCase();
        if (ampm === "PM" && hour < 12) hour += 12;
        if (ampm === "AM" && hour === 12) hour = 0;
        return hour;
    }
    return null;
}

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

/**
 * H6 helper: Safely compute a new running average rating after removing one vote.
 * Guards against division by zero, NaN, and -Infinity.
 */
function safeRatingRollback(
    currentRating: number | undefined,
    currentCount: number | undefined,
    removedRating: number
): { rating: number; ratingCount: number } {
    const safeCurrentRating = typeof currentRating === "number" && Number.isFinite(currentRating) ? currentRating : 0;
    const safeCurrentCount = typeof currentCount === "number" && Number.isFinite(currentCount) ? currentCount : 0;
    const nextCount = Math.max(0, safeCurrentCount - 1);

    if (nextCount === 0) {
        return { rating: 0, ratingCount: 0 };
    }

    const nextRating = ((safeCurrentRating * safeCurrentCount) - removedRating) / nextCount;
    return {
        rating: Number.isFinite(nextRating) ? Math.max(0, nextRating) : 0,
        ratingCount: nextCount,
    };
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

        // H1: DB-backed rate limit
        const rentalRequestKey = buildRateLimitKey("rental", "request", userId, args.ipAddress);
        await assertRateLimit(ctx, rentalRequestKey, RENTAL_RATE_LIMITS.requestRental);

        if (args.zone === "Home") {
            const selectedArea = args.deliveryLocation.area?.trim() ?? "";
            if (!selectedArea) {
                throw new Error("Please select a delivery area.");
            }
            if (!(ALLOWED_AREAS as readonly string[]).includes(selectedArea) || !getDeliveryAreaByName(selectedArea)) {
                throw new Error("Service not available in your area. Please select a valid delivery area in Guntur.");
            }

            const areaValidation = validateDeliveryAreaSelection({
                selectedArea,
                formattedAddress: args.deliveryLocation.formattedAddress,
                latitude: args.deliveryLocation.latitude,
                longitude: args.deliveryLocation.longitude,
            });

            if (!areaValidation.isValid) {
                throw new Error(areaValidation.message);
            }
        }

        const book = await ctx.db.get(args.bookId);
        if (!book) throw new Error("Book not found.");
        if (book.availableCopies <= 0)
            throw new Error("This book is currently unavailable.");

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

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];

        const maxDate = new Date();
        maxDate.setDate(now.getDate() + 5);
        const maxDateStr = maxDate.toISOString().split('T')[0];

        if (args.deliveryDate < todayStr) throw new Error("Cannot schedule delivery in the past.");
        if (args.deliveryDate > maxDateStr) throw new Error("Cannot schedule delivery more than 5 days in advance.");

        const slotStartHour = VALID_SLOTS[args.deliveryTime];
        if (slotStartHour === undefined) {
            throw new Error("Invalid delivery time slot.");
        }

        if (args.deliveryDate === todayStr) {
            const currentHour = now.getHours();
            if (slotStartHour < currentHour + 1) {
                throw new Error("Delivery must be scheduled at least 1 hour in advance.");
            }
        }

        await ctx.db.patch(args.rentalId, {
            deliveryDate: args.deliveryDate,
            deliveryTime: args.deliveryTime,
            status: "delivery_scheduled",
        });

        const book = await ctx.db.get(rental.bookId);
        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Delivery Scheduled 🚚",
            body: `Your delivery for "${book?.title ?? "your book"}" is scheduled for ${args.deliveryDate}.`,
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

        const book = await ctx.db.get(rental.bookId);
        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Book Delivered! 📖",
            body: `"${book?.title ?? "Your book"}" has been delivered. Enjoy your read!`,
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
        reviewText: v.optional(v.string()),
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

        if (args.pickupLocation && rental.zone === "Home") {
            const selectedArea = args.pickupLocation.area?.trim() ?? "";
            if (!selectedArea) {
                throw new Error("Please select your pickup area.");
            }
            if (!(ALLOWED_AREAS as readonly string[]).includes(selectedArea) || !getDeliveryAreaByName(selectedArea)) {
                throw new Error("Service not available in your area. Please select a valid delivery area in Guntur.");
            }

            const areaValidation = validateDeliveryAreaSelection({
                selectedArea,
                formattedAddress: args.pickupLocation.formattedAddress,
                latitude: args.pickupLocation.latitude,
                longitude: args.pickupLocation.longitude,
            });

            if (!areaValidation.isValid) {
                throw new Error(areaValidation.message);
            }
        }

        if (rental.status !== "delivered")
            throw new Error("Book must be delivered before scheduling pickup.");

        if (rental.ratedAt) {
            throw new Error("Pickup has already been scheduled for this rental.");
        }

        if (!args.pickupDate) throw new Error("Pickup date is required.");
        if (!args.pickupTime) throw new Error("Pickup time is required.");

        const now = new Date();
        const todayStr = now.toISOString().split('T')[0];
        const maxDate = new Date();
        maxDate.setDate(now.getDate() + 5);
        const maxDateStr = maxDate.toISOString().split('T')[0];

        if (args.pickupDate <= todayStr) throw new Error("Cannot schedule pickup for today. Please provide at least 1 day notice.");
        if (args.pickupDate > maxDateStr) throw new Error("Cannot schedule pickup more than 5 days in advance.");

        const slotStartHour = VALID_SLOTS[args.pickupTime];
        if (slotStartHour === undefined) {
            throw new Error("Invalid pickup time slot.");
        }

        if (!rental.deliveryDate || !rental.deliveryTime)
            throw new Error("Delivery date/time missing for rent calculation.");

        if (args.pickupDate <= rental.deliveryDate) {
            throw new Error("Pickup date must be strictly after the delivery date.");
        }

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

        // C3: Prevent duplicate review on rapid double-tap
        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_rentalId", (q) => q.eq("rentalId", args.rentalId))
            .first();
        if (existingReview) {
            throw new Error("A review has already been submitted for this rental.");
        }

        // Insert review record
        await ctx.db.insert("reviews", {
            bookId: rental.bookId,
            userId: user._id,
            rentalId: args.rentalId,
            rating: args.userRating,
            reviewText: args.reviewText?.trim() || undefined,
            createdAt: Date.now(),
        });

        const expiresAt = Date.now() + 60 * 60 * 1000;
        await ctx.db.patch(args.rentalId, {
            pickupDate: args.pickupDate,
            pickupTime: args.pickupTime,
            pickupLocation: args.pickupLocation,
            totalRent,
            userRating: args.userRating,
            ratedAt: Date.now(),
            status: "pickup_scheduled",
            paymentStatus: "pending",
            paymentExpiresAt: expiresAt,
        });

        // Notify admins that a pickup is scheduled
        await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminsOfPickupScheduled, {
            rentalId: args.rentalId,
            bookTitle: book?.title ?? "A book",
            userName: user?.name ?? "A user",
        });

        // M6: Pre-expiry warning — notify user 10 min before auto-cancel (at 50 min mark)
        await ctx.scheduler.runAfter(50 * 60 * 1000, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "⏰ Payment Reminder",
            body: `Your pickup payment for "${book.title}" expires in 10 minutes. Please complete your payment now to keep the pickup slot.`,
            dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
        });

        // Auto-cancel if payment isn't completed within 1 hour
        await ctx.scheduler.runAfter(60 * 60 * 1000, internal.rentals.autoCancelPickup, {
            rentalId: args.rentalId,
        });
    },
});

export const cancelPickup = mutation({
    args: {
        rentalId: v.id("rentals"),
        accessToken: v.string(),
    },
    handler: async (ctx, args) => {
        const user = await getAuthenticatedUser(ctx, args.accessToken);
        const rental = await ctx.db.get(args.rentalId);
        if (!rental) throw new Error("Rental not found.");

        if (rental.userId !== user._id && user.role !== "admin") {
            throw new Error("Unauthorized");
        }

        if (rental.status !== "pickup_scheduled")
            throw new Error("Rental must be 'pickup_scheduled' to cancel pickup.");

        // H6: Safe rating rollback — guards against NaN and -Infinity
        if (rental.userRating) {
            const book = await ctx.db.get(rental.bookId);
            if (book) {
                const { rating, ratingCount } = safeRatingRollback(
                    book.rating,
                    book.ratingCount,
                    rental.userRating
                );
                await ctx.db.patch(rental.bookId, { rating, ratingCount });
            }
        }

        await ctx.db.patch(args.rentalId, {
            pickupDate: undefined,
            pickupTime: undefined,
            pickupLocation: undefined,
            totalRent: undefined,
            userRating: undefined,
            ratedAt: undefined,
            paymentStatus: undefined,
            paymentExpiresAt: undefined,
            status: "delivered",
        });

        // M5: Notify user about cancellation
        const book = await ctx.db.get(rental.bookId);
        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Pickup Cancelled",
            body: `Your pickup for "${book?.title ?? "your book"}" has been cancelled. You can reschedule at any time.`,
            dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
        });
    },
});

export const autoCancelPickup = internalMutation({
    args: { rentalId: v.id("rentals") },
    handler: async (ctx, args) => {
        const rental = await ctx.db.get(args.rentalId);
        if (!rental || rental.status !== "pickup_scheduled") return;

        // H6: Safe rating rollback
        if (rental.userRating) {
            const book = await ctx.db.get(rental.bookId);
            if (book) {
                const { rating, ratingCount } = safeRatingRollback(
                    book.rating,
                    book.ratingCount,
                    rental.userRating
                );
                await ctx.db.patch(rental.bookId, { rating, ratingCount });
            }
        }

        await ctx.db.patch(args.rentalId, {
            pickupDate: undefined,
            pickupTime: undefined,
            pickupLocation: undefined,
            totalRent: undefined,
            userRating: undefined,
            ratedAt: undefined,
            paymentStatus: undefined,
            paymentExpiresAt: undefined,
            status: "delivered",
        });

        const book = await ctx.db.get(rental.bookId);
        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Pickup Auto-Cancelled ⏳",
            body: `Your scheduled pickup for "${book?.title ?? "your book"}" was cancelled due to incomplete payment. Your rental timer has resumed.`,
            dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
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

        const freshBook = await ctx.db.get(rental.bookId);
        if (freshBook) {
            const nextAvailable = freshBook.availableCopies + 1;
            await ctx.db.patch(rental.bookId, {
                availableCopies: nextAvailable,
            });

            if (freshBook.availableCopies === 0 && nextAvailable > 0) {
                await ctx.scheduler.runAfter(0, internal.notifications.notifySubscribersOfAvailability, {
                    bookId: rental.bookId,
                    bookTitle: freshBook.title,
                });
            }
        }

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

        const book = await ctx.db.get(rental.bookId);
        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Return Success ✅",
            body: `Your return for "${book?.title ?? "your book"}" has been processed.`,
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

        // Capped at 25 — a user won't realistically have more than 25 active rentals.
        // Prevents unbounded reads that waste function call budget.
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

/**
 * L1 FIX: Timeframe filtering now uses DB-side createdAt range instead of
 * fetching all records and filtering in JavaScript.
 */
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

        // L1: Compute the createdAt lower bound in JS, pass to DB filter
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

        // L1: Apply createdAt lower bound directly in DB filter
        if (createdAtMin !== undefined) {
            queryBuilder = queryBuilder.filter((q: any) => q.gte(q.field("createdAt"), createdAtMin));
        }

        // Capped at 50 to bound reads per query. Users with extensive history
        // will see the most recent 50 entries.
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
