'use node';

import { openai } from '@ai-sdk/openai';
import FirecrawlApp from '@mendable/firecrawl-js';
import { generateObject, generateText, tool } from 'ai';
import { v } from 'convex/values';
import { TwitterApi } from 'twitter-api-v2';
import { z } from 'zod';
import { internal } from './_generated/api';
import { Doc } from './_generated/dataModel';
import { ActionCtx, internalAction } from './_generated/server';
import { scheduleNextActionIfNeeded, setActionStatus } from './taskActions';

// TODO: move to DB
const ACTIONS = {
	async fill(ctx: ActionCtx, task: Doc<'tasks'>) {
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
			prompt: [
				`Here's the task:`,
				`ID: ${task._id}`,
				`Title: ${task.title}`,
				`Body: ${task.body}`,
				`Created at: ${task._creationTime}`,
			].join('\n'),
		});

		// update the task
		await ctx.runMutation(internal.tasks._update, {
			taskId: task._id,
			title: object.title,
			body: object.body,
		});
	},
	async minify(ctx: ActionCtx, task: Doc<'tasks'>) {
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
			prompt: [
				`Here's the task:`,
				`ID: ${task._id}`,
				`Title: ${task.title}`,
				`Body: ${task.body}`,
				`Created at: ${task._creationTime}`,
			].join('\n'),
		});

		// update the task
		await ctx.runMutation(internal.tasks._update, {
			taskId: task._id,
			title: object.title,
			body: object.body,
		});
	},
	async scrape(ctx: ActionCtx, task: Doc<'tasks'>) {
		//
		const {
			text, //
			finishReason,
			toolCalls,
			toolResults,
			steps,
			usage,
			warnings,
			responseMessages,
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
			prompt: [
				`Here's the task as of now:`,
				`ID: ${task._id}`,
				`Title: ${task.title}`,
				`Body: ${task.body}`,
				`Created at: ${task._creationTime}`,
			].join('\n'),
			tools: {
				scrapeWeb: tool({
					description: 'Scrape the web for information',
					parameters: z.object({
						url: z.string().describe('The URL to scrape. Must be a valid and public URL.'),
					}),
					execute: async ({ url }) => {
						//
						const crawler = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY }); // TODO: use typed env

						console.debug('Will scrape URL:', url);
						const result = await crawler.scrapeUrl(url, {
							formats: ['markdown'],
							onlyMainContent: true,
						});
						console.debug('Did scrape URL:', result);

						// TODO: do something with .metadata, .warning, .error
						if (result.success) return result.markdown;
						else throw new Error(result.error);
					},
				}),
				scrapeTwitter: tool({
					description: 'Scrape Twitter for information',
					parameters: z.object({
						url: z
							.string()
							.describe('The URL to scrape. Must be a Twitter/X valid URL such as twitter.com or x.com.'),
					}),
					execute: async ({ url }) => {
						//
						// TODO: use typed env
						const client = new TwitterApi(process.env.TWITTER_API_KEY as string);

						const tweetId = url.split('/').pop();
						if (!tweetId) throw new Error('No tweet ID found in the URL.');

						console.debug('Will scrape Twitter URL:', url, tweetId);
						const tweet = await client.v2.singleTweet(tweetId, {
							expansions: [
								'attachments.poll_ids',
								'attachments.media_keys',
								'author_id',
								'referenced_tweets.id',
								'in_reply_to_user_id',
								'edit_history_tweet_ids',
								'geo.place_id',
								'entities.mentions.username',
								'referenced_tweets.id.author_id',
							],
						});
						console.debug('Did scrape Twitter:', tweet);

						return tweet.data.text;
					},
				}),
				invalidRequest: tool({
					description:
						'You are unable to fulfill the request for any reason. e.g. you could not find any URLs in the task.',
					parameters: z.object({
						reason: z.string().describe('The reason you are unable to fulfill the request.'),
					}),
					execute: async ({ reason }) => reason,
				}),
			},
			toolChoice: 'required',
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
			// responseMessages,
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
	},
	async factCheck(ctx: ActionCtx, task: Doc<'tasks'>) {
		//
		const {
			text, //
			finishReason,
			toolCalls,
			toolResults,
			steps,
			usage,
			warnings,
			responseMessages,
		} = await generateText({
			model: openai('gpt-4o'),
			maxSteps: 1,
			system: [
				`You'll receive a user-created task, and your job is to fact-check the information in the task.`,
				`Your answer will be attached to the task as the fact-checked information.`,
				`Reply with ONLY the fact-checked information.`,
			].join('\n'),
			prompt: [
				`Here's the task as of now:`,
				`ID: ${task._id}`,
				`Title: ${task.title}`,
				`Body: ${task.body}`,
				`Created at: ${task._creationTime}`,
			].join('\n'),
		});

		console.debug({
			text,
			finishReason,
			toolCalls,
			// toolResults,
			// steps,
			usage,
			warnings,
			// responseMessages,
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
	},
};

export const run = internalAction({
	args: {
		userId: v.id('users'),
		taskId: v.id('tasks'),
		actionId: v.id('taskActions'),
	},
	handler: async (ctx, { taskId, actionId, userId }) => {
		//
		// set action as 'running'
		await setActionStatus(ctx, { actionId, status: 'running' });

		// grab the task and action
		const task = await ctx.runQuery(internal.tasks._findOne, { taskId });
		const action = await ctx.runQuery(internal.taskActions._findOne, { actionId });

		// invoke magic rock
		try {
			await ACTIONS[action.kind](ctx, task);
		} catch (error) {
			//
			// TODO: this will stop the queue

			// set action as 'failed'
			await setActionStatus(ctx, { actionId, status: 'failed' });
			throw error;
		}

		// set action as 'succeeded'
		await setActionStatus(ctx, { actionId, status: 'succeeded' });

		// schedule next action
		await scheduleNextActionIfNeeded(ctx, { taskId, userId });

		// TODO: error handling (notify me and set as 'failed' at least)
		// TODO: log/persist events
	},
});
