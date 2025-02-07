import Google from '@auth/core/providers/google';
import { convexAuth } from '@convex-dev/auth/server';
import { WorldID } from './auth/WorldID';
import { env } from './schemas/envSchema';

export const { auth, signIn, signOut, store } = convexAuth({
	providers: [
		Google,
		WorldID,
		// WorldWallet,
	],
	jwt: {
		durationMs: env.JWT_SESSION_DURATION_MS || 1000 * 60 * 60 * 24 * 7 /* 7 days */,
	},
	session: {
		inactiveDurationMs: env.JWT_SESSION_DURATION_MS || 1000 * 60 * 60 * 24 * 7 /* 7 days */,
	},
	callbacks: {
		async afterUserCreatedOrUpdated(ctx, args) {
			console.debug('afterUserCreatedOrUpdated', ctx, args);
		},
	},
});

// 'profile' {
//   iss: 'https://id.worldcoin.org',
//   sub: '0x00a891a0cccb023610c62d171bd68839b2b005920b5bca08d8632ec1530a9bf9',
//   jti: 'b15d8d1b-e73b-45a3-9da5-1ce69f258ddd',
//   iat: 1738869546,
//   exp: 1738873146,
//   aud: 'app_7832db605b6904efc7183ef4f456cc6a',
//   scope: 'openid email profile',
//   'https://id.worldcoin.org/beta': {
//     likely_human: 'strong',
//     credential_type: 'orb',
//     warning: 'DEPRECATED and will be removed soon. Use `https://id.worldcoin.org/v1` instead.'
//   },
//   'https://id.worldcoin.org/v1': {
//     verification_level: 'orb'
//   },
//   nonce: 'V5UBGC1CxIaF9Q_amjrsWpTDmu8_q4kLJPapF_m2MGQ',
//   email: '0x00a891a0cccb023610c62d171bd68839b2b005920b5bca08d8632ec1530a9bf9@id.worldcoin.org',
//   name: 'World ID User',
//   given_name: 'World ID',
//   family_name: 'User'
// }
