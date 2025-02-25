import { Id } from 'convex/_generated/dataModel';
import { asBigInt } from 'convex/utils/money';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { useTaskMutations } from '~/hooks/useTaskMutations';

export function IncreaseTaskBudgetCard({ taskId }: { taskId: Id<'tasks'> }) {
	//
	const { increaseBudget } = useTaskMutations();

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			amount: z.string(),
		}),
		handler: async ({ amount }) => {
			console.debug('addFunds', taskId, amount, typeof amount, parseFloat(amount));
			await increaseBudget({ taskId, amount: asBigInt({ dollars: parseFloat(amount) }) });
		},
	});

	const handleKeyDown = useSubmitHotkey();

	return (
		<Card className="max-h-fit border-none rounded-none">
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<p className="font-semibold">Amount USD</p>
						<Input
							type="number"
							name="amount"
							min={0}
							step={0.01}
							placeholder="Amount"
							required
							defaultValue={0.1}
						/>
					</div>
					<Button variant="default" type="submit">
						Increase task budget
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
