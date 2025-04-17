import { Doc } from 'convex/_generated/dataModel';
import { useState } from 'react';
import { Separator } from '~/components/ui/separator';
import { BasicInfoFields } from './BasicInfoFields';
import { FormActions } from './FormActions';
import { HardSkillConfig } from './HardSkillConfig';
import { SkillKindSelector } from './SkillKindSelector';
import { SoftSkillConfig } from './SoftSkillConfig';

interface UnifiedSkillFormProps {
	skill?: Doc<'skills'>;
	isCloning?: boolean;
}

export function UnifiedSkillForm({ skill, isCloning = false }: UnifiedSkillFormProps) {
	//
	// We're only creating the UI shell for now - all state and logic will be added later
	const [skillKind, setSkillKind] = useState<'soft' | 'hard'>('soft');
	const [inputSchema, setInputSchema] = useState('z.object({})');

	return (
		<form className="space-y-6">
			{/* Skill Kind Selector - only shown when creating new skills */}
			{!skill && <SkillKindSelector value={skillKind} onValueChange={setSkillKind} />}

			{/* Basic Info Fields */}
			<BasicInfoFields
				isHardSkill={skillKind === 'hard'}
				inputSchema={inputSchema}
				onInputSchemaChange={setInputSchema}
			/>

			<Separator />

			{/* Skill-specific configuration */}
			{skillKind === 'soft' ? <SoftSkillConfig /> : <HardSkillConfig />}

			{/* Form Actions */}
			<FormActions isEditing={Boolean(skill)} isCloning={isCloning} />
		</form>
	);
}
