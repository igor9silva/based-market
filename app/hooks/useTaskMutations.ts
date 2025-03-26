import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';

export function useTaskMutations() {
	//
	const act = useMutation(api.action.public.act);
	const authorize = useMutation(api.action.public.authorize);
	const approveBlocking = useMutation(api.action.public.approveBlockingAction);
	const updateInboxDetailWidthPercent = useMutation(api.users.preferences.public.updateInboxDetailWidthPercent);

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
			shouldReopen: true,
		});
	};

	const stop = ({
		taskId, //
	}: {
		taskId: Id<'tasks'>;
	}) => {
		return act({
			taskId,
			skillKey: 'stop',
			args: {},
		});
	};

	const updateInstructions = ({
		taskId, //
		title,
		instructions,
	}: {
		taskId: Id<'tasks'>;
		title?: string;
		instructions?: string;
	}) => {
		return act({
			taskId,
			skillKey: 'updateInstructions',
			args: { title, instructions },
			shouldReopen: true,
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
			shouldReopen: true,
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
			hasApproved: true,
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
			hasApproved: false,
		});
	};

	const setInboxDetailWidthPercent = ({
		widthPercent, //
	}: {
		widthPercent: number;
	}) => {
		return updateInboxDetailWidthPercent({ widthPercent });
	};

	const approveBlockingAction = ({
		taskId, //
	}: {
		taskId: Id<'tasks'>;
	}) => {
		return approveBlocking({
			taskId,
		});
	};

	return {
		say,
		stop,
		updateInstructions,
		resolve,
		discard,
		increaseBudget,
		approveAction,
		rejectAction,
		setInboxDetailWidthPercent,
		approveBlockingAction,
	};
}
