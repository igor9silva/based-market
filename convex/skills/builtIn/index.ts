import { askForClarification } from './askForClarification';
import { discard } from './discard';
import { divide } from './divide';
import { increaseBudget } from './increaseBudget';
import { multiply } from './multiply';
import { reopen } from './reopen';
import { resolve } from './resolve';
import { say } from './say';
import { stop } from './stop';
import { subtract } from './subtract';
import { sum } from './sum';
import { updateInstructions } from './updateInstructions';
import { updateSummary } from './updateSummary';

export const _builtInSkills = {
	discard,
	askForClarification,
	updateInstructions,
	updateSummary,
	// moveTask,
	// createSubtask,

	say,
	reopen,
	increaseBudget,
	resolve,

	/* math */
	sum,
	multiply,
	divide,
	subtract,

	stop,
};
