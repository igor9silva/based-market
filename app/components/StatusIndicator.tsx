const sizeClasses = {
	xs: 'size-1',
	sm: 'size-2',
	md: 'size-4',
	lg: 'size-8',
};

type StatusIndicatorProps = {
	size?: keyof typeof sizeClasses;
	className?: string;
	pulse?: boolean;
};

export function StatusIndicator({ size = 'xs', className = '', pulse = true }: StatusIndicatorProps) {
	return (
		<div
			className={`rounded-full ${sizeClasses[size]} ${pulse ? 'animate-pulse-blur' : ''} ${className}`}
			aria-live="polite"
			aria-label="Status Indicator"
		>
			{/* TODO: write this 👇 */}
			<span className="sr-only">Loading or active status</span>
		</div>
	);
}
