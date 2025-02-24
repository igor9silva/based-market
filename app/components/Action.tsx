import { Doc } from 'convex/_generated/dataModel';
import { useMemo } from 'react';
import { cn } from '~/lib/utils';

import { asDollars } from 'convex/utils/money';
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

	if (action.skillKey === 'react' && (action.status === 'succeeded' || action.status === 'skipped')) {
		return null;
	}

	return (
		<div
			className={cn(className, 'flex flex-row justify-between', {
				'ml-auto': isAuthorCurrentUser,
				'animate-in duration-100': isNew,
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
						skillKey={action.skillKey}
						args={action.args}
						costs={action.costs}
						className={cn({
							'bg-primary text-primary-foreground': isAuthorCurrentUser && action.skillKey === 'say',
						})}
					/>
				) : (
					<div className="text-sm text-muted-foreground">Using {action.skillKey}()</div>
				)}
			</div>
		</div>
	);
}

function Result({
	result, //
	skillKey,
	args,
	className,
	costs,
}: {
	result: string;
	skillKey: string;
	args: Record<string, any>;
	costs: Array<{
		symbol: string;
		amount: bigint;
		description: string;
	}>;
	className?: string;
}) {
	const mdx = <MDX text={result} errorFallback={<pre className="whitespace-pre-wrap">{result}</pre>} />;

	if (skillKey === 'say') {
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
				<div className="text-muted-foreground">{skillKey}()</div>
			</CollapsibleTrigger>
			<CollapsibleContent>
				<p>
					args: <code>{JSON.stringify(args)}</code>
				</p>
				<p>costs:</p>
				<ul>
					{costs.map((cost) => (
						<li key={cost.symbol}>
							{cost.symbol} {asDollars({ bigInt: cost.amount })} ({cost.description})
						</li>
					))}
				</ul>
				<p>result: {mdx}</p>
			</CollapsibleContent>
		</Collapsible>
	);
}
