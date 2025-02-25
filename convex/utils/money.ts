const MONEY_PRECISION = 10 ** 10; // minimum representation is 0.0000000001

// 0.01 -> 10_000_000_000n
// 0.0000000001 -> 1n
export function asBigInt({ dollars }: { dollars: number }) {
	return BigInt(dollars * MONEY_PRECISION);
}

// 10_000_000_000n -> 0.01
// 1n -> 0.0000000001
export function asDollars({ bigInt, precision = 2 }: { bigInt: bigint; precision?: number }) {
	return (Number(bigInt) / MONEY_PRECISION).toFixed(precision);
}
