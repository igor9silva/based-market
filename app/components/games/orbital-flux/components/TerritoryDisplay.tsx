import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type { GameStats } from '../types';

interface TerritoryDisplayProps {
	stats: GameStats;
	winner?: string | null;
}

export function TerritoryDisplay({ stats, winner }: TerritoryDisplayProps) {
	//
	const { blackPercentage, whitePercentage } = stats;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Territory Control</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* white team progress */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<span className="flex items-center gap-2">
							<div className="w-4 h-4 bg-white border border-border rounded-sm"></div>
							White
						</span>
						<span className="font-mono text-sm">{whitePercentage.toFixed(1)}%</span>
					</div>
					<div className="w-full bg-muted rounded-full h-3">
						<div
							className="bg-white border border-border h-3 rounded-full transition-all duration-300"
							style={{ width: `${whitePercentage}%` }}
						></div>
					</div>
				</div>

				{/* black team progress */}
				<div className="space-y-2">
					<div className="flex justify-between items-center">
						<span className="flex items-center gap-2">
							<div className="w-4 h-4 bg-black rounded-sm"></div>
							Black
						</span>
						<span className="font-mono text-sm">{blackPercentage.toFixed(1)}%</span>
					</div>
					<div className="w-full bg-muted rounded-full h-3">
						<div
							className="bg-black h-3 rounded-full transition-all duration-300"
							style={{ width: `${blackPercentage}%` }}
						></div>
					</div>
				</div>

				{/* winner announcement */}
				{winner && (
					<div className="mt-4 p-4 bg-accent border border-border rounded-lg text-center">
						<h3 className="text-lg font-bold text-accent-foreground">{winner}</h3>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
