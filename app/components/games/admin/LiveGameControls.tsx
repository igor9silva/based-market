import { api } from 'convex/_generated/api';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useState } from 'react';
import { Button } from '~/components/ui/button';
import { Loading } from '~/components/Loading';

interface LiveGameControlsProps {
	gameSlug: string;
	password?: string;
	onPasswordPrompt?: () => string | null;
	onGameCreated?: (gameId: string) => void;
	onGameStopped?: () => void;
	children?: React.ReactNode;
}

export function LiveGameControls({
	gameSlug,
	password: initialPassword,
	onPasswordPrompt,
	onGameCreated,
	onGameStopped,
	children,
}: LiveGameControlsProps) {
	//
	const currentLiveGame = useQuery(api.games.public.getCurrentLiveGame);
	const startLiveGame = useMutation(api.games.public.startLive);
	const stopLiveGame = useMutation(api.games.public.stopLive);
	const cleanupAllGames = useMutation(api.games.public.cleanupAll);

	const [password, setPassword] = useState<string | null>(initialPassword || null);
	const [isLoading, setIsLoading] = useState(false);

	/**
	 * prompts for password if not available
	 */
	const promptPassword = useCallback(() => {
		//
		if (onPasswordPrompt) {
			const pwd = onPasswordPrompt();
			if (pwd) setPassword(pwd);
			return pwd;
		}

		const pwd = window.prompt('Enter live game password:');
		if (pwd) setPassword(pwd);
		return pwd;
	}, [onPasswordPrompt]);

	/**
	 * creates and starts a new live game
	 */
	const createNewGame = useCallback(
		async (config: any) => {
			//
			setIsLoading(true);
			try {
				const pwd = password || promptPassword();
				if (!pwd) return;

				const gameId = await startLiveGame({
					password: pwd,
					kind: gameSlug as any,
					config,
				});

				onGameCreated?.(gameId);
			} catch (error) {
				console.error('Failed to start live game:', error);
				alert(`Failed to start live game: ${error}`);
			} finally {
				setIsLoading(false);
			}
		},
		[startLiveGame, password, promptPassword, gameSlug, onGameCreated],
	);

	/**
	 * stops the current live game
	 */
	const handleStopGame = useCallback(async () => {
		//
		const pwd = password || promptPassword();
		if (!pwd) return;

		setIsLoading(true);
		try {
			await stopLiveGame({ password: pwd });
			onGameStopped?.();
		} catch (error) {
			console.error('Failed to stop live game:', error);
			alert(`❌ Failed to stop live game: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [stopLiveGame, password, promptPassword, onGameStopped]);

	/**
	 * cleanup all games
	 */
	const handleCleanup = useCallback(async () => {
		//
		const pwd = password || promptPassword();
		if (!pwd) return;

		const confirmed = window.confirm('🚨 EMERGENCY CLEANUP 🚨\nThis will stop ALL running games.\nAre you sure?');
		if (!confirmed) return;

		setIsLoading(true);
		try {
			const result = await cleanupAllGames({ password: pwd });
			alert(`✅ Cleanup complete: ${result.stoppedGames} games stopped`);
			onGameStopped?.();
		} catch (error) {
			console.error('Failed to cleanup games:', error);
			alert(`❌ Failed to cleanup games: ${error}`);
		} finally {
			setIsLoading(false);
		}
	}, [cleanupAllGames, password, promptPassword, onGameStopped]);

	// loading state
	if (currentLiveGame === undefined || isLoading) {
		return <Loading />;
	}

	// existing live game detected - show control options
	if (currentLiveGame) {
		return (
			<div className="h-screen bg-background flex items-center justify-center overflow-hidden">
				<div className="text-center space-y-6 max-w-md">
					<p className="text-muted-foreground">
						Live game running
						<br />
						<span className="font-mono text-sm">{currentLiveGame._id}</span>
					</p>

					<div className="space-y-4">
						<Button onClick={handleStopGame} variant="destructive" size="lg" className="w-full">
							⏹️ Stop Current Game
						</Button>

						<Button
							onClick={handleCleanup}
							variant="destructive"
							size="lg"
							className="w-full bg-red-700 hover:bg-red-800"
						>
							🧹 Emergency Cleanup All
						</Button>
					</div>

					{password && <p className="text-xs text-muted-foreground">Password set ✓</p>}
				</div>
			</div>
		);
	}

	// no active game - render children with ability to create games
	return (
		<div className="h-screen bg-background text-foreground overflow-hidden">
			<div className="h-full flex items-center justify-center">
				<div className="w-96 bg-card border border-border rounded-lg p-6">
					{children}

					<div className="space-y-3 mt-6">
						<Button onClick={handleCleanup} variant="destructive" className="w-full">
							🧹 Emergency Cleanup
						</Button>
					</div>

					{password && <p className="text-xs text-muted-foreground text-center mt-4">Password set ✓</p>}
				</div>
			</div>
		</div>
	);
}