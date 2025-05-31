import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { TimeAgo } from '~/components/TimeAgo';

export function PaymentsPanel({ gameId }: { gameId: Id<'games'> }) {
	//
	const query = convexQuery(api.payments.public.all, { gameId });
	const { data: payments } = useSuspenseQuery(query);

	return (
		<div className="mt-4 p-3 bg-accent border border-border rounded-lg max-h-80 overflow-y-auto">
			<h5 className="font-semibold text-sm mb-2 text-accent-foreground">Payments</h5>
			<div className="space-y-1">
				{payments.map((payment) => {
					//
					const shortId = payment.coinbaseId.slice(0, 8);

					const statusText = {
						confirmed: 'confirmed',
						pending: 'confirmed',
						failed: 'failed',
						created: 'pending',
					}[payment.status];

					const statusColor = {
						confirmed: 'text-green-500',
						pending: 'text-green-500',
						failed: 'text-red-500',
						created: 'text-muted-foreground',
					}[payment.status];

					return (
						<div key={payment.coinbaseId} className="text-xs text-muted-foreground space-y-0">
							<div className="flex justify-between">
								<span>{payment.product}</span>
								<span className={statusColor}>{statusText}</span>
							</div>
							<div className="flex justify-between text-xs/70">
								<TimeAgo date={payment._creationTime} />
								<span>ID: {shortId}</span>
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}
