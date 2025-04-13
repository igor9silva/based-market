import { createFileRoute, Link } from '@tanstack/react-router';
import { PlusCircle } from 'lucide-react';
import { z } from 'zod';
import { SkillList } from '~/components/skills/SkillList';
import { Button } from '~/components/ui/button';
import { CardDescription, CardTitle } from '~/components/ui/card';
import { Separator } from '~/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '~/components/ui/tabs';

export const Route = createFileRoute('/skills')({
	component: RouteComponent,
	validateSearch: z.object({
		tab: z.enum(['soft', 'hard']).optional().default('soft'),
	}),
});

export default function RouteComponent() {
	//
	const { tab } = Route.useSearch();

	return (
		<div className="m-6">
			<div className="flex flex-row items-center justify-between my-4">
				<div>
					<CardTitle>Skills</CardTitle>
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
			<div>
				<Tabs defaultValue="soft" value={tab} className="w-full">
					<TabsList className="mb-4">
						<Link to="/skills" search={{ tab: 'soft' }} activeOptions={{ exact: true }}>
							<TabsTrigger value="soft" className="cursor-pointer">
								Soft Skills (AI)
							</TabsTrigger>
						</Link>
						<Link to="/skills" search={{ tab: 'hard' }} activeOptions={{ exact: true }}>
							<TabsTrigger value="hard" className="cursor-pointer">
								Hard Skills (HTTP)
							</TabsTrigger>
						</Link>
					</TabsList>
					<Separator className="mb-4" />
					<TabsContent value="soft">
						<SkillList kind={'soft'} />
					</TabsContent>
					<TabsContent value="hard">
						<SkillList kind={'hard'} />
					</TabsContent>
				</Tabs>
			</div>
		</div>
	);
}
