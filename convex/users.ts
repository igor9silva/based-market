import { getAuthUserId } from '@convex-dev/auth/server';
import { query } from './lib';
import { env } from './schemas/env';

const ALLOWED_DOMAINS = env.ALLOWED_DOMAINS || [];
const ALLOWED_EMAILS = env.ALLOWED_EMAILS || [];

export const current = query({
	args: {},
	handler: async (ctx) => {
		//
		const userId = await getAuthUserId(ctx);
		if (!userId) throw new Error('Not authenticated');

		const user = await ctx.db.get(userId);
		if (!user) throw new Error('Not found');

		const email = user.email;
		if (!email) throw new Error(`No email found for user ${userId}`);
		if (!isAllowed(email)) throw new Error(`Email ${email} not allowed`);

		return user;
	},
});

// Helper functions ------------------------------------

function isAllowed(email: string) {
	const domain = email.split('@')[1];
	return ALLOWED_DOMAINS.includes(domain) || ALLOWED_EMAILS.includes(email);
}
