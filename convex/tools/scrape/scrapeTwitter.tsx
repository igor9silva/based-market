import { tool } from 'ai';
import { z } from 'zod';
import { Doc } from '../../_generated/dataModel';
import { ActionCtx } from '../../_generated/server';

export const scrapeTwitter = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'operations'>,
) => {
	return tool({
		description: 'Scrape Twitter for information',
		parameters: z.object({
			url: z.string().describe('The URL to scrape. Must be a Twitter/X valid URL such as twitter.com or x.com.'),
		}),
		execute: async ({ url }) => {
			//
			// get tweet ID from URL
			// TODO: abstract away calling external APIs
			const tweetId = new URL(url).pathname
				.split('/')
				.filter(Boolean) // removes empty strings
				.at(-1);
			if (!tweetId) throw new Error('No tweet ID found in the URL.');

			// build the API call
			const apiURL = `https://twitter154.p.rapidapi.com/tweet/details?tweet_id=${tweetId}`;
			const options = {
				method: 'GET',
				headers: {
					'x-rapidapi-key': process.env.RAPID_API_KEY as string, // TODO: use typed env
				},
			};

			console.debug('Will scrape Twitter URL:', url, tweetId);
			const response = await fetch(apiURL, options);
			const tweet = await response.json(); // TODO: add type, validation
			console.debug('Did scrape Twitter:', tweet);

			// TODO: persist the whole tweet somewhere
			return tweet.text;
		},
	});
};
