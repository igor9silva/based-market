import { Id } from 'convex/_generated/dataModel';
import { productSchema } from 'convex/schemas/paymentSchema';
import { usePaymentMutations } from '~/hooks/usePayment';
import type { ActiveEffect, Color, EffectType, PerkConfig } from '../types';

interface PerkPanelProps {
	gameId: Id<'games'>;
	isRunning: boolean;
	activeEffects: ActiveEffect[];
	hasActiveEffect: (effectType: string, side: string) => boolean;
	canActivateEffect: (effectType: EffectType, side: Color) => boolean;
	countActiveEffects: (side: string) => number;
	onActivateEffect: (effectType: EffectType, side: Color) => void;
	perkConfig: PerkConfig;
}

interface PerkDefinition {
	type: EffectType;
	label: string;
}

/**
 * converts milliseconds to seconds for display
 */
function formatDuration(milliseconds: number): number {
	//
	return Math.round(milliseconds / 1000);
}

/**
 * generates perk definitions with dynamic durations
 */
function createPerkDefinitions(perkConfig: PerkConfig, teamColor: Color): PerkDefinition[] {
	//
	const enemyTeam = teamColor === 'white' ? 'Black' : 'White';

	return [
		{
			type: 'extra-orb',
			label: `Extra Orb (${formatDuration(perkConfig.extraOrbDuration)}s)`,
		},
		{
			type: 'unbreakable',
			label: `Unbreakable (${formatDuration(perkConfig.unbreakableDuration)}s)`,
		},
		{
			type: 'speed-boost',
			label: `Speed Boost (${formatDuration(perkConfig.speedBoostDuration)}s)`,
		},
		{
			type: 'freeze-enemy',
			label: `Freeze ${enemyTeam} (${formatDuration(perkConfig.freezeDuration)}s)`,
		},
	];
}

/**
 * calculates total active effects for a team including chaos effects
 */
function calculateTotalEffects(teamColor: Color, countActiveEffects: (side: string) => number): number {
	//
	const teamEffects = countActiveEffects(teamColor);
	const chaosEffects = countActiveEffects('neutral');
	return teamEffects + chaosEffects;
}

export function PerkPanel({
	gameId,
	isRunning,
	activeEffects,
	hasActiveEffect,
	canActivateEffect,
	countActiveEffects,
	onActivateEffect,
	perkConfig,
}: PerkPanelProps) {
	//
	const { purchasePerk } = usePaymentMutations();

	const handlePurchasePerk = async (effectType: EffectType, teamColor: Color) => {
		//
		await purchasePerk({
			product: productSchema.parse(`orbital-flux ${teamColor} ${effectType}`),
			gameId,
		});
	};

	const handlePurchaseChaos = async () => {
		//
		await purchasePerk({ product: 'orbital-flux neutral chaos', gameId });
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
					perkConfig={perkConfig}
					countActiveEffects={countActiveEffects}
					onPurchasePerk={handlePurchasePerk}
				/>

				{/* black team perks */}
				<TeamPerks
					teamName="Black"
					teamColor="black"
					perkConfig={perkConfig}
					countActiveEffects={countActiveEffects}
					onPurchasePerk={handlePurchasePerk}
				/>

				{/* chaos mode section */}
				<ChaosSection perkConfig={perkConfig} onPurchaseChaos={handlePurchaseChaos} />

				{/* active effects display */}
				{activeEffects.length > 0 && <ActiveEffectsDisplay activeEffects={activeEffects} />}
			</div>
		</div>
	);
}

interface TeamPerksProps {
	teamName: string;
	teamColor: Color;
	perkConfig: PerkConfig;
	countActiveEffects: (side: string) => number;
	onPurchasePerk: (effectType: EffectType, teamColor: Color) => Promise<void>;
}

function TeamPerks({ teamName, teamColor, perkConfig, countActiveEffects, onPurchasePerk }: TeamPerksProps) {
	//
	const perks = createPerkDefinitions(perkConfig, teamColor);
	const totalEffects = calculateTotalEffects(teamColor, countActiveEffects);

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

interface ChaosSectionProps {
	perkConfig: PerkConfig;
	onPurchaseChaos: () => Promise<void>;
}

function ChaosSection({ perkConfig, onPurchaseChaos }: ChaosSectionProps) {
	//
	const chaosDuration = formatDuration(perkConfig.chaosModeDuration);

	return (
		<div className="space-y-2">
			<h4 className="font-semibold text-sm text-muted-foreground">Chaos</h4>
			<button
				onClick={onPurchaseChaos}
				className="w-full px-3 py-2 text-sm bg-destructive hover:bg-destructive/80 text-destructive-foreground border border-border rounded transition-colors"
			>
				🌪️ CHAOS 🌪️ ({chaosDuration}s)
			</button>
		</div>
	);
}

interface ActiveEffectsDisplayProps {
	activeEffects: ActiveEffect[];
}

function ActiveEffectsDisplay({ activeEffects }: ActiveEffectsDisplayProps) {
	//
	const formatEffectName = (type: string): string => {
		//
		return type.replace('-', ' ').toUpperCase();
	};

	const formatTimeLeft = (endTime: number): number => {
		//
		return Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
	};

	const formatTeamPrefix = (side: string): string => {
		//
		return side !== 'neutral' ? `${side.toUpperCase()}: ` : '';
	};

	return (
		<div className="mt-4 p-3 bg-accent border border-border rounded-lg">
			<h5 className="font-semibold text-sm mb-2 text-accent-foreground">Active Effects:</h5>
			{activeEffects.map((effect) => {
				//
				const timeLeft = formatTimeLeft(effect.endTime);
				const displayName = formatEffectName(effect.type);
				const teamPrefix = formatTeamPrefix(effect.side);

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
