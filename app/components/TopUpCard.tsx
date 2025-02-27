import { useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { asBigInt } from 'convex/utils/money';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';

export function TopUpCard() {
	//
	const navigate = useNavigate();
	const startTopUp = useMutation(api.topUps.public.startTopUp);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			amount: z.string(),
		}),
		handler: async ({ amount }) => {
			//
			const topUpId = await startTopUp({
				symbol: 'USD',
				amount: asBigInt({ dollars: Number(amount) }),
				chain: 'base',
			});

			navigate({ to: '/top-up/$id', params: { id: topUpId } });
		},
	});

	// confirm on CMD+Enter
	const handleKeyDown = useSubmitHotkey();

	return (
		<Card className="max-h-fit border-none rounded-none">
			<CardContent className="p-0">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<p className="font-semibold">USD Amount</p>
						<Input type="string" name="amount" placeholder="Amount" required defaultValue={0.1} />
					</div>
					<Button variant="default" type="submit">
						Top up
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
