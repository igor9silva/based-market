import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { Check, ChevronLast, Loader2, RotateCw, X } from 'lucide-react';
import { TimeAgo } from '~/components/TimeAgo';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

export function TaskAction({
	action, //
	className,
}: {
	action: Doc<'taskActions'>;
	className?: string;
}) {
	const skipAction = useMutation(api.taskActions.skip);
	const retryAction = useMutation(api.taskActions.retry);

	return (
		<div key={action._id} className={cn('flex flex-row gap-1 justify-between', className)}>
			<div className="flex flex-col">
				<div className="flex flex-row gap-1 items-baseline">
					{action.status === 'running' && <Loader2 className="size-4 animate-spin" />}
					{action.status === 'succeeded' && <Check className="size-4" />}
					{action.status === 'failed' && <X className="size-4" />}
					<div className={cn('text-xl font-medium', action.status === 'skipped' && 'line-through')}>
						{action.kind}
					</div>
					<div className="text-sm text-muted-foreground">{action.status}</div>
				</div>
				{/* {action.errorMessage && <div className="text-xs text-red-500">{action.errorMessage}</div>} */}
				<div className="text-xs text-muted-foreground">
					requested <TimeAgo date={action._creationTime} />
				</div>
			</div>
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-1">
					{isEnabled(action, 'skip') && (
						<Button onClick={() => skipAction({ actionId: action._id })}>
							<ChevronLast />
						</Button>
					)}
					{isEnabled(action, 'retry') && (
						<Button onClick={() => retryAction({ actionId: action._id })}>
							<RotateCw />
						</Button>
					)}
				</div>
			</div>
		</div>
	);
}

function isEnabled(
	action: Doc<'taskActions'>, //
	kind: 'skip' | 'retry',
) {
	switch (kind) {
		case 'skip':
			return action.status === 'pending' || action.status === 'failed';
		case 'retry':
			return action.status === 'failed';
		default:
			return false;
	}
}
