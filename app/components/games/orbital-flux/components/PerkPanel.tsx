import { Button } from '~/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '~/components/ui/card';
import type { ActiveEffect, Color, EffectType } from '../types';

interface PerkPanelProps {
	isRunning: boolean;
	activeEffects: ActiveEffect[];
	hasActiveEffect: (effectType: string, side: string) => boolean;
	onActivateEffect: (effectType: EffectType, side: Color) => void;
}

export function PerkPanel({ isRunning, activeEffects, hasActiveEffect, onActivateEffect }: PerkPanelProps) {
	//
	return (
		<Card>
			<CardHeader>
				<CardTitle>Perk Actions</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				{/* white team perks */}
				<TeamPerks
					teamName="White"
					teamColor="white"
					isRunning={isRunning}
					hasActiveEffect={hasActiveEffect}
					onActivateEffect={onActivateEffect}
				/>

				{/* black team perks */}
				<TeamPerks
					teamName="Black"
					teamColor="black"
					isRunning={isRunning}
					hasActiveEffect={hasActiveEffect}
					onActivateEffect={onActivateEffect}
				/>

				{/* neutral chaos mode */}
				<Button
					onClick={() => onActivateEffect('chaos-mode', 'neutral')}
					disabled={!isRunning || hasActiveEffect('chaos-mode', 'neutral')}
					size="sm"
					variant="destructive"
					className="w-full"
				>
					🌪️ Chaos Mode (6s)
				</Button>

				{/* active effects display */}
				{activeEffects.length > 0 && <ActiveEffectsDisplay activeEffects={activeEffects} />}
			</CardContent>
		</Card>
	);
}

interface TeamPerksProps {
	teamName: string;
	teamColor: Color;
	isRunning: boolean;
	hasActiveEffect: (effectType: string, side: string) => boolean;
	onActivateEffect: (effectType: EffectType, side: Color) => void;
}

function TeamPerks({ teamName, teamColor, isRunning, hasActiveEffect, onActivateEffect }: TeamPerksProps) {
	//
	const perks = [
		{ type: 'extra-orb' as EffectType, label: 'Extra Orb (10s)' },
		{ type: 'unbreakable' as EffectType, label: 'Unbreakable (10s)' },
		{ type: 'speed-boost' as EffectType, label: 'Speed Boost (8s)' },
		{
			type: 'freeze-opponent' as EffectType,
			label: `Freeze ${teamColor === 'white' ? 'Black' : 'White'} (5s)`,
		},
	];

	return (
		<div className="space-y-2">
			<h4 className="font-semibold text-sm text-muted-foreground">{teamName} Team</h4>
			<div className="grid grid-cols-1 gap-2">
				{perks.map((perk) => (
					<Button
						key={perk.type}
						onClick={() => onActivateEffect(perk.type, teamColor)}
						disabled={!isRunning || hasActiveEffect(perk.type, teamColor)}
						size="sm"
						variant="outline"
					>
						{perk.label}
					</Button>
				))}
			</div>
		</div>
	);
}

interface ActiveEffectsDisplayProps {
	activeEffects: ActiveEffect[];
}

function ActiveEffectsDisplay({ activeEffects }: ActiveEffectsDisplayProps) {
	//
	return (
		<div className="mt-4 p-3 bg-accent/50 border border-border rounded-lg">
			<h5 className="font-semibold text-sm mb-2 text-accent-foreground">Active Effects:</h5>
			{activeEffects.map((effect) => {
				//
				const timeLeft = Math.max(0, Math.ceil((effect.endTime - Date.now()) / 1000));
				const displayName = effect.type.replace('-', ' ').toUpperCase();
				const teamPrefix = effect.side !== 'neutral' ? `${effect.side.toUpperCase()}: ` : '';

				return (
					<div key={effect.id} className="text-xs text-muted-foreground">
						{teamPrefix}
						{displayName} ({timeLeft}s)
					</div>
				);
			})}
		</div>
	);
}
