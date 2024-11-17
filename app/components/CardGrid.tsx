export function CardGrid({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex gap-2 flex-wrap w-full text-ellipsis whitespace-nowrap [&>*]:grow [&>*]:max-h-fit [&>*]:max-w-full">
			{children}
		</div>
	);
}
