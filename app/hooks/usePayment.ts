import { api } from 'convex/_generated/api';
import { useAction } from 'convex/react';
import { productSchema } from 'convex/schemas/paymentSchema';
import { z } from 'zod';

export function usePaymentMutations() {
	//
	const startPayment = useAction(api.payments.public.start);

	const purchasePerk = async ({
		product, //
	}: {
		product: z.infer<typeof productSchema>;
	}) => {
		//
		const paymentUrl = await startPayment({ product });

		// redirect to payment URL
		window.location.href = paymentUrl;
	};

	return {
		purchasePerk,
	};
}
