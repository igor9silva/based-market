import { OIDCConfig } from '@auth/core/providers';
import { Profile } from '@auth/core/types';
import { env } from '../schemas/envSchema';

export const WorldID: OIDCConfig<Profile> = {
	//
	id: 'worldid',
	name: 'Worldcoin',
	type: 'oidc',
	issuer: 'https://id.worldcoin.org',
	clientId: env.WLD_CLIENT_ID,
	clientSecret: env.WLD_CLIENT_SECRET,
	idToken: true,
	checks: ['state', 'nonce', 'pkce'],
	authorization: {
		params: {
			scope: 'openid email profile',
		},
	},

	profile(profile: Record<string, any>) {
		//
		console.debug('WorldID OAuth profile', profile);
		//
		return {
			id: profile.sub,
			email: profile.email,
			name: profile.name,
			verificationLevel: profile['https://id.worldcoin.org/v1'].verification_level,
			walletAddress: profile['https://id.worldcoin.org/v1'].sub,
			walletChain: 'worldchain' as const,
		};
	},
} as const;
