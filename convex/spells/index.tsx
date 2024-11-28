'use node';

import { Doc } from '../_generated/dataModel';
import factCheck from './factCheck';
import fill from './fill';
import minify from './minify';
import scrape from './scrape';

// TODO: move spells to DB
export { genericSpell } from './generic';
export default {
	fill,
	minify,
	scrape,
	factCheck,
};

export const promptForTask = (task: Doc<'tasks'>) =>
	[
		`Here's the task as of now:`,
		`ID: ${task._id}`,
		`Title: ${task.title}`,
		`Body: ${task.body}`,
		`Created at: ${task._creationTime}`,
	].join('\n');
