'use node';

import { openai } from '@ai-sdk/openai';
import { generateText } from 'ai';
import { promptForTask } from '.';
import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import invalidRequest from '../tools/invalidRequest';
import scrapeTwitter from '../tools/scrapeTwitter';
import scrapeWeb from '../tools/scrapeWeb';

export default async function scrape(
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'taskActions'>,
) {
	console.debug('Scraping task:', task);

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
			`You'll receive a user-created task, and your job is to scrape the web for information.`,
			`Grab the main URL from the task title or body.`,
			`You have access to a set of tools to scrape the web.`,
			`Use the tools to get the content of *the main* URL only (do not scrape multiple URLs).`,
			`Your answer will be attached to the task as the URL content.`,
			`The 'scrapeWeb' tool is a generic tool that will scrape any website.`,
			`The 'scrapeTwitter' tool is specific to Twitter/X URLs.`,
			`Always prefer specific tools over the generic one.`,
			`Reply with ONLY the scraped content.`,
		].join('\n'),
		prompt: promptForTask(task),
		toolChoice: 'required',
		tools: {
			scrapeWeb,
			scrapeTwitter,
			invalidRequest,
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

	console.debug({
		text,
		finishReason,
		toolCalls,
		toolResults,
		// steps,
		usage,
		warnings,
	});

	const { text: cleaned } = await generateText({
		model: openai('gpt-4o'),
		prompt: scrapped,
		system: [
			`You'll receive a scraped webpage as markdown.`,
			`Your job is to remove all images and other non-text content.`,
			`Reply with ONLY the cleaned markdown.`,
		].join('\n'),
	});

	return { result: cleaned };
}
