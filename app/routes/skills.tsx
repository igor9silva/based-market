import { createFileRoute } from '@tanstack/react-router';
import { SkillList } from '~/components/skills/SkillList';
import { CardDescription, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';

export const Route = createFileRoute('/skills')({
	component: RouteComponent,
});

export default function RouteComponent() {
	//
	return (
		<div className="m-6">
			<div className="flex flex-row items-center justify-between my-4 gap-2">
				<div>
					<CardTitle className="text-2xl">Skills</CardTitle>
					<CardDescription>The building blocks of Meseeks — they define what it can do.</CardDescription>
				</div>
			</div>
			<div className="space-y-8">
				<div>
					<h2 className="text-lg font-semibold">Managed by you</h2>
					<CardDescription>Skills you taught Meseeks yourself.</CardDescription>
					<Separator className="mt-2 mb-4" />
					<SkillList filter={'personal'} shouldShowLearnButton={true} />
				</div>

				<div>
					<h2 className="text-lg font-semibold">Managed by us</h2>
					<CardDescription>
						Skills taught to Meseeks by <strong>isPro</strong> (the Meseeks team).
					</CardDescription>
					<Separator className="my-4" />
					<SkillList filter={'public'} />
				</div>
			</div>
		</div>
	);
}
