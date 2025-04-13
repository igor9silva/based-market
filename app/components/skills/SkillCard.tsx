import { useNavigate } from '@tanstack/react-router';
import { Doc } from 'convex/_generated/dataModel';
import { pricingFor } from 'convex/skills/createAITool';
import { asDollars } from 'convex/utils/money';
import { Copy, Eye, MoreHorizontal, Pencil, Trash } from 'lucide-react';
import { useMemo } from 'react';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '~/components/ui/card';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '~/components/ui/dropdown-menu';
import { SkillTooltip } from './SkillTooltip';

/**
 * Skill card with basic information and available actions
 */
export function SkillCard({ skill }: { skill: Doc<'skills'> }) {
	//
	const navigate = useNavigate();

	const handleAction = (action: 'view' | 'edit' | 'clone' | 'delete') => {
		//
		switch (action) {
			case 'view':
				navigate({ to: '/skills/$id', params: { id: skill._id } });
				break;
			case 'edit':
				navigate({ to: '/skills_/$id', params: { id: skill._id } });
				break;
			case 'clone':
				navigate({ to: '/skills/clone/$id', params: { id: skill._id } });
				break;
			case 'delete':
				// TODO: Implement delete
				console.log('Delete', skill._id);
				break;
		}
	};

	const cost = useMemo(() => {
		//
		if (skill.cost === 'dynamic') {
			//
			const pricing = pricingFor(skill.config.model);

			return [
				`input ${asDollars({ bigInt: pricing.inputToken * 1_000_000n })}$/Mtok`,
				`output ${asDollars({ bigInt: pricing.outputToken * 1_000_000n })}$/Mtok`,
			].join(', ');
		}

		return `${asDollars({ bigInt: skill.cost, precision: 4 })}$ per use`;
		//
	}, [skill]);

	return (
		<Card>
			<CardHeader className="pb-2">
				<div className="flex justify-between items-start">
					<div>
						<CardTitle className="text-lg">{skill.key}</CardTitle>
						{skill.kind === 'soft' && (
							<span className="text-sm text-muted-foreground">{skill.config.model}</span>
						)}
						<CardDescription className="mt-1 line-clamp-2">{skill.description}</CardDescription>
					</div>
					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<Button variant="ghost" size="icon">
								<MoreHorizontal className="h-4 w-4" />
								<span className="sr-only">Open menu</span>
							</Button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="end">
							<DropdownMenuItem onSelect={() => handleAction('view')}>
								<Eye className="mr-2 h-4 w-4" />
								View
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => handleAction('edit')}>
								<Pencil className="mr-2 h-4 w-4" />
								Edit
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => handleAction('clone')}>
								<Copy className="mr-2 h-4 w-4" />
								Clone
							</DropdownMenuItem>
							<DropdownMenuItem onSelect={() => handleAction('delete')} className="text-destructive">
								<Trash className="mr-2 h-4 w-4" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</CardHeader>
			<CardContent className="pb-2">
				<div className="flex flex-wrap gap-2 mb-2">
					<Badge variant="outline">{skill.kind === 'soft' ? 'AI' : 'HTTP'}</Badge>
					<Badge variant="secondary">{cost}</Badge>

					{skill.kind === 'soft' && (
						<SkillTooltip
							badgeLabel="skills"
							tooltipTitle="Model can choose between"
							items={skill.config?.availableSkills ?? []}
						/>
					)}

					{skill.kind === 'hard' && (
						<SkillTooltip
							badgeLabel="reactions"
							tooltipTitle="Known reactions"
							items={skill.knownReactions?.map((reaction) => reaction.skillKey) ?? []}
						/>
					)}
				</div>
			</CardContent>
			<CardFooter>
				<div className="flex justify-between w-full text-xs text-muted-foreground">
					<span>Owner: {typeof skill.owner === 'string' ? skill.owner : 'User'}</span>
					<span>Author: {typeof skill.author === 'string' ? skill.author : 'Custom'}</span>
				</div>
			</CardFooter>
		</Card>
	);
}
