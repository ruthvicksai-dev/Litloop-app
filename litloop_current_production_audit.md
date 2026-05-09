
================================================================================
                    LITLOOP — PRODUCTION READINESS AUDIT
================================================================================

  Date:     2026-05-09
  Target:   ~200 concurrent users on Convex Free Tier
  Stack:    Expo 54 / React Native 0.81 / Convex 1.32 / TypeScript


================================================================================
  OVERALL SCORE:  7.5 / 10  —  3 BLOCKERS REMAIN
================================================================================

  Architecture .............. 8 / 10   Ready
  Database & Schema ......... 9 / 10   Ready
  Authentication ............ 9.5 / 10 Ready
  Authorization ............. 9 / 10   Ready
  Rate Limiting ............. 9.5 / 10 Ready
  Input Validation .......... 9 / 10   Ready
  API Key Security .......... 5 / 10   BLOCKER
  Query Performance ......... 8 / 10   Ready
  Frontend Performance ...... 6 / 10   Needs Profiling
  Error Handling ............ 8 / 10   Ready
  Error Tracking ............ 2 / 10   BLOCKER
  Build & Deploy ............ 7 / 10   Verify EAS
  Dependency Health ......... 5 / 10   BLOCKER
  Data Integrity ............ 9 / 10   Ready


================================================================================
  BLOCKERS  —  MUST FIX BEFORE LAUNCH
================================================================================

  B1  No error tracking (Sentry / Crashlytics not integrated)
      You will be completely blind to crashes in production.
      Effort: 2–4 hours

  B2  High-severity npm vulnerabilities
      fast-uri (path traversal), @babel/plugin-transform-modules-systemjs
      (arbitrary code execution).
      Fix: run  npm audit fix
      Effort: 30 min

  B3  Google API keys are unrestricted
      Maps key in .env.local, Firebase key in android/app/google-services.json.
      Anyone who finds these keys can run up your billing.
      Fix: Google Cloud Console → restrict by Android package + SHA fingerprint.
      Effort: 30 min

  B4  getDashboardRevenue has no auth guard
      File: analytics.ts line 557
      Any client can call this and read your monthly revenue.
      Fix: add accessToken arg + assertAdmin call.
      Effort: 15 min

  B5  JWT secrets not split
      Access and refresh tokens share one signing key (JWT_SECRET).
      Fix: set JWT_ACCESS_SECRET and JWT_REFRESH_SECRET in Convex dashboard.
      Effort: 15 min


================================================================================
  SECTION 1  —  ARCHITECTURE
================================================================================

  Folder Structure
  ────────────────
  app/            Expo Router pages (tabs, admin, auth, rental)
  components/     Reusable UI (ui/, shared/, admin/)
  constants/      Theme, fonts, colors
  context/        AuthContext, NetworkContext, ToastContext
  convex/         Backend functions, schema, crons
    └── lib/      Shared helpers (jwt, rateLimit, authHelpers, bookHelpers)
  hooks/          31 extracted custom hooks with barrel export
  utils/          Categorized utilities (admin/, book/, common/, device/, location/)

  Verdict: Clean separation of concerns. Well-organized.


  Component Size Warnings
  ───────────────────────
  These files are too large and should be split into sub-components:

    (admin)/verify-payment.tsx       39 KB
    (admin)/book-details.tsx         29 KB
    (admin)/payment-settings.tsx     22 KB
    (tabs)/profile.tsx               16 KB


  State Management
  ────────────────
  Auth state:     Centralized AuthContext with expo-secure-store, auto-refresh,
                  session recovery. Well-implemented.
  Network state:  NetworkContext with NetInfo subscription. Clean.
  Server state:   Convex useQuery / useMutation. No redundant caching.

  Verdict: Solid.


  Minor Duplication
  ─────────────────
  resolveCoverUrls logic appears twice in bookHelpers.ts (lines 15-37 and 63-82).
  getBookWithCoverUrls should call resolveCoverUrls internally.


================================================================================
  SECTION 2  —  DATABASE & SCHEMA
