/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as analytics from "../analytics.js";
import type * as analytics_helpers from "../analytics/helpers.js";
import type * as analytics_read from "../analytics/read.js";
import type * as analytics_write from "../analytics/write.js";
import type * as auth from "../auth.js";
import type * as auth_helpers from "../auth/helpers.js";
import type * as auth_password from "../auth/password.js";
import type * as auth_session from "../auth/session.js";
import type * as auth_signin from "../auth/signin.js";
import type * as auth_signup from "../auth/signup.js";
import type * as books from "../books.js";
import type * as books_helpers from "../books/helpers.js";
import type * as books_internal from "../books/internal.js";
import type * as books_read from "../books/read.js";
import type * as books_write from "../books/write.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as email_helpers from "../email/helpers.js";
import type * as email_internal from "../email/internal.js";
import type * as favorites from "../favorites.js";
import type * as favorites_read from "../favorites/read.js";
import type * as favorites_write from "../favorites/write.js";
import type * as http from "../http.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_authHelpers from "../lib/authHelpers.js";
import type * as lib_bookHelpers from "../lib/bookHelpers.js";
import type * as lib_google from "../lib/google.js";
import type * as lib_jwt from "../lib/jwt.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_reviewCounters from "../lib/reviewCounters.js";
import type * as notifications from "../notifications.js";
import type * as notifications_helpers from "../notifications/helpers.js";
import type * as notifications_internal from "../notifications/internal.js";
import type * as notifications_read from "../notifications/read.js";
import type * as notifications_write from "../notifications/write.js";
import type * as paymentSettings from "../paymentSettings.js";
import type * as paymentSettings_helpers from "../paymentSettings/helpers.js";
import type * as paymentSettings_read from "../paymentSettings/read.js";
import type * as paymentSettings_write from "../paymentSettings/write.js";
import type * as payments from "../payments.js";
import type * as payments_helpers from "../payments/helpers.js";
import type * as payments_read from "../payments/read.js";
import type * as payments_write from "../payments/write.js";
import type * as readLater from "../readLater.js";
import type * as readLater_read from "../readLater/read.js";
import type * as readLater_write from "../readLater/write.js";
import type * as rentals from "../rentals.js";
import type * as rentals_addresses from "../rentals/addresses.js";
import type * as rentals_helpers from "../rentals/helpers.js";
import type * as rentals_internal from "../rentals/internal.js";
import type * as rentals_read from "../rentals/read.js";
import type * as rentals_write from "../rentals/write.js";
import type * as reviews from "../reviews.js";
import type * as reviews_read from "../reviews/read.js";
import type * as reviews_write from "../reviews/write.js";
import type * as series from "../series.js";
import type * as series_helpers from "../series/helpers.js";
import type * as series_read from "../series/read.js";
import type * as series_write from "../series/write.js";
import type * as users from "../users.js";
import type * as users_read from "../users/read.js";
import type * as users_write from "../users/write.js";
import type * as verifications from "../verifications.js";
import type * as verifications_helpers from "../verifications/helpers.js";
import type * as verifications_read from "../verifications/read.js";
import type * as verifications_write from "../verifications/write.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  "analytics/helpers": typeof analytics_helpers;
  "analytics/read": typeof analytics_read;
  "analytics/write": typeof analytics_write;
  auth: typeof auth;
  "auth/helpers": typeof auth_helpers;
  "auth/password": typeof auth_password;
  "auth/session": typeof auth_session;
  "auth/signin": typeof auth_signin;
  "auth/signup": typeof auth_signup;
  books: typeof books;
  "books/helpers": typeof books_helpers;
  "books/internal": typeof books_internal;
  "books/read": typeof books_read;
  "books/write": typeof books_write;
  crons: typeof crons;
  email: typeof email;
  "email/helpers": typeof email_helpers;
  "email/internal": typeof email_internal;
  favorites: typeof favorites;
  "favorites/read": typeof favorites_read;
  "favorites/write": typeof favorites_write;
  http: typeof http;
  "lib/auditLog": typeof lib_auditLog;
  "lib/authHelpers": typeof lib_authHelpers;
  "lib/bookHelpers": typeof lib_bookHelpers;
  "lib/google": typeof lib_google;
  "lib/jwt": typeof lib_jwt;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/reviewCounters": typeof lib_reviewCounters;
  notifications: typeof notifications;
  "notifications/helpers": typeof notifications_helpers;
  "notifications/internal": typeof notifications_internal;
  "notifications/read": typeof notifications_read;
  "notifications/write": typeof notifications_write;
  paymentSettings: typeof paymentSettings;
  "paymentSettings/helpers": typeof paymentSettings_helpers;
  "paymentSettings/read": typeof paymentSettings_read;
  "paymentSettings/write": typeof paymentSettings_write;
  payments: typeof payments;
  "payments/helpers": typeof payments_helpers;
  "payments/read": typeof payments_read;
  "payments/write": typeof payments_write;
  readLater: typeof readLater;
  "readLater/read": typeof readLater_read;
  "readLater/write": typeof readLater_write;
  rentals: typeof rentals;
  "rentals/addresses": typeof rentals_addresses;
  "rentals/helpers": typeof rentals_helpers;
  "rentals/internal": typeof rentals_internal;
  "rentals/read": typeof rentals_read;
  "rentals/write": typeof rentals_write;
  reviews: typeof reviews;
  "reviews/read": typeof reviews_read;
  "reviews/write": typeof reviews_write;
  series: typeof series;
  "series/helpers": typeof series_helpers;
  "series/read": typeof series_read;
  "series/write": typeof series_write;
  users: typeof users;
  "users/read": typeof users_read;
  "users/write": typeof users_write;
  verifications: typeof verifications;
  "verifications/helpers": typeof verifications_helpers;
  "verifications/read": typeof verifications_read;
  "verifications/write": typeof verifications_write;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {};
