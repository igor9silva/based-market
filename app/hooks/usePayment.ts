import { useMutation } from '@tanstack/react-query';
import { MiniKit, PayCommandInput, Tokens, tokenToDecimals } from '@worldcoin/minikit-js';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useAction } from 'convex/react';

export class PaymentError extends Error {
	constructor(
		message: string,
		public code: string,
	) {
		super(message);
	}
}

export const usePayment = (transaction: Doc<'transactions'>) => {
	//
	const confirmPayment = useAction(api.transactions.public.confirmPayment);

	const { mutate, isPending, error } = useMutation({
		mutationFn: async () => {
			//
			if (!MiniKit.isInstalled()) {
				throw new PaymentError('Payments are only available inside the World App.', 'MISSING_MINI_KIT');
			}

			const payload: PayCommandInput = {
				reference: transaction._id,
				to: transaction.to,
				description: transaction.description,
				tokens: transaction.payload.map(({ symbol, amount }) => ({
					symbol: symbol as Tokens,
					token_amount: tokenToDecimals(amount, symbol as Tokens).toString(),
				})),
			};

			const { finalPayload } = await MiniKit.commandsAsync.pay(payload);
			if (finalPayload.status === 'error') throw new Error(finalPayload.error_code);

			await confirmPayment({ transactionId: transaction._id, finalPayload });
		},
	});

	return { pay: mutate, isPending, error };
};
