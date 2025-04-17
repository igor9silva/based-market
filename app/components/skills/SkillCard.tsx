import { Link } from '@tanstack/react-router';
import { Doc } from 'convex/_generated/dataModel';
import { pricingFor } from 'convex/skills/createAITool';
import { asDollars } from 'convex/utils/money';
import { Badge } from '~/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '~/components/ui/card';
import { SkillTooltip } from './SkillTooltip';

/**
 * Skill card with basic information and available actions
 */
export function SkillCard({ skill }: { skill: Doc<'skills'> }) {
	//
	const availableSkills = skill.kind === 'soft' ? skill.config?.availableSkills ?? [] : [];
	const knownReactions = skill.kind === 'hard' ? skill.knownReactions ?? [] : [];

	return (
		<Link
			to="/skills/$id"
			params={{ id: skill._id }}
			className="block transition-all hover:scale-[1.01] focus:scale-[1.01] hover:shadow-md focus:shadow-md outline-none"
		>
			<Card className="flex flex-col h-full">
				<CardHeader className="pb-2">
					<div>
						<CardTitle className="text-lg">{skill.key}</CardTitle>
						<CardDescription className="mt-1 line-clamp-2 min-h-[40px]">
							{skill.description}
						</CardDescription>
					</div>
				</CardHeader>
				<CardContent className="flex-grow pt-2">
					<div className="grid grid-rows-[auto_auto] gap-2 h-full">
						<div className="flex items-center gap-2">
							{skill.kind === 'soft' ? (
								<Badge variant="secondary" className="text-xs font-medium">
									{skill.config.model}
								</Badge>
							) : (
								<Badge variant="secondary">HTTP</Badge>
							)}

							{availableSkills.length > 0 && (
								<SkillTooltip
									badgeLabel={availableSkills.length === 1 ? 'skill' : 'skills'}
									tooltipTitle="Model can choose between"
									items={availableSkills}
								/>
							)}

							{knownReactions.length > 0 && (
								<SkillTooltip
									badgeLabel={knownReactions.length === 1 ? 'reaction' : 'reactions'}
									tooltipTitle="Known reactions"
									items={knownReactions.map((reaction) => reaction.skillKey)}
								/>
							)}
						</div>

						<div className="mt-auto pt-2 border-t text-xs text-muted-foreground">
							<Pricing skill={skill} />
						</div>
					</div>
				</CardContent>
			</Card>
		</Link>
	);
}

function Pricing({ skill }: { skill: Doc<'skills'> }) {
	//

	if (skill.cost !== 'dynamic') {
		return (
			<div className="flex items-center justify-center">
				<span>{asDollars({ bigInt: skill.cost, precision: 4 })}$ per use</span>
			</div>
		);
	}

	if (skill.config.model === 'auto') {
		return (
			<div className="flex items-center justify-center">
				<span>Cost depends on selected task intelligence</span>
			</div>
		);
	}

	const price = pricingFor(skill.config.model);

	return (
		<div className="flex items-center justify-between">
			<span>{asDollars({ bigInt: price.inputToken * 1_000_000n })}$/M tokens in</span>
			<span>{asDollars({ bigInt: price.outputToken * 1_000_000n })}$/M tokens out</span>
		</div>
	);
}
