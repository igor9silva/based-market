import { openai } from '@ai-sdk/openai';
import { generateObject } from 'ai';
import { z } from 'zod';
import { api, internal } from './_generated/api';
import { Id } from './_generated/dataModel';
import { internalAction, mutation, query } from './_generated/server.js';

export const list = query(async (ctx) => {
	// TODO: from user
	return await ctx.db.query('tasks').collect();
});

type AddArgs = {
	title: string;
	body: string | undefined;
	owner: Id<'users'>;
};
export const add = mutation(async (ctx, { title, body, owner }: AddArgs) => {
	const taskId = await ctx.db.insert('tasks', { title, body, owner });

	// TODO: auto-schedule side effects
	// - fill
	// - learn
	// = suggest
	// - ...
});

export const findOne = query(async (ctx, { taskId }: { taskId: Id<'tasks'> }) => {
	const task = await ctx.db.get(taskId);
	if (!task) throw new Error('Task not found');

	return task;
});

export const update = mutation(
	async (
		ctx,
		{ taskId, title, body, effects }: { taskId: Id<'tasks'>; title: string; body: string; effects: string[] },
	) => {
		return await ctx.db.patch(taskId, { title, body, effects });
	},
);

export const startFilling = mutation(async (ctx, { taskId }: { taskId: Id<'tasks'> }) => {
	await ctx.db.patch(taskId, { effects: ['filling'] });
	await ctx.scheduler.runAfter(0, internal.tasks.fill, { taskId });
});

export const fill = internalAction(async (ctx, { taskId }: { taskId: Id<'tasks'> }) => {
	//
	const task = await ctx.runQuery(api.tasks.findOne, { taskId });
	if (!task) throw new Error('Task not found');

	const { object } = await generateObject({
		model: openai('gpt-4o'),
		// TODO: think about how to use the same schema
		schema: z.object({
			title: z.string(),
			body: z.string(),
		}),
		prompt: [
			`You'll receive a user-created task, and your job is to fix and improve it.`,
			`Users will usually only fill-in the 'title', and with very few details.`,
			`You should fill everything possible based on info already in the task, plus everything else you know, is able to infer or is able to find on the web.`,
			``,
			`Here's the task:`,
			`ID: ${task._id}`,
			`Title: ${task.title}`,
			`Body: ${task.body}`,
			`Created at: ${task._creationTime}`,
		].join('\n'),
	});

	// remove 'filling' effect
	const effects = task.effects?.filter((effect) => effect !== 'filling') ?? [];

	await ctx.runMutation(api.tasks.update, {
		taskId,
		title: object.title,
		body: object.body,
		effects: effects,
	});

	// TODO: log/persist events
});

// export const listMessages = query({
// 	args: {
// 		cacheBust: v.optional(v.any()),
// 		channel: v.optional(v.string()),
// 	},
// 	handler: async (ctx, args) => {
// 		const _unused = args.cacheBust;
// 		const channelName = args.channel || 'chatty';
// 		return await latestMessagesFromChannel(ctx, channelName);
// 	},
// });

// async function channelByName(ctx: QueryCtx, channelName: string) {
// 	const channel = await ctx.db
// 		.query('channels')
// 		.withIndex('by_name', (q) => q.eq('name', channelName))
// 		.unique();
// 	if (!channel) throw new Error(`No such channel '${channelName}'`);
// 	return channel;
// }

// easter egg: i'm leaving this commented functions for future reference of how I coded - I review everything.

// async function latestMessagesFromChannel(ctx: QueryCtx, channelName: string, max = 20) {
// 	const channel = await channelByName(ctx, channelName);

// 	const messages = await ctx.db
// 		.query('messages')
// 		.withIndex('by_channel', (q) => q.eq('channel', channel._id))
// 		.order('desc')
// 		.take(max);
// 	const messagesWithAuthor = await Promise.all(
// 		messages.map(async (message) => {
// 			const user = await ctx.db.get(message.user);
// 			// Join the count of likes with the message data
// 			return { ...message, user: user?.name || 'anonymous' };
// 		}),
// 	);
// 	return messagesWithAuthor;
// }

// export const count = query(async (ctx, { cacheBust, channel }: { cacheBust: unknown; channel: string }) => {
// 	const _unused = cacheBust;
// 	const channelName = channel || 'chatty';
// 	return (await latestMessagesFromChannel(ctx, channelName, 1000)).length;
// });

// export const listUsers = query(async (ctx, { cacheBust }) => {
// 	const _unused = cacheBust;
// 	return await ctx.db.query('users').collect();
// });

// export const countUsers = query(async (ctx, { cacheBust }) => {
// 	const _unused = cacheBust;
// 	return (await ctx.db.query('users').collect()).length;
// });

// function choose(choices: string[]): string {
// 	return choices[Math.floor(Math.random() * choices.length)];
// }

