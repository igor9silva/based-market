import { createFileRoute } from '@tanstack/react-router';
import OrbitalFlux from '~/components/games/OrbitalFlux';

export const Route = createFileRoute('/')({
	component: RouteComponent,
});

function RouteComponent() {
	return <OrbitalFlux />;
}
