import React, { createContext, useContext, useEffect, useRef } from 'react';
import { Textarea } from '~/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { useSubmitHotkey } from '~/hooks/useSubmitHotkey';
import { cn } from '~/lib/utils';

type PromptInputContextType = {
	maxHeight: number | string;
	onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
	disabled?: boolean;
};

const PromptInputContext = createContext<PromptInputContextType>({
	maxHeight: 240,
	onSubmit: undefined,
	disabled: false,
});

function usePromptInput() {
	const context = useContext(PromptInputContext);
	if (!context) {
		throw new Error('usePromptInput must be used within a PromptInput');
	}
	return context;
}

type PromptInputProps = {
	maxHeight?: number | string;
	onSubmit?: (e: React.FormEvent<HTMLFormElement>) => void;
	children: React.ReactNode;
	className?: string;
	disabled?: boolean;
};

function PromptInput({ className, maxHeight = 240, onSubmit, children, disabled = false }: PromptInputProps) {
	//
	const handleKeyDown = useSubmitHotkey();

	return (
		<TooltipProvider>
			<PromptInputContext.Provider
				value={{
					maxHeight,
					onSubmit,
					disabled,
				}}
			>
				<form
					onSubmit={onSubmit}
					onKeyDown={handleKeyDown}
					className={cn('border-input bg-background rounded-3xl border p-2 shadow-xs', className)}
				>
					{children}
				</form>
			</PromptInputContext.Provider>
		</TooltipProvider>
	);
}

export type PromptInputTextareaProps = {
	disableAutosize?: boolean;
	inputRef?: React.RefObject<HTMLTextAreaElement>;
} & React.ComponentProps<typeof Textarea>;

function PromptInputTextarea({
	className,
	onKeyDown,
	disableAutosize = false,
	inputRef,
	...props
}: PromptInputTextareaProps) {
	//
	const { maxHeight, disabled } = usePromptInput();
	const textareaRef = useRef<HTMLTextAreaElement>(null);

	// Auto-resize functionality
	const handleInput = () => {
		//
		if (disableAutosize) return;

		const ref = inputRef ?? textareaRef;
		if (!ref.current) return;

		ref.current.style.height = 'auto';
		ref.current.style.height =
			typeof maxHeight === 'number'
				? `${Math.min(ref.current.scrollHeight, maxHeight)}px`
				: `min(${ref.current.scrollHeight}px, ${maxHeight})`;
	};

	// Set up the input event listener for auto-resize
	useEffect(() => {
		//
		const ref = inputRef ?? textareaRef;
		if (!ref.current) return;

		ref.current.addEventListener('input', handleInput);
		return () => ref.current?.removeEventListener('input', handleInput);
		//
	}, [inputRef, disableAutosize, maxHeight]);

	return (
		<Textarea
			name="message"
			ref={inputRef ?? textareaRef}
			className={cn(
				'text-primary min-h-[44px] w-full resize-none border-none bg-transparent shadow-none outline-none focus-visible:ring-0 focus-visible:ring-offset-0',
				className,
			)}
			rows={1}
			disabled={disabled}
			{...props}
		/>
	);
}

type PromptInputActionsProps = React.HTMLAttributes<HTMLDivElement>;

function PromptInputActions({ children, className, ...props }: PromptInputActionsProps) {
	return (
		<div className={cn('flex items-center gap-2', className)} {...props}>
			{children}
		</div>
	);
}

type PromptInputActionProps = {
	className?: string;
	tooltip: React.ReactNode;
	children: React.ReactNode;
	side?: 'top' | 'bottom' | 'left' | 'right';
} & React.ComponentProps<typeof Tooltip>;

function PromptInputAction({ tooltip, children, className, side = 'top', ...props }: PromptInputActionProps) {
	const { disabled } = usePromptInput();

	return (
		<Tooltip {...props}>
			<TooltipTrigger asChild disabled={disabled}>
				{children}
			</TooltipTrigger>
			<TooltipContent side={side} className={className}>
				{tooltip}
			</TooltipContent>
		</Tooltip>
	);
}

export { PromptInput, PromptInputAction, PromptInputActions, PromptInputTextarea };
