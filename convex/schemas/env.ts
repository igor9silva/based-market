import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
	//
	runtimeEnv: process.env,

	server: {
		//
		AUTH_GOOGLE_ID: z.string().min(1).describe('Google OAuth client ID.'),
		AUTH_GOOGLE_SECRET: z.string().min(1).describe('Google OAuth client secret.'),

		ALLOWED_DOMAINS: z
			.string()
			.min(1)
			// transform to array
			.transform((s) => s.split(','))
			// make sure transform worked
			.pipe(z.array(z.string()))
			.describe('Comma-separated list of allowed domains to sign in with.'),

		ALLOWED_EMAILS: z
			.string()
			.min(1)
			// transform to array
			.transform((s) => s.split(','))
			// make sure transform worked
			.pipe(z.array(z.string()))
			.describe('Comma-separated list of allowed emails to sign in with.'),

		JWT_SESSION_DURATION_MS: z
			.string()
			.min(1)
			// transform to number
			.transform((s) => parseInt(s, 10))
			// make sure transform worked
			.pipe(z.number())
			.describe('JWT session duration in milliseconds.'),

		OPENAI_API_KEY: z.string().min(1).describe('OpenAI API key.'),

		MAX_CONSECUTIVE_MESEEK_EVENTS: z
			.number()
			.min(1)
			.describe('The maximum number of consecutive meseeks events.')
			.default(20),
	},

	/**
	 * By default, this library will feed the environment variables directly to
	 * the Zod validator.
	 *
	 * This means that if you have an empty string for a value that is supposed
	 * to be a number (e.g. `PORT=` in a ".env" file), Zod will incorrectly flag
	 * it as a type mismatch violation. Additionally, if you have an empty string
	 * for a value that is supposed to be a string with a default value (e.g.
	 * `DOMAIN=` in an ".env" file), the default value will never be applied.
	 *
	 * This is true in order to solve these issues.
	 */
	emptyStringAsUndefined: true,
});
