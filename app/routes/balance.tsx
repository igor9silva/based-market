import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute, Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Doc, Id } from 'convex/_generated/dataModel';
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

	const queryLockedBalance = convexQuery(api.users.public.findLockedBalance, {});
	const { data: lockedBalance } = useSuspenseQuery(queryLockedBalance);

	return (
		<div className="flex flex-col gap-2 p-4">
			<div className="flex flex-col gap-0">
				<h1 className="text-2xl font-bold">Balance</h1>
				<span className="text-sm">
					Your current non-locked balance is{' '}
					<span className="font-bold">{(user.balanceUSD ?? 0).toFixed(6)}</span>{' '}
					<WorldcoinLogo className="inline-block size-3 align-[-1px]" />.
				</span>
				{lockedBalance > 0 && (
					<span className="text-sm">
						Other <span className="font-bold">{lockedBalance.toFixed(6)}</span>{' '}
						<WorldcoinLogo className="inline-block size-3 align-[-1px]" /> are locked in active tasks.
					</span>
				)}
			</div>
			<div className="flex flex-col gap-2">
				<h2 className="text-lg font-bold">Transactions</h2>
				{transactions.map((transaction) => (
					<TransactionItem
						key={transaction._id}
						transaction={transaction}
						taskId={
							transaction.kind === 'fund task' || transaction.kind === 'refund task'
								? transaction.taskId
								: undefined
						}
					/>
				))}
			</div>
		</div>
	);
}

function TransactionItem({
	transaction, //
	taskId,
}: {
	transaction: Doc<'transactions'>;
	taskId?: Id<'tasks'>;
}) {
	//
	return (
		<div className="flex items-center justify-between rounded-lg border p-4">
			<div className="flex flex-col gap-1">
				<span className="text-sm text-gray-500">
					<TimeAgo date={transaction._creationTime} />
				</span>
				<TransactionKind transaction={transaction} />
				{taskId && (
					<Link
						to="/$"
						params={{ _splat: `/chat/${taskId}` }}
						className="text-xs text-muted-foreground hover:text-foreground"
					>
						{taskId}
					</Link>
				)}
			</div>
			<span
				className={`flex-shrink-0 font-medium ${transaction.value.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}
			>
				{transaction.value.amount.toFixed(2)}
			</span>
		</div>
	);
}

function TransactionKind({
	transaction, //
	taskId,
}: {
	transaction: Doc<'transactions'>;
	taskId?: Id<'tasks'>;
}) {
	//
	if (transaction.description) {
		return <span className="font-medium">{transaction.description}</span>;
	}

	switch (transaction.kind) {
		case 'free credits':
			return <span className="font-medium">Free Credits</span>;
		case 'top up':
			return <span className="font-medium">Top Up</span>;
		case 'fund task':
			return <span className="font-medium">Add funds to task</span>;
		case 'refund task':
			return <span className="font-medium">Refund from task</span>;
		default:
			return <span className="font-medium">Unknown</span>;
	}
}
