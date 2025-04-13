import { convexQuery } from '@convex-dev/react-query';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Link } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { skillSchema } from 'convex/schemas/skillSchema';
import { PlusCircle } from 'lucide-react';
import { z } from 'zod';
import { Button } from '~/components/ui/button';
import { SkillCard } from './SkillCard';

/**
 * Fetches and displays the filtered list of skills
 * Should be wrapped in Suspense
 */
export function SkillListContent({
	kind, //
	searchTerm,
}: {
	kind: 'soft' | 'hard';
	searchTerm: string;
}) {
	//
	const query = convexQuery(api.skills.public.findAll, { kind });
	const { data: skills } = useSuspenseQuery(query);

	// Filter skills based on search term
	const filteredSkills = skills?.filter(
		(skill: z.infer<typeof skillSchema>) =>
			skill.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
			skill.description.toLowerCase().includes(searchTerm.toLowerCase()),
	);

	// Empty state
	if (filteredSkills?.length === 0) {
		return (
			<div className="text-center py-10">
				<p className="text-muted-foreground">No skills yet</p>
				<Link to="/skills/new">
					<Button>
						<PlusCircle />
						Learn
					</Button>
				</Link>
			</div>
		);
	}

	return (
		<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
			{filteredSkills?.map((skill) => <SkillCard key={skill._id} skill={skill} type={skill.kind} />)}
		</div>
	);
}
