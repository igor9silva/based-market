import { Id } from 'convex/_generated/dataModel';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Input } from '~/components/ui/input';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { useTaskMutations } from '~/hooks/useTaskMutations';

export function AddFundsButton({ taskId }: { taskId: Id<'tasks'> }) {
	//
	const { addFunds } = useTaskMutations();
	console.debug('taskId', taskId);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			amount: z.string(),
		}),
		handler: async ({ amount }) => {
			console.debug('addFunds', taskId, amount, typeof amount, parseFloat(amount));
			await addFunds({ taskId, amount: parseFloat(amount) });
		},
	});

	const handleKeyDown = useSubmitHotkey();

	return (
		<Card className="max-h-fit border-none rounded-none">
			<CardContent className="p-4">
				<form onSubmit={handleSubmit} onKeyDown={handleKeyDown} className="flex flex-col gap-2">
					<div className="flex flex-col gap-0.5">
						<p className="font-semibold">Amount WLD</p>
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
						Add Funds
					</Button>
				</form>
			</CardContent>
		</Card>
	);
}
