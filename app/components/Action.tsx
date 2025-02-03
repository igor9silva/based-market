import { Doc } from 'convex/_generated/dataModel';
import { useMemo } from 'react';
import { cn } from '~/lib/utils';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible';
import MDX from '~/components/ui/mdx';

export function Action({
	className, //
	action,
	initialRenderDate,
	isAuthorCurrentUser,
}: {
	className?: string;
	action: Doc<'actions'>;
	initialRenderDate: Date;
	isAuthorCurrentUser: boolean;
}) {
	const isNew = useMemo(() => {
		return new Date(action._creationTime) > initialRenderDate;
	}, [action, initialRenderDate]);

	if (action.toolKey === 'react' && (action.status === 'succeeded' || action.status === 'skipped')) {
		return null;
	}

	return (
		<div
			className={cn(className, 'flex flex-row justify-between', {
				'ml-auto': isAuthorCurrentUser,
				'animate-in duration-150': isNew,
				'slide-in-from-right': isNew && isAuthorCurrentUser,
				'slide-in-from-left': isNew && !isAuthorCurrentUser,
			})}
		>
			<div
				className={cn('max-w-full', {
					'animate-pulse': action.status === 'pending authorization',
					'bg-pink-700/30': action.status === 'enqueued',
					'bg-blue-700/30': action.status === 'running',
					'bg-red-700/30': action.status === 'failed',
					'bg-gray-700/30': action.status === 'skipped',
				})}
			>
				{action.result ? (
					<Result
						result={action.result}
						toolKey={action.toolKey}
						args={action.args}
						className={cn({
							'bg-primary text-primary-foreground': isAuthorCurrentUser && action.toolKey === 'say',
						})}
					/>
				) : (
					<div className="text-sm text-muted-foreground">Using {action.toolKey}()</div>
				)}
			</div>
		</div>
	);
}

function Result({
	result, //
	toolKey,
	args,
	className,
}: {
	result: string;
	toolKey: string;
	args: Record<string, any>;
	className?: string;
}) {
	const mdx = <MDX text={result} errorFallback={<pre className="whitespace-pre-wrap">{result}</pre>} />;

	if (toolKey === 'say') {
		return (
			<div
				className={cn(
					'rounded-lg border border-border bg-card p-2 text-card-foreground shadow overflow-x-auto',
					className,
				)}
			>
				{mdx}
			</div>
		);
	}

	return (
		<Collapsible className={cn('text-sm', className)}>
			<CollapsibleTrigger>
				<div className="text-muted-foreground">{toolKey}()</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<p>
					args: <code>{JSON.stringify(args)}</code>
				</p>
				<p>result: {mdx}</p>
			</CollapsibleContent>
		</Collapsible>
	);
}
