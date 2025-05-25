import { Play, RotateCcw, Square } from 'lucide-react';
import { Button } from '~/components/ui/button';

interface GameControlsProps {
	isRunning: boolean;
	onStart: () => void;
	onStop: () => void;
	onReset: () => void;
}

export function GameControls({ isRunning, onStart, onStop, onReset }: GameControlsProps) {
	//
	/**
	 * toggles between start and stop
	 */
	const handleToggle = () => {
		//
		if (isRunning) {
			onStop();
		} else {
			onStart();
		}
	};

	return (
		<div className="flex gap-2">
			{/* start/stop button */}
			<Button onClick={handleToggle} variant={isRunning ? 'destructive' : 'default'} size="sm">
				{isRunning ? (
					<>
						<Square className="w-4 h-4" />
						Stop
					</>
				) : (
					<>
						<Play className="w-4 h-4" />
						Start
					</>
				)}
			</Button>

			{/* reset button */}
			<Button onClick={onReset} variant="outline" size="sm">
				<RotateCcw className="w-4 h-4" />
				Reset
			</Button>
		</div>
	);
}
