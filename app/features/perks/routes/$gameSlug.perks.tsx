import { createFileRoute, useParams } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { useQuery } from 'convex/react';
// productSchema is now z.string(), expecting "{gameSlug}:{side}:{perkType}"
import { productSchema } from 'convex/schemas/paymentSchema';
// Constants and types from Orbital Flux are used here.
// For other games, these would need to be made generic or loaded dynamically.
import { DEFAULT_PERK_CONFIG } from '~/../../packages/orbital-flux/constants';
import type {
	Color,
	EffectType,
	PerkConfig,
} from '~/../../packages/orbital-flux/types';
import { Loading } from '~/../../components/Loading';
import { usePaymentMutations } from '~/../../hooks/usePayment';

/**
 * Route for displaying and purchasing perks for a specific live game.
 * The `gameSlug` parameter in the URL determines for which game the perks are shown.
 */
export const Route = createFileRoute('/games/$gameSlug/perks')({
	component: RouteComponent,
});

// Defines the structure for perk display information.
// Currently specific to Orbital Flux perk types.
interface PerkDefinition {
	type: EffectType;
	label: string;
}

/**
 * Converts milliseconds to seconds for display.
 */
function formatDuration(milliseconds: number): number {
	return Math.round(milliseconds / 1000);
}

/**
 * Generates perk definitions with dynamic durations.
 * This function is currently specific to Orbital Flux perks.
 * For other games, this would need to be adapted or made more generic.
 */
function createPerkDefinitions(
	perkConfig: PerkConfig, // PerkConfig is Orbital Flux specific
	teamColor: Color,
): PerkDefinition[] {
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
	// Get the gameSlug from the URL (e.g., "orbital-flux")
	const { gameSlug } = useParams({ from: '/games/$gameSlug/perks' });
	// Get the current live game (could be any game kind)
	const currentGame = useQuery(api.games.public.getCurrentLiveGame);
	const { purchasePerk } = usePaymentMutations(); // Hook for initiating perk purchases

	/**
	 * Handles purchasing a team-specific perk.
	 * The product string is constructed using the gameSlug, teamColor, and effectType.
	 */
	const handlePurchasePerk = async (
		effectType: EffectType, // EffectType is Orbital Flux specific
		teamColor: Color,
	) => {
		if (!currentGame) return;

		// Construct the product string, e.g., "orbital-flux:white:extra-orb"
		// This structured string is sent to the backend.
		await purchasePerk({
			product: `${gameSlug}:${teamColor}:${effectType}`,
			gameId: currentGame._id,
		});
	};

	/**
	 * Handles purchasing a neutral perk (chaos mode for Orbital Flux).
	 * The product string includes "neutral" as the side.
	 */
	const handlePurchaseChaos = async () => {
		if (!currentGame) return;

		// Construct the product string for chaos, e.g., "orbital-flux:neutral:chaos"
		await purchasePerk({
			product: `${gameSlug}:neutral:chaos`,
			gameId: currentGame._id,
		});
	};

  // show loading state
  if (currentGame === undefined) {
    return <Loading />
  }

  // show no live game state
  if (currentGame === null) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <p className="text-muted-foreground">
            There's no game currently running live.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* header */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold">Purchase Perks</h1>
            <p className="text-muted-foreground">
              Purchase perks for the live game{' '}
              <span className="font-mono">{currentGame._id}</span>.
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
              onPurchasePerk={handlePurchasePerk}
            />

            {/* black team perks */}
            <TeamPerksSection
              teamName="Black"
              teamColor="black"
              perkConfig={DEFAULT_PERK_CONFIG}
              onPurchasePerk={handlePurchasePerk}
            />

            {/* chaos mode section */}
            <ChaosSection
              perkConfig={DEFAULT_PERK_CONFIG}
              onPurchaseChaos={handlePurchaseChaos}
            />
          </div>
        </div>
      </div>
    </div>
  )
}

interface TeamPerksSectionProps {
  teamName: string
  teamColor: Color
  perkConfig: PerkConfig
  onPurchasePerk: (effectType: EffectType, teamColor: Color) => Promise<void>
}

function TeamPerksSection({
  teamName,
  teamColor,
  perkConfig,
  onPurchasePerk,
}: TeamPerksSectionProps) {
  //
  const perks = createPerkDefinitions(perkConfig, teamColor)
  const teamBg = teamColor === 'white' ? 'bg-white' : 'bg-black'

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      <div className="flex items-center gap-3 mb-4">
        <div
          className={`w-6 h-6 rounded-full ${teamBg} border-2 border-border`}
        ></div>
        <h2 className="text-xl font-bold">{teamName} Team Perks</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {perks.map((perk) => (
          <button
            key={perk.type}
            onClick={() => onPurchasePerk(perk.type, teamColor)}
            className="px-4 py-3 text-sm bg-secondary hover:bg-secondary/80 text-secondary-foreground border border-border rounded-lg transition-colors text-left"
          >
            <div className="font-medium">{perk.label}</div>
            <div className="text-xs text-muted-foreground mt-1">$0.10 USD</div>
          </button>
        ))}
      </div>
    </div>
  )
}

interface ChaosSectionProps {
  perkConfig: PerkConfig
  onPurchaseChaos: () => Promise<void>
}

function ChaosSection({ perkConfig, onPurchaseChaos }: ChaosSectionProps) {
  //
  const chaosDuration = formatDuration(perkConfig.chaosModeDuration)

  return (
    <div className="bg-card border border-border rounded-lg p-6">
      {/* <div className="flex items-center gap-3 mb-4">
				<div className="w-6 h-6 rounded-full bg-gradient-to-r from-red-500 to-purple-500 border-2 border-border"></div>
				<h2 className="text-xl font-bold">Chaos Mode</h2>
			</div> */}

      <button
        onClick={onPurchaseChaos}
        className="w-full px-4 py-3 text-sm bg-destructive hover:bg-destructive/80 text-destructive-foreground border border-border rounded-lg transition-colors"
      >
        <div className="font-medium">🌪️ CHAOS 🌪️ ({chaosDuration}s)</div>
        <div className="text-xs text-destructive-foreground/80 mt-1">
          $0.10 USD • Affects both teams
        </div>
      </button>
    </div>
  )
}
