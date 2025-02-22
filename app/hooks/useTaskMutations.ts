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
			toolKey: 'say',
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
			toolKey: 'updateTask',
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
			toolKey: 'markAsDone',
			args: { isDone },
		});
	};

	const increaseBudget = ({
		taskId, //
		amount,
	}: {
		taskId: Id<'tasks'>;
		amount: number;
	}) => {
		return act({
			taskId,
			toolKey: 'increaseBudget',
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
