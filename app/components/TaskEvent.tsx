import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { api } from 'convex/_generated/api';
import { Doc } from 'convex/_generated/dataModel';
import { authorSchema } from 'convex/schemas/authorSchema';
import { useMemo } from 'react';
import { z } from 'zod';
import { useAnimatedText } from '~/hooks/useAnimatedText';
import { cn } from '~/lib/utils';

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '~/components/ui/collapsible';
import MDX from '~/components/ui/mdx';

function Author({
	className, //
	author, //
}: {
	className?: string;
	author: z.infer<typeof authorSchema>;
}) {
	const query = convexQuery(api.users.public.current, {});
	const { data: user } = useSuspenseQuery(query);

	return (
		<strong className={cn(className, { 'text-purple-300': author !== user._id })}>
			{author === user._id ? 'you' : 'Meseeks'}:
		</strong>
	);
}

export function TaskEvent({
	className, //
	event,
	initialRenderDate,
}: {
	className?: string;
	event: Doc<'actions'>;
	initialRenderDate: Date;
}) {
	//
	const content = useMemo(() => {
		switch (event.status) {
			case 'pending authorization':
				return 'Pending authorization';
			case 'enqueued':
				return 'Enqueued';
			case 'running':
				return 'Running';
			case 'skipped':
				return 'Skipped';
			case 'succeeded':
			case 'failed':
				return event.result;
		}
	}, [event]);

	const isNew = useMemo(() => {
		return new Date(event._creationTime) > initialRenderDate;
	}, [event, initialRenderDate]);

	return (
		<div className={cn(className, 'flex flex-row justify-between')}>
			<div className="flex flex-col gap-1 overflow-x-auto">
				<div className="flex flex-row gap-1 items-center">
					<Author author={event.author} />
				</div>

				<div
					className={cn({
						'animate-pulse': event.status === 'pending authorization',
						'bg-pink-700/30': event.status === 'enqueued',
						'bg-blue-700/30': event.status === 'running',
						'bg-green-700/30': event.status === 'succeeded',
						'bg-red-700/30': event.status === 'failed',
						'bg-gray-700/30': event.status === 'skipped',
					})}
				>
					{event.kind === 'async' ? (
						<Collapsible>
							<CollapsibleTrigger>
								{event.result ? '' : 'Running '} <code>{event.toolKey}</code>
							</CollapsibleTrigger>
							<CollapsibleContent>
								args: <code>{JSON.stringify(event.args)}</code>
								<Content content={content} />
							</CollapsibleContent>
						</Collapsible>
					) : (
						<Content content={content} />
					)}
				</div>
			</div>
		</div>
	);
}

function AnimatedContent({ content }: { content: string }) {
	const text = useAnimatedText(content);
	return <Content content={text} />;
}

function Content({ content }: { content: string }) {
	return <MDX text={content} errorFallback={<pre className="whitespace-pre-wrap">{content}</pre>} />;
}
