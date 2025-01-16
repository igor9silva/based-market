import { tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Send a message to the user.',
	parameters: z.object({
		message: z.string().describe('The message to send to the user in MDX/Markdown format.'),
	}),
};

export const sendMessage = (
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
