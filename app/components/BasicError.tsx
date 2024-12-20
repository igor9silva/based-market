export function BasicError({ text }: { text?: string }) {
	return <div className="flex flex-col items-center justify-center h-screen w-full gap-4">{text ?? 'failed'}</div>;
}
