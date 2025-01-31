import { Migrations } from '@convex-dev/migrations';
import { components } from './_generated/api.js';
import { DataModel } from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);

// export const temp2 = migrations.define({
// 	table: 'actions',
// 	// customRange: (query) => query.withIndex('by_requiredField', (q) => q.eq('requiredField', '')),
// 	migrateOne: async (_ctx, doc) => ({ key: undefined }),
// });

// export const runTemp2 = migrations.runner(internal.migrations.temp2);
