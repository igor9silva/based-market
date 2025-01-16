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
	operation?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	if (!operation) return tool(metadata);

	return tool({
		...metadata,
		execute: async (): Promise<any> => {
			throw new Error('Should never run!');
		},
	});
};
