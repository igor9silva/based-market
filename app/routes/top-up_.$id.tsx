import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardFooter } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/top-up_/$id')({
	component: RouteComponent,
});

export function RouteComponent({ className }: { className?: string }) {
	//
	const { id } = Route.useParams();

	const query = convexQuery(api.transactions.public.findOne, {
		transactionId: id as Id<'transactions'>,
	});
	const { data: transaction } = useSuspenseQuery(query);

	const discard = useMutation(api.transactions.public.discard);

	const statusColors = {
		waiting: 'bg-yellow-100 text-yellow-800',
		pending: 'bg-yellow-100 text-yellow-800',
		confirmed: 'bg-green-100 text-green-800',
		failed: 'bg-red-100 text-red-800',
	} as const;

	return (
		<Card className={cn('max-h-fit border-none rounded-none', className)}>
			<CardContent className="p-4">
				<div className="flex flex-col gap-6">
					{/* Header with Status */}
					<div className="flex items-center justify-between">
						<div className="flex flex-col gap-1">
							<h2 className="text-2xl font-bold">Transaction Details</h2>
							<p className="text-sm text-muted-foreground">{transaction.reference}</p>
						</div>
						<Badge
							className={cn(
								'px-3 py-1 text-sm font-medium capitalize',
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
								<span className="text-base font-medium text-muted-foreground">{symbol}</span>
								<span className="text-xl font-bold tabular-nums">{amount}</span>
							</div>
						))}
					</div>

					{/* Transaction Details */}
					<div className="grid gap-4">
						<div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
							<span className="text-muted-foreground">Chain</span>
							<span className="font-medium capitalize">{transaction.chain}</span>

							<span className="text-muted-foreground">Recipient</span>
							<span className="font-medium break-all">{transaction.to}</span>

							<span className="text-muted-foreground">Description</span>
							<span className="font-medium">{transaction.description}</span>

							{/* <span className="text-muted-foreground">Author</span>
							<span className="font-medium">{transaction.author}</span> */}
						</div>
					</div>
				</div>
			</CardContent>
			{transaction.status === 'waiting' && (
				<CardFooter className="flex justify-end gap-2 p-4 border-t">
					<Button
						className="w-24"
						variant="destructive"
						onClick={() => discard({ transactionId: id as Id<'transactions'> })}
					>
						Discard
					</Button>
					<Button className="w-24" variant="default">
						Pay
					</Button>
				</CardFooter>
			)}
		</Card>
	);
}
