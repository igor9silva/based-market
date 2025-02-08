import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';
import { topUpAmountSchema } from 'convex/schemas/topUpSchema';
import { toast } from 'sonner';
import { z } from 'zod';
import { TopUpItem } from '~/components/TopUpItem';
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
	const query = convexQuery(api.topUps.public.findAllWaiting, {});
	const { data: waitingTopUps } = useSuspenseQuery(query);

	if (waitingTopUps.length > 0) {
		return (
			<div className="flex flex-col gap-2 p-4">
				<div className="">
					<h3 className="text-lg font-semibold">You have started topUps</h3>
					<span className="text-sm text-muted-foreground">Pay or cancel them before starting a new one.</span>
				</div>
				<ul className="flex flex-col gap-2">
					{waitingTopUps.map((topUp) => (
						<TopUpItem key={topUp._id} topUp={topUp} />
					))}
				</ul>
			</div>
		);
	}

	return (
		<div className="flex flex-col gap-2 p-4">
			<TopUpCard />
			<History />
		</div>
	);
}

function History() {
	//
	const query = convexQuery(api.topUps.public.findAllHistory, {});
	const { data: history } = useSuspenseQuery(query);

	return (
		<ul className="flex flex-col gap-2">
			{history.map((topUp) => (
				<TopUpItem key={topUp._id} topUp={topUp} />
			))}
		</ul>
	);
}

function TopUpCard() {
	//
	const navigate = useNavigate();
	const startTopUp = useMutation(api.topUps.public.startTopUp);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			amount: z.string(),
		}),
		handler: async ({ amount }) => {
			//
			const parsed = topUpAmountSchema.safeParse(Number(amount));
			if (!parsed.success) {
				toast.error('Amount must be $0.1 or more');
				return;
			}

			const topUp = await startTopUp({
				payload: [{ symbol: 'WLD', amount: parsed.data }],
			});

			navigate({ to: '/top-up/$id', params: { id: topUp._id } });
		},
	});

	// confirm on CMD+Enter
	const handleKeyDown = useSubmitHotkey();

	return (
		<Card className="max-h-fit border-none rounded-none">
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<p className="font-semibold">Amount $USD</p>
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
