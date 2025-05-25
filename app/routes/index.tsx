import { createFileRoute } from '@tanstack/react-router';
import OrbitalFlux from '~/components/games/orbital-flux/OrbitalFlux';

export const Route = createFileRoute('/')({
	component: RouteComponent,
});

function RouteComponent() {
	return <OrbitalFlux />;
}
