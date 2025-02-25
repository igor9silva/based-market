import { Doc } from 'convex/_generated/dataModel';
import { ArrowUp, Paperclip, Square, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
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
	const { say } = useTaskMutations();

	useEffect(() => {
		textareaRef.current?.focus();
	}, []);

	const handleSubmit = useHandleSubmit({
		schema: z.object({
			message: z.string().min(1, 'Message is required'),
		}),
		handler: async ({ message }) => {
			await say({ message, taskId: task._id });
			setFiles([]); // Clear files after submission
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

	const isLoading = false;

	return (
		<PromptInput onSubmit={handleSubmit} className={cn('w-full bg-sidebar max-w-(--breakpoint-md)', className)}>
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

			<PromptInputTextarea placeholder="What's next?" inputRef={textareaRef} />

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

				<PromptInputAction tooltip={isLoading ? 'Stop generation' : 'Send message'}>
					<Button type="submit" variant="default" size="icon" className="h-8 w-8 rounded-full">
						{isLoading ? <Square className="size-5 fill-current" /> : <ArrowUp className="size-5" />}
					</Button>
				</PromptInputAction>
			</PromptInputActions>
		</PromptInput>
	);
}
