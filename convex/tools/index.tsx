'use node';

import { Doc } from '../_generated/dataModel';
import { ActionCtx } from '../_generated/server';
import { checkFact } from './checkFact';
import { fillTask } from './fillTask';
import { minifyDescription } from './minifyDescription';
import { scrapeLink } from './scrapeLink';
import { updateTask } from './updateTask';

export const coreTools = (
	ctx: ActionCtx, //
	task: Doc<'tasks'>,
	action: Doc<'taskActions'>,
) => ({
	updateTask: updateTask(ctx, task, action),
	fillTask: fillTask(ctx, task, action),
	minifyDescription: minifyDescription(ctx, task, action),
	scrapeLink: scrapeLink(ctx, task, action),
	checkFact: checkFact(ctx, task, action),
});

// TODO: a more robust one
export const promptForTask = (task: Doc<'tasks'>) =>
	[
		`Here's the task as of now:`,
		`ID: ${task._id}`,
		`Title: ${task.title}`,
		`Body: ${task.body}`,
		`Created at: ${task._creationTime}`,
	].join('\n');
