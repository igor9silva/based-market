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
		title,
		body,
	}: {
		taskId: Id<'tasks'>;
		title?: string;
		body?: string;
	}) => {
		return act({
			taskId,
			toolKey: 'updateTask',
			args: { title, body },
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

	const addFunds = ({
		taskId, //
		amount,
	}: {
		taskId: Id<'tasks'>;
		amount: number;
	}) => {
		return act({
			taskId,
			toolKey: 'addFunds',
			args: { amount },
		});
	};

	return {
		say,
		updateTask,
		markAsDone,
		addFunds,
	};
}
