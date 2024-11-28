import { z } from 'zod';

export const taskActionStatusSchema = z.enum([
	'pending', //
	'running',
	'succeeded',
	'failed',
	'skipped',
]);

export const taskActionKindSchema = z.enum([
	'fill', //
	'minify',
	'scrape',
	'factCheck',
	// 'learn',
	// 'suggest',
]);
