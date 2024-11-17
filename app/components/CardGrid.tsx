export function CardGrid({ children }: { children: React.ReactNode }) {
	return <div className="flex gap-2 flex-wrap [&>*]:grow [&>*]:max-h-fit">{children}</div>;
}
