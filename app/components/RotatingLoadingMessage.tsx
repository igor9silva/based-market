import { useEffect, useState } from 'react';
import { cn } from '~/lib/utils';
import { BasicError } from './BasicError';

export function RotatingLoadingMessage({ className }: { className?: string }) {
	//
	const loadingMessages = [
		'Teaching silicon to be conscious...',
		'Convincing our rocks to think...',
		"Existence is pain! But we're working on it...",
		"Look at me, I'm setting up your account!",
		'Calculating the meaning of life, universe, and everything...',
		'Turning solar radiation into intelligence...',
		'Making these rocks really, really smart...',
		'Ooo-wee, preparing your AI playground!',
		'Creating artificial general awesomeness...',
		'Wubba lubba dub dub! Almost ready...',
		'Teaching computers to pass the butter...',
		'Achieving singularity in 3... 2...',
	];

	const [currentMessage, setCurrentMessage] = useState(loadingMessages[0]);

	useEffect(() => {
		//
		const interval = setInterval(() => {
			setCurrentMessage((prev) => {
				const currentIndex = loadingMessages.indexOf(prev);
				const nextIndex = (currentIndex + 1) % loadingMessages.length;
				return loadingMessages[nextIndex];
			});
		}, 2000);

		return () => clearInterval(interval);
	}, [loadingMessages]);

	return <BasicError text={currentMessage} className={cn('animate-pulse', className)} />;
}
