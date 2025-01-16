import { tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Do nothing.',
	parameters: z.object({}),
};

export const doNothing = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'actions'> & { kind: 'tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async (): Promise<any> => {
			throw new Error('Should never run!');
		},
	});
};
