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
import type * as actions from "../actions.js";
import type * as auth from "../auth.js";
import type * as components_ from "../components.js";
import type * as events from "../events.js";
import type * as http from "../http.js";
import type * as lib from "../lib.js";
import type * as magicRock from "../magicRock.js";
import type * as operations from "../operations.js";
import type * as schemas_actionSchema from "../schemas/actionSchema.js";
import type * as schemas_authorSchema from "../schemas/authorSchema.js";
import type * as schemas_componentSchema from "../schemas/componentSchema.js";
import type * as schemas_eventSchema from "../schemas/eventSchema.js";
import type * as schemas_operationSchema from "../schemas/operationSchema.js";
import type * as schemas_taskSchema from "../schemas/taskSchema.js";
import type * as tasks from "../tasks.js";
import type * as tools_checkFact from "../tools/checkFact.js";
import type * as tools_createHttpTool from "../tools/createHttpTool.js";
import type * as tools_createSubtask from "../tools/createSubtask.js";
import type * as tools_doNothing from "../tools/doNothing.js";
import type * as tools_fillTask from "../tools/fillTask.js";
import type * as tools_index from "../tools/index.js";
import type * as tools_markAsDone from "../tools/markAsDone.js";
import type * as tools_minifyDescription from "../tools/minifyDescription.js";
import type * as tools_moveTask from "../tools/moveTask.js";
import type * as tools_scrape_invalidRequest from "../tools/scrape/invalidRequest.js";
import type * as tools_scrape_scrapeTwitter from "../tools/scrape/scrapeTwitter.js";
import type * as tools_scrape_scrapeWeb from "../tools/scrape/scrapeWeb.js";
import type * as tools_scrapeLink from "../tools/scrapeLink.js";
import type * as tools_searchTasks from "../tools/searchTasks.js";
import type * as tools_sendMessage from "../tools/sendMessage.js";
import type * as tools_updateTask from "../tools/updateTask.js";
import type * as users from "../users.js";
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
  actions: typeof actions;
  auth: typeof auth;
  components: typeof components_;
  events: typeof events;
  http: typeof http;
  lib: typeof lib;
  magicRock: typeof magicRock;
  operations: typeof operations;
  "schemas/actionSchema": typeof schemas_actionSchema;
  "schemas/authorSchema": typeof schemas_authorSchema;
  "schemas/componentSchema": typeof schemas_componentSchema;
  "schemas/eventSchema": typeof schemas_eventSchema;
  "schemas/operationSchema": typeof schemas_operationSchema;
  "schemas/taskSchema": typeof schemas_taskSchema;
  tasks: typeof tasks;
  "tools/checkFact": typeof tools_checkFact;
  "tools/createHttpTool": typeof tools_createHttpTool;
  "tools/createSubtask": typeof tools_createSubtask;
  "tools/doNothing": typeof tools_doNothing;
  "tools/fillTask": typeof tools_fillTask;
  "tools/index": typeof tools_index;
  "tools/markAsDone": typeof tools_markAsDone;
  "tools/minifyDescription": typeof tools_minifyDescription;
  "tools/moveTask": typeof tools_moveTask;
  "tools/scrape/invalidRequest": typeof tools_scrape_invalidRequest;
  "tools/scrape/scrapeTwitter": typeof tools_scrape_scrapeTwitter;
  "tools/scrape/scrapeWeb": typeof tools_scrape_scrapeWeb;
  "tools/scrapeLink": typeof tools_scrapeLink;
  "tools/searchTasks": typeof tools_searchTasks;
  "tools/sendMessage": typeof tools_sendMessage;
  "tools/updateTask": typeof tools_updateTask;
  users: typeof users;
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
