# Convex Schema

The Convex schema lives in `convex/schema.ts`. Tables are designed around the app's main domains: users, auth sessions, catalog, rentals, payments, notifications, reviews, analytics, verification, and operational state.

## Core Tables

### `users`

Stores account profile and authorization flags.

Fields: `name`, `email`, `phone?`, `passwordHash?`, `providers?`, `avatarUrl?`, `lastLoginProvider?`, `role`, `pushToken?`, `acceptedTerms?`, `acceptedAt?`, `isVerifiedStudent?`, `createdAt`.

Indexes: `by_email`, `by_phone`, `by_role`, `by_pushToken`, `by_createdAt`.

Relationships: referenced by sessions, rentals, reviews, notifications, favorites, read-later items, verification requests, audit logs, and payment settings.

### `sessions`

Stores refresh-token session records.

Fields: `userId`, `refreshTokenHash?`, `tokenHash?` legacy fallback, `deviceInfo?`, `ipAddress?`, `isRevoked?`, `expiresAt`, `replacedBySessionId?`, `createdAt`.

Indexes: `by_userId`, `by_refreshTokenHash`, `by_userId_active`.

Notes: access tokens are JWTs; refresh tokens are hashed and persisted. Refresh rotation revokes the old session and links it to the replacement.

### `otp_requests`

Temporary signup/password reset OTP records.

Fields: `email`, `otpCodeHash`, `signupData?`, `expiresAt`, `isVerified`, `createdAt`.

Indexes: `by_email`.

Notes: signup data stores a pre-hashed password, not plaintext. OTPs expire after 10 minutes.

### `books`

Main catalog table.

Fields include title/author/description, pricing, genre metadata, rating counters, ranking metrics, series linkage, search text, Convex Storage image IDs, inventory counts, and `createdAt`.

Important fields: `rentPerDay`, `genre?`, `genres?`, `rating?`, `ratingCount?`, `bookViews?`, `bookRentals?`, `rankingScore?`, `seriesId?`, `searchText?`, `coverImage?`, `coverImages?`, `totalCopies`, `availableCopies`, `avgRating?`, `totalReviews?`, `rating1Count?` through `rating5Count?`, `flaggedCount?`.

Indexes: `by_title`, `by_title_author`, `by_rating`, `by_rankingScore`, `by_genre`, `by_createdAt`, `by_seriesId`, `by_isTop10`, `by_isFamous`, `by_isTrending`, `by_top10Position`.

Search index: `search_books` on `searchText`, filtered by `genres`.

### `book_series`

Groups books into series.

Fields: `name`, `coverImage`, `description?`, `createdAt`.

Indexes: `by_name`.

### `rentals`

Represents the full rental lifecycle.

Fields: `userId`, `bookId`, `zone`, `deliveryLocation`, `deliveryDate?`, `deliveryTime?`, `pickupDate?`, `pickupTime?`, `pickupLocation?`, `userRating?`, `ratedAt?`, `rentPerDay`, `totalRent?`, `status`, `paymentMethod?`, `paymentStatus?`, `rejectionReason?`, `paymentExpiresAt?`, `utrNumber?`, `paymentScreenshot?`, `lateFee?`, `createdAt`.

Rental statuses: `requested`, `delivery_scheduled`, `delivered`, `pickup_scheduled`, `payment_pending`, `paid`, `returned`.

Payment statuses: `pending`, `verification_pending`, `cash_pending`, `paid`, `rejected`, `expired`, `cancelled`.

Indexes: `by_userId`, `by_bookId`, `by_status`, `by_zone`, `by_userId_status`, `by_utrNumber`, `by_createdAt`, `by_userId_createdAt`.

### `student_verifications`

Manual student verification requests for College Zone access.

Fields: `userId`, `studentIdNumber`, `fullNameOnId`, `department?`, `year?`, `idCardImageId`, `status`, `rejectionReason?`, `verifiedAt?`, `verifiedBy?`, `createdAt`, `updatedAt`.

Statuses: `pending`, `approved`, `rejected`.

Indexes: `by_userId`, `by_status`, `by_userId_status`, `by_createdAt`.

### `payment_settings`

Admin-managed UPI configuration.

Fields: `upiId`, `merchantName`, `active`, `qrEnabled`, `updatedAt`, `updatedBy`.

Indexes: `by_active`.

## Engagement Tables

### `favorites`

Fields: `userId`, `bookId`, `createdAt`.

Indexes: `by_userId`, `by_bookId`, `by_user_book`.

### `read_later`

Fields: `userId`, `bookId`, `createdAt`.

