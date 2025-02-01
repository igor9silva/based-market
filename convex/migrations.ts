import { Migrations } from '@convex-dev/migrations';
import { components } from './_generated/api.js';
import { DataModel } from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);

// export const temp3 = migrations.define({
// 	table: 'actions',
// 	// customRange: (query) => query.withIndex('by_requiredField', (q) => q.eq('requiredField', '')),
// 	migrateOne: async (_ctx, doc) => ({ owner: `` as Id<'users'> }),
// });

// export const runTemp3 = migrations.runner(internal.migrations.temp3);

// export const temp4 = migrations.define({
// 	table: 'tasks',
// 	// customRange: (query) => query.withIndex('by_requiredField', (q) => q.eq('requiredField', '')),
// 	migrateOne: async (_ctx, doc) => ({ owner: `` as Id<'users'> }),
// });

// export const runTemp4 = migrations.runner(internal.migrations.temp4);
