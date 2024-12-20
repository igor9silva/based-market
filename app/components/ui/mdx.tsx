import { toast } from 'sonner';
import { useMDX } from '~/hooks/useMDX';

import { ChatHistory } from '~/components/ChatHistory';
import { Grid } from '~/components/layout/Grid';
import { TwoColumn } from '~/components/layout/TwoColumn';
import { Loading } from '~/components/Loading';
import { QuickAdd } from '~/components/QuickAdd';
import { TaskConversation } from '~/components/TaskConversation';
import TaskDetail from '~/components/TaskDetail';
import { TaskList } from '~/components/TaskList';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';

const components = {
	ChatHistory,
	Separator,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
	TwoColumn,
	TaskConversation,
	TaskDetail,
	Grid,
	QuickAdd,
	TaskList,
};

export default function MDX({
	text, //
	onClickFix,
}: {
	text: string;
	onClickFix?: (e: React.MouseEvent) => void;
}) {
	//
	const { Component, error, isPending } = useMDX(text);

	if (isPending) return <Loading />;
	if (error) return <MDXError error={error} onClickFix={onClickFix} />;

	if (!Component) throw new Error('No component found');

	return (
		<div className="whitespace-normal [&>*]:break-all">
			<Component
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
					...components,
				}}
			/>
		</div>
	);
}

function MDXError({
	error, //
	onClickFix,
}: {
	error: Error;
	onClickFix?: (e: React.MouseEvent) => void;
}) {
	//
	const handleErrorClick = (e: React.MouseEvent<HTMLPreElement>) => {
		e.stopPropagation();
		navigator.clipboard.writeText(error.message);
		toast('Error copied to clipboard.');
	};

	const handleFixClick = (e: React.MouseEvent<HTMLButtonElement>) => {
		e.stopPropagation();
		if (onClickFix) return onClickFix(e);
		toast.error('Not implemented yet.');
	};

	return (
		<div>
			<p>Error loading content:</p>
			<pre onClick={handleErrorClick} className="text-red-500 whitespace-pre-wrap">
				{error.message}
			</pre>
			<br />
			<Button onClick={handleFixClick}>Fix it</Button>
		</div>
	);
}
