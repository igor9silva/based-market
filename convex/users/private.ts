import { zid } from 'convex-helpers/server/zod';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';
import { MutationCtx } from '../_generated/server';
import { _add, _findAll } from '../components/private';
import { internalMutation, internalQuery } from '../lib';
import { env } from '../schemas/envSchema';
import { valueSchema } from '../schemas/transactionSchema';
import { _addInboxTask } from '../tasks/private';

export const _seedIfNeeded = async (
	ctx: MutationCtx, //
	userId: Id<'users'>,
) => {
	//
	const refUser = await _findOne(ctx, { userId: env.REF_USER_ID as Id<'users'> });
	if (!refUser) throw new Error('Ref user not found'); // FATAL (will stop seeding user forever), TODO: notify fatal

	const user = await _findOne(ctx, { userId });
	if (user?.isReady) return;

	const inboxTaskId = await _addInboxTask(ctx, {
		author: userId,
		owner: userId,
		title: 'Inbox',
		body: 'Inbox',
	});

	await _seedComponentsFromRef(ctx, refUser._id, userId, inboxTaskId);

	// adding a fake delay for fun
	const delay = 10000; // ms
	ctx.scheduler.runAfter(delay, internal.users.private._markAreReady, { userId });
};

const _seedComponentsFromRef = async (
	ctx: MutationCtx, //
	refUserId: Id<'users'>,
	newUserId: Id<'users'>,
	inboxTaskId: Id<'tasks'>,
) => {
	//
	// get all reference components
	const refComponents = await _findAll(ctx, { userId: refUserId });

	// add each one to the seeded user
	await Promise.all(
		refComponents.map((refComponent) =>
			_add(ctx, {
				owner: newUserId,
				body: refComponent.body,
				defaultTaskId: refComponent.defaultTaskId ? inboxTaskId : undefined,
				slug: refComponent.slug,
			}),
		),
	);
};

export const _markAreReady = internalMutation({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		//
		const user = await _findOne(ctx, { userId });
		if (!user) throw new Error('User not found');

		await ctx.db.patch(userId, { isReady: true });
	},
});

export const _adjustBalance = internalMutation({
	args: {
		userId: zid('users'),
		value: valueSchema,
	},
	handler: async (ctx, { userId, value }) => {
		//
		const user = await _findOne(ctx, { userId });
		if (!user) throw new Error('User not found');

		if (value.symbol !== 'WLD') throw new Error('Only WLD is supported for now');

		return await ctx.db.patch(userId, { balanceWLD: (user.balanceWLD ?? 0) + value.amount });
	},
});

export const _findOne = internalQuery({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		return await ctx.db.get(userId);
	},
});
