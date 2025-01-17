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
import type * as actions_private from "../actions/private.js";
import type * as actions_public from "../actions/public.js";
import type * as auth from "../auth.js";
import type * as components_public from "../components/public.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as magicRock from "../magicRock.js";
import type * as schemas_actionSchema from "../schemas/actionSchema.js";
import type * as schemas_authorSchema from "../schemas/authorSchema.js";
import type * as schemas_componentSchema from "../schemas/componentSchema.js";
import type * as schemas_envSchema from "../schemas/envSchema.js";
import type * as schemas_taskSchema from "../schemas/taskSchema.js";
import type * as schemas_toolSchema from "../schemas/toolSchema.js";
import type * as tasks_private from "../tasks/private.js";
import type * as tasks_public from "../tasks/public.js";
import type * as tools_private_createHttpTool from "../tools/private/createHttpTool.js";
import type * as tools_private_execute from "../tools/private/execute.js";
import type * as tools_private_queries from "../tools/private/queries.js";
import type * as users_public from "../users/public.js";
import type * as utils_zodToString from "../utils/zodToString.js";

/**
 * A utility for referencing Convex functions in your app's API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
declare const fullApi: ApiFromModules<{
  "actions/private": typeof actions_private;
  "actions/public": typeof actions_public;
  auth: typeof auth;
  "components/public": typeof components_public;
  http: typeof http;
  lib: typeof lib;
  magicRock: typeof magicRock;
  "schemas/actionSchema": typeof schemas_actionSchema;
  "schemas/authorSchema": typeof schemas_authorSchema;
  "schemas/componentSchema": typeof schemas_componentSchema;
  "schemas/envSchema": typeof schemas_envSchema;
  "schemas/taskSchema": typeof schemas_taskSchema;
  "schemas/toolSchema": typeof schemas_toolSchema;
  "tasks/private": typeof tasks_private;
  "tasks/public": typeof tasks_public;
  "tools/private/createHttpTool": typeof tools_private_createHttpTool;
  "tools/private/execute": typeof tools_private_execute;
  "tools/private/queries": typeof tools_private_queries;
  "users/public": typeof users_public;
  "utils/zodToString": typeof utils_zodToString;
}>;
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;
