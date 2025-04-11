import { RefObject, useEffect, useState } from 'react';
import { DEFAULT_MD_BREAKPOINT } from '~/lib/tailwind';

/**
 * A React hook that detects if the current container element's width is below a specified breakpoint.
 *
 * Returns a boolean indicating if the container width is less than the breakpoint.
 * The value updates automatically when the container is resized.
 * Requires a ref to the container element.
 *
 * @param {RefObject<T>} ref - A React ref attached to the container element.
 * @param {number} [breakpoint=DEFAULT_MD_BREAKPOINT] - The width breakpoint in pixels.
 * @returns {boolean} True if container width is less than the breakpoint, false otherwise.
 *
 * @example
 * function MyComponent() {
 *   const containerRef = useRef<HTMLDivElement>(null);
 *   const isBelowBreakpoint = useContainerBreakpoint(containerRef, 600);
 *   return <div ref={containerRef}>{isBelowBreakpoint ? <SmallView /> : <LargeView />}</div>;
 * }
 */
export function useContainerBreakpoint<T extends HTMLElement>(
	ref: RefObject<T>,
	breakpoint: number = DEFAULT_MD_BREAKPOINT,
): boolean {
	//
	const [isBelowBreakpoint, setIsBelowBreakpoint] = useState<boolean | undefined>(undefined);

	useEffect(() => {
		//
		if (!ref.current) {
			console.warn('useContainerBreakpoint: Ref is not attached to an element.');
			return;
		}

		const element = ref.current;

		const observer = new ResizeObserver((entries) => {
			//
			if (entries[0]) {
				const { width } = entries[0].contentRect;
				setIsBelowBreakpoint(width < breakpoint);
			}
		});

		observer.observe(element);

		// initial check
		setIsBelowBreakpoint(element.offsetWidth < breakpoint);

		return () => {
			//
			// check if element still exists before unobserving
			// this can happen if the component unmounts quickly
			if (element) {
				observer.unobserve(element);
			}
		};
	}, [ref, breakpoint]);

	return Boolean(isBelowBreakpoint);
}
