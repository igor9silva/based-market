import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const gameSchema = z.object({
	owner: zid('users'),
});
