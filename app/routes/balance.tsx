import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { TimeAgo } from '~/components/TimeAgo';
import { WorldcoinLogo } from '~/components/ui/icons/WorldcoinLogo';
import { useCurrentUser } from '~/hooks/useCurrentUser';

export const Route = createFileRoute('/balance')({
	component: RouteComponent,
});

function RouteComponent() {
	//
	const query = convexQuery(api.transactions.public.findAll, {});
	const { data: transactions } = useSuspenseQuery(query);

	const user = useCurrentUser();

	return (
		<div className="flex flex-col gap-2 p-4">
			<div className="flex flex-col gap-0">
				<h1 className="text-2xl font-bold">Balance</h1>
				<span className="text-sm">
					Your current non-locked balance is{' '}
					<span className="font-bold">{(user.balanceWLD ?? 0).toFixed(8)}</span>{' '}
					<WorldcoinLogo className="inline-block size-3 align-[-1px]" />.
				</span>
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="text-lg font-bold">Transactions</h2>
				{transactions.map((transaction) => (
					<TransactionItem key={transaction._id} transaction={transaction} />
				))}
			</div>
		</div>
	);
}

function TransactionItem({ transaction }: { transaction: Doc<'transactions'> }) {
	//
	return (
		<div className="flex items-center justify-between rounded-lg border p-4">
			<div className="flex flex-col gap-1">
				<span className="font-medium">{transaction.kind === 'top up' ? 'Top Up' : 'Task Cost'}</span>
				<span className="text-sm text-gray-500">
					<TimeAgo date={transaction._creationTime} />
				</span>
			</div>
			<span className={`font-medium ${transaction.value.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
				{transaction.value.amount.toLocaleString('en-US', {
					style: 'currency',
					currency: 'WLD',
				})}
			</span>
		</div>
	);
}
