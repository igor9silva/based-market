'use node';

import FirecrawlApp from '@mendable/firecrawl-js';
import { tool } from 'ai';
import { z } from 'zod';

export default tool({
	description: 'Scrape the web for information',
	parameters: z.object({
		url: z.string().describe('The URL to scrape. Must be a valid and public URL.'),
	}),
	execute: async ({ url }) => {
		//
		// TODO: use typed env
		const crawler = new FirecrawlApp({ apiKey: process.env.FIRECRAWL_API_KEY });

		console.debug('Will scrape URL:', url);
		const result = await crawler.scrapeUrl(url, {
			formats: ['markdown'],
			onlyMainContent: true,
		});
		console.debug('Did scrape URL:', result);

		if (!result.success) throw new Error(result.error);

		// TODO: do something with .metadata, .warning, .error
		return result.markdown;
	},
});
