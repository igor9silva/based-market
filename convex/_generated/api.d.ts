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
import type * as lib from "../lib.js";
import type * as magic from "../magic.js";
import type * as schemas_author from "../schemas/author.js";
import type * as schemas_task from "../schemas/task.js";
import type * as schemas_taskAction from "../schemas/taskAction.js";
import type * as taskActions from "../taskActions.js";
import type * as tasks from "../tasks.js";
import type * as tools_checkFact from "../tools/checkFact.js";
import type * as tools_fillTask from "../tools/fillTask.js";
import type * as tools_index from "../tools/index.js";
import type * as tools_minifyDescription from "../tools/minifyDescription.js";
import type * as tools_scrape_invalidRequest from "../tools/scrape/invalidRequest.js";
import type * as tools_scrape_scrapeTwitter from "../tools/scrape/scrapeTwitter.js";
import type * as tools_scrape_scrapeWeb from "../tools/scrape/scrapeWeb.js";
import type * as tools_scrapeLink from "../tools/scrapeLink.js";
import type * as tools_updateTask from "../tools/updateTask.js";
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
  lib: typeof lib;
  magic: typeof magic;
  "schemas/author": typeof schemas_author;
  "schemas/task": typeof schemas_task;
  "schemas/taskAction": typeof schemas_taskAction;
  taskActions: typeof taskActions;
  tasks: typeof tasks;
  "tools/checkFact": typeof tools_checkFact;
  "tools/fillTask": typeof tools_fillTask;
  "tools/index": typeof tools_index;
  "tools/minifyDescription": typeof tools_minifyDescription;
  "tools/scrape/invalidRequest": typeof tools_scrape_invalidRequest;
  "tools/scrape/scrapeTwitter": typeof tools_scrape_scrapeTwitter;
  "tools/scrape/scrapeWeb": typeof tools_scrape_scrapeWeb;
  "tools/scrapeLink": typeof tools_scrapeLink;
  "tools/updateTask": typeof tools_updateTask;
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
