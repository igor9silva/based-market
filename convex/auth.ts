import Google from '@auth/core/providers/google';
import { convexAuth } from '@convex-dev/auth/server';
import { env } from './schemas/env';

export const { auth, signIn, signOut, store } = convexAuth({
	providers: [Google],
	jwt: {
		durationMs: env.JWT_SESSION_DURATION_MS || 1000 * 60 * 60 * 24 * 7 /* 7 days */,
	},
	session: {
		inactiveDurationMs: env.JWT_SESSION_DURATION_MS || 1000 * 60 * 60 * 24 * 7 /* 7 days */,
	},
	callbacks: {
		async afterUserCreatedOrUpdated(ctx, args) {
			console.log('afterUserCreatedOrUpdated', ctx, args);
		},
	},
});
