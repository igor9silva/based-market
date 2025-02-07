import { ConvexCredentials } from '@convex-dev/auth/providers/ConvexCredentials';

export const WorldWallet = ConvexCredentials({
	id: 'worldwallet',
	// apiKey: process.env.AUTH_RESEND_KEY,
	// maxAge: 60 * 15, // 15 minutes

	async authorize(credentials, ctx) {
		//
		console.debug('authorize', credentials, ctx);
		return null;
	},

	// async generateVerificationToken() {
	// 	return generateRandomString(8, alphabet('0-9'));
	// },
	// async sendVerificationRequest({ identifier: email, provider, token }) {
	// 	const resend = new ResendAPI(provider.apiKey);
	// 	const { error } = await resend.emails.send({
	// 		from: 'My App <onboarding@resend.dev>',
	// 		to: [email],
	// 		subject: `Sign in to My App`,
	// 		text: 'Your code is ' + token,
	// 	});

	// 	if (error) {
	// 		throw new Error(JSON.stringify(error));
	// 	}
	// },
});
