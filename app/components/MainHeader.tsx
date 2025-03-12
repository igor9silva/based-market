import { useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, ArrowUp, Share } from 'lucide-react';
import { Suspense } from 'react';
import { cn } from '~/lib/utils';

import { toast } from 'sonner';
import { Balance } from '~/components/Balance';
import { useCommandMenu } from '~/components/CommandMenu';
import { TaskStatusIndicator } from '~/components/TaskStatusIndicator';
import { Button } from '~/components/ui/button';
import { useSplatParams } from '~/hooks/useSplatParams';

export function MainHeader({ className }: { className?: string }) {
	//
	const { history } = useRouter();
	const { pathname, searchStr, search } = useLocation();
	const { open: openCommandDialog } = useCommandMenu();
	const { taskId } = useSplatParams();
	const navigate = useNavigate();

	const goBack = () => history.back();
	const goUp = () => navigate({ to: '/$', params: { _splat: `` } });
	const share = () => {
		navigator.clipboard.writeText(window.location.href);
		toast.success('Link copied to clipboard.');
	};

	return (
		<header
			className={cn('flex h-14 items-center justify-between border-t md:border-b px-0 md:px-2 gap-1', className)}
		>
			<div className="flex items-center gap-1">
				{/* TODO: dynamically enable/disable
					https://github.com/TanStack/router/discussions/181#discussioncomment-11726923 */}
				<Button className="p-2" variant="ghost" onClick={goBack}>
					<ArrowLeft />
				</Button>
				<Button className="p-2" variant="ghost" onClick={goUp}>
					<ArrowUp />
				</Button>
			</div>

			<div className="w-1/2 flex gap-1">
				<Button
					variant="outline"
					onClick={openCommandDialog}
					className="flex w-full justify-between gap-2 bg-muted/40 hover:bg-accent text-muted-foreground truncate p-2"
				>
					<span className="text-xs md:text-sm">
						{pathname}
						{searchStr}
					</span>
					<kbd className="hidden md:inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1 font-mono font-medium text-muted-foreground text-xs">
						<span className="text-base">⌘</span>K
					</kbd>
				</Button>
				<Button className="p-2" variant="ghost" onClick={share}>
					<Share />
				</Button>
				{search.selectedSubtaskId && (
					<Button
						variant="ghost"
						size="icon"
						className="[&_svg]:size-5"
						onClick={(e) => {
							e.preventDefault();
							navigate({ to: '/$', params: { _splat: `/chat/${search.selectedSubtaskId}` } });
						}}
					>
						<ArrowRight />
					</Button>
				)}
			</div>

			<div className="flex gap-1">
				<Balance />
				{taskId && (
					<Suspense fallback={null}>
						<div className="flex items-center p-1">
							<TaskStatusIndicator className="" taskId={taskId} />
						</div>
					</Suspense>
				)}
			</div>
		</header>
	);
}
