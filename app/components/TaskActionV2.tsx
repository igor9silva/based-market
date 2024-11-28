import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { useMutation } from 'convex/react';
import { authorSchema } from 'convex/schemas/author';
import { Check, ChevronLast, Loader2, RotateCw, X } from 'lucide-react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { cn } from '~/lib/utils';

function Author({
	className, //
	author, //
}: {
	className?: string;
	author: z.infer<typeof authorSchema>;
}) {
	return <strong className={className}>{author === 'meseeks' ? 'Meseeks' : 'you'}:</strong>;
}

export function TaskAction({
	className, //
	action,
}: {
	className?: string;
	action: Doc<'taskActions'>;
}) {
	//
	const skipAction = useMutation(api.taskActions.skip);
	const retryAction = useMutation(api.taskActions.retry);

	return (
		<div className={cn(className, 'flex flex-row justify-between')}>
			<div className="flex flex-col gap-1">
				<div className="flex flex-row gap-1 items-center">
					<Author className={cn({ 'text-purple-300': action.author === 'meseeks' })} author={action.author} />
					{action.status === 'running' && <Loader2 className="size-4 shrink-0 animate-spin" />}
					{action.status === 'succeeded' && <Check className="size-4 shrink-0" />}
					{action.status === 'failed' && <X className="size-4 shrink-0" />}
				</div>

				<div className={cn(action.status === 'skipped' && 'line-through')}>
					{action.kind === 'mutation' ? action.changes : action.message}
				</div>
			</div>

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
