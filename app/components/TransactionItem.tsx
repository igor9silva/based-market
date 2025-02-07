import { Link } from '@tanstack/react-router';
import { Doc } from 'convex/_generated/dataModel';
import { TimeAgo } from '~/components/TimeAgo';

export function TransactionItem({ transaction }: { transaction: Doc<'transactions'> }) {
	//
	const statusColors = {
		waiting: 'bg-yellow-100 text-yellow-800',
		pending: 'bg-yellow-100 text-yellow-800',
		completed: 'bg-green-100 text-green-800',
		failed: 'bg-red-100 text-red-800',
	};

	return (
		<li className="rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow">
			<Link
				to="/top-up/$id"
				params={{ id: transaction._id }}
				className="text-primary hover:underline font-medium"
			>
				<div className="flex items-center justify-between gap-4">
					<div className="flex flex-col">
						{transaction.reference}
						<TimeAgo date={transaction._creationTime} />
					</div>

					<span
						className={`px-3 py-1 rounded-full text-sm font-medium ${
							statusColors[transaction.status as keyof typeof statusColors]
						}`}
					>
						{transaction.status}
					</span>
				</div>
			</Link>
		</li>
	);
}
