import Google from '@auth/core/providers/google';
import { convexAuth } from '@convex-dev/auth/server';

export const { auth, signIn, signOut, store } = convexAuth({
	providers: [Google],
	callbacks: {
		async afterUserCreatedOrUpdated(ctx, args) {
			console.log('afterUserCreatedOrUpdated', ctx, args);
		},
	},
	// TODO: limit to my domains only
});
