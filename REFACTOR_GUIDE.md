# Game System Refactor

This document outlines the refactored architecture for the game livestreaming app.

## Overview

The app has been refactored from hardcoded game-specific routes to a flexible, registry-based system that supports multiple games.

## New Architecture

### Game Registry System (`app/lib/games/`)

- **`GameRegistry.ts`**: Central registry that manages all available games
- **`orbital-flux/OrbitalFluxGameDefinition.ts`**: Orbital Flux game registration
- **`index.ts`**: Bootstraps and exports the configured registry

### New Route Structure

**Before:**
```
/                              -> GamesList
/games/orbital-flux_/          -> Orbital Flux lobby  
/games/orbital-flux_/$id       -> Specific game viewer
/games/orbital-flux_/live      -> Admin live control
/games/orbital-flux_/perks     -> Perks purchasing
```

**After:**
```
/                              -> Redirects to /games
/games/                        -> Lists all available games
/games/$gameSlug/              -> Game lobby (any game)
/games/$gameSlug/$gameId       -> Specific game viewer (any game)
/games/$gameSlug/live          -> Admin live control (any game)
/games/$gameSlug/perks         -> Perks purchasing (any game)
```

### Component Architecture

**Generic Components:**
- `GameLobby.tsx` - Works with any game from registry
- `admin/LiveGameControls.tsx` - Reusable admin controls

**Game-Specific:**
- `orbital-flux/` - Orbital Flux specific components
- Each game gets its own folder under `games/`

## Key Benefits

1. **Scalable**: Easy to add new games
2. **Clean Separation**: Admin, viewing, and purchasing are separate concerns
3. **Type Safety**: Proper TypeScript interfaces throughout
4. **Reusable**: Common functionality shared across games
5. **Maintainable**: Single responsibility principle applied

## Adding a New Game

1. Create game folder: `app/components/games/my-game/`
2. Implement the required interfaces:
   - `GameComponent` - Main game component
   - `ConfigPanel` - Game configuration UI
   - `PerksPanel` - (Optional) Perks purchasing UI
3. Create game definition: `app/lib/games/my-game/MyGameDefinition.ts`
4. Register in `app/lib/games/index.ts`

## Migration Status

The following files have been created/updated:
- ✅ Game registry system
- ✅ New route structure 
- ✅ Generic components
- ✅ Orbital Flux registration
- ⚠️ Old routes still exist (need removal)

## Todo

1. Remove old hardcoded routes:
   - `app/routes/games/orbital-flux_.*.tsx`
2. Update Convex backend if needed
3. Test the new routing system
4. Update any hardcoded links to use new routes

## Usage Examples

### Accessing Orbital Flux:
- Lobby: `/games/orbital-flux`
- Watch game: `/games/orbital-flux/game-id-123`
- Live admin: `/games/orbital-flux/live?password=admin123`
- Buy perks: `/games/orbital-flux/perks`

### URL Configuration:
Live games can be configured via URL:
```
/games/orbital-flux/live?gridWidth=50&orbSpeed=10&password=admin123
```