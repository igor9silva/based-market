'use node';

import { openai } from '@ai-sdk/openai';
import { generateText, tool } from 'ai';
import { z } from 'zod';
import { internal } from '../_generated/api';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { invalidRequest } from './scrape/invalidRequest';
import { scrapeTwitter } from './scrape/scrapeTwitter';
import { scrapeWeb } from './scrape/scrapeWeb';

const metadata = {
	description: "Scrape the URL provided and return it's content.",
	parameters: z.object({
		url: z.string().url(),
	}),
};

export const scrapeLink = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action?: Doc<'operations'> & { kind: 'run-tool' },
) => {
	if (!action) return tool(metadata);

	return tool({
		...metadata,
		execute: async (args) => {
			//
			const { url } = args;
			console.debug(`Scraping ${url} from task: ${task._id}`);

			await ctx.runMutation(internal.events._setToolCallStatusText, {
				eventId: action.origin,
				text: `Scraping ${url}`,
			});

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

			if (toolResults.length !== 1) throw new Error('Expected one tool result.');
			const scrapped = toolResults.at(0)?.result as string;

			await ctx.runMutation(internal.events._setToolCallStatusText, {
				eventId: action.origin,
				text: `Scraped done, removing noise`,
			});

			console.debug('scrapeLink', {
				text,
				finishReason,
				toolCalls,
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
