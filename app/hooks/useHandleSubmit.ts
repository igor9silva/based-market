import { type FormEvent } from 'react';
import { type z } from 'zod';

export function useHandleSubmit<T extends z.ZodType>({
	schema,
	handler,
	shouldAlwaysClearForm = true,
}: {
	schema: T;
	shouldAlwaysClearForm?: boolean;
	handler: (data: z.infer<T>, clearForm: () => void) => Promise<void> | void;
}) {
	return async (e: FormEvent<HTMLFormElement>) => {
		//
		e.preventDefault();
		const formData = new FormData(e.currentTarget);

		// Convert FormData to a plain object
		const rawData = Object.fromEntries(formData);

		// Parse the data
		const data = schema.parse(rawData);

		// Reset the form
		if (shouldAlwaysClearForm) e.currentTarget.reset();

		await handler(data, () => e.currentTarget.reset());
	};
}
