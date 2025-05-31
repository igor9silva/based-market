import { gameRegistry } from './GameRegistry';
import { orbitalFluxGameDefinition } from './orbital-flux/OrbitalFluxGameDefinition';

// register all available games
gameRegistry.register(orbitalFluxGameDefinition);

// export the configured registry
export { gameRegistry };
export * from './GameRegistry';