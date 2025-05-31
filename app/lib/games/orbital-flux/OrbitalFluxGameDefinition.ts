import { z } from 'zod';
import type { GameDefinition } from '../GameRegistry';
import OrbitalFlux from '~/components/games/orbital-flux/OrbitalFlux';
import { ConfigPanel } from '~/components/games/orbital-flux/components/ConfigPanel';
import { GenericPerksPanel } from '~/components/games/GenericPerksPanel';
import { DEFAULT_GAME_CONFIG } from '~/components/games/orbital-flux/constants';
import type { GameConfig as OrbitalFluxConfig } from '~/components/games/orbital-flux/types';

// orbital flux specific config validation
const orbitalFluxConfigSchema = z.object({
	gridWidth: z.number().min(20).max(100),
	gridHeight: z.number().min(20).max(100),
	orbSpeed: z.number().min(1).max(50),
	winThreshold: z.number().min(51).max(100),
	blockSize: z.number().min(8).max(20),
});

export const orbitalFluxGameDefinition: GameDefinition<OrbitalFluxConfig> = {
	metadata: {
		id: 'orbital-flux',
		name: 'Orbital Flux',
		description: 'Fast-paced territory control game where orbs compete to dominate the grid',
		slug: 'orbital-flux',
		isActive: true,
		maxLiveGames: 1,
	},
	components: {
		GameComponent: OrbitalFlux,
		ConfigPanel: ConfigPanel,
		PerksPanel: GenericPerksPanel,
	},
	defaultConfig: DEFAULT_GAME_CONFIG,
	validateConfig: (config: unknown): OrbitalFluxConfig => {
		//
		return orbitalFluxConfigSchema.parse(config);
	},
};