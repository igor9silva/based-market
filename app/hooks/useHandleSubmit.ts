import { type FormEvent } from 'react';
import { type z } from 'zod';

export function useHandleSubmit<T extends z.ZodType>({
	schema,
	handler,
}: {
	schema: T;
	handler: (data: z.infer<T>) => Promise<void> | void;
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
		e.currentTarget.reset();

		await handler(data);
	};
}