================================================================================

  Index Coverage
  ──────────────
  Every table has purpose-built indexes for its query patterns:

    users                by_email, by_role, by_pushToken, by_createdAt
    sessions             by_userId_active, by_refreshTokenHash
    rentals              by_userId, by_bookId, by_status, by_utrNumber, by_createdAt
    books                by_genre, by_isTop10, by_isFamous, by_rankingScore,
                         by_seriesId, by_createdAt, by_searchText
    favorites            by_userId, by_user_book
    reviews              by_bookId, by_userId_bookId, by_isFlagged
    user_notifications   by_userId, by_userId_isRead, by_createdAt
    rate_limit_events    by_key
    analytics_daily      by_date
    analytics_monthly    by_month
    book_stats           by_bookId, by_rentals
    genre_stats          by_genre, by_rentals

  Verdict: Excellent. No missing indexes found.


  Bounded Queries
  ───────────────
  All user-facing queries are properly capped:

    getNotifications           take(200)     notifications.ts:189
    getUnreadCount             take(20)      notifications.ts:210
    getUserFavoriteIds         take(200)     favorites.ts:56
    getUserFavoriteBooks       take(100)     favorites.ts:77
    getPendingVerifications    take(50)      verifications.ts:193
    getVerificationHistory     take(50)      verifications.ts:223
    getPendingPayments         paginated     payments.ts:310
    listUsers                  paginated     users.ts:24
    searchBooks                paginated     books.ts

  One remaining concern:
    getAdminRecipients uses .collect() on admin users (notifications.ts:334).
    Safe only while admin count stays under 10. Add .take(20) as a safety cap.


  Data Integrity
  ──────────────
  [+] TOCTOU protection on rental stock decrement (re-reads book before patch)
  [+] Nightly reconcileAvailableCopies cron with cursor-based pagination
  [+] Rating math guards against NaN and Infinity
  [+] Atomic counters use Math.max(0, ...) to prevent negatives
  [+] Duplicate UTR detection via index before accepting payment


================================================================================
  SECTION 3  —  SECURITY
================================================================================

  Authentication Flow
  ───────────────────
  Password hashing:       PBKDF2-SHA256, 100K iterations, random 16-byte salt
                          (authHelpers.ts:100)
  Legacy hash support:    SHA-256 fallback with migration path
                          (authHelpers.ts:141)
  JWT signing:            HMAC-SHA256 via Web Crypto API, zero external deps
                          (jwt.ts:94)
  Session revocation:     DB check on every authenticated request
                          (authHelpers.ts:51)
  Refresh rotation:       New refresh token on each refresh, old hash invalidated
  Token storage:          expo-secure-store (hardware-backed keychain)
  Google OAuth:           JWKS-verified via jose, issuer + audience validated
                          (google.ts:31)
  Password change:        All sessions revoked after change
                          (auth.ts:909)

  Verdict: Excellent. Industry-standard implementation.


  Authorization Guards
  ────────────────────
  getAuthenticatedUser()   All user mutations. Checks session revocation + expiry.
  assertAdmin()            All admin endpoints. Layered on top of auth.
  Ownership checks         rental.userId !== caller._id pattern in payments, rentals.

  Verdict: Complete coverage.


  Rate Limits (DB-backed, distributed)
  ─────────────────────────────────────
    Signup OTP ................. 3 per 15 min
    Login ...................... 5 per 15 min
    Password reset ............. 3 per 15 min
    Change password ............ 3 per 1 hour
    UPI payment submit ......... 5 per 15 min
    Cash payment select ........ 5 per 15 min
    Payment upload URL ......... 10 per 15 min
    Global payment (per IP) .... 15 per 30 min
    Verification submit ........ 3 per 24 hours
    Verification upload ........ 5 per 1 hour
    Book notify subscribe ...... 10 per 1 hour

  clearRateLimit() on successful login prevents lockout of legitimate users.
  Verdict: Comprehensive. All abuse vectors covered.


  Input Validation
  ────────────────
  [+] UTR numbers:   regex ^[A-Za-z0-9]{12,22}$ + normalize + index-based dedup
  [+] File uploads:  MIME whitelist (JPEG/PNG/WebP) + size caps (10MB / 1MB)
  [+] Phone:         10-digit regex
  [+] Email:         lowercase + trimmed
  [+] Passwords:     8-character minimum
  [+] Student ID:    minimum length checks


  Security Risks
  ──────────────
  [HIGH]   Google API keys unrestricted — see Blocker B3
  [HIGH]   Git history contains google-services.json — consider BFG cleanup
  [MEDIUM] JWT secret fallback to shared key — see Blocker B5
  [MEDIUM] OTP logged to console when RESEND_API_KEY is missing (email.ts:55)
  [MEDIUM] getDashboardRevenue has no auth guard — see Blocker B4


