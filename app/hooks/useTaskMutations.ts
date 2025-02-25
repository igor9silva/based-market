import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';

export function useTaskMutations() {
	//
	const act = useMutation(api.action.public.act);

	const say = ({
		taskId, //
		message,
	}: {
		taskId: Id<'tasks'>;
		message: string;
	}) => {
		return act({
			taskId,
			skillKey: 'say',
			args: { message },
		});
	};

	const updateTask = ({
		taskId, //
		summary,
		description,
	}: {
		taskId: Id<'tasks'>;
		summary?: string;
		description?: string;
	}) => {
		return act({
			taskId,
			skillKey: 'updateTask',
			args: { summary, description },
		});
	};

	const markAsDone = ({
		taskId, //
		isDone,
	}: {
		taskId: Id<'tasks'>;
		isDone: boolean;
	}) => {
		return act({
			taskId,
			skillKey: 'markAsDone',
			args: { isDone },
		});
	};

	const increaseBudget = ({
		taskId, //
		amount,
	}: {
		taskId: Id<'tasks'>;
		amount: bigint;
	}) => {
		return act({
			taskId,
			skillKey: 'increaseBudget',
			args: { amount },
		});
	};

	return {
		say,
		updateTask,
		markAsDone,
		increaseBudget,
	};
}
