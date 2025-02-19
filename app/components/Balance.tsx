import { useNavigate } from '@tanstack/react-router';
import { Button } from '~/components/ui/button';
import { WorldcoinLogo } from '~/components/ui/icons/WorldcoinLogo';
import { useCurrentUser } from '~/hooks/useCurrentUser';
import { cn } from '~/lib/utils';

export function Balance({ className }: { className?: string }) {
	//
	const user = useCurrentUser();
	const navigate = useNavigate();

	return (
		<Button className={cn('p-2', className)} variant="ghost" onClick={() => navigate({ to: '/balance' })}>
			<WorldcoinLogo className="size-3" />
			{(user.balanceUSD ?? 0).toFixed(2)}
		</Button>
	);
}
