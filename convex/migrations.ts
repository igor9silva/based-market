import { Migrations } from '@convex-dev/migrations';
import { components } from './_generated/api.js';
import { DataModel } from './_generated/dataModel.js';

export const migrations = new Migrations<DataModel>(components.migrations);

// export const fillAuthorFromOwner = migrations.define({
// 	table: 'tasks',
// 	// customRange: (query) => query.withIndex('by_requiredField', (q) => q.eq('requiredField', '')),
// 	migrateOne: async (_ctx, doc) => ({ author: doc.owner }),
// });

// export const runFillAuthorFromOwner = migrations.runner(internal.migrations.fillAuthorFromOwner);
