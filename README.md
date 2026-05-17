# LitLoop

LitLoop is a React Native mobile app for discovering, renting, paying for, and returning physical books through a managed delivery workflow. It uses Expo for the native app surface and Convex for the realtime backend, database, storage, scheduled jobs, and internal actions.

The current product supports public browsing, account creation, Google sign-in, book rentals, College Zone student verification, admin operations, UPI/cash payment verification, notifications, reviews, and analytics.

## Features

| Area | Capability |
| --- | --- |
| Catalog | Book discovery, genre search, curated sections, series, related books, ratings, favorites, and read-later lists. |
| Rentals | Home and College delivery requests, admin delivery scheduling, pickup scheduling, payment, return processing, and late-fee tracking. |
| Student Verification | Student ID upload, manual admin approval/rejection, cooldown after rejection, and College Zone access control. |
| Payments | UPI screenshot + UTR submission, cash selection, admin payment verification, configurable UPI settings, and audit logs. |
| Auth | Email OTP signup, password login, Google sign-in, JWT access/refresh sessions, SecureStore persistence, and session revocation. |
| Admin | Dashboard analytics, book management, rentals, payment review, student verification, notifications, and payment settings. |
| Realtime UX | Convex reactive queries keep catalog, rentals, notifications, and admin queues in sync without polling. |
| Operations | Sentry integration, Expo push notifications, Convex cron jobs, EAS build profiles, and production Android hardening. |

## Tech Stack

| Layer | Technology |
| --- | --- |
| Mobile app | React Native 0.81, React 19, Expo SDK 54 |
| Routing | Expo Router 6 with file-based route groups |
| Backend | Convex functions, database, storage, scheduler, crons, HTTP routes |
| State | React Context for auth/network/toast, Convex `useQuery`/`useMutation` for server state |
| Auth storage | `expo-secure-store` |
| Media/storage | Convex Storage, `expo-image-picker`, `expo-image` |
| Maps/location | `expo-location`, `react-native-maps`, Google Maps API key |
| Notifications | `expo-notifications` and Expo push service |
| Monitoring | `@sentry/react-native` |
| Build/release | Expo Application Services (EAS) |

## Folder Structure

