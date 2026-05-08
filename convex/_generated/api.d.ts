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
import type * as books from "../books.js";
import type * as crons from "../crons.js";
import type * as email from "../email.js";
import type * as favorites from "../favorites.js";
import type * as lib_auditLog from "../lib/auditLog.js";
import type * as lib_authHelpers from "../lib/authHelpers.js";
import type * as lib_bookHelpers from "../lib/bookHelpers.js";
import type * as lib_google from "../lib/google.js";
import type * as lib_jwt from "../lib/jwt.js";
import type * as lib_rateLimit from "../lib/rateLimit.js";
import type * as notifications from "../notifications.js";
import type * as paymentSettings from "../paymentSettings.js";
import type * as payments from "../payments.js";
import type * as readLater from "../readLater.js";
import type * as rentals from "../rentals.js";
import type * as reviews from "../reviews.js";
import type * as series from "../series.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  analytics: typeof analytics;
  auth: typeof auth;
  books: typeof books;
  crons: typeof crons;
  email: typeof email;
  favorites: typeof favorites;
  "lib/auditLog": typeof lib_auditLog;
  "lib/authHelpers": typeof lib_authHelpers;
  "lib/bookHelpers": typeof lib_bookHelpers;
  "lib/google": typeof lib_google;
  "lib/jwt": typeof lib_jwt;
  "lib/rateLimit": typeof lib_rateLimit;
  notifications: typeof notifications;
  paymentSettings: typeof paymentSettings;
  payments: typeof payments;
  readLater: typeof readLater;
  rentals: typeof rentals;
  reviews: typeof reviews;
  series: typeof series;
  users: typeof users;
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
