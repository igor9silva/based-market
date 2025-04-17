import { Button } from '~/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '~/components/ui/tooltip';

interface ActionButtonProps {
	//
	icon: React.ReactNode;
	onClick: () => void;
	disabled?: boolean;
	tooltip?: string;
	variant?: 'default' | 'secondary' | 'destructive' | 'outline' | 'ghost' | 'link';
}

export function ActionButton({
	icon,
	onClick,
	disabled = false,
	tooltip = '',
	variant = 'default',
}: ActionButtonProps) {
	//
	return (
		<Tooltip>
			<TooltipTrigger asChild>
				<Button
					type="button"
					variant={variant}
					size="icon"
					className="h-8 w-8 rounded-full"
					onClick={onClick}
					disabled={disabled}
				>
					{icon}
				</Button>
			</TooltipTrigger>
			<TooltipContent>{tooltip}</TooltipContent>
		</Tooltip>
	);
}
