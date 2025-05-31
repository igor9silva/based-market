import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';
import { CONFIG_LIMITS } from '../constants';
import type { GameConfig } from '../types';

interface ConfigPanelProps {
	config: GameConfig;
	isRunning: boolean;
	onConfigChange: (newConfig: GameConfig) => void;
}

export function ConfigPanel({ config, isRunning, onConfigChange }: ConfigPanelProps) {
	//
	/**
	 * updates a specific config value
	 */
	const updateConfig = (key: keyof GameConfig, value: number) => {
		//
		onConfigChange({
			...config,
			[key]: value,
		});
	};

	/**
	 * updates grid size (both width and height together)
	 */
	const updateGridSize = (size: number) => {
		//
		onConfigChange({
			...config,
			gridWidth: size,
			gridHeight: size,
		});
	};

	return (
		<div className="space-y-4">
			{/* configuration sliders */}
			<div className="space-y-3">
				{/* grid size control */}
				<ConfigSlider
					label={`Grid Size: ${config.gridWidth}×${config.gridHeight}`}
					value={config.gridWidth}
					onChange={updateGridSize}
					limits={CONFIG_LIMITS.gridSize}
					disabled={isRunning}
				/>

				{/* orb speed control */}
				<ConfigSlider
					label={`Orb Speed: ${config.orbSpeed}`}
					value={config.orbSpeed}
					onChange={(value) => updateConfig('orbSpeed', value)}
					limits={CONFIG_LIMITS.orbSpeed}
					disabled={isRunning}
				/>

				{/* win threshold control */}
				<ConfigSlider
					label={`Win Threshold: ${config.winThreshold}%`}
					value={config.winThreshold}
					onChange={(value) => updateConfig('winThreshold', value)}
					limits={CONFIG_LIMITS.winThreshold}
					disabled={isRunning}
				/>
			</div>
		</div>
	);
}

interface ConfigSliderProps {
	label: string;
	value: number;
	onChange: (value: number) => void;
	limits: { min: number; max: number; step: number };
	disabled?: boolean;
}

function ConfigSlider({ label, value, onChange, limits, disabled }: ConfigSliderProps) {
	//
	return (
		<div className="space-y-2">
			<Label>{label}</Label>
			<Slider
				value={[value]}
				onValueChange={([newValue]) => onChange(newValue)}
				min={limits.min}
				max={limits.max}
				step={limits.step}
				disabled={disabled}
			/>
		</div>
	);
}
