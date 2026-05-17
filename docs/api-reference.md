# API Reference

This document summarizes important Convex functions. Generated TypeScript types are available through `convex/_generated/api`.

## Conventions

- Authenticated functions usually accept `accessToken: string`.
- Admin functions call `assertAdmin` server-side.
- Public queries should return only public catalog data.
- Mutations throw `Error` with user-safe messages.
- Paginated functions use Convex `paginationOpts`.

## Auth (`convex/auth.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `sendSignupOTP` | mutation | `name`, `email`, `phone`, `password`, `acceptedTerms`, `deviceInfo?`, `ipAddress?` | `{ status: "otp_sent", email }` |
| `verifySignupOTP` | mutation | `email`, `otpCode` | `{ userId, accessToken, refreshToken }` |
| `signIn` | mutation | `email`, `password`, `deviceInfo?`, `ipAddress?` | `{ userId, role, accessToken, refreshToken }` |
| `googleSignIn` | mutation | `idToken`, `deviceInfo?`, `ipAddress?` | `{ userId, role, accessToken, refreshToken }` |
| `getSession` | query | `accessToken` | user session profile or `null` |
| `refreshSession` | mutation | `refreshToken` | `{ accessToken, refreshToken }` |
| `signOut` | mutation | `refreshToken` | void |
| `sendPasswordResetOTP` | mutation | `email` | `{ status: "otp_sent", email }` |
| `resetPasswordWithOTP` | mutation | `email`, `otpCode`, `newPassword` | `{ status: "password_reset" }` |
| `changePassword` | mutation | `accessToken`, `currentPassword`, `newPassword` | `true` |
| `getUserSessions` | query | `accessToken` | active session summaries |
| `revokeSession` | mutation | `accessToken`, `sessionId` | `true` |
| `revokeAllSessions` | mutation | `accessToken`, `exceptCurrent?` | `true` |

Admin maintenance:

- `backfillLegacySessions`
- `backfillUsers`

## Books (`convex/books.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `list` | query | `paginationOpts` | paginated mapped books |
| `get` | query | `bookId` | mapped book or `null` |
| `searchBooks` | query | `searchText?`, `genre?`, `paginationOpts` | paginated mapped books |
| `getBooksByGenre` | query | `genre`, `paginationOpts` | paginated mapped books |
| `getRelatedBooks` | query | `bookId` | up to 8 related mapped books |
| `getDiscoverData` | query | none | home sections for top picks, top 10, trending, famous, new, series |
| `incrementBookViews` | mutation | `bookId` | `true` |

Admin:

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `add` | mutation | book fields + `accessToken` | `bookId` |
| `update` | mutation | `bookId`, partial book fields + `accessToken` | void |
| `remove` | mutation | `bookId`, `accessToken` | void |
| `generateUploadUrl` | mutation | `accessToken` | upload URL |
| `getProblemBooks` | query | `accessToken`, `limit?` | books with low ratings/flags |
| `backfillSearchFields` | mutation | `accessToken`, `paginationOpts` | scan/update summary |

Section queries also exist for direct reads: `getTopPicks`, `getTop10Books`, `getTrendingBooks`, `getFamousBooks`, `getSeriesBooks`, `getNewlyAddedBooks`.

## Rentals (`convex/rentals.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `requestRental` | mutation | `bookId`, `zone`, `deliveryLocation`, `accessToken`, `ipAddress?`, `deviceInfo?` | `rentalId` |
| `schedulePickup` | mutation | `rentalId`, `pickupDate`, `pickupTime`, `userRating`, `reviewText?`, `pickupLocation?`, `accessToken` | void |
| `cancelPickup` | mutation | `rentalId`, `accessToken` | void |
| `getUserRentals` | query | `accessToken`, `userId?` | active rentals with book details |
| `getRentalHistory` | query | `accessToken`, `userId?`, `status?`, `timeframe?` | recent paid/returned rentals |
| `getRental` | query | `rentalId`, `accessToken` | rental with book/user/screenshot details |

Admin:

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `scheduleDelivery` | mutation | `rentalId`, `deliveryDate`, `deliveryTime`, `accessToken` | void |
| `markDelivered` | mutation | `rentalId`, `accessToken` | void |
| `markReturned` | mutation | `rentalId`, `accessToken` | void |
| `getAllRentals` | query | `paginationOpts`, `accessToken` | paginated rentals with book/user details |
| `getBookRentals` | query | `bookId`, `accessToken`, `limit?` | rentals for a book |

Internal:

- `autoCancelPickup`: cancels unpaid pickup after expiry.

## Payments (`convex/payments.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `generateUploadUrl` | mutation | `accessToken` | upload URL |
| `submitUpiPayment` | mutation | `rentalId`, `utrNumber`, `paymentScreenshot`, `accessToken`, `ipAddress?`, `deviceInfo?` | void |
| `selectCashPayment` | mutation | `rentalId`, `accessToken`, `ipAddress?`, `deviceInfo?` | void |
| `verifyPayment` | mutation | `rentalId`, `approved`, `rejectionReason?`, `accessToken` | void |
| `getPendingPayments` | query | `paginationOpts`, `accessToken` | paginated pending payment rentals |

