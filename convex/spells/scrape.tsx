import { openai } from '@ai-sdk/openai';
import { generateObject, generateText } from 'ai';
import { z } from 'zod';
import { internal } from '~/_generated/api';
import { Doc } from '~/_generated/dataModel';
import { ActionCtx } from '~/_generated/server';
import invalidRequest from '~/tools/invalidRequest';
import scrapeTwitter from '~/tools/scrapeTwitter';
import scrapeWeb from '~/tools/scrapeWeb';

const promptForTask = (task: Doc<'tasks'>) =>
	[
		`Here's the task as of now:`,
		`ID: ${task._id}`,
		`Title: ${task.title}`,
		`Body: ${task.body}`,
		`Created at: ${task._creationTime}`,
	].join('\n');

async function fill(ctx: ActionCtx, task: Doc<'tasks'>) {
	//
	const { object } = await generateObject({
		model: openai('gpt-4o'),
		// TODO: think about how to use the same schema
		schema: z.object({
			title: z.string(),
			body: z.string(),
		}),
		system: [
			`You'll receive a user-created task, and your job is to fix and improve it.`,
			`You should fill everything possible based on info already in the task, plus:`,
			`- everything else you know`,
			`- anything you can infer`,
			`- anything you can find on the web`,
		].join('\n'),
		prompt: promptForTask(task),
	});

	// update the task
	await ctx.runMutation(internal.tasks._update, {
		taskId: task._id,
		title: object.title,
		body: object.body,
	});
}

async function minify(ctx: ActionCtx, task: Doc<'tasks'>) {
	//
	const { object } = await generateObject({
		model: openai('gpt-4o'),
		// TODO: think about how to use the same schema
		schema: z.object({
			title: z.string(),
			body: z.string(),
		}),
		system: [
			`You'll receive a user-created task, and your job is to make it shorter.`,
			`Users will usually only fill-in the 'title', and with very few details.`,
			`You should remove everything possible that's not necessary, and that's not useful.`,
			`Make sure to not lose any important information.`,
		].join('\n'),
		prompt: promptForTask(task),
	});

	// update the task
	await ctx.runMutation(internal.tasks._update, {
		taskId: task._id,
		title: object.title,
		body: object.body,
	});
}

async function scrape(ctx: ActionCtx, task: Doc<'tasks'>) {
	//
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

	if (toolCalls.length > 1) {
		console.warn('More than one tool call is not expected.');
	} else if (toolCalls.length === 0) {
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
		// toolResults,
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

	// update the task
	await ctx.runMutation(internal.tasks._update, {
		taskId: task._id,
		// appending instead of replacing the original task body
		body: [
			task.body,
			`------------------------------------`,
			`Link data scraped at ${new Date().toISOString()}:`,
			cleaned,
		].join('\n'),
	});
}

async function factCheck(ctx: ActionCtx, task: Doc<'tasks'>) {
	//
	console.debug('Fact-checking task:', task);
	//
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
			`You'll receive a user-created task, and your job is to fact-check the information in the task.`,
			`Your answer will be attached to the task as the fact-checked information.`,
			`Reply with ONLY the fact-checked information.`,
		].join('\n'),
		prompt: promptForTask(task),
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

	// update the task
	await ctx.runMutation(internal.tasks._update, {
		taskId: task._id,
		// appending instead of replacing the original task body
		body: [
			task.body,
			`------------------------------------`,
			`Fact-checked at ${new Date().toISOString()}:`,
			text,
		].join('\n'),
	});
}

// TODO: move to DB
export default {
	fill,
	minify,
	scrape,
	factCheck,
};
