import { z } from 'zod';
import { tokenSchema } from './topUpSchema';

import { CoreTool } from 'ai';

// standardizing tool result
export type AITool = CoreTool<
	any,
	{
		result: string;
		costs: Array<{
			symbol: z.infer<typeof tokenSchema>;
			amount: bigint;
			description: string;
		}>;
	}
>;
