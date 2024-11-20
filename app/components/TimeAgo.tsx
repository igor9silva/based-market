import { formatDistanceToNow } from 'date-fns';
import { cn } from '~/lib/utils';

export function TimeAgo({
	date, //
	className,
}: {
	date: number | Date;
	className?: string;
}) {
	return <span className={cn('', className)}>{formatDistanceToNow(new Date(date), { addSuffix: true })}</span>;
}
