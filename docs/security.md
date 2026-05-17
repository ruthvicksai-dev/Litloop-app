# Security

LitLoop relies on server-side Convex authorization, short-lived access tokens, refresh-token rotation, explicit admin checks, file metadata validation, DB-backed rate limits, and audit logs for sensitive operations.

## Authorization Model

Frontend route guards are UX controls. Convex functions are the security boundary.

Authenticated functions accept `accessToken` and call one of:

- `getUserIdFromAccessToken`: verifies access token type and signature.
- `getAuthenticatedUser`: verifies token, session record, revocation status, expiry, and user existence.
- `assertAdmin`: verifies authenticated user and admin role.

Use `getAuthenticatedUser` for mutations that must respect session revocation.

## Session Security

- Access tokens are short-lived JWTs.
- Refresh tokens are hashed before storage.
- Refresh rotation revokes old sessions.
- Password reset and password change revoke active sessions.
- Client tokens are stored in `expo-secure-store`.
- Session expiry opens a modal and clears local session state.

Required production env:

- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`

The two secrets must be different, high entropy, and never exposed through `EXPO_PUBLIC_` variables.

## Role Protection

Admin-only functions include book management, payment verification, payment settings, student verification review, analytics, review moderation, and maintenance backfills.

Pattern:

```ts
const admin = await assertAdmin(ctx, args.accessToken);
```

Do not rely on hidden admin screens or route guards without backend checks.

## Verified Student Protection

College Zone access is enforced in `rentals.requestRental`:

```text
zone === "College" requires user.isVerifiedStudent === true or admin role
```

The frontend also disables College fields for unverified users, but backend enforcement is authoritative.

## Input Validation

Current validation examples:

- Auth: normalized email, phone format, password length, terms acceptance.
- OTP: hashed 6-digit codes, expiry checks, timing-safe comparison.
- Books: genre normalization, duplicate title/author checks, numeric bounds.
- Rentals: zone validation, phone validation, area/location checks, date/time slot checks.
- Payments: UTR normalization and format validation.
- Verification: ID number/name trimming and minimum length.
- Profile: non-empty name and 10-digit phone number.

When adding mutations, validate before writing and return user-safe error messages.

## File Upload Security

Upload URL generation is authenticated and rate-limited. Domain submission validates uploaded file metadata.

Current limits:

| Flow | Limit | Types |
| --- | --- | --- |
| Student ID | 1 MB | JPEG, PNG, WebP |
| Payment screenshot | 10 MB | JPEG, PNG, WebP |
| Book covers | Admin-only upload URL; validate downstream when extending. |

Best practices:

- Validate `ctx.storage.getMetadata(storageId)` before accepting a storage ID.
- Delete rejected/oversized uploads when possible.
- Never trust client-side file checks alone.
- Avoid logging storage URLs or sensitive image identifiers.

## Data Access Restrictions

- Users can read their own profile, rentals, history, notifications, favorites, read-later, and verification status.
- Admins can read operational queues and user/rental/payment/verification data required for operations.
- Payment settings public read requires authentication to reduce merchant identity enumeration risk.
- Push tokens are deduplicated and only associated with the current authenticated user.
- Account deletion removes linked user data and attempts to delete verification images.

## Rate Limiting

DB-backed rate limits are implemented through `rate_limit_events` and helpers in `convex/lib/rateLimit.ts`.

Protected paths include:

- Signup OTP requests.
- Sign-in attempts.
- Google sign-in attempts.
- Password changes/resets.
- Rental requests.
- Payment submissions and upload URLs.
- Student verification upload and submission.
- Book availability subscriptions.

Use rate limits for any new mutation that sends email, generates upload URLs, creates financial records, or can be abused in bulk.

## Audit Logs

Sensitive operations write to `audit_logs`, including:

- Book add/update/backfills.
- Payment submission/approval/rejection and duplicate UTR attempts.
- Student verification submit/approve/reject.
- Payment setting changes.
- Account deletion.

Avoid storing raw secrets, image URLs, full payment screenshots, or unnecessary personal data in `metadata`.

## Admin-Only Operations

Admin-only operations must:

1. Call `assertAdmin`.
2. Validate target document existence and expected status.
3. Write an audit log when the action affects money, identity, access, or inventory.
4. Keep mutations idempotent where possible.
5. Notify affected users without leaking private details.

## Sensitive Data Guidelines

- Never expose backend secrets through `EXPO_PUBLIC_` variables.
- Keep ID card images and payment screenshots in Convex Storage only.
- Avoid copying sensitive user data into analytics.
- Keep logs actionable but minimal.
- Use Sentry user IDs/roles, not full user profiles.
- Keep Google Maps and Google OAuth credentials platform-restricted.

## Security Review Checklist For New Features

- Is every backend function explicitly public, authenticated, or admin-only?
- Are all reads indexed or bounded?
- Are all user-controlled strings validated and trimmed?
- Are file uploads checked server-side?
- Does the feature need rate limiting?
- Does the feature touch money, identity, access, or inventory and therefore need an audit log?
- Are error messages helpful without leaking sensitive account state?
- Does account deletion need to clean up new records?
