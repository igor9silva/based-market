import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useAction } from 'convex/react';
import { productSchema } from 'convex/schemas/paymentSchema';
import { z } from 'zod';

export function usePaymentMutations() {
	//
	const startPayment = useAction(api.payments.public.start);

	const purchasePerk = async ({
		product,
		gameId,
	}: {
		product: z.infer<typeof productSchema>;
		gameId: Id<'games'>;
	}) => {
		//
		const paymentUrl = await startPayment({ product, gameId });

		// redirect to payment URL
		// window.location.href = paymentUrl;
		window.open(paymentUrl, '_blank');
	};

	return {
		purchasePerk,
	};
}
