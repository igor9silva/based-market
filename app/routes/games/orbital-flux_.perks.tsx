import { createFileRoute } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
import { productSchema } from 'convex/schemas/paymentSchema';
import { useEffect } from 'react';
import { DEFAULT_PERK_CONFIG } from '~/components/games/orbital-flux/constants';
import type { Color, EffectType, PerkConfig } from '~/components/games/orbital-flux/types';
import { Loading } from '~/components/Loading';
import { useTwoStepPayment } from '~/hooks/usePayment';

export const Route = createFileRoute('/games/orbital-flux_/perks')({
	component: RouteComponent,
});

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

function RouteComponent() {
	//
	// get the current live game
	const currentGame = useQuery(api.games.public.getCurrentLiveGame);
	const { initiatePurchase, resetPayment, resetAllPayments, getPaymentState } = useTwoStepPayment();

	// reset all payment states when there's no active game
	useEffect(() => {
		//
		if (currentGame === null) {
			resetAllPayments();
		}
	}, [currentGame, resetAllPayments]);

	const handleInitiatePerk = async (effectType: EffectType, teamColor: Color) => {
		//
		if (!currentGame) return;

		const key = `${teamColor}-${effectType}`;
		const product = productSchema.parse(`orbital-flux ${teamColor} ${effectType}`);

		await initiatePurchase(key, product, currentGame._id);
	};

	const handleInitiateChaos = async () => {
		//
		if (!currentGame) return;

		const key = 'neutral-chaos';
		await initiatePurchase(key, 'orbital-flux neutral chaos', currentGame._id);
	};

	// show loading state
	if (currentGame === undefined) {
		return <Loading />;
	}

	// show no live game state
	if (currentGame === null) {
		return (
			<div className="min-h-screen bg-background flex items-center justify-center">
				<div className="text-center space-y-4">
					<p className="text-muted-foreground">There's no game currently running live.</p>
				</div>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-background">
			{/* header */}
			<div className="border-b border-border bg-card">
				<div className="container mx-auto px-4 py-6">
					<div className="text-center space-y-2">
						<h1 className="text-3xl font-bold">Purchase Perks</h1>
						<p className="text-muted-foreground">
							Purchase perks for the live game <span className="font-mono">{currentGame._id}</span>.
						</p>
					</div>
				</div>
			</div>

			{/* perks */}
			<div className="container mx-auto px-4 py-8">
				<div className="max-w-2xl mx-auto">
					<div className="grid gap-6">
						{/* white team perks */}
						<TeamPerksSection
							teamName="White"
							teamColor="white"
							perkConfig={DEFAULT_PERK_CONFIG}
							onInitiatePerk={handleInitiatePerk}
							getPaymentState={getPaymentState}
							resetPayment={resetPayment}
						/>

						{/* black team perks */}
						<TeamPerksSection
							teamName="Black"
							teamColor="black"
							perkConfig={DEFAULT_PERK_CONFIG}
							onInitiatePerk={handleInitiatePerk}
							getPaymentState={getPaymentState}
							resetPayment={resetPayment}
						/>

						{/* chaos mode section */}
						<ChaosSection
							perkConfig={DEFAULT_PERK_CONFIG}
							onInitiateChaos={handleInitiateChaos}
							getPaymentState={getPaymentState}
							resetPayment={resetPayment}
						/>
					</div>
				</div>
			</div>
		</div>
	);
}

interface TeamPerksSectionProps {
	teamName: string;
	teamColor: Color;
	perkConfig: PerkConfig;
	onInitiatePerk: (effectType: EffectType, teamColor: Color) => Promise<void>;
	getPaymentState: (key: string) => { status: 'idle' | 'processing' | 'ready'; url?: string; error?: string };
	resetPayment: (key: string) => void;
}

function TeamPerksSection({
	teamName,
	teamColor,
	perkConfig,
	onInitiatePerk,
	getPaymentState,
	resetPayment,
}: TeamPerksSectionProps) {
	//
	const perks = createPerkDefinitions(perkConfig, teamColor);
	const teamBg = teamColor === 'white' ? 'bg-white' : 'bg-black';

	return (
		<div className="bg-card border border-border rounded-lg p-6">
			<div className="flex items-center gap-3 mb-4">
				<div className={`w-6 h-6 rounded-full ${teamBg} border-2 border-border`}></div>
				<h2 className="text-xl font-bold">{teamName} Team Perks</h2>
			</div>

			<div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
				{perks.map((perk) => {
					//
					const key = `${teamColor}-${perk.type}`;
					const paymentState = getPaymentState(key);

					return (
						<PerkButton
							key={perk.type}
							perk={perk}
							paymentState={paymentState}
							onInitiate={() => onInitiatePerk(perk.type, teamColor)}
							onReset={() => resetPayment(key)}
						/>
					);
				})}
			</div>
		</div>
	);
}

interface ChaosSectionProps {
	perkConfig: PerkConfig;
	onInitiateChaos: () => Promise<void>;
	getPaymentState: (key: string) => { status: 'idle' | 'processing' | 'ready'; url?: string; error?: string };
	resetPayment: (key: string) => void;
}

function ChaosSection({ perkConfig, onInitiateChaos, getPaymentState, resetPayment }: ChaosSectionProps) {
	//
	const chaosDuration = formatDuration(perkConfig.chaosModeDuration);
	const key = 'neutral-chaos';
	const paymentState = getPaymentState(key);

	return (
		<div className="bg-card border border-border rounded-lg p-6">
			<PerkButton
				perk={{
					type: 'chaos',
					label: `🌪️ CHAOS 🌪️ (${chaosDuration}s)`,
				}}
				paymentState={paymentState}
				onInitiate={onInitiateChaos}
				onReset={() => resetPayment(key)}
				variant="destructive"
				description="Affects both teams"
			/>
		</div>
	);
}

interface PerkButtonProps {
	perk: PerkDefinition;
	paymentState: { status: 'idle' | 'processing' | 'ready'; url?: string; error?: string };
	onInitiate: () => Promise<void>;
	onReset: () => void;
	variant?: 'default' | 'destructive';
	description?: string;
}

function PerkButton({ perk, paymentState, onInitiate, onReset, variant = 'default', description }: PerkButtonProps) {
	//
	const isFullWidth = variant === 'destructive';

	// render different states
	if (paymentState.status === 'processing') {
		return (
			<div
				className={`px-4 py-3 text-sm bg-muted text-muted-foreground border border-border rounded-lg ${isFullWidth ? 'w-full' : ''}`}
			>
				<div className="flex items-center gap-2">
					<div className="w-4 h-4 border-2 border-muted-foreground/30 border-t-muted-foreground rounded-full animate-spin"></div>
					<span className="font-medium">Processing...</span>
				</div>
				<div className="text-xs mt-1">Creating payment link</div>
			</div>
		);
	}

	if (paymentState.status === 'ready' && paymentState.url) {
		return (
			<div className={`flex gap-2 ${isFullWidth ? 'w-full' : ''}`}>
				<a
					href={paymentState.url}
					target="_blank"
					rel="noopener noreferrer"
					className={`flex-1 px-4 py-3 text-sm font-medium text-center rounded-lg transition-colors ${
						variant === 'destructive'
							? 'bg-destructive hover:bg-destructive/90 text-destructive-foreground'
							: 'bg-primary hover:bg-primary/90 text-primary-foreground'
					}`}
				>
					<div className="font-medium">CLICK TO PAY</div>
					<div
						className={`text-xs mt-1 ${
							variant === 'destructive' ? 'text-destructive-foreground/80' : 'text-primary-foreground/80'
						}`}
					>
						{perk.label} • $0.10 USD{description ? ` • ${description}` : ''}
					</div>
				</a>
				<button
					onClick={onReset}
					className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					✕
				</button>
			</div>
		);
	}

	if (paymentState.error) {
		return (
			<div className={`flex gap-2 ${isFullWidth ? 'w-full' : ''}`}>
				<div className="flex-1 px-4 py-3 text-sm bg-destructive/10 text-destructive border border-destructive/20 rounded-lg">
					<div className="font-medium">Error</div>
					<div className="text-xs mt-1">{paymentState.error}</div>
				</div>
				<button
					onClick={onReset}
					className="px-2 py-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
				>
					↻
				</button>
			</div>
		);
	}

	// default idle state
	return (
		<button
			onClick={onInitiate}
			className={`px-4 py-3 text-sm transition-colors text-left ${isFullWidth ? 'w-full' : ''} ${
				variant === 'destructive'
					? 'bg-destructive hover:bg-destructive/80 text-destructive-foreground border border-border rounded-lg'
					: 'bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-lg'
			}`}
		>
			<div className="font-medium">{perk.label}</div>
			<div
				className={`text-xs mt-1 ${
					variant === 'destructive' ? 'text-destructive-foreground/80' : 'text-muted-foreground'
				}`}
			>
				$0.10 USD{description ? ` • ${description}` : ''}
			</div>
		</button>
	);
}
