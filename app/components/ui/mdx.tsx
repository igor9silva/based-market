import { useMDX } from '~/hooks/useMDX';

export default function MDX({ text }: { text: string }) {
	const Content = useMDX(text);
	return (
		<div className="whitespace-normal [&>*]:break-all">
			<Content
				components={{
					pre: ({ children }) => <pre className="">{children}</pre>,
					code: ({ children }) => <code className="">{children}</code>,
					blockquote: ({ children }) => <blockquote className="">{children}</blockquote>,
					table: ({ children }) => <table className="">{children}</table>,
					td: ({ children }) => <td className="">{children}</td>,
					th: ({ children }) => <th className="">{children}</th>,
					tr: ({ children }) => <tr className="">{children}</tr>,
					thead: ({ children }) => <thead className="">{children}</thead>,
					tbody: ({ children }) => <tbody className="">{children}</tbody>,
					img: ({ src, alt }) => <img src={src} alt={alt} className="rounded-md" />,
					ul: ({ children }) => <ul className="list-disc list-inside">{children}</ul>,
					ol: ({ children }) => <ol className="list-decimal list-inside">{children}</ol>,
					li: ({ children }) => <li className="leading-normal">{children}</li>,
					hr: () => <hr className="my-4 border-t border-border" />,
					h1: ({ children }) => <h1 className="text-2xl font-bold mt-2">{children}</h1>,
					h2: ({ children }) => <h2 className="text-xl font-bold mt-2">{children}</h2>,
					h3: ({ children }) => <h3 className="text-lg font-bold mt-2">{children}</h3>,
					h4: ({ children }) => <h4 className="text-base font-bold mt-2">{children}</h4>,
					h5: ({ children }) => <h5 className="text-sm font-bold mt-2">{children}</h5>,
					h6: ({ children }) => <h6 className="text-xs font-bold mt-2">{children}</h6>,
					p: ({ children }) => <p className="">{children}</p>,
					strong: ({ children }) => <strong className="font-bold">{children}</strong>,
					em: ({ children }) => <em className="italic">{children}</em>,
					del: ({ children }) => <del className="line-through">{children}</del>,
				}}
			/>
		</div>
	);
}
