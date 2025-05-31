import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import { GameLobby } from '~/components/games/GameLobby';

export const Route = createFileRoute('/games/$gameSlug/')({
	component: RouteComponent,
	validateSearch: z.object({
		isExpanded: z.boolean().optional(),
	}),
});

function RouteComponent() {
	//
	const { gameSlug } = Route.useParams();

	return <GameLobby gameSlug={gameSlug} />;
}