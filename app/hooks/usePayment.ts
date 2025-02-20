import { useMutation } from '@tanstack/react-query';
import { Doc } from 'convex/_generated/dataModel';

export class PaymentError extends Error {
	constructor(
		message: string,
		public code: string,
	) {
		super(message);
	}
}

export const usePayment = (topUp: Doc<'topUps'>) => {
	//
	const { mutate, isPending, error } = useMutation({
		mutationFn: async () => {
			//
			throw new Error('Payments are not yet available.');
		},
	});

	return { pay: mutate, isPending, error };
};
