import { MiniKit } from '@worldcoin/minikit-js';
import { ReactNode, useEffect } from 'react';

export default function MiniKitProvider({ children }: { children: ReactNode }) {
	//
	const appId = import.meta.env['VITE_WLD_CLIENT_ID'] as string;
	if (!appId) throw new Error('VITE_WLD_CLIENT_ID is not set');

	useEffect(() => {
		MiniKit.install(appId);
	}, []);

	return <>{children}</>;
}
