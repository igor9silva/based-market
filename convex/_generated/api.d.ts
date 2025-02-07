/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as action_lifecycle_private from "../action/lifecycle/private.js";
import type * as action_private from "../action/private.js";
import type * as action_public from "../action/public.js";
import type * as auth_WorldID from "../auth/WorldID.js";
import type * as auth_WorldWallet from "../auth/WorldWallet.js";
import type * as auth from "../auth.js";
import type * as components_private from "../components/private.js";
import type * as components_public from "../components/public.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as magicRock from "../magicRock.js";
import type * as migrations from "../migrations.js";
import type * as schemas_actionSchema from "../schemas/actionSchema.js";
import type * as schemas_authorSchema from "../schemas/authorSchema.js";
import type * as schemas_componentSchema from "../schemas/componentSchema.js";
import type * as schemas_envSchema from "../schemas/envSchema.js";
import type * as schemas_paginationOptionsSchema from "../schemas/paginationOptionsSchema.js";
import type * as schemas_taskSchema from "../schemas/taskSchema.js";
import type * as schemas_toolSchema from "../schemas/toolSchema.js";
import type * as schemas_transactionSchema from "../schemas/transactionSchema.js";
import type * as schemas_userSchema from "../schemas/userSchema.js";
import type * as tasks_private from "../tasks/private.js";
import type * as tasks_public from "../tasks/public.js";
import type * as tools_createDecisionTool from "../tools/createDecisionTool.js";
import type * as tools_createHttpTool from "../tools/createHttpTool.js";
import type * as tools_private from "../tools/private.js";
import type * as transactions_private from "../transactions/private.js";
import type * as transactions_public from "../transactions/public.js";
import type * as users_private from "../users/private.js";
import type * as users_public from "../users/public.js";
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
  "action/lifecycle/private": typeof action_lifecycle_private;
  "action/private": typeof action_private;
  "action/public": typeof action_public;
  "auth/WorldID": typeof auth_WorldID;
  "auth/WorldWallet": typeof auth_WorldWallet;
  auth: typeof auth;
  "components/private": typeof components_private;
  "components/public": typeof components_public;
  http: typeof http;
  lib: typeof lib;
  magicRock: typeof magicRock;
  migrations: typeof migrations;
  "schemas/actionSchema": typeof schemas_actionSchema;
  "schemas/authorSchema": typeof schemas_authorSchema;
  "schemas/componentSchema": typeof schemas_componentSchema;
  "schemas/envSchema": typeof schemas_envSchema;
  "schemas/paginationOptionsSchema": typeof schemas_paginationOptionsSchema;
  "schemas/taskSchema": typeof schemas_taskSchema;
  "schemas/toolSchema": typeof schemas_toolSchema;
  "schemas/transactionSchema": typeof schemas_transactionSchema;
  "schemas/userSchema": typeof schemas_userSchema;
  "tasks/private": typeof tasks_private;
  "tasks/public": typeof tasks_public;
  "tools/createDecisionTool": typeof tools_createDecisionTool;
  "tools/createHttpTool": typeof tools_createHttpTool;
  "tools/private": typeof tools_private;
  "transactions/private": typeof transactions_private;
  "transactions/public": typeof transactions_public;
  "users/private": typeof users_private;
  "users/public": typeof users_public;
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
