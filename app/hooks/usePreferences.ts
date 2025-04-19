import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';

export function usePreferences() {
	//
	const setPreference = useMutation(api.users.preferences.public.setPreference);
	const getPreference = (key: string) => {
		//
		const query = convexQuery(api.users.preferences.public.getPreference, { key });
		const { data: preference } = useSuspenseQuery(query);

		return preference?.value;
	};

	const setInboxDetailWidthPercent = (widthPercent: number) => {
		return setPreference({ key: 'inboxDetailWidthPercent', value: widthPercent });
	};

	const getInboxDetailWidthPercent = () => {
		const preference = getPreference('inboxDetailWidthPercent');
		return typeof preference === 'number' ? preference : 70;
	};

	const setTaskDetailWidthPercent = (widthPercent: number) => {
		return setPreference({ key: 'taskDetailWidthPercent', value: widthPercent });
	};

	const getTaskDetailWidthPercent = () => {
		const preference = getPreference('taskDetailWidthPercent');
		return typeof preference === 'number' ? preference : 70;
	};

	return {
		setInboxDetailWidthPercent,
		getInboxDetailWidthPercent,
		setTaskDetailWidthPercent,
		getTaskDetailWidthPercent,
	};
}
