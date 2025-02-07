import { MiniKit } from '@worldcoin/minikit-js';
import { useMemo } from 'react';

export const useMiniApp = () => {
	//
	const w = typeof window === 'undefined' ? undefined : window;

	const isInstalled = useMemo(() => {
		if (typeof w === 'undefined') return false;
		return MiniKit.isInstalled();
	}, [MiniKit, w]);

	return { isInstalled };
};
