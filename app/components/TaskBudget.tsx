import { Doc } from 'convex/_generated/dataModel';
import { asDollars } from 'convex/utils/money';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';
import { cn } from '~/lib/utils';

export function TaskBudget({
	task, //
	className,
}: {
	task: Doc<'tasks'>;
	className?: string;
}) {
	//
	const available = task.budgetUSDC.available;
	const total = task.budgetUSDC.total;
	const spent = total - available;
	const percentSpent = total > 0n ? Number((spent * 100n) / total) : 0;

	const color = useMemo(() => {
		//
		// Normalize percentage to 0-1 range, capped at 0.9 (90%)
		const normalizedPercent = Math.min(percentSpent / 90, 1);

		// RGB values for green (0, 192, 134) to red (239, 68, 68)
		const r = Math.round(0 + normalizedPercent * 239);
		const g = Math.round(192 - normalizedPercent * 124);
		const b = Math.round(134 - normalizedPercent * 66);

		return `rgb(${r}, ${g}, ${b})`;
		//
	}, [percentSpent]);

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<div className={cn('flex flex-col items-end text-right whitespace-nowrap', className)}>
						{task.isActive ? (
							// Open task - colored available amount with total underneath
							<div className="flex flex-col">
								<div className="text-sm font-medium" style={{ color }}>
									${asDollars({ bigInt: available, precision: 3 })}
								</div>
								<div className="text-xs text-muted-foreground">
									${asDollars({ bigInt: total, precision: 3 })}
								</div>
							</div>
						) : (
							// Closed task - just final cost
							<div className="text-sm font-medium">${asDollars({ bigInt: spent, precision: 3 })}</div>
						)}
					</div>
				</TooltipTrigger>
				<TooltipContent side="bottom" align="end">
					{task.isActive ? (
						<div className="text-base space-y-1">
							<p>
								Spent <strong>{asDollars({ bigInt: spent, precision: 6 })} USDc</strong> (
								{percentSpent.toFixed(1)}%)
							</p>
							<p>
								Available <strong>{asDollars({ bigInt: available, precision: 6 })} USDc</strong>
							</p>
							<p>
								Total added <strong>{asDollars({ bigInt: total, precision: 6 })} USDc</strong>
							</p>
						</div>
					) : (
						<p className="text-base">
							Total spent <strong>{asDollars({ bigInt: spent, precision: 6 })} USDc</strong>
						</p>
					)}
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
