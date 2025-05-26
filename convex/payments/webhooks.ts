/**
 * Computes the HMAC SHA-256 signature for the given payload and secret.
 */
export async function computeHmacSha256(payload: string, secret: string): Promise<string> {
	//
	const encoder = new TextEncoder();
	const keyData = encoder.encode(secret);
	const messageData = encoder.encode(payload);

	const cryptoKey = await crypto.subtle.importKey('raw', keyData, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);

	const signature = await crypto.subtle.sign('HMAC', cryptoKey, messageData);
	return Array.from(new Uint8Array(signature))
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}

/**
 * Verifies the Coinbase webhook signature using HMAC SHA-256.
 */
export async function isValidCoinbaseSignature(payload: string, signature: string, secret: string): Promise<boolean> {
	//
	const expectedSignature = (await computeHmacSha256(payload, secret)).toLowerCase();
	const providedSignature = signature.toLowerCase();

	if (expectedSignature.length !== providedSignature.length) return false;

	let isValid = true;
	for (let i = 0; i < expectedSignature.length; i++) {
		if (expectedSignature[i] !== providedSignature[i]) isValid = false;
	}

	return isValid;
}

/**
 * Verifies the event body and signature, then parses the event.
 */
export async function parseAndVerifyCoinbaseEvent(request: Request, secret: string) {
	//
	const signature = request.headers.get('X-CC-Webhook-Signature');
	if (!signature) throw new SignatureVerificationError('Missing signature', '');

	const payload = await request.text();

	const isValid = await isValidCoinbaseSignature(payload, signature, secret);
	if (!isValid) throw new SignatureVerificationError(signature, payload);

	let data;
	try {
		data = JSON.parse(payload);
	} catch (error) {
		throw new PayloadParseError('Invalid payload provided. No JSON object could be decoded');
	}

	if (!(data && data.event)) throw new PayloadParseError('Invalid payload provided.');

	return data;
}

export class PayloadParseError extends Error {
	constructor(message: string) {
		super(message);
		this.message = message;
	}
}

export class SignatureVerificationError extends Error {
	constructor(signature: string, payload: string) {
		super(`Invalid signature: ${signature}`);
		this.name = 'SignatureVerificationError';
	}
}