Notes:

- UPI submissions validate UTR format, duplicate UTR usage, image type, and screenshot size.
- Approval moves rental to `paid`; rejection returns it to `pickup_scheduled`.

## Student Verification (`convex/verifications.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `generateUploadUrl` | mutation | `accessToken` | upload URL |
| `submitVerification` | mutation | `accessToken`, `studentIdNumber`, `fullNameOnId`, `department?`, `year?`, `idCardImageId` | `{ success: true }` |
| `getUserVerification` | query | `accessToken` | latest verification with `collegeName` or `null` |
| `getPendingVerifications` | query | `accessToken` | pending requests enriched for admin |
| `getVerificationHistory` | query | `accessToken` | recent resolved requests enriched for admin |
| `approveVerification` | mutation | `accessToken`, `verificationId` | void |
| `rejectVerification` | mutation | `accessToken`, `verificationId`, `rejectionReason?` | void |
| `getPendingVerificationCount` | query | `accessToken` | number |

## Users (`convex/users.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `getUser` | query | `accessToken`, `userId` | user document if self/admin |
| `listUsers` | query | `accessToken`, `paginationOpts` | paginated users, admin-only |
| `updateUser` | mutation | `accessToken`, `name`, `phone` | `true` |
| `deleteAccount` | mutation | `accessToken`, `confirmText: "DELETE"` | `{ success: true }` |

## Notifications (`convex/notifications.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `updatePushToken` | mutation | `accessToken`, `pushToken` | void |
| `clearPushToken` | mutation | `accessToken`, `pushToken` | void |
| `subscribeToBook` | mutation | `accessToken`, `bookId`, `ipAddress?`, `deviceInfo?` | void |
| `getNotifications` | query | `accessToken`, `limit?` | notification list |
| `getUnreadCount` | query | `accessToken` | number |
| `markRead` | mutation | `accessToken`, `notificationId` | void |
| `markAllRead` | mutation | `accessToken` | void |

Internal actions/mutations send push notifications, notify admins, notify subscribers, clean old notifications, and reconcile inventory.

## Reviews (`convex/reviews.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `getBookReviews` | query | `bookId`, `accessToken?`, `limit?` | enriched reviews |
| `getBookReviewSummary` | query | `bookId` | average, total, distribution |
| `reportReview` | mutation | `reviewId`, `reason`, `accessToken` | `{ success: true }` |
| `updateReview` | mutation | `reviewId`, `rating`, `reviewText?`, `accessToken` | `{ success: true }` |
| `deleteReview` | mutation | `reviewId`, `accessToken` | `{ success: true }` |
| `voteReview` | mutation | `reviewId`, `voteType`, `accessToken` | vote result |

Admin:

- `getReviewsByBook`
- `getAllFlaggedReviews`
- `flagReview`
- `unflagReview`
- `rebuildBookReviewCounters`

## Payment Settings (`convex/paymentSettings.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `getActiveSettings` | query | `accessToken` | active UPI settings or `null` |
| `getAllSettings` | query | `accessToken` | all UPI settings, admin-only |
| `addUpiId` | mutation | `upiId`, `merchantName`, `accessToken` | void |
| `toggleActiveUpiId` | mutation | `settingId`, `accessToken` | void |
| `updateUpiId` | mutation | `settingId`, `upiId`, `merchantName`, `accessToken` | void |
| `removeUpiId` | mutation | `settingId`, `accessToken` | void |
| `toggleQrEnabled` | mutation | `settingId`, `qrEnabled`, `accessToken` | void |

## Analytics (`convex/analytics.ts`)

Important admin functions:

- `getDashboardAnalytics`
- `getDashboardRevenue`
- `rebuildDashboardCounters`

Analytics functions aggregate users, rentals, revenue, book stats, and genre stats for admin dashboards.

## Series (`convex/series.ts`)

| Function | Type | Params | Returns |
| --- | --- | --- | --- |
| `list` | query | none | series list |
| `getWithBooks` | query | `seriesId` | series with books |
| `add` | mutation | `name`, `coverImage`, `description?`, `accessToken` | `seriesId` |
| `update` | mutation | `seriesId`, fields, `accessToken` | void |
| `remove` | mutation | `seriesId`, `accessToken` | void |

## HTTP Routes (`convex/http.ts`)

| Route | Method | Returns |
| --- | --- | --- |
| `/health` | `GET` | `{ ok, service, timestamp }` |

## Error Handling Strategy

- Throw `Error` from Convex handlers for invalid input, unauthorized access, or invalid lifecycle transitions.
- Keep messages suitable for end users.
- Avoid exposing whether an email exists during password reset.
- Use audit logs for suspicious or sensitive events, such as duplicate UTR attempts.
- In frontend hooks, catch unknown errors and show the server message when available.
