import { useLocation, useRouter } from '@tanstack/react-router';
import { ArrowLeft, ArrowRight, ArrowUp, Share } from 'lucide-react';
import { cn } from '~/lib/utils';

import { toast } from 'sonner';
import { useCommandMenu } from '~/components/CommandMenu';
import { Button } from '~/components/ui/button';

export function MainHeader({ className }: { className?: string }) {
	//
	const { history } = useRouter();
	const { pathname, searchStr } = useLocation();
	const { open: openCommandDialog } = useCommandMenu();

	const goBack = () => history.back();
	const goForward = () => history.forward();
	const goUp = () => {
		toast.error('Not implemented. Should go to parent task, if any.'); // TODO: implement
	};

	return (
		<header className={cn('flex h-14 items-center justify-between border-b px-2', className)}>
			<div className="flex items-center gap-1">
				<Button variant="outline" onClick={goBack}>
					<ArrowLeft />
				</Button>
				<Button variant="outline" onClick={goForward}>
					{/* TODO: dynamically enable/disable
					https://github.com/TanStack/router/discussions/181#discussioncomment-11726923 */}
					<ArrowRight />
				</Button>
				<Button variant="outline" onClick={goUp}>
					<ArrowUp />
				</Button>
			</div>

			<Button
				variant="outline"
				onClick={openCommandDialog}
				className="flex w-1/2 justify-between gap-2 bg-muted/40 hover:bg-accent text-muted-foreground"
			>
				<span className="text-sm">
					{pathname}
					{searchStr}
				</span>
				<kbd className="inline-flex h-5 items-center gap-0.5 rounded border bg-muted px-1 font-mono font-medium text-muted-foreground text-xs">
					<span className="text-base">⌘</span>K
				</kbd>
			</Button>

			<div className="flex gap-1">
				<Button variant="ghost">
					<Share />
				</Button>
				<div className="flex h-9 items-center gap-2 rounded-md border px-3">
					<span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-500" />
					<span className="text-sm">Running</span>
				</div>
			</div>
		</header>
	);
}
