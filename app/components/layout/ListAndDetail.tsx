import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '~/components/ui/resizable';
import { useIsMobile } from '~/hooks/useIsMobile';
import { cn } from '~/lib/utils';

export function ListAndDetail({
	list,
	detail,
	className,
}: {
	list: React.ReactNode;
	detail?: React.ReactNode;
	className?: string;
}) {
	const isMobile = useIsMobile();
	const direction = isMobile ? 'vertical' : 'horizontal';

	return (
		<ResizablePanelGroup direction={direction} className={cn('overflow-hidden', className)}>
			<ResizablePanel id="list" order={0} defaultSize={detail ? 35 : 100}>
				{list}
			</ResizablePanel>
			{detail && <ResizableHandle />}
			{detail && (
				<ResizablePanel id="detail" order={1} defaultSize={65}>
					{detail}
				</ResizablePanel>
			)}
		</ResizablePanelGroup>
	);
}
