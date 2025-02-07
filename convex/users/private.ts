import { zid } from 'convex-helpers/server/zod';
import { Id } from '../_generated/dataModel';
import { MutationCtx } from '../_generated/server';
import { _add, _findAll } from '../components/private';
import { internalQuery } from '../lib';
import { env } from '../schemas/envSchema';

export const _seedIfNeeded = async (
	ctx: MutationCtx, //
	userId: Id<'users'>,
) => {
	//
	const refUser = await _findOne(ctx, { userId: env.REF_USER_ID as Id<'users'> });
	if (!refUser) throw new Error('Ref user not found'); // FATAL (will stop seeding user forever), TODO: notify fatal

	const user = await _findOne(ctx, { userId });
	if (user?.isReady) return;

	// get all reference components
	const refComponents = await _findAll(ctx, { userId: refUser._id });

	// add each one to the seeded user
	// prettier-ignore
	await Promise.all(refComponents.map((refComponent) => _add(ctx, {
		owner: userId,
		body: refComponent.body,
		defaultTaskId: refComponent.defaultTaskId,
		slug: refComponent.slug,
	})));
};

export const _findOne = internalQuery({
	args: {
		userId: zid('users'),
	},
	handler: async (ctx, { userId }) => {
		return await ctx.db.get(userId);
	},
});
