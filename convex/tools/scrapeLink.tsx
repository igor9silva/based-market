'use node';

import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { invalidRequest } from './scrape/invalidRequest';
import { scrapeTwitter } from './scrape/scrapeTwitter';
import { scrapeWeb } from './scrape/scrapeWeb';

export const scrapeLink = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'taskActions'>,
) => {
	return tool({
		description: "Scrape the URL provided and return it's content.",
		parameters: z.object({
			url: z.string().url(),
		}),
		execute: async ({ url }) => {
			//
			console.debug(`Scraping ${url} from task: ${task._id}`);

			const {
				text,
				finishReason,
				toolCalls,
				toolResults,
				// steps,
				usage,
				warnings,
			} = await generateText({
				model: openai('gpt-4o'),
				maxSteps: 1,
				system: [
					`Your job is to scrape the web for information.`,
					`You have been given a URL, scrape it!`,
					`You have access to a set of tools to scrape the web.`,
					`Use the tools to get the content of the provided URL only.`,
					`The 'scrapeWeb' tool is a generic tool that will scrape any website.`,
					`The 'scrapeTwitter' tool is specific to Twitter/X URLs.`,
					`Always prefer specific tools over the generic one.`,
					`Reply with ONLY the scraped content.`,
				].join('\n'),
				prompt: url,
				toolChoice: 'required',
				tools: {
					scrapeWeb: scrapeWeb(ctx, task, action),
					scrapeTwitter: scrapeTwitter(ctx, task, action),
					invalidRequest: invalidRequest(ctx, task, action),
				},
			});

			if (toolResults.length > 1) {
				console.warn('More than one tool call is not expected.');
			} else if (toolResults.length === 0) {
				console.warn('Tool call was expected.');
				throw new Error('Tool call was expected.');
			}

			const scrapped = toolResults.at(0)?.result;

			if (!scrapped) {
				console.warn('Tool result was expected.');
				throw new Error('Tool result was expected.');
			}

			console.debug('scrapeLink', {
				text,
				finishReason,
				// toolCalls,
				toolResults,
				// steps,
				usage,
				warnings,
			});

			// TODO: remove this
			const { text: cleaned } = await generateText({
				model: openai('gpt-4o'),
				prompt: scrapped,
				system: [
					`You'll receive a scraped webpage as markdown.`,
					`Your job is to remove all images and other non-text content.`,
					`Reply with ONLY the cleaned markdown.`,
				].join('\n'),
			});

			return cleaned;
		},
	});
};
