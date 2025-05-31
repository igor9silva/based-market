import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useRef } from 'react';
import type { EffectType } from '../types';

interface PaymentPerkActivationProps {
	gameId: Id<'games'>;
	onActivatePerk: (type: EffectType, side: 'white' | 'black' | 'neutral', duration: number) => void;
}

export function usePaymentPerkActivation({ gameId, onActivatePerk }: PaymentPerkActivationProps) {
	//
	// query ready-to-use payments for this game
	const readyPayments = useQuery(api.payments.public.notUsed, { gameId });

	// mutation to mark payments as used
	const markAsUsed = useMutation(api.payments.public.markAsUsed);

	// track processed payment IDs to prevent duplicate activation
	const processedPaymentIds = useRef(new Set<string>());

	/**
	 * process ready payments when they arrive
	 */
	useEffect(() => {
		//
		if (!readyPayments || readyPayments.length === 0) return;

		console.log(`Processing ${readyPayments.length} ready payments`);

		// filter out payments we've already processed
		const newPayments = readyPayments.filter((payment) => {
			//
			const paymentKey = `${payment._id}-${payment.status}`;
			return !processedPaymentIds.current.has(paymentKey);
		});

		if (newPayments.length === 0) {
			console.log('No new payments to process');
			return;
		}

		console.log(`Processing ${newPayments.length} new payments`);

		// process only new payments in parallel
		const processPayments = newPayments.map(async (payment) => {
			//
			const paymentKey = `${payment._id}-${payment.status}`;

			// mark as processed immediately to prevent reprocessing
			processedPaymentIds.current.add(paymentKey);

			console.log('Processing payment:', payment._id, 'status:', payment.status);

			// parse the product to extract perk info
			const product = payment.product;
			if (!product.startsWith('orbital-flux ')) {
				console.log('Payment not for orbital-flux:', product);
				return;
			}

			// parse: "orbital-flux white extra-orb" or "orbital-flux neutral chaos"
			const parts = product.split(' ');
			if (parts.length !== 3) {
				console.log('Invalid product format:', product);
				return;
			}

			const [, sideStr, typeStr] = parts;
			const side = sideStr as 'white' | 'black' | 'neutral';
			const type = typeStr as EffectType;

			// determine duration based on perk type
			const durations: Record<EffectType, number> = {
				'extra-orb': 10000, // 10 seconds
				'unbreakable': 15000, // 15 seconds
				'speed-boost': 15000, // 15 seconds
				'freeze-enemy': 5000, // 5 seconds
				'chaos': 6000, // 6 seconds
			};

			const duration = durations[type];
			if (!duration) {
				console.log('Unknown perk type:', type);
				return;
			}

			// activate the perk
			console.log(`Activating perk: ${type} for ${side} (${duration}ms)`);
			onActivatePerk(type, side, duration);

			// mark payment as used in backend
			try {
				await markAsUsed({ paymentId: payment._id });
				console.log(`Payment marked as used: ${payment._id}`);
			} catch (error) {
				console.error('Failed to mark payment as used:', error);
			}
		});

		// run all payment processing in parallel
		Promise.all(processPayments).catch((error) => {
			console.error('Error processing payments:', error);
		});
		//
	}, [readyPayments, markAsUsed, onActivatePerk]);

	// cleanup processed payment IDs when gameId changes
	useEffect(() => {
		//
		processedPaymentIds.current.clear();
	}, [gameId]);
}
