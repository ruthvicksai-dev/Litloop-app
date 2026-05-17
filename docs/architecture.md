# Architecture

LitLoop is an Expo Router app backed by Convex. The frontend owns native UI, navigation, local auth token storage, and form orchestration. Convex owns durable data, authorization, realtime synchronization, file storage, scheduled jobs, and server-side integrations.

Related diagrams: [System Architecture](./diagrams/system-architecture.md), [Convex Data Model](./diagrams/convex-data-model.md), [Rental Lifecycle](./diagrams/rental-lifecycle.md).

## System Overview

```text
React Native / Expo app
  |-- Expo Router screens
  |-- React Context providers
  |-- Feature hooks
  |-- Convex useQuery/useMutation
        |
        v
Convex backend
  |-- schema.ts tables + indexes
  |-- queries for realtime reads
  |-- mutations for business writes
  |-- actions/internal actions for email + push
  |-- storage for covers, payment screenshots, student IDs
  |-- crons for cleanup and inventory reconciliation
```

## Frontend Structure

The app uses a feature-oriented structure:

- `app/` contains route files and route groups.
- `components/` contains reusable UI and domain components.
- `hooks/` contains screen orchestration and feature-specific state.
- `context/` contains app-wide providers for auth, network, and toast state.
- `utils/` contains pure helpers for formatting, location, books, device behavior, and admin calculations.
- `constants/` contains shared theme, font, genre, feature, and pagination configuration.

Screens should stay thin. If a screen needs async behavior, form state, or Convex calls, put that orchestration in a hook and pass clean props into presentational components.

## Backend Structure

Convex modules are grouped by domain:

- `auth.ts`: OTP signup, local sign-in, Google sign-in, JWT sessions, password reset, session revocation.
- `books.ts`: catalog reads, search, admin book CRUD, cover upload URLs, discover data.
- `rentals.ts`: rental request, delivery scheduling, pickup scheduling, returns, rental history.
- `payments.ts`: UPI/cash payment submission, screenshot validation, admin verification.
- `verifications.ts`: student ID upload URLs, verification submission, admin approval/rejection.
- `notifications.ts`: push token updates, in-app notifications, internal push actions.
- `reviews.ts`: reviews, moderation, votes, reports, rating counters.
- `analytics.ts`: dashboard counters, revenue, daily/monthly aggregations.
- `paymentSettings.ts`: admin-managed UPI settings.
- `lib/`: shared backend helpers for auth, JWT, audit logs, book mapping, rate limits, and review counters.

## Data Flow

```text
Screen -> hook -> Convex mutation/query -> Convex table/storage
   ^             |
   |             v
Realtime query re-runs over WebSocket and updates UI
```

Typical example:

1. A user submits a rental request from `app/rental/request.tsx`.
2. `useRequestRentalScreen` validates local form state and calls `api.rentals.requestRental`.
3. Convex authenticates the access token, validates zone/location/book availability, decrements `books.availableCopies`, inserts `rentals`, and schedules notifications.
4. Active `useQuery` subscriptions for rentals, admin queues, catalog availability, and notifications update automatically.

## State Management

Use three layers of state:

- Server state: Convex `useQuery` and `useMutation`.
- App session state: `AuthProvider` stores access/refresh tokens in `expo-secure-store`, exposes `useAuthState` and `useAuthActions`, and refreshes sessions.
- Local UI state: component or hook `useState` for forms, modals, filters, and loading flags.

Avoid duplicating Convex documents into global React state. Let Convex subscriptions remain the source of truth for persisted data.

## Navigation Architecture

Expo Router provides file-based routing:

- `app/_layout.tsx` initializes Sentry, Convex, providers, splash gating, and the root `Stack`.
- `app/(auth)` contains unauthenticated auth screens.
- `app/(tabs)` contains the user-facing tab interface and allows guest browsing.
- `app/(admin)` is protected by `useAdminRouteGuard`.
- `app/rental`, `app/book/[id].tsx`, `app/profile/*`, and `app/notifications.tsx` are shared stack routes.

Route guards:

- `useRootRedirect` sends admins to `/(admin)/dashboard` and users/guests to tabs.
- `useTabsRouteGuard` moves admins out of regular tabs.
- `useAdminRouteGuard` sends unauthenticated or non-admin users to sign-in.

## Realtime Sync Flow

Convex query subscriptions keep lists and details fresh:

```text
Mutation writes document
  -> affected query indexes are invalidated
  -> subscribed clients receive updated query results
  -> React re-renders subscribed screens/components
```

Performance-sensitive reads use bounded `.take(...)`, pagination, or consolidated queries. For example, `books.getDiscoverData` intentionally combines multiple home sections to reduce the number of active subscriptions.

## File Upload Flow

LitLoop uses Convex Storage for book covers, payment screenshots, and student ID images.

```text
Client requests upload URL
  -> Convex authorizes caller and rate-limits URL generation
Client POSTs binary to Convex Storage URL
  -> Convex returns storageId
Client submits storageId in domain mutation
  -> mutation validates metadata, content type, size, and ownership/context
  -> domain record references storageId
```

Important upload paths:

- `books.generateUploadUrl`: admin-only cover uploads.
- `payments.generateUploadUrl`: authenticated payment screenshot uploads.
- `verifications.generateUploadUrl`: authenticated student ID uploads.

## Modular Scalability Strategy

- Keep domain mutations in one Convex module per business area.
- Keep authorization at the beginning of every sensitive Convex function.
- Prefer indexed reads and pagination over `.collect()`.
- Use internal actions for external side effects like email and push.
- Use crons for maintenance tasks that can be retried safely.
- Use audit logs for sensitive operations such as payments, account deletion, verification, and admin updates.
- Keep UI components reusable and business decisions inside hooks/backend functions.
