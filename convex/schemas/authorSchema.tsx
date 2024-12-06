import { zid } from 'convex-helpers/server/zod';
import { z } from 'zod';

export const authorSchema = z.union([
	zid('users'), //
	zid('taskActions'),
]);
