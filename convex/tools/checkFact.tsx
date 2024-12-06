'use node';

import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';

const metadata = {
	description: 'Check if a fact is true or false.',
	parameters: z.object({
		claim: z.string(),
	}),
};

// TODO: build a nicer meseeksTool() abstraction
export const checkFact = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'taskActions'> & { kind: 'run-tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async ({ claim }) => {
			//
			console.debug('Fact-checking task:', task._id);

			const {
				text,
				finishReason,
				toolCalls,
				// toolResults,
				// steps,
				usage,
				warnings,
			} = await generateText({
				model: openai('gpt-4o'),
				maxSteps: 1,
				system: [
					`Your job is to fact-check the claim provided.`,
					`Reply with your confidence score (0.00~100.00) and a short explanation.`,
					`Confidence score = 0.00 means the claim is definitely (100%) false (e.g. 2+2=5).`,
					`Confidence score = 100.00 means the claim is definitely (100%) true (e.g. 2+2=4).`,
					`Avoid using 0.00 or 100.00 unless you're ABSOLUTELY sure.`,
					`If you're not capable of determining the claim's truthfulness, reply with the likelihood of it being true (0.00~100.00).`,
					// TODO: use object output to force it to score, display a <FactCheck> component
				].join('\n'),
				prompt: `Claim: ${claim}`,
			});

			console.debug({
				text,
				finishReason,
				toolCalls,
				// toolResults,
				// steps,
				usage,
				warnings,
			});

			return text;
		},
	});
};
