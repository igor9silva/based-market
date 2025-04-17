import { createFileRoute } from '@tanstack/react-router';
import { UnifiedSkillForm } from '~/components/skills/UnifiedSkillForm';

export const Route = createFileRoute('/skills_/$id')({
	component: RouteComponent,
});

export default function RouteComponent() {
	//
	const { id } = Route.useParams();
	// const query = convexQuery(api.skills.public.findOne, { skillId: id as Id<'skills'> });
	// const { data: skill } = useSuspenseQuery(query);

	return (
		<div className="container py-6 space-y-6">
			<UnifiedSkillForm skillId={id} />
		</div>
	);
}
