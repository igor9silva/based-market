import { createFileRoute } from '@tanstack/react-router';
import { GamesList } from '~/../../components/GamesList';

export const Route = createFileRoute('/games')({
  component: GamesListComponent,
});

function GamesListComponent() {
  // Potentially fetch a list of games here if GamesList expects props
  return <GamesList />;
}
