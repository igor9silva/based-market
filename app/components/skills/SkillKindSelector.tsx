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
						<InfoTooltip>
							AI-powered skills that make decisions, effectively controlling the reaction chain.
						</InfoTooltip>
					</TabsTrigger>
					<TabsTrigger value="hard" className="relative group">
						Hard (using other apps)
						<InfoTooltip>
							API-based skills that connect to external apps and execute specific actions.
						</InfoTooltip>
					</TabsTrigger>
				</TabsList>
			</Tabs>
		</div>
	);
}

function InfoTooltip({ children }: { children: React.ReactNode }) {
	//
	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<InfoIcon className="h-4 w-4 inline-block ml-1" />
				</TooltipTrigger>
				<TooltipContent>{children}</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
