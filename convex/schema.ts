import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
    users: defineTable({
        name: v.string(),
        email: v.string(),
        phone: v.optional(v.string()),
        passwordHash: v.optional(v.string()),
        providers: v.optional(v.array(v.union(v.literal("local"), v.literal("google")))),
        avatarUrl: v.optional(v.string()),
        lastLoginProvider: v.optional(v.union(v.literal("local"), v.literal("google"))),
        role: v.union(v.literal("user"), v.literal("admin")),
        pushToken: v.optional(v.string()),
        acceptedTerms: v.optional(v.boolean()),
        acceptedAt: v.optional(v.number()),
        isVerifiedStudent: v.optional(v.boolean()),
        createdAt: v.number(),
    })
        .index("by_email", ["email"])
        .index("by_phone", ["phone"])
        .index("by_role", ["role"])
        .index("by_pushToken", ["pushToken"])
        .index("by_createdAt", ["createdAt"]),

    book_notifications: defineTable({
        userId: v.id("users"),
        bookId: v.id("books"),
        createdAt: v.number(),
    })
        .index("by_bookId", ["bookId"])
        .index("by_userId_bookId", ["userId", "bookId"]),

    user_notifications: defineTable({
        userId: v.id("users"),
        title: v.string(),
        body: v.string(),
        type: v.string(),          // "rental" | "book" | "general"
        dataJson: v.optional(v.string()), // JSON-encoded navigation data
        isRead: v.boolean(),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_userId_isRead", ["userId", "isRead"])
        .index("by_createdAt", ["createdAt"]),

    sessions: defineTable({
        userId: v.id("users"),
        refreshTokenHash: v.optional(v.string()),
        tokenHash: v.optional(v.string()),
        deviceInfo: v.optional(v.string()),
        ipAddress: v.optional(v.string()),
        isRevoked: v.optional(v.boolean()),
        expiresAt: v.number(),
        replacedBySessionId: v.optional(v.id("sessions")),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_refreshTokenHash", ["refreshTokenHash"])
        .index("by_userId_active", ["userId", "isRevoked"]),

    // OTP Email Verification Requests
    otp_requests: defineTable({
        email: v.string(),
        otpCodeHash: v.string(), // Server-hashed 6-digit OTP
        signupData: v.optional(v.string()), // JSON string of registration payload
        expiresAt: v.number(),
        isVerified: v.boolean(),
        createdAt: v.number(), // Timestamp for cleanup
    }).index("by_email", ["email"]),

    reviews: defineTable({
        bookId: v.id("books"),
        userId: v.id("users"),
        rentalId: v.id("rentals"),
        rating: v.number(),
        reviewText: v.optional(v.string()),
        helpfulCount: v.optional(v.number()),
        unhelpfulCount: v.optional(v.number()),
        isFlagged: v.optional(v.boolean()),
        createdAt: v.number(),
    })
        .index("by_bookId", ["bookId"])
        .index("by_userId_bookId", ["userId", "bookId"])
        .index("by_rentalId", ["rentalId"])
        .index("by_isFlagged", ["isFlagged"]),

    review_votes: defineTable({
        userId: v.id("users"),
        reviewId: v.id("reviews"),
        voteType: v.union(v.literal("helpful"), v.literal("unhelpful")),
        createdAt: v.number(),
    })
        .index("by_reviewId", ["reviewId"])
        .index("by_user_review", ["userId", "reviewId"]),

    book_series: defineTable({
        name: v.string(),
        coverImage: v.id("_storage"),
        description: v.optional(v.string()),
        createdAt: v.number(),
    }).index("by_name", ["name"]),

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
        rankingScore: v.optional(v.number()),
        pageCount: v.optional(v.number()),
        publishedYear: v.optional(v.number()),
        publisher: v.optional(v.string()),
        isbn: v.optional(v.string()),
        isTop10: v.optional(v.boolean()),
        top10Position: v.optional(v.number()),
        isFamous: v.optional(v.boolean()),
        isTrending: v.optional(v.boolean()),
        series: v.optional(v.string()), // Legacy string field
        seriesId: v.optional(v.id("book_series")), // New linked field
        searchText: v.optional(v.string()),
        coverImage: v.optional(v.id("_storage")),
        coverImages: v.optional(v.array(v.id("_storage"))),
        totalCopies: v.number(),
        availableCopies: v.number(),
        avgRating: v.optional(v.number()),
        totalReviews: v.optional(v.number()),
        rating1Count: v.optional(v.number()),
        rating2Count: v.optional(v.number()),
        rating3Count: v.optional(v.number()),
        rating4Count: v.optional(v.number()),
        rating5Count: v.optional(v.number()),
        flaggedCount: v.optional(v.number()),
        createdAt: v.number(),
    })
        .index("by_title", ["title"])
        .index("by_title_author", ["title", "author"])
        .index("by_rating", ["rating"])
        .index("by_rankingScore", ["rankingScore"])
        .index("by_genre", ["genre"])
        .index("by_createdAt", ["createdAt"])
        .index("by_seriesId", ["seriesId"])
        .index("by_isTop10", ["isTop10"])
        .index("by_isFamous", ["isFamous"])
        .index("by_isTrending", ["isTrending"])
        .index("by_top10Position", ["top10Position"])
        .searchIndex("search_books", {
            searchField: "searchText",
            filterFields: ["genres"],
        }),

    rentals: defineTable({
        userId: v.id("users"),
        bookId: v.id("books"),
        zone: v.string(),
        deliveryLocation: v.object({
            // Common
            phone: v.string(),
            landmark: v.optional(v.string()),

            // Custom Address (Legacy / Home manual)
            area: v.optional(v.string()),
            city: v.optional(v.string()),

            // College Specifics
            roomNo: v.optional(v.string()),
            yearOfStudy: v.optional(v.string()),
            department: v.optional(v.string()),
            rollNo: v.optional(v.string()),

            // Home Specifics (Google Maps style)
            latitude: v.optional(v.number()),
            longitude: v.optional(v.number()),
            formattedAddress: v.optional(v.string()),
        }),
        deliveryDate: v.optional(v.string()),
        deliveryTime: v.optional(v.string()),
        pickupDate: v.optional(v.string()),
        pickupTime: v.optional(v.string()),
        userRating: v.optional(v.number()),
        ratedAt: v.optional(v.number()),
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
                v.literal("rejected"),
                v.literal("expired"),
                v.literal("cancelled")
            )
        ),
        rejectionReason: v.optional(v.string()),

        paymentExpiresAt: v.optional(v.number()),
        utrNumber: v.optional(v.string()),
        paymentScreenshot: v.optional(v.id("_storage")),
        lateFee: v.optional(v.number()),
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
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_bookId", ["bookId"])
        .index("by_status", ["status"])
        .index("by_zone", ["zone"])
        .index("by_userId_status", ["userId", "status"])
        .index("by_utrNumber", ["utrNumber"])
        .index("by_createdAt", ["createdAt"])
        .index("by_userId_createdAt", ["userId", "createdAt"]),

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

    analytics_counters: defineTable({
        key: v.string(),
        value: v.number(),
        updatedAt: v.number(),
    }).index("by_key", ["key"]),

    favorites: defineTable({
        userId: v.id("users"),
        bookId: v.id("books"),
        createdAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_bookId", ["bookId"])
        .index("by_user_book", ["userId", "bookId"]),


    read_later: defineTable({
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

    // User-generated content reporting (Google Play policy requirement)
    reports: defineTable({
        reporterId: v.id("users"),
        targetType: v.literal("review"),
        targetId: v.id("reviews"),
        reason: v.string(),
        status: v.union(v.literal("pending"), v.literal("reviewed"), v.literal("dismissed")),
        createdAt: v.number(),
    })
        .index("by_reporterId", ["reporterId"])
        .index("by_targetId", ["targetId"])
        .index("by_status", ["status"]),

    // H5: Immutable audit log for sensitive actions (payment, admin ops, auth events)
    audit_logs: defineTable({
        action: v.string(),
        actorId: v.id("users"),
        targetId: v.optional(v.string()),
        targetType: v.optional(v.string()),
        metadata: v.optional(v.string()), // JSON-serialized
        timestamp: v.number(),
    })
        .index("by_actorId", ["actorId"])
        .index("by_timestamp", ["timestamp"])
        .index("by_action", ["action"]),

    // H3: DB-backed rate limiting for critical paths (distributed, persisted across isolates)
    rate_limit_events: defineTable({
        key: v.string(),
        count: v.number(),
        resetAt: v.number(),
    }).index("by_key", ["key"]),

    // Small internal state records for cron cursors and maintenance progress.
    system_state: defineTable({
        key: v.string(),
        value: v.optional(v.string()),
        updatedAt: v.number(),
    }).index("by_key", ["key"]),

    // Backend-driven payment configuration (admin-editable, no app rebuild needed)
    payment_settings: defineTable({
        upiId: v.string(),
        merchantName: v.string(),
        active: v.boolean(),
        qrEnabled: v.boolean(),
        updatedAt: v.number(),
        updatedBy: v.id("users"),
    }).index("by_active", ["active"]),

    // Student ID verification for College Zone access
    student_verifications: defineTable({
        userId: v.id("users"),
        studentIdNumber: v.string(),
        fullNameOnId: v.string(),
        department: v.optional(v.string()),
        year: v.optional(v.string()),
        idCardImageId: v.id("_storage"),
        status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
        rejectionReason: v.optional(v.string()),
        verifiedAt: v.optional(v.number()),
        verifiedBy: v.optional(v.id("users")),
        createdAt: v.number(),
        updatedAt: v.number(),
    })
        .index("by_userId", ["userId"])
        .index("by_status", ["status"])
        .index("by_userId_status", ["userId", "status"])
        .index("by_createdAt", ["createdAt"]),
});
