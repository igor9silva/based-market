import { Tool } from 'ai';
import { z } from 'zod';
import { newActionSchema } from '../action/private';
import { tokenSchema } from './topUpSchema';

// standardizing tool result
export type AITool = Tool<
	any,
	{
		result: string;
		reactions: Array<z.infer<typeof newActionSchema>>;
		costs: Array<{
			symbol: z.infer<typeof tokenSchema>;
			amount: bigint;
			description: string;
		}>;
	}
>;
