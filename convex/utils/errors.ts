import { ConvexError } from 'convex/values';

export const NOT_FOUND_ERROR = 'Not Found';
export const INSUFFICIENT_ACCOUNT_FUNDS_ERROR = 'Insufficient Account Balance';

const createError = (code: string) => (message?: string) =>
	new ConvexError({
		code,
		...(message && { message }),
	});

export const NotFound = createError(NOT_FOUND_ERROR);
export const InsufficientAccountFunds = createError(INSUFFICIENT_ACCOUNT_FUNDS_ERROR);

export const isError = (key: string, error: unknown) => error instanceof ConvexError && error.data.code === key;
