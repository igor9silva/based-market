import { cn } from '~/lib/utils';

export function Loading({ className }: { className?: string }) {
	return (
		<div className={cn('flex flex-col items-center justify-center h-screen w-full gap-4', className)}>
			Loading...
		</div>
	);
}
