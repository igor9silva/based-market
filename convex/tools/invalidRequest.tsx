import { tool } from 'ai';
import { z } from 'zod';

export default tool({
	description: 'You are unable to fulfill the request for any reason.',
	parameters: z.object({
		reason: z.string().describe('The reason you are unable to fulfill the request.'),
	}),
	execute: async ({ reason }) => reason,
});
