import { InfoIcon } from 'lucide-react';
import { LabelWithTooltip } from '~/components/ui/form-tooltip';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

interface SkillKindSelectorProps {
	value?: 'soft' | 'hard';
	onValueChange?: (value: 'soft' | 'hard') => void;
}

export function SkillKindSelector({ value = 'soft', onValueChange = () => {} }: SkillKindSelectorProps) {
	//
	return (
		<div>
			<LabelWithTooltip tooltip="Choose between a soft skill (decision-making by AI), or a hard skill (that connects to external apps).">
				What kind of skill?
			</LabelWithTooltip>
			<Tabs
				value={value}
				onValueChange={(newValue) => onValueChange(newValue as 'soft' | 'hard')}
				className="mt-2"
			>
				<TabsList>
					<TabsTrigger value="soft" className="relative group">
						Soft (decision-making)
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<InfoIcon className="h-4 w-4 inline-block ml-1" />
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-xs">
										AI-powered skills that make decisions, effectively controlling the reaction
										chain.
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</TabsTrigger>
					<TabsTrigger value="hard" className="relative group">
						Hard (using other apps)
						<TooltipProvider>
							<Tooltip>
								<TooltipTrigger asChild>
									<InfoIcon className="h-4 w-4 inline-block ml-1" />
								</TooltipTrigger>
								<TooltipContent>
									<p className="max-w-xs">
										API-based skills that connect to external apps and execute specific actions.
									</p>
								</TooltipContent>
							</Tooltip>
						</TooltipProvider>
					</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	);
}
