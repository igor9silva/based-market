import { Suspense, useState } from 'react';
import { Input } from '~/components/ui/input';
import { SkillCardSkeleton } from './SkillCardSkeleton';
import { SkillListContent } from './SkillListContent';

/**
 * Main skills list component that:
 * 1. Renders the search input for filtering skills
 * 2. Uses suspense to show loading state
 * 3. Uses URL-based tab state (handled by parent component)
 */
export function SkillList({ kind }: { kind: 'soft' | 'hard' }) {
	//
	const [searchTerm, setSearchTerm] = useState('');

	return (
		<div className="space-y-4">
			<div className="flex items-center space-x-2">
				<Input
					placeholder="Search skills..."
					value={searchTerm}
					onChange={(e) => setSearchTerm(e.target.value)}
					className="max-w-sm"
				/>
			</div>

			<Suspense
				fallback={
					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{Array.from({ length: 6 }).map((_, i) => (
							<SkillCardSkeleton key={i} />
						))}
					</div>
				}
			>
				<SkillListContent kind={kind} searchTerm={searchTerm} />
			</Suspense>
		</div>
	);
}
