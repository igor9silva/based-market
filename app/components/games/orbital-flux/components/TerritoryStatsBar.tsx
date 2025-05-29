import type { GameStats } from '../types';

interface TerritoryStatsBarProps {
	stats: GameStats;
	winner?: 'white' | 'black';
	showStats?: boolean;
	winThreshold?: number;
}

export function TerritoryStatsBar({ stats, winner, showStats = true, winThreshold = 75 }: TerritoryStatsBarProps) {
	//
	const { blackPercentage, whitePercentage, totalBlocks } = stats;
	const whiteBlocks = Math.round((whitePercentage / 100) * totalBlocks);
	const blackBlocks = Math.round((blackPercentage / 100) * totalBlocks);

	return (
		<div className="space-y-2">
			{/* main territory bar */}
			<div className="relative">
				{/* background bar */}
				<div className="w-full bg-secondary rounded-full h-10 relative overflow-hidden border-2 border-border">
					{/* white territory */}
					<div
						className="absolute left-0 top-0 h-full bg-white transition-all duration-300"
						style={{ width: `${whitePercentage}%` }}
					></div>
					{/* black territory */}
					<div
						className="absolute right-0 top-0 h-full bg-black transition-all duration-300"
						style={{ width: `${blackPercentage}%` }}
					></div>
				</div>

				{/* center line indicator */}
				<div className="absolute left-1/2 top-0 w-1 h-full bg-foreground/60 transform -translate-x-0.5"></div>

				{/* win threshold indicators */}
				<div
					className="absolute top-0 w-0.5 h-full bg-green-500 transform -translate-x-0.5"
					style={{ left: `${winThreshold}%` }}
					title={`Win threshold: ${winThreshold}%`}
				></div>
				<div
					className="absolute top-0 w-0.5 h-full bg-green-500 transform -translate-x-0.5"
					style={{ left: `${100 - winThreshold}%` }}
					title={`Win threshold: ${winThreshold}%`}
				></div>

				{/* percentage labels with block counts */}
				<div className="absolute inset-0 flex items-center justify-between px-4 text-sm font-mono font-bold">
					<span className="text-black drop-shadow-[0_1px_2px_rgba(255,255,255,0.8)]">
						{whitePercentage.toFixed(1)}% ({whiteBlocks})
					</span>
					<span className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">
						{blackPercentage.toFixed(1)}% ({blackBlocks})
					</span>
				</div>
			</div>

			{/* winner announcement */}
			{winner && (
				<div className="text-center p-3 bg-accent border border-border rounded-lg">
					<span className="text-lg font-bold text-accent-foreground">{winner}</span>
				</div>
			)}
		</div>
	);
}
