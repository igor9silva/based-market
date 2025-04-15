import { Link } from '@tanstack/react-router';
import { DollarSign } from 'lucide-react';
import { Button } from '~/components/ui/button';

export function AddBudgetButton(props: { variant?: 'ghost' | 'default' }) {
	//
	return (
		<Link to="." search={(prev) => ({ ...prev, isBudgetDrawerOpen: true })}>
			<Button size="sm" variant={props.variant ?? 'default'} className="flex items-center gap-1">
				<DollarSign className="h-4 w-4" />
				Add Budget
			</Button>
		</Link>
	);
}
