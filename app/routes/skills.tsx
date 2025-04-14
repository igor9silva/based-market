import { createFileRoute, Link } from '@tanstack/react-router';
import { PlusCircle } from 'lucide-react';
import { SkillList } from '~/components/skills/SkillList';
import { Button } from '~/components/ui/button';
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
					<CardDescription>
						The building blocks of Meseeks. They define what your companion can do.
					</CardDescription>
				</div>
				<Link to="/skills/new">
					<Button>
						<PlusCircle />
						Learn
					</Button>
				</Link>
			</div>
			<div className="space-y-8">
				<div>
					<h2 className="text-lg font-semibold">Managed by you</h2>
					{/* <CardDescription>Skills that you added yourself.</CardDescription> */}
					<Separator className="mt-2 mb-4" />
					<SkillList kind={'soft'} />
				</div>

				<div>
					<h2 className="text-lg font-semibold">Managed by us</h2>
					<CardDescription>
						Skills that are managed by <strong>isPro</strong> (the Meseeks team).
					</CardDescription>
					<Separator className="my-4" />
					<SkillList kind={'hard'} />
				</div>
			</div>
		</div>
	);
}
