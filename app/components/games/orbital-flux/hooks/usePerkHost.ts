import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ActiveEffect, EffectType } from '../types';

interface PerkFromBackend {
	id: string;
	type: EffectType;
	side: 'white' | 'black' | 'neutral';
	activatedAt: number;
	duration: number;
	purchaseId: string;
}

export function usePerkHost(gameId: Id<'games'>) {
	//
	const [localActivePerks, setLocalActivePerks] = useState<ActiveEffect[]>([]);
	const [perkTimers, setPerkTimers] = useState<Map<string, ReturnType<typeof setTimeout>>>(new Map());

	// backend queries and mutations
	const backendPerks = useQuery(api.games.public.getActivePerks, { gameId });
	const activatePerkMutation = useMutation(api.games.public.activatePerk);
	const deactivatePerkMutation = useMutation(api.games.public.deactivatePerk);

	/**
	 * converts backend perk format to frontend format
	 */
	const convertBackendPerk = useCallback(
		(perk: PerkFromBackend): ActiveEffect => ({
			id: perk.id,
			type: perk.type,
			side: perk.side,
			endTime: perk.activatedAt + perk.duration,
		}),
		[],
	);

	/**
	 * deactivates a perk by ID and cleans up its timer
	 */
	const deactivatePerkById = useCallback(
		async (perkId: string) => {
			//
			// clear the timer if it exists and remove from timers
			setPerkTimers((prev) => {
				const timer = prev.get(perkId);
				if (timer) {
					clearTimeout(timer);
				}
				const newMap = new Map(prev);
				newMap.delete(perkId);
				return newMap;
			});

			// remove from local state
			setLocalActivePerks((prev) => prev.filter((perk) => perk.id !== perkId));

			// remove from backend
			try {
				await deactivatePerkMutation({ gameId, perkId });
				console.log(`Perk deactivated: ${perkId}`);
			} catch (error) {
				console.error('Failed to persist perk deactivation:', error);
			}
		},
		[gameId, deactivatePerkMutation],
	);

	/**
	 * activates a new perk with automatic timer for deactivation
	 */
	const activatePerk = useCallback(
		async (type: EffectType, side: 'white' | 'black' | 'neutral', duration: number) => {
			//
			const perkId = crypto.randomUUID();
			const activatedAt = Date.now();

			const newPerk: ActiveEffect = {
				id: perkId,
				type,
				side,
				endTime: activatedAt + duration,
			};

			// add to local state immediately
			setLocalActivePerks((prev) => [...prev, newPerk]);

			// persist to backend
			try {
				await activatePerkMutation({
					gameId,
					perkId,
					type,
					side,
					activatedAt,
					duration,
					purchaseId: perkId, // use perkId as purchaseId for now
				});
			} catch (error) {
				console.error('Failed to persist perk activation:', error);
				// remove from local state if backend failed
				setLocalActivePerks((prev) => prev.filter((p) => p.id !== perkId));
				return;
			}

			// set up automatic deactivation timer for this specific perk
			const timer = setTimeout(() => {
				//
				deactivatePerkById(perkId);
				console.log(`Perk expired: ${type} for ${side}`);
			}, duration);

			// store the timer for cleanup
			setPerkTimers((prev) => new Map(prev).set(perkId, timer));

			console.log(`Perk activated: ${type} for ${side} (${duration}ms)`);
			return newPerk;
		},
		[gameId, activatePerkMutation, deactivatePerkById],
	);

	/**
	 * load active perks from backend on mount and set up timers for existing perks
	 */
	useEffect(() => {
		//
		if (!backendPerks) return;

		const now = Date.now();
		const activePerks: ActiveEffect[] = [];
		const newTimers = new Map<string, ReturnType<typeof setTimeout>>();

		backendPerks.forEach((backendPerk) => {
			const perk = convertBackendPerk(backendPerk);

			// only include perks that haven't expired yet
			if (perk.endTime > now) {
				activePerks.push(perk);

				// set up timer for remaining duration
				const remainingTime = perk.endTime - now;
				const timer = setTimeout(() => {
					//
					// directly call deactivation without depending on callback
					setLocalActivePerks((prev) => prev.filter((p) => p.id !== perk.id));
					setPerkTimers((prev) => {
						const newMap = new Map(prev);
						newMap.delete(perk.id);
						return newMap;
					});

					// call backend deactivation
					deactivatePerkMutation({ gameId, perkId: perk.id }).catch((error) => {
						console.error('Failed to persist perk deactivation:', error);
					});

					console.log(`Perk expired: ${perk.type} for ${perk.side}`);
				}, remainingTime);

				newTimers.set(perk.id, timer);
			}
		});

		setLocalActivePerks(activePerks);
		setPerkTimers(newTimers);
	}, [backendPerks, gameId, convertBackendPerk, deactivatePerkMutation]);

	/**
	 * cleanup timers when gameId changes or component unmounts
	 */
	useEffect(() => {
		//
		return () => {
			// clear all timers on cleanup
			setPerkTimers((currentTimers) => {
				currentTimers.forEach((timer) => clearTimeout(timer));
				return new Map();
			});
		};
	}, [gameId]);

	/**
	 * helper functions for perk management (matching PerkPanel interface)
	 */
	const hasActiveEffect = useCallback(
		(effectType: string, side: string) => {
			//
			return localActivePerks.some((perk) => perk.type === effectType && perk.side === side);
		},
		[localActivePerks],
	);

	const canActivateEffect = useCallback(
		(effectType: string, side: 'white' | 'black' | 'neutral') => {
			//
			// can activate if not already active for this side
			return !hasActiveEffect(effectType, side);
		},
		[hasActiveEffect],
	);

	const countActiveEffects = useCallback(
		(side: string) => {
			//
			return localActivePerks.filter((perk) => perk.side === side).length;
		},
		[localActivePerks],
	);

	// dummy function for PerkPanel compatibility - actual activation happens via payment monitoring
	const onActivateEffect = useCallback((effectType: string, side: 'white' | 'black' | 'neutral') => {
		//
		// this is called by PerkPanel but actual activation happens when payment is confirmed
		console.log('Perk activation requested via UI:', effectType, side);
	}, []);

	// return current active perks and management functions
	return useMemo(
		() => ({
			activePerks: localActivePerks,
			activatePerk,
			hasActiveEffect,
			canActivateEffect,
			countActiveEffects,
			onActivateEffect,
		}),
		[localActivePerks, activatePerk, hasActiveEffect, canActivateEffect, countActiveEffects, onActivateEffect],
	);
}
