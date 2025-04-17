import { groq } from '@ai-sdk/groq';
import { experimental_transcribe as transcribe } from 'ai';
import { z } from 'zod';
import { api } from '../_generated/api';
import { action } from '../lib';

export const transcribeAudio = action({
	args: {
		audio: z.instanceof(ArrayBuffer),
	},
	handler: async (ctx, args) => {
		//
		const user = await ctx.runQuery(api.users.public.current, {});
		if (!user) throw new Error('User not found');

		const {
			text, //
			segments,
			durationInSeconds,
			language,
			warnings,
			providerMetadata,
			responses,
		} = await transcribe({
			model: groq.transcription('whisper-large-v3'),
			// model: openai.transcription('gpt-4o-transcribe'),
			audio: args.audio,
		});

		console.debug('Transcribing. text:', text);
		console.debug('Transcribing. segments:', segments);
		console.debug('Transcribing. durationInSeconds:', durationInSeconds);
		console.debug('Transcribing. language:', language);
		console.debug('Transcribing. warnings:', warnings);
		console.debug('Transcribing. providerMetadata:', providerMetadata);
		console.debug('Transcribing. responses:', responses);

		return text;
	},
});
