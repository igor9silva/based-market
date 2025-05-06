import { type FormEvent } from 'react';
import { type z } from 'zod';

export function useHandleSubmit<T extends z.ZodType>({
	schema,
	handler,
	shouldAlwaysClearForm = true,
	onParseError,
}: {
	schema: T;
	shouldAlwaysClearForm?: boolean;
	handler: (data: z.infer<T>, clearForm: () => void) => Promise<void> | void;
	onParseError?: (error: z.ZodError) => void;
}) {
	return async (e: FormEvent<HTMLFormElement>) => {
		//
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		// Convert FormData to a plain object
		const rawData = Object.fromEntries(formData);

		// Parse the data
		const parsed = schema.safeParse(rawData);

		if (!parsed.success) {
			onParseError?.(parsed.error);
			return;
		}

		// Reset the form
		if (shouldAlwaysClearForm) e.currentTarget.reset();

		await handler(parsed.data, () => e.currentTarget.reset());
	};
}
