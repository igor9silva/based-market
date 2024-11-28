export function TwoColumn({ children }: { children: [React.ReactNode, React.ReactNode] }) {
	//
	const [left, right] = children;

	return (
		<div className="grid grid-cols-[repeat(auto-fit,minmax(24rem,1fr))] gap-2">
			<div>{left}</div>
			<div>{right}</div>
		</div>
	);
}
