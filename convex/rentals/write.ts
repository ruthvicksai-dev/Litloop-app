import { v } from "convex/values";
import { internal } from "../_generated/api";
import { mutation } from "../_generated/server";
import { recordRentalCreated, recordRentalReturned, recordUserActivity } from "../analytics";
import { insertAuditLog } from "../lib/auditLog";
import { assertAdmin, getAuthenticatedUser } from "../lib/authHelpers";
import { assertRateLimit, buildRateLimitKey } from "../lib/rateLimit";
import { incrementRatingCountPatch } from "../lib/reviewCounters";
import { ALLOWED_AREAS, getDeliveryAreaByName, validateDeliveryAreaSelection } from "../../utils/location/areas";
import { LATE_FEE_PER_DAY, RENTAL_RATE_LIMITS, VALID_SLOTS, daysBetween, safeRatingRollback, rollbackRentalRatingAndReview } from "./helpers";

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
        await assertRateLimit(ctx, rentalRequestKey, RENTAL_RATE_LIMITS.requestRental);

        if (args.zone === "College") {
            if (!user.isVerifiedStudent && user.role !== "admin") {
                throw new Error(
                    "Only verified students from KITS can place orders in the College Zone. " +
                    "Please verify your student status in Profile → Verify Student."
                );
            }
        }

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

        const freshBook = await ctx.db.get(args.bookId);
        if (!freshBook || freshBook.availableCopies <= 0)
            throw new Error("This book is currently unavailable.");

        await ctx.db.patch(args.bookId, {
            availableCopies: freshBook.availableCopies - 1,
        });

        const isHome = args.zone.trim() === "Home";
        const sanitizedDeliveryLocation = {
            phone: args.deliveryLocation.phone.trim(),
            area: isHome ? args.deliveryLocation.area?.trim() || undefined : undefined,
            landmark: args.deliveryLocation.landmark?.trim() || undefined,
            city: isHome ? args.deliveryLocation.city?.trim() || undefined : undefined,
            roomNo: !isHome ? args.deliveryLocation.roomNo?.trim() || undefined : undefined,
            yearOfStudy: !isHome ? args.deliveryLocation.yearOfStudy?.trim() || undefined : undefined,
            department: !isHome ? args.deliveryLocation.department?.trim() || undefined : undefined,
            rollNo: !isHome ? args.deliveryLocation.rollNo?.trim() || undefined : undefined,
            latitude: isHome ? args.deliveryLocation.latitude : undefined,
            longitude: isHome ? args.deliveryLocation.longitude : undefined,
            formattedAddress: isHome ? args.deliveryLocation.formattedAddress?.trim() || undefined : undefined,
        };

        const rentalId = await ctx.db.insert("rentals", {
            userId: userId,
            bookId: args.bookId,
            zone: args.zone.trim(),
            deliveryLocation: sanitizedDeliveryLocation,
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
            const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
            const slotCutoffHour = slotStartHour + 2.5; // Cutoff 30 mins before slot end (e.g. 2:30 PM for 12-3 PM slot)
            if (currentDecimalHour > slotCutoffHour) {
                throw new Error("Selected delivery slot has expired for today.");
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
            deliveredAt: Date.now(),
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

        // S-06 FIX: Validate rating bounds to prevent aggregate corruption
        if (!Number.isFinite(args.userRating) || args.userRating < 1 || args.userRating > 5) {
            throw new Error("Rating must be between 1 and 5.");
        }

        if (args.pickupLocation) {
            const isCollegePickup = Boolean(args.pickupLocation.roomNo || args.pickupLocation.rollNo);

            if (isCollegePickup) {
                if (!args.pickupLocation.roomNo?.trim()) {
                    throw new Error("Room number is required for College pickup.");
                }
                if (!args.pickupLocation.rollNo?.trim()) {
                    throw new Error("Roll number is required for College pickup.");
                }
            } else {
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

        if (args.pickupDate < todayStr) throw new Error("Cannot schedule pickup in the past.");
        if (args.pickupDate > maxDateStr) throw new Error("Cannot schedule pickup more than 5 days in advance.");

        const slotStartHour = VALID_SLOTS[args.pickupTime];
        if (slotStartHour === undefined) {
            throw new Error("Invalid pickup time slot.");
        }

        if (args.pickupDate === todayStr) {
            const currentDecimalHour = now.getHours() + now.getMinutes() / 60;
            const slotCutoffHour = slotStartHour + 2.5; // Cutoff 30 mins before slot end (e.g. 2:30 PM for 12-3 PM slot)
            if (currentDecimalHour > slotCutoffHour) {
                throw new Error("Selected pickup slot has expired for today.");
            }
        }

        const deliveryTimestamp = rental.deliveredAt ?? (rental.deliveryDate ? new Date(rental.deliveryDate).getTime() : rental.createdAt);
        const TWELVE_HOURS_MS = 12 * 60 * 60 * 1000;
        const elapsedMs = Math.max(0, now.getTime() - deliveryTimestamp);

        if (elapsedMs < TWELVE_HOURS_MS) {
            throw new Error("Return pickup can strictly be scheduled only 12 hours after delivery.");
        }

        const days = Math.max(1, Math.floor(elapsedMs / (24 * 60 * 60 * 1000)) + 1);
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
            avgRating: nextRating,
            totalReviews: nextCount,
            ...incrementRatingCountPatch(book, args.userRating, 1),
        });

        const existingReview = await ctx.db
            .query("reviews")
            .withIndex("by_rentalId", (q) => q.eq("rentalId", args.rentalId))
            .first();
        if (existingReview) {
            throw new Error("A review has already been submitted for this rental.");
        }

        await ctx.db.insert("reviews", {
            bookId: rental.bookId,
            userId: user._id,
            rentalId: args.rentalId,
            rating: args.userRating,
            reviewText: args.reviewText?.trim() || undefined,
            createdAt: Date.now(),
        });

        const expiresAt = Date.now() + 60 * 60 * 1000;
        const finalPickupLocation = args.pickupLocation ?? rental.deliveryLocation;

        await ctx.db.patch(args.rentalId, {
            pickupDate: args.pickupDate,
            pickupTime: args.pickupTime,
            pickupLocation: finalPickupLocation,
            totalRent,
            userRating: args.userRating,
            ratedAt: Date.now(),
            status: "pickup_scheduled",
            paymentStatus: "pending",
            paymentExpiresAt: expiresAt,
        });

        await insertAuditLog(ctx, "pickup_scheduled", user._id, args.rentalId, "rental", {
            pickupDate: args.pickupDate,
            pickupTime: args.pickupTime,
            totalRent,
            userRating: args.userRating,
        });

        await ctx.scheduler.runAfter(0, internal.notifications.notifyAdminsOfPickupScheduled, {
            rentalId: args.rentalId,
            bookTitle: book?.title ?? "A book",
            userName: user?.name ?? "A user",
        });

        await ctx.scheduler.runAfter(50 * 60 * 1000, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "⏰ Payment Reminder",
            body: `Your pickup payment for "${book.title}" expires in 10 minutes. Please complete your payment now to keep the pickup slot.`,
            dataJson: JSON.stringify({ rentalId: args.rentalId, type: "rental" }),
        });

        await ctx.scheduler.runAfter(60 * 60 * 1000, internal.rentals.internal.autoCancelPickup, {
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

        await rollbackRentalRatingAndReview(ctx, rental);

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

        await insertAuditLog(ctx, "pickup_cancelled", user._id, args.rentalId, "rental", {
            previousStatus: rental.status,
        });

        const book = await ctx.db.get(rental.bookId);
        await ctx.scheduler.runAfter(0, internal.notifications.notifyUser, {
            userId: rental.userId,
            title: "Pickup Cancelled",
            body: `Your pickup for "${book?.title ?? "your book"}" has been cancelled. You can reschedule at any time.`,
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
        await recordRentalReturned(ctx);

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

export const migrateLegacyRentals = mutation({
    args: { accessToken: v.optional(v.string()) },
    handler: async (ctx) => {
        const rentals = await ctx.db.query("rentals").collect();
        let updatedCount = 0;
        for (const rental of rentals) {
            if (
                rental.deliveredAt === undefined &&
                (rental.status === "delivered" ||
                    rental.status === "pickup_scheduled" ||
                    rental.status === "payment_pending" ||
                    rental.status === "paid" ||
                    rental.status === "returned")
            ) {
                const timestamp = rental.deliveryDate
                    ? new Date(rental.deliveryDate).getTime()
                    : rental.createdAt;
                await ctx.db.patch(rental._id, {
                    deliveredAt: timestamp,
                });
                updatedCount++;
            }
        }
        return { updatedCount, totalRentals: rentals.length };
    },
});
