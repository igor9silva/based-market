import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@radix-ui/react-collapsible';
import { Avatar, AvatarFallback, AvatarImage } from '~/components/ui/avatar';
import MDX from '~/components/ui/mdx';
import { TextShimmer } from '~/components/ui/text-shimmer';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

export type MessageProps = {
	children: React.ReactNode;
	className?: string;
} & React.HTMLProps<HTMLDivElement>;

const Message = ({ children, className, ...props }: MessageProps) => (
	<div className={cn('flex gap-3', className)} {...props}>
		{children}
	</div>
);

export type MessageAvatarProps = {
	src: string;
	alt: string;
	fallback?: string;
	delayMs?: number;
	className?: string;
};

const MessageAvatar = ({ src, alt, fallback, delayMs, className }: MessageAvatarProps) => {
	return (
		<Avatar className={cn('size-8 flex-shrink-0', className)}>
			<AvatarImage src={src} alt={alt} />
			{fallback && <AvatarFallback delayMs={delayMs}>{fallback}</AvatarFallback>}
		</Avatar>
	);
};

export type MessageContentProps = {
	text: string;
	className?: string;
} & React.HTMLProps<HTMLDivElement>;

const MessageContent = ({ text, className, ...props }: MessageContentProps) => {
	//
	return (
		<MDX
			text={text}
			className={cn('rounded-lg text-foreground prose break-words whitespace-normal', className)}
			{...props}
		/>
	);
};

export type MessageActionsProps = {
	children: React.ReactNode;
	className?: string;
} & React.HTMLProps<HTMLDivElement>;

const MessageActions = ({ children, className, ...props }: MessageActionsProps) => (
	<div className={cn('text-muted-foreground flex items-center gap-2', className)} {...props}>
		{children}
	</div>
);

export type MessageActionProps = {
	className?: string;
	tooltip: React.ReactNode;
	children: React.ReactNode;
	side?: 'top' | 'bottom' | 'left' | 'right';
} & React.ComponentProps<typeof Tooltip>;

const MessageAction = ({ tooltip, children, className, side = 'top', ...props }: MessageActionProps) => {
	return (
		<TooltipProvider>
			<Tooltip {...props}>
				<TooltipTrigger asChild>{children}</TooltipTrigger>
				<TooltipContent side={side} className={className}>
					{tooltip}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
};

const SimpleMessage = ({ text, running }: { text: string; running?: boolean }) => (
	<Message>
		{running ? (
			<TextShimmer text={text} /> //
		) : (
			<div className="text-sm text-muted-foreground">{text}</div>
		)}
	</Message>
);

const FailedMessage = ({ text, error }: { text: string; error: string }) => (
	<Message>
		<Collapsible>
			<CollapsibleTrigger>
				<MessageContent className="text-sm text-muted-foreground text-left" text={text} />
			</CollapsibleTrigger>
			<CollapsibleContent>
				<pre className="text-sm text-muted-foreground text-left">{error}</pre>
			</CollapsibleContent>
		</Collapsible>
	</Message>
);

export { FailedMessage, Message, MessageAction, MessageActions, MessageAvatar, MessageContent, SimpleMessage };
