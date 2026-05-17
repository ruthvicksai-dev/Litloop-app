# Authentication Flow

LitLoop uses a custom Convex-backed authentication layer with email OTP signup, password login, Google sign-in, JWT access tokens, refresh token rotation, and client-side SecureStore persistence.

Related diagram: [Auth Flow](./diagrams/auth-flow.md).

## Providers

Supported providers:

- Local email/password account with signup OTP verification.
- Google sign-in through `expo-auth-session/providers/google`.

Provider metadata is stored on `users.providers`, and the last successful provider is stored in `users.lastLoginProvider`.

## Signup Flow

```text
User submits name/email/phone/password/terms
  -> auth.sendSignupOTP
  -> validate fields + rate limits + uniqueness
  -> hash password
  -> store otp_requests with hashed OTP and signupData
  -> internal.email.sendOTP sends email through Resend
  -> user enters OTP
  -> auth.verifySignupOTP
  -> timing-safe OTP hash check
  -> create users record
  -> create access + refresh tokens
  -> client stores tokens in SecureStore
```

Development mode can use `USE_DEV_OTP=true`, which emits a fixed OTP path for local testing. It must never be enabled in production.

## Password Sign-In

`auth.signIn`:

1. Normalizes email and validates credentials.
2. Applies DB-backed rate limits.
3. Verifies PBKDF2 password hashes, with legacy SHA-256 compatibility.
4. Auto-upgrades legacy password hashes after successful login.
5. Creates a session row and returns access/refresh tokens.

## Google Sign-In

Frontend flow:

1. `useGoogleAuth` starts the Expo Auth Session flow.
2. Google returns an ID token.
3. `AuthProvider.signInWithGoogle` calls `auth.googleSignIn`.

Backend flow:

1. Convex verifies the Google ID token with `GOOGLE_CLIENT_ID`.
2. Existing users are linked to the Google provider if needed.
3. New users are created with `role: "user"`.
4. Access/refresh tokens are issued.

## Session Handling

Access tokens:

- Signed with `JWT_ACCESS_SECRET`.
- Default expiry is 30 minutes.
- Stored on device in `expo-secure-store`.
- Sent explicitly as `accessToken` to Convex functions that require auth.

Refresh tokens:

- Signed with `JWT_REFRESH_SECRET`.
- Default expiry is 10 days.
- Stored as a hash on `sessions.refreshTokenHash`.
- Rotated by `auth.refreshSession`.

Client lifecycle:

```text
App starts
  -> AuthProvider loads SecureStore tokens
  -> if access token is valid, use it and schedule refresh
  -> if expired, refresh silently
  -> auth.getSession hydrates current user
  -> failed refresh opens Session Expired modal and clears local tokens
```

## Token Refresh and Revocation

`auth.refreshSession` verifies the refresh JWT, confirms the stored refresh token hash, rejects revoked or expired sessions, creates a new session, and revokes the old one. `replacedBySessionId` is recorded to identify stale refresh retries.

Sign-out clears local storage first, then asks the backend to revoke the refresh session.

Password reset and password change revoke active sessions for the user.

## Role-Based Access

Roles are stored on `users.role`:

- `user`: regular customer account.
- `admin`: can access admin route group and admin Convex functions.

Backend admin checks use `assertAdmin(ctx, accessToken)`, which first validates the token/session and then checks `user.role === "admin"`.

## Admin Authorization

Admin-only operations include:

- Book create/update/delete and upload URLs.
- Rental delivery scheduling, return processing, and admin rental lists.
- Payment verification and payment setting management.
- Student verification approval/rejection and verification queues.
- Dashboard analytics and maintenance backfills.
- Review moderation and flagged review queues.

Admin status is enforced in Convex. Frontend route guards improve UX but are not treated as security boundaries.

## Verified Student Permissions

Verified status is stored as `users.isVerifiedStudent`.

College Zone rental rules:

- The UI disables College-specific request fields for unverified students.
- `rentals.requestRental` rejects College Zone requests unless `isVerifiedStudent === true` or the caller is admin.
- Verification approval sets `isVerifiedStudent: true` on the user.

## Protected Route Logic

- Guests may browse the tab interface.
- Rental request requires a logged-in user.
- Admin routes use `useAdminRouteGuard`.
- Admin Convex functions still validate admin access even if a route guard is bypassed.

## Error Handling

Auth errors are intentionally user-safe:

- Invalid credentials return generic messages.
- Password reset does not reveal whether an account exists.
- Revoked/expired sessions are cleared and require sign-in.
- Rate limits return actionable retry messages.

## Implementation References

- `context/AuthContext.tsx`
- `hooks/auth/useGoogleAuth.ts`
- `hooks/auth/useRouteGuards.ts`
- `convex/auth.ts`
- `convex/lib/authHelpers.ts`
- `convex/lib/jwt.ts`
