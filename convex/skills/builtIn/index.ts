import { askForClarification } from './askForClarification';
import { discard } from './discard';
import { divide } from './divide';
import { increaseBudget } from './increaseBudget';
import { multiply } from './multiply';
import { reopen } from './reopen';
import { resolve } from './resolve';
import { say } from './say';
import { subtract } from './subtract';
import { sum } from './sum';
import { updateInstructions } from './updateInstructions';

export const _builtInSkills = {
	// 1st step
	askForClarification,
	updateInstructions,
	discard,
	//
	// evaluateUnderstanding,
	// reason,
	// setResolution,
	// moveTask,
	// createSubtask,
	say,
	reopen,
	// ,
	increaseBudget,
	//
	// seek
	resolve,
	// math
	sum,
	multiply,
	divide,
	subtract,
};
