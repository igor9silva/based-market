/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
import type * as auth from "../auth.js";
import type * as http from "../http.js";
import type * as magic from "../magic.js";
import type * as spells_scrape from "../spells/scrape.js";
import type * as taskActions from "../taskActions.js";
import type * as tasks from "../tasks.js";
import type * as tools_invalidRequest from "../tools/invalidRequest.js";
import type * as tools_scrapeTwitter from "../tools/scrapeTwitter.js";
import type * as tools_scrapeWeb from "../tools/scrapeWeb.js";
import type * as users from "../users.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  auth: typeof auth;
  http: typeof http;
  magic: typeof magic;
  "spells/scrape": typeof spells_scrape;
  taskActions: typeof taskActions;
  tasks: typeof tasks;
  "tools/invalidRequest": typeof tools_invalidRequest;
  "tools/scrapeTwitter": typeof tools_scrapeTwitter;
  "tools/scrapeWeb": typeof tools_scrapeWeb;
  users: typeof users;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
