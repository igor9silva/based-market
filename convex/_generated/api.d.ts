/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as auth from "../auth.js";
import type * as games_private from "../games/private.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as migrations from "../migrations.js";
import type * as schemas_envSchema from "../schemas/envSchema.js";
import type * as schemas_gameSchema from "../schemas/gameSchema.js";
import type * as schemas_userSchema from "../schemas/userSchema.js";
import type * as users_preferences_private from "../users/preferences/private.js";
import type * as users_preferences_public from "../users/preferences/public.js";
import type * as users_private from "../users/private.js";
import type * as users_public from "../users/public.js";
import type * as utils_errors from "../utils/errors.js";
import type * as utils_money from "../utils/money.js";
import type * as utils_zodToString from "../utils/zodToString.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";
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
  "games/private": typeof games_private;
  http: typeof http;
  lib: typeof lib;
  migrations: typeof migrations;
  "schemas/envSchema": typeof schemas_envSchema;
  "schemas/gameSchema": typeof schemas_gameSchema;
  "schemas/userSchema": typeof schemas_userSchema;
  "users/preferences/private": typeof users_preferences_private;
  "users/preferences/public": typeof users_preferences_public;
  "users/private": typeof users_private;
  "users/public": typeof users_public;
  "utils/errors": typeof utils_errors;
  "utils/money": typeof utils_money;
  "utils/zodToString": typeof utils_zodToString;
}>;
declare const fullApiWithMounts: typeof fullApi;

export declare const api: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApiWithMounts,
  FunctionReference<any, "internal">
>;

export declare const components: {
  migrations: {
    lib: {
      cancel: FunctionReference<
        "mutation",
        "internal",
        { name: string },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
      cancelAll: FunctionReference<
        "mutation",
        "internal",
        { sinceTs?: number },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      clearAll: FunctionReference<
        "mutation",
        "internal",
        { before?: number },
        null
      >;
      getStatus: FunctionReference<
        "query",
        "internal",
        { limit?: number; names?: Array<string> },
        Array<{
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }>
      >;
      migrate: FunctionReference<
        "mutation",
        "internal",
        {
          batchSize?: number;
          cursor?: string | null;
          dryRun: boolean;
          fnHandle: string;
          name: string;
          next?: Array<{ fnHandle: string; name: string }>;
        },
        {
          batchSize?: number;
          cursor?: string | null;
          error?: string;
          isDone: boolean;
          latestEnd?: number;
          latestStart: number;
          name: string;
          next?: Array<string>;
          processed: number;
          state: "inProgress" | "success" | "failed" | "canceled" | "unknown";
        }
      >;
    };
  };
};
