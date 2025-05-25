import { Migrations } from '@convex-dev/migrations';
import { components } from './_generated/api.js';
import { DataModel } from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);

// export const fillDepth = migrations.define({
// 	table: 'actions',
// 	// customRange: (query) => query.withIndex('by_requiredField', (q) => q.eq('requiredField', '')),
// 	migrateOne: async (_ctx, doc) => ({ depth: 0 }),
// });

// export const runFillDepth = migrations.runner(internal.migrations.fillDepth);
