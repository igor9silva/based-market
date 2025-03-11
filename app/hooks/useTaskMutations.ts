import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';

export function useTaskMutations() {
	//
	const act = useMutation(api.action.public.act);
	const authorize = useMutation(api.action.public.authorize);

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
		title,
		details,
	}: {
		taskId: Id<'tasks'>;
		title?: string;
		details?: string;
	}) => {
		return act({
			taskId,
			skillKey: 'updateTask',
			args: { title, details },
		});
	};

	const resolve = ({
		taskId, //
	}: {
		taskId: Id<'tasks'>;
	}) => {
		return act({
			taskId,
			skillKey: 'resolve',
			args: {},
		});
	};

	const discard = ({
		taskId, //
	}: {
		taskId: Id<'tasks'>;
	}) => {
		return act({
			taskId,
			skillKey: 'discard',
			args: {},
		});
	};

	const reopen = ({
		taskId, //
	}: {
		taskId: Id<'tasks'>;
	}) => {
		return act({
			taskId,
			skillKey: 'reopen',
			args: {},
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

	const approveAction = ({
		taskId, //
		actionId,
	}: {
		taskId: Id<'tasks'>;
		actionId: Id<'actions'>;
	}) => {
		return authorize({
			taskId,
			actionId,
			approved: true,
		});
	};

	const rejectAction = ({
		taskId, //
		actionId,
	}: {
		taskId: Id<'tasks'>;
		actionId: Id<'actions'>;
	}) => {
		return authorize({
			taskId,
			actionId,
			approved: false,
		});
	};

	return {
		say,
		updateTask,
		resolve,
		discard,
		reopen,
		increaseBudget,
		approveAction,
		rejectAction,
	};
}
