import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { usePayment } from '~/hooks/usePayment';
import { cn } from '~/lib/utils';

import { BasicError } from '~/components/BasicError';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter } from '~/components/ui/card';
import { useWorldApp } from '~/hooks/useWorldApp';

export const Route = createFileRoute('/top-up_/$id')({
	component: RouteComponent,
});

const statusColors = {
	waiting: 'bg-yellow-100 text-yellow-800',
	pending: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-green-100 text-green-800',
	failed: 'bg-red-100 text-red-800',
} as const;

export function RouteComponent({ className }: { className?: string }) {
	//
	const { id } = Route.useParams();
	const { openApp } = useWorldApp(`/top-up/${id}`);

	const query = convexQuery(api.transactions.public.findOne, {
		transactionId: id as Id<'transactions'>,
	});
	const { data: transaction } = useSuspenseQuery(query);

	const discard = useMutation(api.transactions.public.discard);

	const { pay, isPending, error } = usePayment(transaction);

	if (error) {
		//
		return (
			<div className="flex flex-col items-center justify-center h-full w-full gap-4">
				<BasicError text={error.message} className="h-fit" />
				<Button variant="default" onClick={openApp}>
					Open World App
				</Button>
			</div>
		);
	}

	return (
		<Card className={cn('max-h-fit border-none rounded-none', className)}>
			<CardContent className="p-4">
				<div className="flex flex-col gap-4">
					{/* Header with Status */}
					<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
						<div className="flex flex-col gap-1">
							<h2 className="text-xl sm:text-2xl font-bold">Transaction Details</h2>
							<p className="text-xs sm:text-sm text-muted-foreground break-all">
								{transaction.reference}
							</p>
						</div>
						<Badge
							className={cn(
								'w-fit px-3 py-1 text-sm font-medium capitalize',
								statusColors[transaction.status as keyof typeof statusColors],
							)}
						>
							{transaction.status}
						</Badge>
					</div>

					{/* Amount Section */}
					<div className="flex flex-col gap-2 p-4 bg-muted rounded-lg">
						{transaction.payload.map(({ symbol, amount }) => (
							<div key={symbol} className="flex items-center justify-between">
								<span className="text-sm sm:text-base font-medium text-muted-foreground">{symbol}</span>
								<span className="text-lg sm:text-xl font-bold tabular-nums">{amount}</span>
							</div>
						))}
					</div>

					{/* Transaction Details */}
					<div className="grid gap-4">
						<div className="grid grid-cols-[auto,1fr] gap-x-4 gap-y-2 text-sm">
							<span className="text-muted-foreground whitespace-nowrap">Chain</span>
							<span className="font-medium capitalize break-all">{transaction.chain}</span>

							<span className="text-muted-foreground whitespace-nowrap">Recipient</span>
							<span className="font-medium break-all">{transaction.to}</span>

							<span className="text-muted-foreground whitespace-nowrap">Description</span>
							<span className="font-medium break-all">{transaction.description}</span>
						</div>
					</div>
				</div>
			</CardContent>
			{transaction.status === 'waiting' && (
				<CardFooter className="flex flex-col sm:flex-row justify-end gap-2 p-4 border-t">
					<Button
						className="w-full sm:w-24"
						variant="destructive"
						disabled={isPending}
						onClick={() => discard({ transactionId: id as Id<'transactions'> })}
					>
						Discard
					</Button>
					<Button className="w-full sm:w-24" variant="default" disabled={isPending} onClick={() => pay()}>
						{isPending ? 'Paying...' : 'Pay'}
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
