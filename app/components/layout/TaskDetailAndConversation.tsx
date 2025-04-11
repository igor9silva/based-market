import { useRef } from 'react';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useContainerBreakpoint } from '~/hooks/useContainerBreakpoint';
import { DEFAULT_MD_BREAKPOINT } from '~/lib/tailwind';
import { cn } from '~/lib/utils';

const MIN_HEIGHT_FOR_CONVERSATION = 600;

export function TaskDetailAndConversation({
	list,
	detail,
	className,
	defaultListSize = 30,
	widthBreakpoint = DEFAULT_MD_BREAKPOINT,
	heightBreakpoint = MIN_HEIGHT_FOR_CONVERSATION,
}: {
	list: React.ReactNode;
	detail?: React.ReactNode;
	defaultListSize?: number;
	className?: string;
	widthBreakpoint?: number;
	heightBreakpoint?: number;
}) {
	const containerRef = useRef<HTMLDivElement>(null);
	const isBelowWidthBreakpoint = useContainerBreakpoint(containerRef, 'width', widthBreakpoint);
	const isBelowHeightBreakpoint = useContainerBreakpoint(containerRef, 'height', heightBreakpoint);

	const direction = isBelowWidthBreakpoint ? 'vertical' : 'horizontal';

	// determine if the detail (conversation) panel should be rendered
	// render if there is detail data AND the container height is sufficient
	const shouldRenderDetailPanel = Boolean(detail) && !isBelowHeightBreakpoint;

	return (
		<div ref={containerRef} className={cn('h-full w-full', className)}>
			<ResizablePanelGroup direction={direction} className={cn('overflow-hidden', className)}>
				<ResizablePanel id="list" order={0} defaultSize={shouldRenderDetailPanel ? defaultListSize : 100}>
					{/* the content of the first panel depends on the layout direction */}
					{direction === 'vertical' ? list : detail}
				</ResizablePanel>
				{shouldRenderDetailPanel && <ResizableHandle withHandle />}
				{shouldRenderDetailPanel && (
					<ResizablePanel id="detail" order={1} defaultSize={100 - defaultListSize}>
						{/* the content of the second panel depends on the layout direction */}
						{direction === 'vertical' ? detail : list}
					</ResizablePanel>
				)}
			</ResizablePanelGroup>
		</div>
	);
}
