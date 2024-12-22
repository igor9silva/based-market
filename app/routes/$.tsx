import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zid } from 'convex-helpers/server/zod';
import { api } from 'convex/_generated/api';
import { z } from 'zod';
import { BasicError } from '~/components/BasicError';
import MDX from '~/components/ui/mdx';
import { useSplatParams } from '~/hooks/useSplatParams';

const searchSchema = z.object({
	selectedSubtaskId: zid('tasks').optional(),
});

export const Route = createFileRoute('/$')({
	component: MDXPage,
	errorComponent: () => <BasicError text="Not found (or something else went wrong)." />,
	validateSearch: searchSchema,
});

export default function MDXPage() {
	//
	const params = useSplatParams();

	const slug = params.slug || 'list';
	const pageQuery = convexQuery(api.pages.findOneBySlug, { slug });
	const { data: page } = useSuspenseQuery(pageQuery);

	// prepend the taskId to the body so that MDX can read it
	const taskId = params.taskId || page.defaultTaskId || 'inbox';
	const body = `export const taskId = '${taskId}';\n\n${page.body}`;

	return <MDX text={body} />;
}
