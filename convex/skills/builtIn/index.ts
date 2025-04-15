import { askForClarification } from './askForClarification';
import { discard } from './discard';
import { divide } from './divide';
import { done } from './done';
import { increaseBudget } from './increaseBudget';
import { multiply } from './multiply';
import { reason } from './reason';
import { reopen } from './reopen';
import { requestBudget } from './requestBudget';
import { resolve } from './resolve';
import { say } from './say';
import { stop } from './stop';
import { subtract } from './subtract';
import { sum } from './sum';
import { updateInstructions } from './updateInstructions';

export const _builtInSkills = {
	askForClarification,
	updateInstructions,
	// updateSummary,
	// moveTask,
	// createSubtask,
	done,
	say,
	reason,
	reopen,
	increaseBudget,
	resolve,

	/* math */
	sum,
	multiply,
	divide,
	subtract,

	/* lifecycle */
	stop,
	requestBudget,
	discard,
};
