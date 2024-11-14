import { Separator } from '@radix-ui/react-separator';
import { SidebarTrigger } from '~/components/ui/sidebar';

export function PageHeader({ children }: { children: React.ReactNode }) {
	return (
		<header className="sticky top-0 flex shrink-0 items-center gap-2 border-b bg-background p-4 rounded-tl-lg rounded-tr-lg">
			<SidebarTrigger className="-ml-1 md:hidden" />
			<Separator orientation="vertical" className="mr-2 h-4 md:hidden" />
			{children}
		</header>
	);
}
