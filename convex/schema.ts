import { authTables } from '@convex-dev/auth/server';
import { zodToConvex } from 'convex-helpers/server/zod';
import { defineSchema, defineTable } from 'convex/server';
import { gameSchema } from './schemas/gameSchema';
import { userPreferencesSchema, userSchema } from './schemas/userSchema';

// prettier-ignore
export default defineSchema({

	...authTables,

	users: defineTable(
		zodToConvex(userSchema),
	).index(
		'email', ['email'],
	).index(
		'phone', ['phone'],
	).index(
		'walletAddress_chain', ['walletAddress', 'walletChain'],
	),

	user_preferences: defineTable(
		zodToConvex(userPreferencesSchema),
	).index(
		'by_owner_key', ['owner', 'key'],
	),

	games: defineTable(
		zodToConvex(gameSchema),
	).index(
		'by_owner', ['owner'],
	),
});
