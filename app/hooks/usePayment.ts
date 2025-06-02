import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useAction } from 'convex/react';
import { productSchema } from 'convex/schemas/paymentSchema';
import { useCallback, useState } from 'react';
import { z } from 'zod';

interface PaymentState {
	status: 'idle' | 'processing' | 'ready';
	url?: string;
	error?: string;
}

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
		window.location.href = paymentUrl;
		// window.open(paymentUrl, '_blank');
	};

	return {
		purchasePerk,
	};
}

export function useTwoStepPayment() {
	//
	const [paymentStates, setPaymentStates] = useState<Record<string, PaymentState>>({});
	const startPayment = useAction(api.payments.public.start);

	const initiatePurchase = async (key: string, product: z.infer<typeof productSchema>, gameId: Id<'games'>) => {
		//
		setPaymentStates((prev) => ({
			...prev,
			[key]: { status: 'processing' },
		}));

		try {
			const paymentUrl = await startPayment({ product, gameId });

			setPaymentStates((prev) => ({
				...prev,
				[key]: { status: 'ready', url: paymentUrl },
			}));
		} catch (error) {
			setPaymentStates((prev) => ({
				...prev,
				[key]: {
					status: 'idle',
					error: error instanceof Error ? error.message : 'Failed to create payment',
				},
			}));
		}
	};

	const resetPayment = useCallback((key: string) => {
		//
		setPaymentStates((prev) => {
			const newState = { ...prev };
			delete newState[key];
			return newState;
		});
	}, []);

	const getPaymentState = useCallback(
		(key: string): PaymentState => {
			//
			return paymentStates[key] || { status: 'idle' };
		},
		[paymentStates],
	);

	const resetAllPayments = useCallback(() => {
		//
		setPaymentStates({});
	}, []);

	return {
		initiatePurchase,
		resetPayment,
		resetAllPayments,
		getPaymentState,
	};
}
