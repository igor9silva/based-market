import { z } from 'zod';

export const polarEventSchema = z.object({
	type: z.string(),
	data: z.record(z.any()),
});