// function madlib(strings: TemplateStringsArray, ...choices: any[]): string {
// 	return strings.reduce((result, str, i) => {
// 		return result + str + (choices[i] ? choose(choices[i]) : '');
// 	}, '');
// }

// const greetings = ['hi', 'Hi', 'hello', 'hey'];
// const names = ['James', 'Jamie', 'Emma', 'Nipunn'];
// const punc = ['...', '-', ',', '!', ';'];
// const text = [
// 	'how was your weekend?',
// 	"how's the weather in SF?",
// 	"what's your favorite ice cream place?",
// 	"I'll be late to make the meeting tomorrow morning",
// 	"Could you let the customer know we've fixed their issue?",
// ];

// export const sendGeneratedMessage = internalMutation(async (ctx) => {
// 	const body = madlib`${greetings} ${names}${punc} ${text}`;
// 	const user = await ctx.db.insert('users', {
// 		name: 'User ' + Math.floor(Math.random() * 1000),
// 	});
// 	const channel = (await channelByName(ctx, 'chatty'))._id;
// 	await ctx.db.insert('messages', { body, user, channel });
// });

// // TODO concurrency here
// export const sendGeneratedMessages = action({
// 	args: { num: v.number() },
// 	handler: async (ctx, { num }: { num: number }) => {
// 		await ctx.runMutation(api.messages.clear);
// 		for (let i = 0; i < num; i++) {
// 			await ctx.runMutation(internal.messages.sendGeneratedMessage);
// 		}
// 	},
// });

// export const clear = mutation(async (ctx) => {
// 	await Promise.all([
// 		...(await ctx.db.query('messages').collect()).map((message) => ctx.db.delete(message._id)),
// 		...(await ctx.db.query('users').collect()).map((user) => ctx.db.delete(user._id)),
// 		...(await ctx.db.query('channels').collect()).map((channel) => ctx.db.delete(channel._id)),
// 		...(await ctx.db.query('channelMembers').collect()).map((membership) => ctx.db.delete(membership._id)),
// 	]);
// });

// async function ensureChannel(ctx: MutationCtx, name: string) {
// 	const existing = await ctx.db
// 		.query('channels')
// 		.withIndex('by_name', (q) => q.eq('name', name))
// 		.unique();
// 	if (!existing) {
// 		await ctx.db.insert('channels', { name });
// 	}
// }

// export const seed = internalMutation(async (ctx) => {
// 	await ensureChannel(ctx, 'chatty');
// 	await ensureChannel(ctx, 'sf');
// 	await ensureChannel(ctx, 'nyc');
// 	await ensureChannel(ctx, 'seattle');
// });

// export const sendMessage = mutation(
// 	async (ctx, { user, body, channel = 'chatty' }: { user: string; body: string; channel: string }) => {
// 		// userId ought to match User /d+
// 		// until every user gets their own channel, use simulated messages
// 		const cleanBody = madlib`${greetings} ${names}${punc} ${text}`;
// 		const existingUser = await ctx.db
// 			.query('users')
// 			// .withIndex('by_name')
// 			.filter((q) => q.eq(q.field('name'), user))
// 			.unique();
// 		let userId = existingUser?._id || (await ctx.db.insert('users', { name: user }));
// 		const channelId = (await channelByName(ctx, channel))._id;
// 		await ctx.db.insert('messages', {
// 			user: userId,
// 			body: cleanBody,
// 			channel: channelId,
// 		});
// 	},
// );

// export const simulateTraffic = mutation(async (ctx) => {
// 	const simulation = await ctx.db.query('simulating').unique();
// 	const now = Date.now();
// 	const duration = 5000;
// 	if (!simulation) {
// 		await ctx.db.insert('simulating', {
// 			finishingAt: now + duration,
// 		});
// 		await ctx.scheduler.runAfter(0, internal.messages.runSimulation);
// 	} else {
// 		await ctx.db.replace(simulation._id, {
// 			finishingAt: Math.max(simulation.finishingAt, now + duration),
// 		});
// 	}
// });

// export const runSimulation = internalMutation(async (ctx) => {
// 	const now = Date.now();
// 	const simulation = await ctx.db.query('simulating').unique();
// 	if (!simulation) {
// 		return;
// 	}
// 	if (simulation.finishingAt < now) {
// 		await ctx.db.delete(simulation._id);
// 		return;
// 	}
// 	const body = madlib`${greetings} ${names}${punc} ${text}`;
// 	const user = await ctx.db.insert('users', {
// 		name: 'User ' + Math.floor(Math.random() * 1000),
// 	});
// 	const channel = (await channelByName(ctx, 'chatty'))._id;
// 	await ctx.db.insert('messages', { body, user: user, channel });
// 	await ctx.scheduler.runAfter(500, internal.messages.runSimulation);
// });

// export const isSimulatingTraffic = query(async (ctx) => {
// 	return !!(await ctx.db.query('simulating').collect()).length;
// });
