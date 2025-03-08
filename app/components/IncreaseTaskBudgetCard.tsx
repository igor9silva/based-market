import { Id } from 'convex/_generated/dataModel';
import { asBigInt } from 'convex/utils/money';
import { z } from 'zod';
import { BudgetSelector } from '~/components/ui/budget-selector';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { useTaskMutations } from '~/hooks/useTaskMutations';

export function IncreaseTaskBudgetCard({ taskId }: { taskId: Id<'tasks'> }) {
	//
	const { increaseBudget } = useTaskMutations();

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			amount: z.coerce.number().min(0).max(100).default(0.1),
		}),
		handler: async ({ amount }) => {
			//
			const bigIntAmount = asBigInt({ dollars: amount });
			console.debug('addFunds', taskId, amount);
			await increaseBudget({ taskId, amount: bigIntAmount });
		},
	});

	const handleKeyDown = useSubmitHotkey();

	return (
		<Card className="max-h-fit border-none rounded-none">
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-4">
					<BudgetSelector name="amount" defaultValue={0.1} />
					<Button variant="default" type="submit">
						Increase task budget
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