================================================================================
  SECTION 4  —  PERFORMANCE
================================================================================

  Backend Query Efficiency
  ────────────────────────
  Good patterns already in place:

    [+] getDiscoverData consolidates 6 section queries into 1 subscription
    [+] updatePushToken uses by_pushToken index (not full table scan)
    [+] getAdminRecipients uses by_role index (not .filter())
    [+] cleanupOldNotifications uses by_createdAt index to skip recent records
    [+] Analytics uses pre-aggregated tables (daily, monthly, book_stats, genre_stats)

  Remaining hotspots:

    getDashboardAnalytics fallback
      .take(1000) on users + rentals when counters not yet initialized.
      Impact: Only on first admin load before rebuild.

    getDiscoverData
      Resolves ~65 storage URLs per subscription activation.
      Impact: Heavy on first load for each user.

    getAdminRecipients
      Uses .collect() — unbounded if admin count grows.
      Fix: add .take(20).


  WebSocket Budget for 200 Users
  ──────────────────────────────
  Each useQuery() is a persistent WebSocket subscription.

    Home screen ............ 1 subscription/user .... 200 total
    Notification badge ..... 1 subscription/user .... 200 total
    Auth session ........... 1 subscription/user .... 200 total
    Favorites .............. 1 subscription/user .... 200 total
    Book detail ............ 2 subscriptions ........ ~50 total
    My Rentals ............. 1 subscription ......... ~100 total
    Search ................. 1 subscription ......... ~30 total
                                                     ─────────
    Estimated total:                                  ~980

  Convex Free Tier can handle this. The "skip" pattern for unauthenticated
  users is already correctly applied.


  Frontend Performance
  ────────────────────
  [!] Re-renders:  AuthContext provides one large object. Any auth state change
                   re-renders all consumers. Split into state + actions contexts.
  [?] Lists:       Verify FlatList is used everywhere (not ScrollView + .map()).
  [?] Images:      Confirm expo-image with cachePolicy for book covers.
  [!] Bundle:      69 dependencies. Run npx expo-doctor to identify bloat.
  [+] Fonts:       8 Lato variants loaded, splash held until ready. Good.


================================================================================
  SECTION 5  —  RELIABILITY
================================================================================

  Error Handling
  ──────────────
  [+] ErrorBoundary wraps entire Stack navigator (AppGate.tsx:76)
  [+] NetworkContext + OfflineBanner for connectivity drops
  [+] Push token failure caught silently with warning log (AppGate.tsx:47)
  [+] Custom Convex logger suppresses expected auth errors in production


  Session Recovery
  ────────────────
  AuthContext (lines 207-253) handles server-side session revocation:
    1. Detects getSession returning null while accessToken exists
    2. Attempts silent refresh via stored refresh token
    3. Falls back to full sign-out if refresh fails
    4. hasAttemptedRecoveryRef prevents infinite retry loops

  Verdict: Excellent implementation.


  Cron Jobs
  ─────────
  Notification cleanup:    Sunday 2 AM UTC, 90-day TTL, 500 deletes/run
  Stock reconciliation:    Daily 3 AM UTC, 50 books/run with cursor persistence

  Both are properly bounded and will not timeout.


  Account Deletion (Google Play Compliant)
  ─────────────────────────────────────────
  Requires "DELETE" confirmation → blocks if active rentals → revokes sessions →
  clears push tokens → deletes favorites/notifications → audit log → deletes user.


================================================================================
  SECTION 6  —  DEVOPS & DEPLOYMENT
