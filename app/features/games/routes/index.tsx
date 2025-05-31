import { createFileRoute, redirect } from '@tanstack/react-router';

// This route was app/routes/index.tsx but is now repurposed for /games
// It will redirect to /games/orbital-flux as per the plan.
export const Route = createFileRoute('/games')({
  loader: () => {
    throw redirect({
      to: '/games/orbital-flux',
    });
  },
});
