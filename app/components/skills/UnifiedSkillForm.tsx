import { useNavigate } from '@tanstack/react-router';
import { api } from 'convex/_generated/api';
import { Doc, Id } from 'convex/_generated/dataModel';
import { useMutation, useQuery } from 'convex/react';
import { decisionConfigSchema, skillSchema } from 'convex/schemas/skillSchema';
import { asBigInt } from 'convex/utils/money';
import { InfoIcon, Trash, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { z } from 'zod';
import { ZodEditor } from '~/components/skills/ZodEditor';
import { Badge } from '~/components/ui/badge';
import { Button } from '~/components/ui/button';
import { Card, CardContent } from '~/components/ui/card';
import { Combobox, ComboboxOption } from '~/components/ui/combobox';
import { LabelWithTooltip } from '~/components/ui/form-tooltip';
import { Input } from '~/components/ui/input';
import { ScrollArea } from '~/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '~/components/ui/select';
import { Separator } from '~/components/ui/separator';
import { Slider } from '~/components/ui/slider';
import { Tabs, TabsList, TabsTrigger } from '~/components/ui/tabs';
import { Textarea } from '~/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '~/components/ui/tooltip';

// Define our unified skill type based on the schema
type Skill = z.infer<typeof skillSchema>;
type DecisionConfig = z.infer<typeof decisionConfigSchema>;

interface BasicSkill {
	_id: Id<'skills'>;
	key: string;
	kind: 'soft' | 'hard' | 'built-in';
	description: string;
}

interface UnifiedSkillFormProps {
	skillId?: string;
	isCloning?: boolean;
}

export function UnifiedSkillForm({ skillId, isCloning = false }: UnifiedSkillFormProps) {
	//
	const navigate = useNavigate({ from: '/skills' });

	// State for skill kind
	const [skillKind, setSkillKind] = useState<'soft' | 'hard'>('soft');

	// State for shared form fields
	const [commonFields, setCommonFields] = useState({
		key: '',
		description: '',
		inputSchema: 'z.object({})',
		preApprovedCost: 'none',
		cost: '0.01',
	});

	// State for soft skill specific fields
	const [softSkillConfig, setSoftSkillConfig] = useState({
		model: 'groq/llama-4-maverick',
		instructions: '',
		temperature: 0.7,
		availableSkills: [] as string[],
		historyMode: 'since last summarized' as DecisionConfig['historyMode'],
		bodyTemplate: '{}',
	});

	// State for hard skill specific fields
	const [hardSkillConfig, setHardSkillConfig] = useState({
		url: '',
		method: 'GET' as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
		headers: {} as Record<string, string>,
		paramMappings: [] as Array<{
			type: 'search' | 'header' | 'path' | 'body';
			source: string;
			target: string;
		}>,
		bodyTemplate: '{}',
		knownReactions: [] as Array<{
			skillKey: string;
			args: Record<string, any>;
			condition: 'owner' | 'companion' | 'any';
		}>,
	});

	// Temporary state for parameter mappings
	const [newParamMapping, setNewParamMapping] = useState<{
		type: 'search' | 'header' | 'path' | 'body';
		source: string;
		target: string;
	}>({
		type: 'search',
		source: '',
		target: '',
	});

	// Temporary state for headers
	const [newHeader, setNewHeader] = useState({
		key: '',
		value: '',
	});

	// State for available skills selection
	const [newSkillKey, setNewSkillKey] = useState('');
	const [newReactionCondition, setNewReactionCondition] = useState<'owner' | 'companion' | 'any'>('any');

	// Get all skills
	// const allSkills = useQuery(api.skills.public.findAll, {}) || [];
	const allSkills = [] as Doc<'skills'>[];

	// Fetch skill data if editing
	const skillData = useQuery(api.skills.public.findOne, skillId ? { skillId: skillId as Id<'skills'> } : 'skip');

	// Mutations
	const createSkill = useMutation(api.skills.public.create);
	const updateSkill = useMutation(api.skills.public.update);

	// Model options for the combobox
	const modelOptions: ComboboxOption[] = [
		{ value: 'groq/llama-4-maverick', label: 'Llama 4 Maverick (Primary)' },
		{ value: 'openai/gpt-4o', label: 'GPT-4o' },
		{ value: 'anthropic/claude-3-opus', label: 'Claude 3 Opus' },
	];

	// Load initial data
	useEffect(() => {
		//
		// Load from API if editing existing skill
		if (skillData && (skillId || isCloning)) {
			const kind = skillData.kind === 'built-in' ? 'soft' : skillData.kind;
			setSkillKind(kind);

			// Set common fields
			setCommonFields({
				key: isCloning ? `${skillData.key}_clone` : skillData.key,
				description: skillData.description,
				inputSchema: skillData.inputSchema,
				preApprovedCost:
					typeof skillData.preApprovedCost === 'bigint'
						? skillData.preApprovedCost.toString()
						: skillData.preApprovedCost,
				cost:
					typeof skillData.cost === 'bigint'
						? skillData.cost.toString()
						: skillData.cost === 'dynamic'
							? '0.01'
							: '0.01',
			});

			// Set kind-specific config
			if (kind === 'soft') {
				setSoftSkillConfig({
					model: skillData.config.model,
					instructions: skillData.config.instructions,
					temperature: skillData.config.temperature,
					availableSkills: skillData.config.availableSkills || [],
					historyMode: skillData.config.historyMode,
					bodyTemplate: JSON.stringify(skillData.config.bodyTemplate || {}, null, 2),
				});
			} else if (kind === 'hard') {
				setHardSkillConfig({
					url: skillData.config.url,
					method: skillData.config.method,
					headers: skillData.config.headers || {},
					paramMappings: skillData.config.paramMappings || [],
					bodyTemplate: JSON.stringify(skillData.config.bodyTemplate || {}, null, 2),
					knownReactions: skillData.knownReactions || [],
				});
			}
		}
	}, [skillData, skillId, isCloning]);

	// Handle form submission
	const handleSubmit = async (e: React.FormEvent) => {
		//
		e.preventDefault();

		try {
			// Parse JSON for body templates
			let bodyTemplate = {};

			try {
				if (skillKind === 'soft') {
					bodyTemplate = JSON.parse(softSkillConfig.bodyTemplate);
				} else {
					bodyTemplate = JSON.parse(hardSkillConfig.bodyTemplate);
				}
			} catch (error) {
				toast.error('Invalid JSON', {
					description: 'The body template contains invalid JSON',
				});
				return;
			}

			// Convert preApprovedCost
			const preApprovedCostValue =
				commonFields.preApprovedCost === 'none'
					? ('none' as const)
					: asBigInt({ dollars: parseFloat(commonFields.preApprovedCost) });

			// Create submission data based on skill kind
			let submissionData;

			if (skillKind === 'soft') {
				submissionData = {
					key: commonFields.key,
					kind: 'soft' as const,
					description: commonFields.description,
					inputSchema: commonFields.inputSchema,
					preApprovedCost: preApprovedCostValue,
					cost: 'dynamic' as const, // Soft skills always use dynamic cost
					config: {
						model: softSkillConfig.model,
						instructions: softSkillConfig.instructions,
						temperature: Number(softSkillConfig.temperature),
						availableSkills: softSkillConfig.availableSkills,
						historyMode: softSkillConfig.historyMode,
						body: {
							template: bodyTemplate,
						},
					},
				};
			} else {
				submissionData = {
					key: commonFields.key,
					kind: 'hard' as const,
					description: commonFields.description,
					inputSchema: commonFields.inputSchema,
					preApprovedCost: preApprovedCostValue,
					cost: asBigInt({ dollars: parseFloat(commonFields.cost) }),
					knownReactions: hardSkillConfig.knownReactions,
					config: {
						url: hardSkillConfig.url,
						method: hardSkillConfig.method,
						headers: hardSkillConfig.headers,
						paramMappings: hardSkillConfig.paramMappings,
						body: {
							template: bodyTemplate,
						},
					},
				};
			}

			// Create or update the skill
			if (skillId && !isCloning) {
				await updateSkill({ id: skillId as Id<'skills'>, ...submissionData });
				toast.success('Skill updated', {
					description: 'Your skill has been updated successfully',
				});
			} else {
				await createSkill(submissionData);
				toast.success('Skill created', {
					description: 'Your skill has been created successfully',
				});
			}

			// Navigate back to the skills list
			navigate({ to: '/skills' as const });
		} catch (error) {
			toast.error('Error', {
				description: `Failed to ${skillId && !isCloning ? 'update' : 'create'} skill: ${error}`,
			});
		}
	};

	// Handle changes to common fields
	const handleCommonChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setCommonFields((prev) => ({ ...prev, [name]: value }));
	};

	// Handle select changes
	const handleSelectChange = (name: string, value: string) => {
		if (name.startsWith('softSkillConfig.')) {
			const field = name.split('.')[1];
			setSoftSkillConfig((prev) => ({ ...prev, [field]: value }));
		} else if (name.startsWith('hardSkillConfig.')) {
			const field = name.split('.')[1];
			setHardSkillConfig((prev) => ({ ...prev, [field]: value }));
		} else {
			setCommonFields((prev) => ({ ...prev, [name]: value }));
		}
	};

	// Handle schema changes
	const handleSchemaChange = (schema: string) => {
		setCommonFields((prev) => ({ ...prev, inputSchema: schema }));
	};

	// Soft skill specific handlers
	const handleAddAvailableSkill = () => {
		if (!newSkillKey) return;

		setSoftSkillConfig((prev) => ({
			...prev,
			availableSkills: [...prev.availableSkills, newSkillKey],
		}));

		setNewSkillKey('');
	};

	const handleRemoveAvailableSkill = (skill: string) => {
		setSoftSkillConfig((prev) => ({
			...prev,
			availableSkills: prev.availableSkills.filter((s) => s !== skill),
		}));
	};

	// Hard skill specific handlers
	const handleAddParamMapping = () => {
		if (!newParamMapping.source || !newParamMapping.target) return;

		setHardSkillConfig((prev) => ({
			...prev,
			paramMappings: [...prev.paramMappings, { ...newParamMapping }],
		}));

		setNewParamMapping({
			type: 'search',
			source: '',
			target: '',
		});
	};

	const handleRemoveParamMapping = (index: number) => {
		setHardSkillConfig((prev) => ({
			...prev,
			paramMappings: prev.paramMappings.filter((_, i) => i !== index),
		}));
	};

	const handleAddHeader = () => {
		if (!newHeader.key || !newHeader.value) return;

		setHardSkillConfig((prev) => ({
			...prev,
			headers: {
				...prev.headers,
				[newHeader.key]: newHeader.value,
			},
		}));

		setNewHeader({ key: '', value: '' });
	};

	const handleRemoveHeader = (headerKey: string) => {
		const newHeaders = { ...hardSkillConfig.headers };
		delete newHeaders[headerKey];

		setHardSkillConfig((prev) => ({
			...prev,
			headers: newHeaders,
		}));
	};

	const handleAddReaction = () => {
		if (!newSkillKey) return;

		setHardSkillConfig((prev) => ({
			...prev,
			knownReactions: [
				...prev.knownReactions,
				{
					skillKey: newSkillKey,
					args: {},
					condition: newReactionCondition,
				},
			],
		}));

		setNewSkillKey('');
	};

	const handleRemoveReaction = (index: number) => {
		setHardSkillConfig((prev) => ({
			...prev,
			knownReactions: prev.knownReactions.filter((_, i) => i !== index),
		}));
	};

	return (
		<form onSubmit={handleSubmit} className="space-y-6">
			{/* Skill Type Selection */}
			{!skillId && (
				<div>
					<LabelWithTooltip tooltip="Choose between a decision-making soft skill powered by AI, or a hard skill that connects to external services.">
						What kind of skill?
					</LabelWithTooltip>
					<Tabs
						value={skillKind}
						onValueChange={(value) => setSkillKind(value as 'soft' | 'hard')}
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
												AI-powered skills that make decisions, effectively controlling the
												reaction chain.
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
												API-based skills that connect to external apps and execute specific
												actions.
											</p>
										</TooltipContent>
									</Tooltip>
								</TooltipProvider>
							</TabsTrigger>
						</TabsList>
					</Tabs>
				</div>
			)}

			{/* Common Fields */}
			<div className="space-y-4">
				{/* <h2 className="text-lg font-medium">Basic Information</h2> */}

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
							value={commonFields.key}
							onChange={handleCommonChange}
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
							<div className={`${commonFields.preApprovedCost === 'none' ? 'w-full' : 'w-2/3'}`}>
								<Select
									value={commonFields.preApprovedCost === 'none' ? 'none' : 'auto'}
									onValueChange={(value) => {
										handleSelectChange('preApprovedCost', value === 'none' ? 'none' : '0.01');
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

							{commonFields.preApprovedCost !== 'none' && (
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
											value={commonFields.preApprovedCost}
											onChange={(e) => {
												const value = e.target.value;
												// Simple validation to ensure it's a valid positive number
												const numValue = parseFloat(value);
												if (!isNaN(numValue) && numValue >= 0) {
													handleSelectChange('preApprovedCost', value);
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
						value={commonFields.description}
						onChange={handleCommonChange}
						placeholder="Describe what this skill does"
						className="min-h-[100px]"
						required
					/>
				</div>

				{/* Input Schema - Only for hard skills */}
				{skillKind === 'hard' && (
					<div className="space-y-2">
						<LabelWithTooltip
							htmlFor="inputSchema"
							tooltip="Define the expected input parameters using Zod schema"
						>
							Input Schema
						</LabelWithTooltip>
						<ZodEditor value={commonFields.inputSchema} onChange={handleSchemaChange} />
					</div>
				)}
			</div>

			<Separator />

			{/* Skill-specific configuration */}
			{skillKind === 'soft' ? (
				<div className="space-y-4">
					<h2 className="text-lg font-medium">AI Configuration</h2>

					<div className="space-y-4">
						<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
							<div className="space-y-2">
								<LabelWithTooltip
									htmlFor="model"
									tooltip="The AI model that will power this skill. Different models have different capabilities and costs."
								>
									Intelligence
								</LabelWithTooltip>
								<Combobox
									options={modelOptions}
									value={softSkillConfig.model}
									onChange={(value) => handleSelectChange('softSkillConfig.model', value)}
									placeholder="Select model"
								/>
							</div>

							<div className="space-y-2">
								<LabelWithTooltip
									htmlFor="temperature"
									tooltip="Controls randomness: lower values mean more deterministic, higher values mean more creative. The *higher* it is, the more likely to hallucinate it gets."
								>
									Temperature
								</LabelWithTooltip>
								<div className="flex flex-col space-y-2">
									<div className="flex justify-between items-center">
										<span className="text-sm text-muted-foreground">Deterministic</span>
										<span className="text-sm font-medium tabular-nums">
											{softSkillConfig.temperature.toFixed(2)}
										</span>
										<span className="text-sm text-muted-foreground">Creative</span>
									</div>
									<Slider
										id="temperature"
										min={0}
										max={2}
										step={0.01}
										value={[softSkillConfig.temperature]}
										onValueChange={(values) =>
											setSoftSkillConfig((prev) => ({ ...prev, temperature: values[0] }))
										}
										className="mt-2"
									/>
								</div>
							</div>
						</div>

						<div className="space-y-2">
							<LabelWithTooltip
								htmlFor="instructions"
								tooltip="Detailed instructions for the AI model on how to perform this skill. Be specific and comprehensive."
							>
								Instructions
							</LabelWithTooltip>
							<Textarea
								id="instructions"
								value={softSkillConfig.instructions}
								onChange={(e) =>
									setSoftSkillConfig((prev) => ({ ...prev, instructions: e.target.value }))
								}
								placeholder="Detailed instructions for the model"
								className="min-h-[200px]"
								required
							/>
						</div>

						{/* <div className="space-y-2">
							<LabelWithTooltip
								htmlFor="config.historyMode"
								tooltip="Controls how much conversation history is included when executing this skill."
							>
								History Mode
							</LabelWithTooltip>
							<Select
								value={softSkillConfig.historyMode}
								onValueChange={(value) =>
									setSoftSkillConfig((prev) => ({
										...prev,
										historyMode: value as DecisionConfig['historyMode'],
									}))
								}
							>
								<SelectTrigger>
									<SelectValue placeholder="Select history mode" />
								</SelectTrigger>
								<SelectContent>
									<SelectItem value="since last summarized">Since Last Summarized</SelectItem>
									<SelectItem value="since last instructed">Since Last Instructed</SelectItem>
									<SelectItem value="all">All History</SelectItem>
								</SelectContent>
							</Select>
						</div> */}

						<div className="space-y-2">
							<LabelWithTooltip
								htmlFor="Available skills"
								tooltip="Soft skills will always finish with exactly 1 reaction (never 0, never 2). This list is the set of options it has to choose from."
							>
								Available skills
							</LabelWithTooltip>
							<div className="flex gap-2">
								<Select value={newSkillKey} onValueChange={setNewSkillKey}>
									<SelectTrigger className="w-full">
										<SelectValue placeholder="Select a skill" />
									</SelectTrigger>
									<SelectContent>
										{allSkills
											.filter((skill: BasicSkill) => skill.key !== commonFields.key)
											.map((skill: BasicSkill) => (
												<SelectItem key={skill.key} value={skill.key}>
													{skill.key}
												</SelectItem>
											))}
									</SelectContent>
								</Select>
								<Button type="button" onClick={handleAddAvailableSkill} disabled={!newSkillKey}>
									Add
								</Button>
							</div>

							{softSkillConfig.availableSkills.length > 0 ? (
								<ScrollArea className="h-32 border rounded-md p-4">
									<div className="flex flex-wrap gap-2">
										{softSkillConfig.availableSkills.map((skill) => (
											<Badge key={skill} variant="secondary" className="flex items-center gap-1">
												{skill}
												<Button
													type="button"
													variant="ghost"
													size="icon"
													className="h-4 w-4 ml-1 p-0"
													onClick={() => handleRemoveAvailableSkill(skill)}
												>
													<X className="h-3 w-3" />
												</Button>
											</Badge>
										))}
									</div>
								</ScrollArea>
							) : (
								<div className="text-center p-4 border rounded-md text-muted-foreground">
									No skills connected
								</div>
							)}
						</div>
					</div>
				</div>
			) : (
				<div className="space-y-6">
					<h2 className="text-lg font-medium">HTTP Configuration</h2>

					<div className="space-y-4">
						<div className="grid gap-4 grid-cols-1 md:grid-cols-2">
							<div className="space-y-2">
								<LabelWithTooltip
									htmlFor="cost"
									tooltip="The cost to run this skill each time it's used."
								>
									Cost per use (in $)
								</LabelWithTooltip>
								<Select
									value={commonFields.cost}
									onValueChange={(value) => handleSelectChange('cost', value)}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select cost" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="0">$0 (Free)</SelectItem>
										<SelectItem value="0.001">$0.001</SelectItem>
										<SelectItem value="0.01">$0.01</SelectItem>
										<SelectItem value="0.05">$0.05</SelectItem>
										<SelectItem value="0.1">$0.10</SelectItem>
									</SelectContent>
								</Select>
							</div>

							<div className="space-y-2">
								<LabelWithTooltip
									htmlFor="method"
									tooltip="The HTTP method to use for the API request."
								>
									HTTP Method
								</LabelWithTooltip>
								<Select
									value={hardSkillConfig.method}
									onValueChange={(value) =>
										setHardSkillConfig((prev) => ({
											...prev,
											method: value as 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH',
										}))
									}
								>
									<SelectTrigger>
										<SelectValue placeholder="Select method" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="GET">GET</SelectItem>
										<SelectItem value="POST">POST</SelectItem>
										<SelectItem value="PUT">PUT</SelectItem>
										<SelectItem value="DELETE">DELETE</SelectItem>
										<SelectItem value="PATCH">PATCH</SelectItem>
									</SelectContent>
								</Select>
							</div>
						</div>

						<div className="space-y-2">
							<LabelWithTooltip htmlFor="url" tooltip="The endpoint URL that this skill will call.">
								URL
							</LabelWithTooltip>
							<Input
								id="url"
								value={hardSkillConfig.url}
								onChange={(e) => setHardSkillConfig((prev) => ({ ...prev, url: e.target.value }))}
								placeholder="https://api.example.com/endpoint"
								required
							/>
						</div>

						{/* Headers */}
						<div className="space-y-2">
							<LabelWithTooltip
								htmlFor="Headers"
								tooltip="HTTP headers to include with the request, such as authorization tokens."
							>
								Headers
							</LabelWithTooltip>
							<Card>
								<CardContent className="pt-4">
									<div className="space-y-4">
										<div className="flex gap-2">
											<Input
												placeholder="Header name"
												value={newHeader.key}
												onChange={(e) => setNewHeader({ ...newHeader, key: e.target.value })}
											/>
											<Input
												placeholder="Header value"
												value={newHeader.value}
												onChange={(e) => setNewHeader({ ...newHeader, value: e.target.value })}
											/>
											<Button
												type="button"
												onClick={handleAddHeader}
												disabled={!newHeader.key || !newHeader.value}
											>
												Add
											</Button>
										</div>

										{Object.keys(hardSkillConfig.headers).length > 0 ? (
											<div className="space-y-2">
												{Object.entries(hardSkillConfig.headers).map(([key, value]) => (
													<div
														key={key}
														className="flex justify-between items-center p-2 rounded bg-muted/50"
													>
														<div className="flex gap-2">
															<span className="font-medium">{key}:</span>
															<span>{value}</span>
														</div>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() => handleRemoveHeader(key)}
														>
															<Trash className="h-4 w-4" />
														</Button>
													</div>
												))}
											</div>
										) : (
											<div className="text-center p-4 text-muted-foreground">
												No headers defined
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Body Template */}
						<div className="space-y-2">
							<LabelWithTooltip
								htmlFor="bodyTemplate"
								tooltip="JSON template for the request body. Use {'{parameter}'} for dynamic values."
							>
								Body Template
							</LabelWithTooltip>
							<Textarea
								id="bodyTemplate"
								value={hardSkillConfig.bodyTemplate}
								onChange={(e) => {
									setHardSkillConfig((prev) => ({ ...prev, bodyTemplate: e.target.value }));
								}}
								placeholder="{}"
								className="font-mono h-32"
							/>
						</div>

						{/* Parameter Mappings */}
						<div className="space-y-2">
							<LabelWithTooltip
								htmlFor="Parameter Mappings"
								tooltip="Define how input parameters should be mapped to the API request."
							>
								Parameter Mappings
							</LabelWithTooltip>
							<Card>
								<CardContent className="pt-4">
									<div className="space-y-4">
										<div className="flex gap-2 flex-wrap">
											<Select
												value={newParamMapping.type}
												onValueChange={(value) =>
													setNewParamMapping({
														...newParamMapping,
														type: value as 'search' | 'header' | 'path' | 'body',
													})
												}
											>
												<SelectTrigger className="w-28">
													<SelectValue placeholder="Type" />
												</SelectTrigger>
												<SelectContent>
													<SelectItem value="search">Query</SelectItem>
													<SelectItem value="header">Header</SelectItem>
													<SelectItem value="path">Path</SelectItem>
													<SelectItem value="body">Body</SelectItem>
												</SelectContent>
											</Select>

											<Input
												placeholder="Source (parameter name)"
												value={newParamMapping.source}
												onChange={(e) =>
													setNewParamMapping({ ...newParamMapping, source: e.target.value })
												}
												className="flex-1"
											/>

											<Input
												placeholder="Target (API parameter name)"
												value={newParamMapping.target}
												onChange={(e) =>
													setNewParamMapping({ ...newParamMapping, target: e.target.value })
												}
												className="flex-1"
											/>

											<Button
												type="button"
												onClick={handleAddParamMapping}
												disabled={!newParamMapping.source || !newParamMapping.target}
											>
												Add
											</Button>
										</div>

										{hardSkillConfig.paramMappings.length > 0 ? (
											<div className="space-y-2">
												{hardSkillConfig.paramMappings.map((param, index) => (
													<div
														key={index}
														className="flex justify-between items-center p-2 rounded bg-muted/50"
													>
														<div>
															<Badge className="mr-2">{param.type}</Badge>
															<span className="font-medium">{param.source}</span>
															<span className="mx-2">→</span>
															<span>{param.target}</span>
														</div>
														<Button
															type="button"
															variant="ghost"
															size="icon"
															onClick={() => handleRemoveParamMapping(index)}
														>
															<Trash className="h-4 w-4" />
														</Button>
													</div>
												))}
											</div>
										) : (
											<div className="text-center p-4 text-muted-foreground">
												No parameter mappings defined
											</div>
										)}
									</div>
								</CardContent>
							</Card>
						</div>

						{/* Known Reactions */}
						<div className="space-y-2">
							<LabelWithTooltip
								htmlFor="Known Reactions"
								tooltip="Skills that should automatically run after this skill is used."
							>
								Known Reactions
							</LabelWithTooltip>
							<div className="flex gap-2 flex-wrap">
								<Select value={newSkillKey} onValueChange={setNewSkillKey}>
									<SelectTrigger className="flex-1">
										<SelectValue placeholder="Select a skill" />
									</SelectTrigger>
									<SelectContent>
										{allSkills
											.filter((skill: BasicSkill) => skill.key !== commonFields.key)
											.map((skill: BasicSkill) => (
												<SelectItem key={skill.key} value={skill.key}>
													{skill.key}
												</SelectItem>
											))}
									</SelectContent>
								</Select>

								<Select
									value={newReactionCondition}
									onValueChange={(value) =>
										setNewReactionCondition(value as 'owner' | 'companion' | 'any')
									}
								>
									<SelectTrigger className="w-40">
										<SelectValue placeholder="Condition" />
									</SelectTrigger>
									<SelectContent>
										<SelectItem value="owner">Owner</SelectItem>
										<SelectItem value="companion">Companion</SelectItem>
										<SelectItem value="any">Any</SelectItem>
									</SelectContent>
								</Select>

								<Button type="button" onClick={handleAddReaction} disabled={!newSkillKey}>
									Add
								</Button>
							</div>

							{hardSkillConfig.knownReactions.length > 0 ? (
								<div className="space-y-2 mt-2">
									{hardSkillConfig.knownReactions.map((reaction, index) => (
										<div
											key={index}
											className="flex justify-between items-center p-2 rounded bg-muted/50"
										>
											<div>
												<span className="font-medium">{reaction.skillKey}</span>
												<Badge className="ml-2" variant="outline">
													{reaction.condition}
												</Badge>
											</div>
											<Button
												type="button"
												variant="ghost"
												size="icon"
												onClick={() => handleRemoveReaction(index)}
											>
												<Trash className="h-4 w-4" />
											</Button>
										</div>
									))}
								</div>
							) : (
								<div className="text-center p-4 border rounded-md text-muted-foreground mt-2">
									No reactions defined
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{/* Advanced Fields */}
			<div className="space-y-4">
				<h2 className="text-lg font-medium">Advanced</h2>

				<div className="space-y-2">
					<LabelWithTooltip
						htmlFor="inputSchema"
						tooltip="Define the expected input parameters using Zod schema"
					>
						Input Schema
					</LabelWithTooltip>
					<ZodEditor value={commonFields.inputSchema} onChange={handleSchemaChange} />
				</div>

				<div className="space-y-2">
					<LabelWithTooltip
						htmlFor="bodyTemplate"
						tooltip="JSON template for the request/response body. Use {'{parameter}'} for dynamic values."
					>
						Body Template
					</LabelWithTooltip>
					<Textarea
						id="bodyTemplate"
						value={skillKind === 'soft' ? softSkillConfig.bodyTemplate : hardSkillConfig.bodyTemplate}
						onChange={(e) => {
							if (skillKind === 'soft') {
								setSoftSkillConfig((prev) => ({ ...prev, bodyTemplate: e.target.value }));
							} else {
								setHardSkillConfig((prev) => ({ ...prev, bodyTemplate: e.target.value }));
							}
						}}
						placeholder="{}"
						className="font-mono h-32"
					/>
				</div>
			</div>

			{/* Form Buttons */}
			<div className="flex justify-end gap-2">
				<Button type="button" variant="outline" onClick={() => navigate({ to: '/skills' as const })}>
					Cancel
				</Button>
				<Button type="submit">{skillId && !isCloning ? 'Update' : 'Create'} Skill</Button>
			</div>
		</form>
	);
}
