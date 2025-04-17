interface KeyboardShortcutIndicatorProps {
	//
	keySymbol: string;
	text: string;
}

export function KeyboardShortcutIndicator({ keySymbol, text }: KeyboardShortcutIndicatorProps) {
	//
	return (
		<span className="items-center text-xs text-muted-foreground gap-1.5 hidden md:flex">
			<kbd className="inline-flex items-center rounded font-medium h-5 bg-background px-1 text-lg">
				<span className="mr-0.5">⌘</span>
				<span className="text-xl">{keySymbol}</span>
			</kbd>
			{text}
		</span>
	);
}