Indexes: `by_userId`, `by_bookId`, `by_user_book`.

### `book_notifications`

Stores one-shot availability subscriptions.

Fields: `userId`, `bookId`, `createdAt`.

Indexes: `by_bookId`, `by_userId_bookId`.

### `user_notifications`

In-app notification records.

Fields: `userId`, `title`, `body`, `type`, `dataJson?`, `isRead`, `createdAt`.

Indexes: `by_userId`, `by_userId_isRead`, `by_createdAt`.

## Reviews and Moderation

### `reviews`

Fields: `bookId`, `userId`, `rentalId`, `rating`, `reviewText?`, `helpfulCount?`, `unhelpfulCount?`, `isFlagged?`, `createdAt`.

Indexes: `by_bookId`, `by_userId_bookId`, `by_rentalId`, `by_isFlagged`.

### `review_votes`

Fields: `userId`, `reviewId`, `voteType`, `createdAt`.

Indexes: `by_reviewId`, `by_user_review`.

### `reports`

Fields: `reporterId`, `targetType`, `targetId`, `reason`, `status`, `createdAt`.

Indexes: `by_reporterId`, `by_targetId`, `by_status`.

## Analytics and Operations

### `analytics_monthly`

Fields: `month`, `revenue`, `rentals`, `newUsers`, `activeUsers`, `createdAt`.

Index: `by_month`.

### `analytics_daily`

Fields: `date`, `revenue`, `rentals`, `createdAt`.

Index: `by_date`.

### `book_stats`

Fields: `bookId`, `rentals`, `revenue`, `lastRentedAt`, `createdAt`.

Indexes: `by_bookId`, `by_rentals`, `by_revenue`.

### `genre_stats`

Fields: `genre`, `rentals`, `revenue`, `createdAt`.

Indexes: `by_genre`, `by_rentals`, `by_revenue`.

### `analytics_counters`

Fields: `key`, `value`, `updatedAt`.

Index: `by_key`.

### `user_month_activity`

Fields: `userId`, `month`, `createdAt`.

Indexes: `by_user_month`, `by_month`.

### `audit_logs`

Immutable-style log for sensitive actions.

Fields: `action`, `actorId`, `targetId?`, `targetType?`, `metadata?`, `timestamp`.

Indexes: `by_actorId`, `by_timestamp`, `by_action`.

### `rate_limit_events`

DB-backed rate-limiting buckets.

Fields: `key`, `count`, `resetAt`.

Index: `by_key`.

### `system_state`

Internal state for cron cursors and maintenance jobs.

Fields: `key`, `value?`, `updatedAt`.

Index: `by_key`.

## Relationship Map

```text
users
  |-- sessions
  |-- rentals -- books -- book_series
  |-- reviews -- review_votes
  |-- favorites/read_later
  |-- user_notifications/book_notifications
  |-- student_verifications
  |-- audit_logs

rentals
  |-- paymentScreenshot -> Convex Storage
  |-- reviews

student_verifications
  |-- idCardImageId -> Convex Storage
```

## Indexing Strategy

- Use identity indexes for direct lookups: `by_email`, `by_phone`, `by_refreshTokenHash`, `by_user_book`.
- Use compound indexes for ownership and status filters: `by_userId_status`, `by_userId_active`, `by_userId_isRead`.
- Use sort-oriented indexes for feed/list queries: `by_createdAt`, `by_rating`, `by_rankingScore`.
- Use search index for catalog search instead of client-side filtering.
- Use `by_status` for admin queues such as pending payments and verifications.

## Query Optimization Notes

- Prefer `paginate` for admin lists and catalog pages.
- Prefer bounded `.take(...)` for small dashboard or notification counts.
- Avoid `.collect()` unless the table is intentionally tiny, such as current UPI settings.
- Consolidate high-traffic realtime queries. `books.getDiscoverData` reduces home subscriptions by returning multiple catalog sections in one query.
- Keep derived counters on write paths when reads are frequent, such as rating distributions and analytics counters.

## Naming Conventions

- Public read functions use nouns or `get*`/`list*`: `books.get`, `rentals.getUserRentals`.
- Public write functions use imperative verbs: `requestRental`, `schedulePickup`, `submitUpiPayment`.
- Admin mutations name the operation directly: `verifyPayment`, `approveVerification`, `toggleActiveUpiId`.
- Internal functions are prefixed or located as internal Convex exports: `internalIncrementBookViews`, `cleanupOldNotifications`.
- Access-controlled functions accept `accessToken` explicitly and validate it server-side.
