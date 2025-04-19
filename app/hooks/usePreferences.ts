import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { useMutation } from 'convex/react';

export function usePreferences({ defaultValue }: { defaultValue?: number } = {}) {
	//
	const setPreference = useMutation(api.users.preferences.public.setPreference);
	const getPreference = (key: string) => {
		//
		const query = convexQuery(api.users.preferences.public.getPreference, { key });
		const { data: preference } = useSuspenseQuery(query);

		return preference?.value;
	};

	const setInboxWidthPercent = (widthPercent: number) => {
		return setPreference({ key: 'inboxWidthPercent', value: widthPercent });
	};

	const getInboxWidthPercent = () => {
		const preference = getPreference('inboxWidthPercent');
		return typeof preference === 'number' ? preference : defaultValue ?? 50;
	};

	const setTaskDetailWidthPercent = (widthPercent: number) => {
		return setPreference({ key: 'taskDetailWidthPercent', value: widthPercent });
	};

	const getTaskDetailWidthPercent = () => {
		const preference = getPreference('taskDetailWidthPercent');
		return typeof preference === 'number' ? preference : defaultValue ?? 50;
	};

	return {
		setInboxWidthPercent,
		getInboxWidthPercent,
		setTaskDetailWidthPercent,
		getTaskDetailWidthPercent,
	};
}
