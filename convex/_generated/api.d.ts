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
import type * as favorites from "../favorites.js";
import type * as http from "../http.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_authHelpers from "../lib/authHelpers.js";
import type * as lib_bookHelpers from "../lib/bookHelpers.js";
import type * as lib_google from "../lib/google.js";
import type * as lib_jwt from "../lib/jwt.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as lib_reviewCounters from "../lib/reviewCounters.js";
import type * as notifications from "../notifications.js";
import type * as paymentSettings from "../paymentSettings.js";
import type * as payments from "../payments.js";
import type * as readLater from "../readLater.js";
import type * as rentals from "../rentals.js";
import type * as rentals_helpers from "../rentals/helpers.js";
import type * as rentals_internal from "../rentals/internal.js";
import type * as rentals_read from "../rentals/read.js";
import type * as rentals_write from "../rentals/write.js";
import type * as reviews from "../reviews.js";
import type * as series from "../series.js";
import type * as users from "../users.js";
import type * as verifications from "../verifications.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
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
  favorites: typeof favorites;
  http: typeof http;
  "lib/auditLog": typeof lib_auditLog;
  "lib/authHelpers": typeof lib_authHelpers;
  "lib/bookHelpers": typeof lib_bookHelpers;
  "lib/google": typeof lib_google;
  "lib/jwt": typeof lib_jwt;
  "lib/rateLimit": typeof lib_rateLimit;
  "lib/reviewCounters": typeof lib_reviewCounters;
  notifications: typeof notifications;
  paymentSettings: typeof paymentSettings;
  payments: typeof payments;
  readLater: typeof readLater;
  rentals: typeof rentals;
  "rentals/helpers": typeof rentals_helpers;
  "rentals/internal": typeof rentals_internal;
  "rentals/read": typeof rentals_read;
  "rentals/write": typeof rentals_write;
  reviews: typeof reviews;
  series: typeof series;
  users: typeof users;
  verifications: typeof verifications;
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
