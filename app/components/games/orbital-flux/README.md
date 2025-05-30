# Based Arena

## Games

### Orbital Flux

Orbital Flux is a real-time strategy simulation where two teams (black and white) compete for territorial control. Orbs bounce around the arena, converting opposing territory blocks on collision. The game features power-ups, configurable parameters, and a modular architecture for easy customization.

#### Features

##### Core Gameplay
- **Territorial Control**: Teams compete to control grid blocks
- **Physics Simulation**: Orbs with realistic collision detection and boundary bouncing
- **Win Conditions**: Configurable percentage threshold or total domination

##### Perks
- **Extra Orb**: Spawn temporary additional orbs (10s)
- **Unbreakable**: Make territory blocks immune to conversion (15s)
- **Speed Boost**: Double orb movement speed (15s)
- **Freeze Opponent**: Freeze enemy orbs (5s)
- **Chaos**: Randomize all orb directions (6s)

##### Customization
- **Grid Size**: 20×20 to 60×60 blocks
- **Orb Speed**: 1-50 units per frame
- **Win Threshold**: 60-99% territory control
- **Block Size**: 8-20 pixels
- **Perk Durations**: Fully configurable

#### Usage

##### Basic Usage

```tsx
import { OrbitalFlux } from '~/components/games/orbital-flux';

export default function GamePage() {
  return <OrbitalFlux />;
}
```

##### Advanced Configuration

```tsx
import { OrbitalFlux } from '~/components/games/orbital-flux';
import type { GameConfig, PowerUpConfig } from '~/components/games/orbital-flux';

const customConfig: Partial<GameConfig> = {
  gridWidth: 40,
  gridHeight: 40,
  orbSpeed: 15,
  winThreshold: 75,
  blockSize: 10,
};

const customPerks: Partial<PerkConfig> = {
  extraOrbDuration: 15000, // 15 seconds
  speedBoostDuration: 12000, // 12 seconds
  freezeDuration: 8000, // 8 seconds
};

export default function CustomGamePage() {
  return (
    <OrbitalFlux
      initialConfig={customConfig}
      initialPerkConfig={customPerks}
      enablePerks={true}
      enableConfigControls={false} // Hide config panel
      showStats={true}
      onGameStart={() => console.log('Game started!')}
      onWinner={(winner) => console.log(`Winner: ${winner}`)}
      onTerritoryChange={(stats) => console.log('Territory changed:', stats)}
    />
  );
}
```

##### Minimal Configuration

```tsx
import { OrbitalFlux } from '~/components/games/orbital-flux';

export default function MinimalGamePage() {
  return (
    <OrbitalFlux
      enablePerks={false}
      enableConfigControls={false}
      showStats={false}
      initialConfig={{ gridWidth: 30, gridHeight: 30 }}
    />
  );
}
```

#### Props API

##### OrbitalFluxProps

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialConfig` | `Partial<GameConfig>` | `{}` | Initial game configuration |
| `initialPerkConfig` | `Partial<PerkConfig>` | `{}` | Initial perk durations |
| `enablePerks` | `boolean` | `true` | Show perk controls |
| `enableConfigControls` | `boolean` | `true` | Show configuration panel |
| `showStats` | `boolean` | `true` | Show statistics panel |
| `onGameStart` | `() => void` | `undefined` | Called when game starts |
| `onGameStop` | `() => void` | `undefined` | Called when game stops |
| `onGameReset` | `() => void` | `undefined` | Called when game resets |
| `onWinner` | `(winner: string) => void` | `undefined` | Called when game ends |
| `onTerritoryChange` | `(stats: GameStats) => void` | `undefined` | Called on territory changes |

##### GameConfig

| Property | Type | Default | Range | Description |
|----------|------|---------|-------|-------------|
| `gridWidth` | `number` | `50` | 20-60 | Grid width in blocks |
| `gridHeight` | `number` | `50` | 20-60 | Grid height in blocks |
| `orbSpeed` | `number` | `20` | 1-50 | Orb movement speed |
| `winThreshold` | `number` | `90` | 60-99 | Win percentage threshold |
| `blockSize` | `number` | `12` | 8-20 | Block size in pixels |

##### PerkConfig

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `extraOrbDuration` | `number` | `10000` | Extra orb duration (ms) |
| `unbreakableDuration` | `number` | `15000` | Unbreakable effect duration (ms) |
| `speedBoostDuration` | `number` | `15000` | Speed boost duration (ms) |
| `freezeDuration` | `number` | `5000` | Freeze effect duration (ms) |
| `chaosModeDuration` | `number` | `6000` | Chaos mode duration (ms) |

#### Game Mechanics

##### Collision Detection
- **Ray-casting**: Prevents orbs from "tunneling" through blocks at high speeds
- **Precise Reflection**: Calculates exact collision points and reflection angles
- **Boundary Handling**: Orbs bounce off arena walls with proper physics

##### Territory Conversion
- Orbs convert opposing territory blocks on collision
- Unbreakable effect prevents block conversion
- Real-time territory percentage calculation

##### Perk System
- Team-specific perks with visual indicators
- Temporary effects with countdown timers
- Chaos mode affects all orbs regardless of team

##### Visual Effects
- **Theme Support**: Automatic dark/light mode adaptation
- **Effect Indicators**: Colored outlines show active effects
- **Smooth Animations**: 60fps canvas rendering with optimized performance

#### Performance Considerations

- **Efficient Collision Detection**: Optimized ray-casting algorithm
- **Memory Management**: Automatic cleanup of expired effects and temporary orbs
- **Canvas Optimization**: Minimal redraws and efficient rendering
- **State Management**: Immutable state updates for predictable behavior

#### Extensibility

The modular architecture makes it easy to:

- Add new perk types in `PerkPanel.tsx`
- Implement custom rendering effects in `GameCanvas.tsx`
- Create new game modes by extending the configuration
- Add multiplayer support through the callback system
- Integrate with external state management (Redux, Zustand, etc.)

#### Development

##### Adding New Perks

1. Add the effect type to `types.ts`:
```tsx
export type EffectType = 
  | 'extra-orb' 
  | 'unbreakable' 
  | 'speed-boost' 
  | 'freeze-enemy' 
  | 'chaos';
```

2. Update the duration configuration in `constants.ts`
3. Implement the effect logic in `useGameState.ts`
4. Add visual indicators in `GameCanvas.tsx`
5. Add UI controls in `PerkPanel.tsx`

##### Customizing Rendering

The `GameCanvas` component can be extended to add:
- Particle effects
- Trail rendering for orbs
- Custom block textures
- Animated backgrounds
- Score overlays

##### Performance Monitoring

Use the callback props to monitor game performance:
```tsx
<OrbitalFlux
  onTerritoryChange={(stats) => {
    // Monitor territory changes
    analytics.track('territory_change', stats);
  }}
  onWinner={(winner) => {
    // Track game completion
    analytics.track('game_complete', { winner });
  }}
/>
```

#### Browser Compatibility

- **Modern Browsers**: Chrome 80+, Firefox 75+, Safari 13+, Edge 80+
- **Canvas Support**: Requires HTML5 Canvas and requestAnimationFrame
- **Performance**: Optimized for 60fps on devices with dedicated graphics

#### License

This component is part of the based-market project and follows the same licensing terms. 