================================================================================

  Build Config
  ────────────
  [+] eas.json has 3 profiles (development, preview, production) with auto-increment
  [+] .env.example present with 9 variables documented
  [!] Verify all EAS env vars are set in EAS dashboard
  [!] Test a production build to confirm google-services.json injection works


  Required Convex Env Vars (Production)
  ──────────────────────────────────────
  JWT_ACCESS_SECRET     If missing: falls back to shared JWT_SECRET
  JWT_REFRESH_SECRET    If missing: falls back to shared JWT_SECRET
  RESEND_API_KEY        If missing: OTP codes logged to console
  GOOGLE_CLIENT_ID      If missing: Google sign-in silently fails


  Monitoring
  ──────────
  [MISSING]  Sentry / Crashlytics       BLOCKER — no crash reporting
  [MISSING]  APM / Performance tracking  Should add post-launch
  [OK]       Convex Dashboard            Available for manual monitoring
  [MISSING]  Uptime monitoring           Add basic health check


================================================================================
  SECTION 7  —  CONVEX FREE TIER BUDGET
================================================================================

  Estimated Monthly Usage (200 active users)
  ──────────────────────────────────────────
                        Free Limit         Estimated Usage
  Function calls        500K / month       ~300–400K
  Database bandwidth    1 GB / month       ~200–500 MB
  File storage          1 GB               Depends on uploads
  Action compute        25K GB-s / month   Low (email only)


  Biggest Bandwidth Consumers
  ───────────────────────────
  getDiscoverData         ~65 docs + ~65 storage URLs     Every home visit      HIGH
  getSession              1 session + 1 user doc          Every subscription    MEDIUM
  getUnreadCount          Up to 20 notification docs      Real-time             MEDIUM
  getDashboardAnalytics   ~50+ docs                       Admin only            LOW


  Optimization Ideas (Post-Launch)
  ────────────────────────────────
  1. TTL-cache discover data (refresh every 5 min instead of on every change)
  2. Lazy-load discover sections (above-fold first)
  3. Replace mark-all-read per-doc writes with a lastReadAt timestamp approach


================================================================================
  SECTION 8  —  DEPENDENCIES
================================================================================

  npm Audit Results
  ─────────────────
  MUST FIX:
    fast-uri <= 3.1.1              HIGH      Path traversal + host confusion
    @babel/...systemjs 7.12-7.29   HIGH      Arbitrary code execution

  SHOULD FIX:
    postcss < 8.5.10               MODERATE  XSS via unescaped output
    @tootallnate/once < 3.0.1      LOW       Incorrect control flow

  Run:  npm audit fix


  Core Dependencies — All Healthy
  ────────────────────────────────
  convex 1.32.x          Actively maintained
  expo 54.x              Latest stable
  react-native 0.81.x    Current
  jose                   Well-maintained (Google JWT verification)
  resend                 Active (email delivery)
  expo-secure-store      Hardware-backed token storage


================================================================================
  PRIORITY FIX LIST
================================================================================

  BEFORE LAUNCH
  ─────────────
   1. Integrate Sentry or Crashlytics ........................ 2–4 hrs
   2. Run npm audit fix ..................................... 30 min
   3. Restrict Google API keys in GCP Console ............... 30 min
   4. Add auth guard to getDashboardRevenue ................. 15 min
   5. Set split JWT secrets in Convex production env ........ 15 min

  FIRST WEEK
  ──────────
   6. Cap getAdminRecipients with .take(20) ................. 5 min
   7. Consolidate resolveCoverUrls duplication .............. 30 min
   8. Split AuthContext into state + actions contexts ....... 1–2 hrs
   9. Run rebuildDashboardCounters in production ............ 15 min
  10. Test EAS production build end-to-end .................. 1 hr

  POST-LAUNCH
  ───────────
  11. Split large admin pages into sub-components ........... 4–8 hrs
  12. Implement lastReadAt for notification reads ........... 2–4 hrs
  13. Add discover data TTL caching ......................... 2–4 hrs
  14. Add uptime monitoring ................................. 1 hr
  15. Clean remaining lint warnings ......................... 1–2 hrs


================================================================================
  END OF AUDIT
================================================================================
