import { ZodEditor } from '~/components/skills/ZodEditor';
import { LabelWithTooltip } from '~/components/ui/form-tooltip';
import { Input } from '~/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Textarea } from '~/components/ui/textarea';

interface BasicInfoFieldsProps {
	keyValue?: string;
	onKeyChange?: (value: string) => void;
	description?: string;
	onDescriptionChange?: (value: string) => void;
	preApprovedCost?: string;
	onPreApprovedCostChange?: (value: string) => void;
	inputSchema?: string;
	onInputSchemaChange?: (value: string) => void;
	isHardSkill?: boolean;
}

export function BasicInfoFields({
	keyValue = '',
	onKeyChange = () => {},
	description = '',
	onDescriptionChange = () => {},
	preApprovedCost = 'none',
	onPreApprovedCostChange = () => {},
	inputSchema = 'z.object({})',
	onInputSchemaChange = () => {},
	isHardSkill = false,
}: BasicInfoFieldsProps) {
	//
	const isPreApproved = preApprovedCost !== 'none';

	return (
		<div className="space-y-4">
			<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
				<div className="space-y-2">
					<LabelWithTooltip
						htmlFor="key"
						tooltip="A unique identifier for this skill. e.g. searchWeb, gmail_move, etc."
					>
						Key (unique identifier)
					</LabelWithTooltip>
					<Input
						id="key"
						name="key"
						value={keyValue}
						onChange={(e) => onKeyChange(e.target.value)}
						placeholder="e.g., searchWeb, processImage"
						required
					/>
				</div>

				<div className="space-y-2">
					<LabelWithTooltip
						htmlFor="authorization"
						tooltip="Controls when this skill requires human approval. You can allow it to be executed by Meseeks with no human approval up to a certain cost, but it'll still be subject to other limits, such as amount of consecutive actions."
					>
						Authorization
					</LabelWithTooltip>
					<div className="flex flex-row items-center gap-3 w-full">
						<div className={`${!isPreApproved ? 'w-full' : 'w-2/3'}`}>
							<Select
								value={isPreApproved ? 'auto' : 'none'}
								onValueChange={(value) => {
									onPreApprovedCostChange(value === 'none' ? 'none' : '0.01');
								}}
							>
								<SelectTrigger className="w-full">
									<SelectValue placeholder="Select authorization type" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="none">Always require human authorization</SelectItem>
									<SelectItem value="auto">Perform automatically up to</SelectItem>
								</SelectContent>
							</Select>
						</div>

						{isPreApproved && (
							<div className="flex items-center gap-1 w-1/3">
								<div className="relative flex-1">
									<span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-sm font-medium text-gray-500">
										$
									</span>
									<Input
										id="preApprovedCostValue"
										type="number"
										min="0"
										step="0.01"
										placeholder="0.10"
										value={preApprovedCost}
										onChange={(e) => {
											const value = e.target.value;
											// Simple validation to ensure it's a valid positive number
											const numValue = parseFloat(value);
											if (!isNaN(numValue) && numValue >= 0) {
												onPreApprovedCostChange(value);
											}
										}}
										className="pl-6 w-full"
									/>
								</div>
							</div>
						)}
					</div>
				</div>
			</div>

			<div className="space-y-2">
				<LabelWithTooltip
					htmlFor="description"
					tooltip="A clear description of what this skill does. This is visible to LLMs, so you must include instructions on how to use that skill, how to fill in input params, etc."
				>
					Description
				</LabelWithTooltip>
				<Textarea
					id="description"
					name="description"
					value={description}
					onChange={(e) => onDescriptionChange(e.target.value)}
					placeholder="Describe what this skill does"
					className="min-h-[100px]"
					required
				/>
			</div>

			{/* Input Schema - Only for hard skills */}
			{isHardSkill && (
				<div className="space-y-2">
					<LabelWithTooltip
						htmlFor="inputSchema"
						tooltip="Define the expected input parameters using Zod schema"
					>
						Input Schema
					</LabelWithTooltip>
					<ZodEditor value={inputSchema} onChange={onInputSchemaChange} />
				</div>
			)}
		</div>
	);
}
