import { MiniKit } from '@worldcoin/minikit-js';

export const useWorldApp = (path: string) => {
	//
	const openApp = () => {
		location.href = `https://worldcoin.org/mini-app?app_id=${MiniKit.appId}&path=${path}`;
	};

	return { openApp };
};
