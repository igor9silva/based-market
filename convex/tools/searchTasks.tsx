import { tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Semantically search for tasks',
	parameters: z.object({
		query: z.string().describe('The query to search for related tasks'),
	}),
};

export const searchTasks = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ query }) => {
			//
			const results = await ctx.runAction(internal.tasks._semanticSearch, { query });

			return results.map((r) => `- ${r.title} (score: ${(r._score * 100).toFixed(2)}%) ID: ${r._id}`).join('\n');
		},
	});
};
