import { NoOp } from 'convex-helpers/server/customFunctions';
import { zCustomAction, zCustomMutation, zCustomQuery } from 'convex-helpers/server/zod';
import {
	action as actionOG,
	internalAction as internalActionOG,
	internalMutation as internalMutationOG,
	internalQuery as internalQueryOG,
	mutation as mutationOG,
	query as queryOG,
} from './_generated/server';

export const query = zCustomQuery(queryOG, NoOp);
export const mutation = zCustomMutation(mutationOG, NoOp);
export const action = zCustomAction(actionOG, NoOp);
export const internalMutation = zCustomMutation(internalMutationOG, NoOp);
export const internalQuery = zCustomQuery(internalQueryOG, NoOp);
export const internalAction = zCustomAction(internalActionOG, NoOp);
