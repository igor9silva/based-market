import Google from '@auth/core/providers/google';
import { convexAuth } from '@convex-dev/auth/server';

// TODO: limit to my domains only
// that's how I used to do with Auth.js on Next
// 		const allowedDomains = ['igorsilva.pro'];
// 		const allowedUsers = ['igor9ferreira9@gmail.com'];

// 		async createOrUpdateUser(ctx, args) {
// 			const emails = args.profile.email;

// 			if (!email) return false;
// 			if (!email_verified) return false;

// 			if (allowedUsers.includes(email)) {
// 				return true;
// 			}

// 			if (allowedDomains.some((domain) => email?.endsWith(domain))) {
// 				return true;
// 			}

// 			return false;
// 		},
// it doesnt seem to be possible to do this with Convex Auth
// at their discord someone suggested to solve this with authorization, which is not ideal

export const { auth, signIn, signOut, store } = convexAuth({
	providers: [Google],
	jwt: {
		durationMs: Number(process.env.JWT_SESSION_DURATION_MS || 60 * 60 * 24 * 7 /* 7 days */), // TODO: use typed env
	},
	callbacks: {
		async afterUserCreatedOrUpdated(ctx, args) {
			console.log('afterUserCreatedOrUpdated', ctx, args);
		},
	},
});
