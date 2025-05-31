interface LiveCountdownBarProps {
	winner: string;
	countdown: number;
}

export function LiveCountdownBar({ winner, countdown }: LiveCountdownBarProps) {
	//
	// use proper contrast: opposite text color from background
	const winnerColor = winner === 'white' ? 'text-black' : 'text-white';
	const winnerBg = winner === 'white' ? 'bg-white' : 'bg-black';
	const winnerTextShadow =
		winner === 'white'
			? 'drop-shadow-[0_1px_2px_rgba(255,255,255,0.5)]'
			: 'drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]';

	return (
		<div className="w-full bg-secondary rounded-full h-10 relative overflow-hidden border-2 border-border">
			{/* winner background fills the entire bar */}
			<div className={`absolute inset-0 ${winnerBg} transition-all duration-300`}></div>

			{/* content overlay */}
			<div className="absolute inset-0 flex items-center justify-between px-6 text-sm font-bold">
				<span className={`${winnerColor} ${winnerTextShadow}`}>🎉 {winner.toUpperCase()} WINS!</span>
				<span className={`${winnerColor} ${winnerTextShadow}`}>Next game in {countdown}s</span>
			</div>
		</div>
	);
}
