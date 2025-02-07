import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { MiniKit } from '@worldcoin/minikit-js';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { z } from 'zod';
import { TransactionItem } from '~/components/TransactionItem';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';

export const Route = createFileRoute('/top-up')({
	component: RouteComponent,
});

export function RouteComponent() {
	//
	const query = convexQuery(api.transactions.public.findAllWaiting, {});
	const { data: waitingTransactions } = useSuspenseQuery(query);

	if (waitingTransactions.length > 0) {
		return (
			<div className="flex flex-col gap-2 p-4">
				<div className="">
					<h3 className="text-lg font-semibold">You have started transactions</h3>
					<span className="text-sm text-muted-foreground">Pay or cancel them before starting a new one.</span>
				</div>
				<ul className="flex flex-col gap-2">
					{waitingTransactions.map((transaction) => (
						<TransactionItem key={transaction._id} transaction={transaction} />
					))}
				</ul>
			</div>
		);
	}

	return <TopUpCard />;
}

function TopUpCard() {
	//
	const navigate = useNavigate();
	const startTopUp = useMutation(api.transactions.public.startTopUp);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			amount: z.string().pipe(
				z.coerce
					.number()
					.min(0.1, 'Minimum amount is $0.1') //
					.max(100000, 'That much? Are you sure?'),
			),
		}),
		handler: async ({ amount }) => {
			//
			const transaction = await startTopUp({
				payload: [{ symbol: 'USDCE', amount: amount }],
			});

			navigate({ to: '/top-up/$id', params: { id: transaction._id } });
		},
	});

	// confirm on CMD+Enter
	const handleKeyDown = useSubmitHotkey();

	if (!MiniKit.isInstalled()) {
		//
		const openWorldApp = () => {
			location.href = `https://worldcoin.org/mini-app?app_id=${MiniKit.appId}&path=/top-up`;
		};

		return (
			<div className="flex flex-col gap-2">
				<p>Top Up is only available inside the World App.</p>
				<Button variant="default" onClick={openWorldApp}>
					Open World App
				</Button>
			</div>
		);
	}

	return (
		<Card className="max-h-fit border-none rounded-none">
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<p className="font-semibold">Amount $USD</p>
						<Input type="number" name="amount" placeholder="Amount" required defaultValue={10} />
					</div>
					<Button variant="default" type="submit">
						Top up
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
