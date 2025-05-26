import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';

export function PaymentsPanel() {
	//
	const query = convexQuery(api.payments.public.all, {});
	const { data: payments } = useSuspenseQuery(query);

	return (
		<div className="mt-4 p-3 bg-accent border border-border rounded-lg max-h-80 overflow-y-auto">
			<h5 className="font-semibold text-sm mb-2 text-accent-foreground">Payments</h5>
			{payments.map((payment) => {
				//
				const formattedDate = new Date(payment._creationTime).toLocaleString();
				const shortId = payment.coinbaseId.slice(0, 8);
				const displayName = payment.product.replace('-', ' ').toUpperCase();
				const statusColor = {
					confirmed: 'text-green-500',
					failed: 'text-red-500',
					created: 'text-muted-foreground',
					pending: 'text-yellow-500',
				}[payment.status];

				return (
					<div key={payment.coinbaseId} className="text-xs text-muted-foreground space-y-1">
						<div className="flex justify-between">
							<span>{displayName}</span>
							<span className={statusColor}>{payment.status}</span>
						</div>
						<div className="flex justify-between text-xs/70">
							<span>{formattedDate}</span>
							<span>ID: {shortId}</span>
						</div>
					</div>
				);
			})}
		</div>
	);
}
