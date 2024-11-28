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
import type * as schemas_taskEvent from "../schemas/taskEvent.js";
import type * as spells_factCheck from "../spells/factCheck.js";
import type * as spells_fill from "../spells/fill.js";
import type * as spells_index from "../spells/index.js";
import type * as spells_minify from "../spells/minify.js";
import type * as spells_scrape from "../spells/scrape.js";
import type * as taskActions from "../taskActions.js";
import type * as taskEvents from "../taskEvents.js";
import type * as tasks from "../tasks.js";
import type * as tools_invalidRequest from "../tools/invalidRequest.js";
import type * as tools_scrapeTwitter from "../tools/scrapeTwitter.js";
import type * as tools_scrapeWeb from "../tools/scrapeWeb.js";
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
  "schemas/taskEvent": typeof schemas_taskEvent;
  "spells/factCheck": typeof spells_factCheck;
  "spells/fill": typeof spells_fill;
  "spells/index": typeof spells_index;
  "spells/minify": typeof spells_minify;
  "spells/scrape": typeof spells_scrape;
  taskActions: typeof taskActions;
  taskEvents: typeof taskEvents;
  tasks: typeof tasks;
  "tools/invalidRequest": typeof tools_invalidRequest;
  "tools/scrapeTwitter": typeof tools_scrapeTwitter;
  "tools/scrapeWeb": typeof tools_scrapeWeb;
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
