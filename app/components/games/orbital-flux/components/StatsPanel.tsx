import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type { GameStats } from '../types';

interface StatsPanelProps {
	stats: GameStats;
	isRunning: boolean;
}

export function StatsPanel({ stats, isRunning }: StatsPanelProps) {
	//
	const { totalBlocks, blackPercentage, whitePercentage } = stats;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Statistics</CardTitle>
			</CardHeader>
			<CardContent className="space-y-2">
				{/* total blocks */}
				<StatRow label="Total Blocks" value={totalBlocks.toString()} />

				{/* white blocks count */}
				<StatRow label="White Blocks" value={Math.round((whitePercentage / 100) * totalBlocks).toString()} />

				{/* black blocks count */}
				<StatRow label="Black Blocks" value={Math.round((blackPercentage / 100) * totalBlocks).toString()} />

				{/* game status */}
				<div className="flex justify-between">
					<span>Status:</span>
					<span
						className={`font-mono text-sm ${
							isRunning ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
						}`}
					>
						{isRunning ? 'Running' : 'Stopped'}
					</span>
				</div>
			</CardContent>
		</Card>
	);
}

interface StatRowProps {
	label: string;
	value: string;
}

function StatRow({ label, value }: StatRowProps) {
	//
	return (
		<div className="flex justify-between">
			<span>{label}:</span>
			<span className="font-mono text-sm">{value}</span>
		</div>
	);
}
