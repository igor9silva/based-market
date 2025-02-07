import { Link } from '@tanstack/react-router';
import { Doc } from 'convex/_generated/dataModel';
import { TimeAgo } from '~/components/TimeAgo';

export const transactionStatusColors = {
	waiting: 'bg-yellow-100 text-yellow-800',
	pending: 'bg-yellow-100 text-yellow-800',
	confirmed: 'bg-green-100 text-green-800',
	failed: 'bg-red-100 text-red-800',
};

export function TransactionItem({ transaction }: { transaction: Doc<'transactions'> }) {
	//

	return (
		<li className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
			<Link
				to="/top-up/$id"
				params={{ id: transaction._id }}
				className="text-primary hover:underline font-medium"
			>
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-col min-w-0">
						<span className="truncate">{transaction._id}</span>
						<TimeAgo date={transaction._creationTime} />
					</div>

					<span
						className={`shrink-0 px-3 py-1 rounded-full text-sm font-medium ${
							transactionStatusColors[transaction.status as keyof typeof transactionStatusColors]
						}`}
					>
						{transaction.status}
					</span>
				</div>
			</Link>
		</li>
	);
}
