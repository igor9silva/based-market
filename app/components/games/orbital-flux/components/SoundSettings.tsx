import { Volume2, VolumeX } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { Label } from '~/components/ui/label';
import { Slider } from '~/components/ui/slider';
import { Switch } from '~/components/ui/switch';

interface SoundConfig {
	volume: number;
	enabled: boolean;
}

interface SoundSettingsProps {
	config: SoundConfig;
	onConfigChange: (newConfig: Partial<SoundConfig>) => void;
}

export function SoundSettings({ config, onConfigChange }: SoundSettingsProps) {
	//
	const handleVolumeChange = (values: number[]) => {
		//
		onConfigChange({ volume: values[0] / 100 });
	};

	const handleEnabledChange = (enabled: boolean) => {
		//
		onConfigChange({ enabled });
	};

	const toggleMute = () => {
		//
		onConfigChange({ enabled: !config.enabled });
	};

	return (
		<div className="space-y-4 p-4 border border-border rounded-lg bg-card">
			<div className="flex items-center justify-between">
				<Label className="text-sm font-medium">Sound Effects</Label>
				<Button variant="ghost" size="sm" onClick={toggleMute} className="h-8 w-8 p-0">
					{config.enabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
				</Button>
			</div>

			<div className="space-y-3">
				<div className="flex items-center space-x-2">
					<Switch checked={config.enabled} onCheckedChange={handleEnabledChange} id="sound-enabled" />
					<Label htmlFor="sound-enabled" className="text-sm">
						Enable sounds
					</Label>
				</div>

				<div className="space-y-2">
					<Label className="text-sm text-muted-foreground">Volume: {Math.round(config.volume * 100)}%</Label>
					<Slider
						value={[config.volume * 100]}
						onValueChange={handleVolumeChange}
						max={100}
						min={0}
						step={5}
						disabled={!config.enabled}
						className="w-full"
					/>
				</div>
			</div>
		</div>
	);
}
