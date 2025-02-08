import { useLocation, useNavigate, useRouter } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, ArrowUp, Share } from 'lucide-react';
import { Suspense } from 'react';
import { cn } from '~/lib/utils';

import { useSearch } from '@tanstack/react-router';
import { toast } from 'sonner';
import { ActionIsland } from '~/components/ActionIsland';
import { useCommandMenu } from '~/components/CommandMenu';
import { Button } from '~/components/ui/button';
import { useSplatParams } from '~/hooks/useSplatParams';

export function MainHeader({ className }: { className?: string }) {
	//
	const { history } = useRouter();
	const { pathname, searchStr, search } = useLocation();
	const { open: openCommandDialog } = useCommandMenu();
	const { taskId } = useSplatParams();
	const navigate = useNavigate();
	const { selectedSubtaskId } = useSearch({ strict: false });

	const goBack = () => history.back();
	const goUp = () => {
		toast.error('Coming soon. Will move to parent task, if any.'); // TODO: implement
	};
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

			<div className="w-5/12 flex gap-1">
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
				{search.selectedSubtaskId && (
					<Button
						variant="ghost"
						size="icon"
						className="justify-end [&_svg]:size-5"
						onClick={(e) => {
							e.preventDefault();
							console.log('double click');
							navigate({ to: '/$', params: { _splat: `/chat/${search.selectedSubtaskId}` } });
						}}
					>
						<ArrowRight />
					</Button>
				)}
			</div>

			<div className="flex gap-1">
				<Button className="p-2" variant="ghost" onClick={share}>
					<Share />
				</Button>
				{taskId && (
					<Suspense fallback={null}>
						<ActionIsland
							taskId={taskId}
							className="md:relative" // Add positioning context for desktop
						/>
					</Suspense>
				)}
			</div>
		</header>
	);
}
