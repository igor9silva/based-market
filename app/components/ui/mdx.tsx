import { useMDX } from '~/hooks/useMDX';

export default function MDX({ text }: { text: string }) {
	const Content = useMDX(text);
	return <Content />;
}
