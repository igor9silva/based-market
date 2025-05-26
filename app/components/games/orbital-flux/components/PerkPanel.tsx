import { usePaymentMutations } from '~/hooks/usePayment';
import type { ActiveEffect, Color, EffectType } from '../types';

interface PerkPanelProps {
	isRunning: boolean;
	activeEffects: ActiveEffect[];
	hasActiveEffect: (effectType: string, side: string) => boolean;
	canActivateEffect: (effectType: EffectType, side: Color) => boolean;
	countActiveEffects: (side: string) => number;
	onActivateEffect: (effectType: EffectType, side: Color) => void;
}

export function PerkPanel({
	isRunning,
	activeEffects,
	hasActiveEffect,
	canActivateEffect,
	countActiveEffects,
	onActivateEffect,
}: PerkPanelProps) {
	//
	const { purchasePerk } = usePaymentMutations();

	const handlePurchasePerk = async (effectType: EffectType, teamColor: Color) => {
		//
		const productKey = `orbital-flux ${teamColor} ${effectType}`;
		await purchasePerk({ product: productKey as any });
	};

	const handlePurchaseChaos = async () => {
		//
		await purchasePerk({ product: 'orbital-flux neutral chaos' });
	};

	return (
		<div className="bg-card border border-border rounded-lg">
			<div className="p-4">
				<h2 className="text-lg font-bold text-card-foreground">Perks</h2>
			</div>
			<div className="p-4">
				{/* white team perks */}
				<TeamPerks
					teamName="White"
					teamColor="white"
					isRunning={isRunning}
					hasActiveEffect={hasActiveEffect}
					canActivateEffect={canActivateEffect}
					countActiveEffects={countActiveEffects}
					onActivateEffect={onActivateEffect}
					onPurchasePerk={handlePurchasePerk}
				/>

				{/* black team perks */}
				<TeamPerks
					teamName="Black"
					teamColor="black"
					isRunning={isRunning}
					hasActiveEffect={hasActiveEffect}
					canActivateEffect={canActivateEffect}
					countActiveEffects={countActiveEffects}
					onActivateEffect={onActivateEffect}
					onPurchasePerk={handlePurchasePerk}
				/>

				{/* chaos mode section */}
				<div className="space-y-2">
					<h4 className="font-semibold text-sm text-muted-foreground">Chaos</h4>
					<button
						onClick={handlePurchaseChaos}
						className="w-full px-3 py-2 text-sm bg-destructive hover:bg-destructive/80 text-destructive-foreground border border-border rounded transition-colors"
					>
						🌪️ CHAOS 🌪️ (6s)
					</button>
				</div>

				{/* active effects display */}
				{activeEffects.length > 0 && <ActiveEffectsDisplay activeEffects={activeEffects} />}
			</div>
		</div>
	);
}

interface TeamPerksProps {
	teamName: string;
	teamColor: Color;
	isRunning: boolean;
	hasActiveEffect: (effectType: string, side: string) => boolean;
	canActivateEffect: (effectType: EffectType, side: Color) => boolean;
	countActiveEffects: (side: string) => number;
	onActivateEffect: (effectType: EffectType, side: Color) => void;
	onPurchasePerk: (effectType: EffectType, teamColor: Color) => Promise<void>;
}

function TeamPerks({
	teamName,
	teamColor,
	isRunning,
	hasActiveEffect,
	canActivateEffect,
	countActiveEffects,
	onActivateEffect,
	onPurchasePerk,
}: TeamPerksProps) {
	//
	const perks = [
		{ type: 'extra-orb' as EffectType, label: 'Extra Orb (10s)' },
		{ type: 'unbreakable' as EffectType, label: 'Unbreakable (10s)' },
		{ type: 'speed-boost' as EffectType, label: 'Speed Boost (8s)' },
		{
			type: 'freeze-enemy' as EffectType,
			label: `Freeze ${teamColor === 'white' ? 'Black' : 'White'} (5s)`,
		},
	];

	const effectCount = countActiveEffects(teamColor);
	const chaosCount = countActiveEffects('neutral');
	const totalEffects = effectCount + chaosCount;

	return (
		<div className="space-y-2">
			<h4 className="font-semibold text-sm text-muted-foreground">
				{teamName} Team ({totalEffects}/5)
			</h4>
			<div className="grid grid-cols-1 gap-2">
				{perks.map((perk) => (
					<button
						key={perk.type}
						onClick={() => onPurchasePerk(perk.type, teamColor)}
						className="px-3 py-2 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded transition-colors"
					>
						{perk.label}
					</button>
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
		<div className="mt-4 p-3 bg-accent border border-border rounded-lg">
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
