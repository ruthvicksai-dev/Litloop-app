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
    })
        .index("by_email", ["email"])
        .index("by_phone", ["phone"])
        .index("by_createdAt", ["createdAt"]),

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
        genre: v.optional(v.string()),
        genres: v.optional(v.array(v.string())),
        rating: v.optional(v.number()),
        ratingCount: v.optional(v.number()),
        bookViews: v.optional(v.number()),
        bookRentals: v.optional(v.number()),
        pageCount: v.optional(v.number()),
        publishedYear: v.optional(v.number()),
        publisher: v.optional(v.string()),
        isTop10: v.optional(v.boolean()),
        top10Position: v.optional(v.number()),
        isFamous: v.optional(v.boolean()),
        isTrending: v.optional(v.boolean()),
        series: v.optional(v.string()),
        searchText: v.optional(v.string()),
        coverImage: v.optional(v.id("_storage")),
        coverImages: v.optional(v.array(v.id("_storage"))),
        totalCopies: v.number(),
        availableCopies: v.number(),
        createdAt: v.number(),
    })
        .index("by_title", ["title"])
        .index("by_genre", ["genre"])
        .index("by_createdAt", ["createdAt"])
        .searchIndex("search_books", {
            searchField: "searchText",
            filterFields: ["genre"],
        }),

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
        .index("by_zone", ["zone"])
        .index("by_createdAt", ["createdAt"]),

    analytics_monthly: defineTable({
        month: v.string(),
        revenue: v.number(),
        rentals: v.number(),
        newUsers: v.number(),
        activeUsers: v.number(),
        createdAt: v.number(),
    }).index("by_month", ["month"]),

    analytics_daily: defineTable({
        date: v.string(),
        revenue: v.number(),
        rentals: v.number(),
        createdAt: v.number(),
    }).index("by_date", ["date"]),

    book_stats: defineTable({
        bookId: v.id("books"),
        rentals: v.number(),
        revenue: v.number(),
        lastRentedAt: v.number(),
        createdAt: v.number(),
    })
        .index("by_bookId", ["bookId"])
        .index("by_rentals", ["rentals"])
        .index("by_revenue", ["revenue"]),

    genre_stats: defineTable({
        genre: v.string(),
        rentals: v.number(),
        revenue: v.number(),
        createdAt: v.number(),
    })
        .index("by_genre", ["genre"])
        .index("by_rentals", ["rentals"])
        .index("by_revenue", ["revenue"]),

    favorites: defineTable({
        userId: v.id("users"),
        bookId: v.id("books"),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_bookId", ["bookId"])
        .index("by_user_book", ["userId", "bookId"]),

    user_month_activity: defineTable({
        userId: v.id("users"),
        month: v.string(),
        createdAt: v.number(),
    })
        .index("by_user_month", ["userId", "month"])
        .index("by_month", ["month"]),
});
