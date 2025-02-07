import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { Card, CardContent } from '~/components/ui/card';
import { cn } from '~/lib/utils';

export const Route = createFileRoute('/top-up/$id')({
	component: RouteComponent,
});

export function RouteComponent({ className }: { className?: string }) {
	//
	const { id } = Route.useParams();

	const query = convexQuery(api.transactions.public.findOne, {
		transactionId: id as Id<'transactions'>,
	});
	const { data: transaction } = useSuspenseQuery(query);

	return (
		<Card className={cn('max-h-fit border-none rounded-none', className)}>
			<CardContent className="p-4">
				<div className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<p>Reference</p>
						<p>{transaction.reference}</p>
					</div>
					<div className="flex flex-col gap-0.5">
						<p>Status</p>
						<p>{transaction.status}</p>
					</div>
					<div className="flex flex-col gap-0.5">
						<p>Payload</p>
						<p>{JSON.stringify(transaction.payload)}</p>
					</div>
					<div className="flex flex-col gap-0.5">
						<p>Chain</p>
						<p>{transaction.chain}</p>
					</div>
					<div className="flex flex-col gap-0.5">
						<p>To</p>
						<p>{transaction.to}</p>
					</div>
					<div className="flex flex-col gap-0.5">
						<p>Description</p>
						<p>{transaction.description}</p>
					</div>
					<div className="flex flex-col gap-0.5">
						<p>Author</p>
						<p>{transaction.author}</p>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
