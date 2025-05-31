import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/perks')({
	beforeLoad: () => {
		//
		throw redirect({
			to: '/games/orbital-flux/perks',
		});
	},
});
