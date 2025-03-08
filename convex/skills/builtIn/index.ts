import { archive } from './archive';
import { askForClarification } from './askForClarification';
import { createSubtask } from './createSubtask';
import { divide } from './divide';
import { evaluateUnderstanding } from './evaluateUnderstanding';
import { increaseBudget } from './increaseBudget';
import { moveTask } from './moveTask';
import { multiply } from './multiply';
import { reason } from './reason';
import { reopen } from './reopen';
import { resolve } from './resolve';
import { say } from './say';
import { setResolution } from './setResolution';
import { subtract } from './subtract';
import { sum } from './sum';
import { updateTask } from './updateTask';

export const _builtInSkills = {
	say,
	askForClarification,
	evaluateUnderstanding,
	reason,
	increaseBudget,
	updateTask,
	reopen,
	resolve,
	archive,
	setResolution,
	moveTask,
	createSubtask,
	sum,
	multiply,
	divide,
	subtract,
};
