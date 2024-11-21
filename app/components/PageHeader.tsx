import { Separator } from '@radix-ui/react-separator';
import { SidebarTrigger } from '~/components/ui/sidebar';
import { cn } from '~/lib/utils';

export function PageHeader({
	children, //
	className,
}: {
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<header className={cn('sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4', className)}>
			<SidebarTrigger className="-ml-1 md:hidden" />
			<Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
			{children}
		</header>
	);
}
