import type { Id } from 'convex/_generated/dataModel';

export interface GameConfig {
	[key: string]: any;
}

export interface GameMetadata {
	id: string;
	name: string;
	description: string;
	slug: string;
	isActive: boolean;
	maxLiveGames: number;
}

export interface GameDefinition<TConfig extends GameConfig = GameConfig> {
	metadata: GameMetadata;
	components: {
		GameComponent: any;
		ConfigPanel: any;
		PerksPanel?: any;
	};
	defaultConfig: TConfig;
	validateConfig: (config: unknown) => TConfig;
}

export interface GameComponentProps<TConfig extends GameConfig> {
	gameId: Id<'games'>;
	config: TConfig;
	mode: 'lobby' | 'playing' | 'live';
	enablePerks?: boolean;
	showStats?: boolean;
	autoStart?: boolean;
	customStatsBar?: any;
	customRightPanel?: any;
	showSidebarToggle?: boolean;
	hideGameControls?: boolean;
	onGameStart?: () => void;
	onGameStop?: () => void;
	onGameReset?: () => void;
	onWinner?: (winner: string) => void;
	onGameStateChange?: (gameState: any) => void;
}

export interface ConfigPanelProps<TConfig extends GameConfig> {
	config: TConfig;
	isRunning: boolean;
	onConfigChange: (config: TConfig) => void;
}

export interface PerksPanelProps {
	gameId: Id<'games'>;
}

class GameRegistry {
	//
	private games = new Map<string, GameDefinition>();

	/**
	 * registers a new game in the system
	 */
	register<TConfig extends GameConfig>(definition: GameDefinition<TConfig>): void {
		//
		this.games.set(definition.metadata.slug, definition);
	}

	/**
	 * gets a game definition by slug
	 */
	getGame(slug: string): GameDefinition | undefined {
		//
		return this.games.get(slug);
	}

	/**
	 * gets all registered games
	 */
	getAllGames(): GameDefinition[] {
		//
		return Array.from(this.games.values());
	}

	/**
	 * gets all active games
	 */
	getActiveGames(): GameDefinition[] {
		//
		return this.getAllGames().filter((game) => game.metadata.isActive);
	}

	/**
	 * checks if a game slug exists
	 */
	hasGame(slug: string): boolean {
		//
		return this.games.has(slug);
	}
}

// singleton instance
export const gameRegistry = new GameRegistry();