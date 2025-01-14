import { tool } from 'ai';
import { z } from 'zod';

import { Doc } from '../../_generated/dataModel';
import { ActionCtx } from '../../_generated/server';

export const invalidRequest = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'operations'>,
) => {
	return tool({
		description: 'You are unable to fulfill the request for any reason.',
		parameters: z.object({
			reason: z.string().describe('The reason you are unable to fulfill the request.'),
		}),
		execute: async ({ reason }) => reason,
	});
};
