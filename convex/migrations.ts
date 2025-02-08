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

// export const temp5 = migrations.define({
// 	table: 'actions',
// 	customRange: (query) =>
// 		query.filter((q) =>
// 			q.or(
// 				q.eq(q.field('status'), 'skipped'),
// 				q.eq(q.field('status'), 'failed'),
// 				q.eq(q.field('status'), 'succeeded'),
// 			),
// 		),
// 	migrateOne: async (_ctx, doc) => ({ costs: [] }),
// });

// export const runTemp5 = migrations.runner(internal.migrations.temp5);
