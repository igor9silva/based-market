import { Doc } from 'convex/_generated/dataModel';
import { ArrowUp, Paperclip, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { PromptInput, PromptInputAction, PromptInputActions, PromptInputTextarea } from '~/components/ui/prompt-input';
import { useHandleSubmit } from '~/hooks/useHandleSubmit';
import { useTaskMutations } from '~/hooks/useTaskMutations';
import { cn } from '~/lib/utils';

export function ActionComposer({
	task, //
	className,
}: {
	task: Doc<'tasks'>;
	className?: string;
}) {
	//
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const [files, setFiles] = useState<File[]>([]);
	const { say, approveBlockingAction } = useTaskMutations();
	const [isEmpty, setIsEmpty] = useState(true);

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	useEffect(() => {
		//
		const handleGlobalKeyDown = (e: KeyboardEvent) => {
			if (e.key === 'i' && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				textareaRef.current?.focus();
			}
		};

		document.addEventListener('keydown', handleGlobalKeyDown);

		return () => {
			document.removeEventListener('keydown', handleGlobalKeyDown);
		};
	}, []);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			message: z.string().min(1, 'Message is required'),
		}),
		handler: async ({ message }) => {
			await say({ message, taskId: task._id });
			setFiles([]); // Clear files after submission
			if (textareaRef.current) {
				textareaRef.current.value = ''; // Clear textarea after submission
				setIsEmpty(true); // Reset isEmpty after submission
			}
		},
	});

	const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		if (event.target.files) {
			const newFiles = Array.from(event.target.files);
			setFiles((prev) => [...prev, ...newFiles]);
		}
	};

	const handleRemoveFile = (index: number) => {
		setFiles((prev) => prev.filter((_, i) => i !== index));
	};
	
	// Memoized value determining if we should approve the blocking action
	const shouldApproveBlockingAction = useMemo(() => 
		task.status === 'blocked' && isEmpty
	, [task.status, isEmpty]);

	const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
		//
		if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
			e.preventDefault();
			
			if (shouldApproveBlockingAction) {
				approveBlockingAction({ taskId: task._id });
				return;
			}
			
			// Otherwise, submit the form
			e.currentTarget.requestSubmit();
		}
	};
	
	const handleTextareaChange = () => {
		setIsEmpty(!textareaRef.current?.value.trim());
	};

	return (
		<PromptInput 
			onSubmit={handleSubmit} 
			className={cn('bg-sidebar max-w-(--breakpoint-md)', className)}
			onKeyDown={handleKeyDown}
		>
			{files.length > 0 && (
				<div className="flex flex-wrap gap-2 pb-2">
					{files.map((file, index) => (
						<div key={index} className="bg-secondary flex items-center gap-2 rounded-lg px-3 py-2 text-sm">
							<Paperclip className="size-4" />
							<span className="max-w-[120px] truncate">{file.name}</span>
							<button
								onClick={() => handleRemoveFile(index)}
								className="hover:bg-secondary/50 rounded-full p-1"
							>
								<X className="size-4" />
							</button>
						</div>
					))}
				</div>
			)}

			<PromptInputTextarea 
				placeholder="What's next?" 
				inputRef={textareaRef} 
				onChange={handleTextareaChange}
			/>

			<PromptInputActions className="flex items-center justify-between gap-2 pt-2">
				<PromptInputAction tooltip="Attach files">
					<label
						htmlFor="file-upload"
						className="hover:bg-secondary-foreground/10 flex h-8 w-8 cursor-pointer items-center justify-center rounded-2xl"
					>
						<input
							type="file"
							multiple
							onChange={handleFileChange}
							className="hidden"
							id="file-upload"
							name="files"
						/>
						<Paperclip className="text-primary size-5" />
					</label>
				</PromptInputAction>

				<div className="flex items-center gap-2 ml-auto">
					{shouldApproveBlockingAction && (
						<span className="flex items-center text-xs text-muted-foreground gap-1.5">
							<kbd className="inline-flex items-center rounded border bg-background px-1 font-mono text-xs">
								<span className="mr-0.5">⌘</span>Enter
							</kbd>
							to authorize
						</span>
					)}
					<PromptInputAction tooltip={'Say'}>
						<Button type="submit" variant="default" size="icon" className="h-8 w-8 rounded-full">
							<ArrowUp className="size-5" />
						</Button>
					</PromptInputAction>
				</div>
			</PromptInputActions>
		</PromptInput>
	);
}
