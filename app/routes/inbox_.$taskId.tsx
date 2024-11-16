import { createFileRoute } from '@tanstack/react-router';
import TaskDetail from '~/components/TaskDetail';

export const Route = createFileRoute('/inbox_/$taskId')({
	component: TaskDetail,
});
