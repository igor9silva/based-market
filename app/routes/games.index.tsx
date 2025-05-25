import { createFileRoute } from '@tanstack/react-router';
import GamesList from '~/components/GamesList';

export const Route = createFileRoute('/games/')({
	component: RouteComponent,
});

function RouteComponent() {
	//
	return <GamesList />;
}
