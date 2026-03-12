import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        phone: v.string(),
        passwordHash: v.string(),
        role: v.union(v.literal("user"), v.literal("admin")),
        createdAt: v.number(),
    }).index("by_email", ["email"]),

    sessions: defineTable({
        userId: v.id("users"),
        tokenHash: v.string(),
        expiresAt: v.number(),
        createdAt: v.number(),
    })
        .index("by_tokenHash", ["tokenHash"])
        .index("by_userId", ["userId"]),

    books: defineTable({
        title: v.string(),
        author: v.string(),
        description: v.string(),
        rentPerDay: v.number(),
        coverImage: v.optional(v.id("_storage")),
        coverImages: v.optional(v.array(v.id("_storage"))),
        totalCopies: v.number(),
        availableCopies: v.number(),
        createdAt: v.number(),
    }).index("by_title", ["title"]),

    rentals: defineTable({
        userId: v.id("users"),
        bookId: v.id("books"),
        zone: v.string(),
        deliveryLocation: v.object({
            area: v.string(),
            city: v.string(),
            landmark: v.string(),
            phone: v.string(),
        }),
        deliveryDate: v.optional(v.string()),
        deliveryTime: v.optional(v.string()),
        pickupDate: v.optional(v.string()),
        pickupTime: v.optional(v.string()),
        rentPerDay: v.number(),
        totalRent: v.optional(v.number()),
        status: v.union(
            v.literal("requested"),
            v.literal("delivery_scheduled"),
            v.literal("delivered"),
            v.literal("pickup_scheduled"),
            v.literal("payment_pending"),
            v.literal("paid"),
            v.literal("returned")
        ),
        paymentMethod: v.optional(
            v.union(v.literal("upi"), v.literal("cash"))
        ),
        paymentStatus: v.optional(
            v.union(
                v.literal("pending"),
                v.literal("verification_pending"),
                v.literal("cash_pending"),
                v.literal("paid"),
                v.literal("rejected")
            )
        ),
        utrNumber: v.optional(v.string()),
        paymentScreenshot: v.optional(v.id("_storage")),
        lateFee: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_status", ["status"])
        .index("by_zone", ["zone"]),
});
