import { createFileRoute } from '@tanstack/react-router'
import { api } from 'convex/_generated/api'
import { useQuery } from 'convex/react'
import { productSchema } from 'convex/schemas/paymentSchema'
import { DEFAULT_PERK_CONFIG } from '~/components/games/orbital-flux/constants'
import type {
  Color,
  EffectType,
  PerkConfig,
} from '~/components/games/orbital-flux/types'
import { Loading } from '~/components/Loading'
import { usePaymentMutations } from '~/hooks/usePayment'

export const Route = createFileRoute('/games/orbital-flux_/perks')({
  component: RouteComponent,
})

interface PerkDefinition {
  type: EffectType
  label: string
}

/**
 * converts milliseconds to seconds for display
 */
function formatDuration(milliseconds: number): number {
  //
  return Math.round(milliseconds / 1000)
}

/**
 * generates perk definitions with dynamic durations
 */
function createPerkDefinitions(
  perkConfig: PerkConfig,
  teamColor: Color,
): PerkDefinition[] {
  //
  const enemyTeam = teamColor === 'white' ? 'Black' : 'White'

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
  ]
}

function RouteComponent() {
  //
  // get the current live game
  const currentGame = useQuery(api.games.public.getCurrentLiveGame)
  const { purchasePerk } = usePaymentMutations()

  const handlePurchasePerk = async (
    effectType: EffectType,
    teamColor: Color,
  ) => {
    //
    if (!currentGame) return

    await purchasePerk({
      product: productSchema.parse(`orbital-flux ${teamColor} ${effectType}`),
      gameId: currentGame._id,
    })
  }

  const handlePurchaseChaos = async () => {
    //
    if (!currentGame) return

    await purchasePerk({
      product: 'orbital-flux neutral chaos',
      gameId: currentGame._id,
    })
  }

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
