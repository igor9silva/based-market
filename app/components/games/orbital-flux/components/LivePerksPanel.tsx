import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { TimeAgo } from '~/components/TimeAgo';

export function LivePerksPanel({ gameId }: { gameId: Id<'games'> }) {
	//
	const query = convexQuery(api.payments.public.all, { gameId });
	const { data: payments } = useSuspenseQuery(query);

	return (
		<div className="w-80 bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-lg">
			<div className="p-4 border-b border-border">
				<h3 className="text-lg font-bold text-card-foreground">Perks</h3>
			</div>

			<div className="p-4 space-y-2">
				{payments.length < 1 ? (
					<div className="text-center text-muted-foreground text-sm">No perks purchased yet</div>
				) : (
					payments.map((payment) => <PerkItem key={payment._id} payment={payment} />)
				)}
			</div>
		</div>
	);
}

interface PerkItemProps {
	payment: {
		_id: Id<'payments'>;
		_creationTime: number;
		coinbaseId: string;
		product: string;
		status: 'created' | 'pending' | 'confirmed' | 'failed';
		isUsed: boolean;
	};
}

function PerkItem({ payment }: PerkItemProps) {
	//
	// parse the product to extract perk info
	const productParts = payment.product.split(' ');
	const team = productParts[1]; // 'white', 'black', or 'neutral'
	const perkType = productParts[2]; // 'extra-orb', 'unbreakable', etc.

	// format the perk name for display
	const perkName = formatPerkName(perkType);
	const teamDisplay = team === 'neutral' ? 'Chaos' : `${team.charAt(0).toUpperCase() + team.slice(1)} Team`;

	// determine visual state based on status and usage
	const getStatusInfo = () => {
		//
		if (payment.isUsed) {
			return {
				text: 'used',
				color: 'text-muted-foreground',
				bgColor: 'bg-muted/50',
				strikethrough: true,
			};
		}

		switch (payment.status) {
			case 'created':
				return {
					text: 'pending',
					color: 'text-yellow-500',
					bgColor: 'bg-yellow-500/10',
					strikethrough: false,
				};
			case 'pending':
			case 'confirmed':
				return {
					text: 'active',
					color: 'text-green-500',
					bgColor: 'bg-green-500/10',
					strikethrough: false,
				};
			case 'failed':
				return {
					text: 'failed',
					color: 'text-red-500',
					bgColor: 'bg-red-500/10',
					strikethrough: true,
				};
			default:
				return {
					text: 'unknown',
					color: 'text-muted-foreground',
					bgColor: 'bg-muted/50',
					strikethrough: false,
				};
		}
	};

	const statusInfo = getStatusInfo();

	// team color indicator
	const teamColorClass =
		team === 'white'
			? 'bg-white border-gray-300'
			: team === 'black'
				? 'bg-black border-gray-600'
				: 'bg-gradient-to-r from-red-500 to-purple-500';

	return (
		<div className={`p-3 rounded-lg border transition-all duration-300 ${statusInfo.bgColor} border-border/50`}>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-2">
					{/* team color indicator */}
					<div className={`w-3 h-3 rounded-full border ${teamColorClass}`} />

					{/* perk info */}
					<div className={statusInfo.strikethrough ? 'line-through' : ''}>
						<div className="text-sm font-medium text-card-foreground">{perkName}</div>
						<div className="text-xs text-muted-foreground">{teamDisplay}</div>
					</div>
				</div>

				{/* status */}
				<div className="text-right">
					<div className={`text-xs font-medium ${statusInfo.color}`}>{statusInfo.text}</div>
					<div className="text-xs text-muted-foreground">
						<TimeAgo date={payment._creationTime} />
					</div>
				</div>
			</div>
		</div>
	);
}

function formatPerkName(perkType: string): string {
	//
	const perkNames: Record<string, string> = {
		'extra-orb': 'Extra Orb',
		'unbreakable': 'Unbreakable',
		'speed-boost': 'Speed Boost',
		'freeze-enemy': 'Freeze Enemy',
		'chaos': 'Chaos Mode',
	};

	return perkNames[perkType] || perkType;
}