```text
Litloop/
|-- app/                         Expo Router screens and route groups
|   |-- (auth)/                   Sign-in and sign-up flows
|   |-- (tabs)/                   Home, search, rentals, history, profile
|   |-- (admin)/                  Admin dashboard and operations
|   |-- book/[id].tsx             Book details
|   |-- profile/verify.tsx        Student verification UI
|   `-- rental/                   Rental request, payment, return scheduling
|-- components/                   Reusable UI, domain, admin, auth, and rental components
|-- constants/                    Theme, fonts, genres, feature flags, pagination
|-- context/                      Auth, network, and toast providers
|-- convex/                       Backend schema, queries, mutations, actions, crons
|   |-- schema.ts                 Convex table definitions and indexes
|   |-- auth.ts                   OTP, local auth, Google auth, sessions
|   |-- books.ts                  Catalog and admin book operations
|   |-- rentals.ts                Rental lifecycle
|   |-- payments.ts               Payment submission and admin verification
|   |-- verifications.ts          Student verification workflow
|   |-- lib/                      Backend helpers for auth, JWT, audit, books, rates
|   `-- _generated/               Convex generated API/data model files
|-- docs/                         Engineering documentation
|-- hooks/                        Screen and feature hooks
|-- utils/                        Formatting, location, admin, book, and device helpers
|-- assets/                       Images and bundled fonts
|-- app.json                      Expo app manifest
|-- app.config.js                 Dynamic Expo config and Sentry plugin
|-- eas.json                      EAS build profiles
`-- package.json                  Scripts and dependencies
```

## Installation

### Prerequisites

- Node.js 18 or newer
- npm
- Expo tooling through `npx expo`
- Convex account and project
- EAS account for production builds
- Android Studio for local Android emulator/device builds

### Setup

```bash
git clone <repo-url>
cd Litloop
npm install
```

Copy `.env.example` to `.env.local` and fill in the required values.

```bash
cp .env.example .env.local
```

On Windows PowerShell:

```powershell
Copy-Item .env.example .env.local
```

## Environment Variables

Client-side Expo variables use the `EXPO_PUBLIC_` prefix and are bundled into the app. Do not put secrets in those values.

| Variable | Scope | Purpose |
| --- | --- | --- |
| `EXPO_PUBLIC_CONVEX_URL` | Expo | Convex deployment URL used by `ConvexReactClient`. |
| `EXPO_PUBLIC_CONVEX_SITE_URL` | Expo | Convex site URL for HTTP routes, if needed by the app or tooling. |
| `EXPO_PUBLIC_GOOGLE_SIGNIN_ENABLED` | Expo | Feature toggle for Google sign-in UI. |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_ANDROID` | Expo | Android OAuth client ID. |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_IOS` | Expo | iOS OAuth client ID. |
| `EXPO_PUBLIC_GOOGLE_CLIENT_ID_WEB` | Expo | Web OAuth client ID used by Expo Auth Session. |
| `EXPO_PUBLIC_OWNER` | Expo | Expo account name used in the auth proxy redirect URI. |
| `EXPO_PUBLIC_GOOGLE_MAPS_KEY` | Expo | Google Maps key for Android map configuration. |
| `EXPO_PUBLIC_UPI_ID` | Expo | Legacy/public fallback UPI ID. Runtime settings are backend-driven. |
| `EXPO_PUBLIC_SENTRY_DSN` | Expo | Enables Sentry in non-development builds. |
| `GOOGLE_SERVICES_JSON` | EAS | Secret file reference for Firebase/Google services on Android. |
| `SENTRY_ORG`, `SENTRY_PROJECT`, `SENTRY_AUTH_TOKEN` | EAS/Sentry | Sentry source map and project integration. |
| `JWT_ACCESS_SECRET` | Convex | Backend secret for access token signing. |
| `JWT_REFRESH_SECRET` | Convex | Backend secret for refresh token signing. |
| `ACCESS_TOKEN_EXPIRY_MINUTES` | Convex | Optional access token lifetime, defaults to 30 minutes. |
| `REFRESH_TOKEN_EXPIRY_DAYS` | Convex | Optional refresh token lifetime, defaults to 10 days. |
| `GOOGLE_CLIENT_ID` | Convex | Google client ID used to verify server-side ID tokens. |
| `RESEND_API_KEY` | Convex | Email delivery for OTP messages. |
| `USE_DEV_OTP` | Convex | Development-only OTP mode. Never enable in production. |

Set Convex backend secrets with:

```bash
npx convex env set JWT_ACCESS_SECRET "<strong-secret>"
npx convex env set JWT_REFRESH_SECRET "<strong-secret>"
npx convex env set GOOGLE_CLIENT_ID "<google-client-id>"
npx convex env set RESEND_API_KEY "<resend-api-key>"
```

## Convex Setup

Start Convex locally:

```bash
npx convex dev
```

This generates the `convex/_generated` API files and prints the deployment URL. Add that URL to `EXPO_PUBLIC_CONVEX_URL`.

Deploy backend functions:

```bash
npx convex deploy
```

Useful health check after deploy:

```text
GET <EXPO_PUBLIC_CONVEX_SITE_URL>/health
```

## Expo Setup

Start the Expo development server:

```bash
npm start
```

Run on Android:

```bash
npm run android
```

Run on iOS:

```bash
npm run ios
```

Run web preview:

```bash
npm run web
```

## Running Locally

Use two terminals:

```bash
npx convex dev
npm start
```

For features that touch Google sign-in, maps, email OTP, push notifications, or payment screenshots, verify the matching environment variables and platform configuration first.

## Production Build

Before building:

```bash
npm run lint
npx convex deploy
```

Build Android production artifact:

```bash
eas build --profile production --platform android
```

Build Android internal preview:

```bash
eas build --profile preview --platform android
```

Build iOS production artifact:

```bash
eas build --profile production --platform ios
```

## EAS Build Notes

The project uses `eas.json` profiles:

| Profile | Use |
| --- | --- |
| `development` | Development client builds. |
| `preview` | Internal distribution builds with auto-increment enabled. |
| `production` | Store-ready builds with production environment values. |

Recommended first-time EAS commands:

```bash
npx eas login
npx eas build:configure
npx eas secret:create --scope project --name GOOGLE_SERVICES_JSON --type file --value ./google-services.json
```

For Android Play Store submission, prefer AAB output from the production profile. Keep signing credentials managed by EAS unless there is an explicit reason to bring your own keystore.

## Screenshots

Add production screenshots here after the next release.

| Screen | Placeholder |
| --- | --- |
| Home | `docs/assets/screenshots/home.png` |
| Book Details | `docs/assets/screenshots/book-details.png` |
| Rental Request | `docs/assets/screenshots/rental-request.png` |
| Student Verification | `docs/assets/screenshots/student-verification.png` |
| Admin Dashboard | `docs/assets/screenshots/admin-dashboard.png` |
| Payment Verification | `docs/assets/screenshots/payment-verification.png` |

## Documentation

- [Architecture](./docs/architecture.md)
- [Convex Schema](./docs/convex-schema.md)
- [Authentication Flow](./docs/auth-flow.md)
- [Student Verification](./docs/student-verification.md)
- [Deployment](./docs/deployment.md)
- [Security](./docs/security.md)
- [API Reference](./docs/api-reference.md)

## Roadmap

- Add automated test coverage for critical auth, rental, payment, and verification paths.
- Add deep-link routing from notification payloads to rental and book detail screens.
- Add admin pagination/search for verification history and user management.
- Add staged rollout and rollback playbooks for OTA updates.
- Add structured audit-log viewer for security and support operations.
- Add observability dashboards for Convex errors, rental funnel conversion, and payment rejection reasons.
- Add screenshot capture and release asset automation for store submissions.

## Maintainers

LitLoop is structured for a small startup engineering team: keep business rules in Convex, keep screen orchestration in hooks, keep UI components presentational, and update `/docs` whenever behavior or operational assumptions change.
