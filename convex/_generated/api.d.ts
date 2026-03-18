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
import type * as favorites from "../favorites.js";
import type * as lib_authHelpers from "../lib/authHelpers.js";
import type * as lib_google from "../lib/google.js";
import type * as lib_jwt from "../lib/jwt.js";
import type * as notifications from "../notifications.js";
import type * as payments from "../payments.js";
import type * as readLater from "../readLater.js";
import type * as rentals from "../rentals.js";
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
  favorites: typeof favorites;
  "lib/authHelpers": typeof lib_authHelpers;
  "lib/google": typeof lib_google;
  "lib/jwt": typeof lib_jwt;
  notifications: typeof notifications;
  payments: typeof payments;
  readLater: typeof readLater;
  rentals: typeof rentals;
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
