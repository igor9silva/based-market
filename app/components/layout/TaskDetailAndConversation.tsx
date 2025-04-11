import { useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useContainerBreakpoint } from '~/hooks/useContainerBreakpoint';
import { useIsMobile } from '~/hooks/useIsMobile';
import { DEFAULT_MD_BREAKPOINT } from '~/lib/tailwind';
import { cn } from '~/lib/utils';

export function TaskDetailAndConversation({
	list,
	detail,
	className,
	defaultListSize = 30,
	breakpoint = DEFAULT_MD_BREAKPOINT,
}: {
	list: React.ReactNode;
	detail?: React.ReactNode;
	defaultListSize?: number;
	className?: string;
	breakpoint?: number;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isBelowBreakpoint = useContainerBreakpoint(containerRef, breakpoint);
	const isMobile = useIsMobile();

	const direction = isBelowBreakpoint ? 'vertical' : 'horizontal';

	return (
		<div ref={containerRef} className={cn('h-full w-full', className)}>
			<ResizablePanelGroup direction={direction} className={cn('overflow-hidden', className)}>
				<ResizablePanel id="list" order={0} defaultSize={detail ? defaultListSize : 100}>
					{isBelowBreakpoint ? list : detail}
				</ResizablePanel>
				{detail && !isMobile && <ResizableHandle withHandle />}
				{detail && !isMobile && (
					<ResizablePanel id="detail" order={1} defaultSize={100 - defaultListSize}>
						{isBelowBreakpoint ? detail : list}
					</ResizablePanel>
				)}
			</ResizablePanelGroup>
		</div>
	);
}
