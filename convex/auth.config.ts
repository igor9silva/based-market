export default {
	providers: [
		{
			domain: process.env.CONVEX_SITE_URL,
			applicationID: 'convex',
		},
		{
			domain: process.env.CONVEX_SITE_URL,
			applicationID: process.env.WLD_CLIENT_ID,
		},
	],
};
