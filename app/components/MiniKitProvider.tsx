import { MiniKit } from '@worldcoin/minikit-js';
import { createContext, ReactNode, useContext, useEffect } from 'react';

const MiniKitContext = createContext<MiniKit | null>(null);

export function useMiniKit() {
	//
	const context = useContext(MiniKitContext);

	if (!context) throw new Error('useMiniKit must be used within a MiniKitProvider');

	return context;
}

export default function MiniKitProvider({ children }: { children: ReactNode }) {
	//
	useEffect(() => {
		MiniKit.install();
	}, []);

	return <MiniKitContext.Provider value={MiniKit}>{children}</MiniKitContext.Provider>;
}
