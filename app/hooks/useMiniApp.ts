import { MiniKit } from '@worldcoin/minikit-js';
import { useMemo } from 'react';

export const useMiniApp = () => {
	//
	const isInstalled = useMemo(() => {
		if (typeof window === 'undefined') return false;
		return MiniKit.isInstalled();
	}, [MiniKit]);

	return { isInstalled };
};
