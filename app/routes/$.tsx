import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { createFileRoute } from '@tanstack/react-router';
import { zid } from 'convex-helpers/server/zod';
import { api } from 'convex/_generated/api';
import { Id } from 'convex/_generated/dataModel';
import { z } from 'zod';
import { BasicError } from '~/components/BasicError';
import MDX from '~/components/ui/mdx';

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
	const params = paramsFromURL(Route);

	const slug = params.slug || 'list';
	const pageQuery = convexQuery(api.pages.findOneBySlug, { slug });
	const { data: page } = useSuspenseQuery(pageQuery);

	// prepend the taskId to the body so that MDX can read it
	const taskId = params.taskId || page.defaultTaskId || 'inbox';
	const body = `export const taskId = '${taskId}';\n\n${page.body}`;

	return <MDX text={body} />;
}

function paramsFromURL(route: typeof Route) {
	//
	const { _splat } = route.useParams();
	const parts = _splat?.split('/') ?? [];

	// must be `/`, `/page` or `/page/taskId`
	if (parts.length > 2) {
		throw new Error('Invalid URL');
	}

	return {
		slug: parts.at(0) as string,
		taskId: parts.at(1) as Id<'tasks'> | undefined,
	};
}
