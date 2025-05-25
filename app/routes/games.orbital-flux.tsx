import { createFileRoute } from '@tanstack/react-router';
import { z } from 'zod';
import OrbitalFlux from '~/components/games/orbital-flux/OrbitalFlux';

export const Route = createFileRoute('/games/orbital-flux')({
	component: RouteComponent,
	validateSearch: z.object({
		isExpanded: z.boolean().optional(),
	}),
});

function RouteComponent() {
	//
	return <OrbitalFlux />;
}
