import { useEffect, useState } from 'react';

export type Dimension = 'width' | 'height';

/**
 * Observes a dimension (width or height) of a container element and returns
 * whether it's below a given breakpoint.
 *
 * @param containerRef Ref object pointing to the container element.
 * @param dimension The dimension to observe ('width' or 'height').
 * @param breakpoint The threshold in pixels for the specified dimension.
 * @returns True if the container dimension is less than the breakpoint, false otherwise.
 */
export function useContainerBreakpoint(
	containerRef: React.RefObject<HTMLElement>,
	dimension: Dimension,
	breakpoint: number,
): boolean {
	//
	const [isBelowBreakpoint, setIsBelowBreakpoint] = useState(false);

	useEffect(() => {
		//
		const element = containerRef.current;
		if (!element) return;

		const observer = new ResizeObserver((entries) => {
			//
			for (const entry of entries) {
				//
				let size: number;

				if (entry.borderBoxSize) {
					const borderBox = Array.isArray(entry.borderBoxSize) ? entry.borderBoxSize[0] : entry.borderBoxSize;

					if (dimension === 'width') {
						// Explicitly cast to access inlineSize, handling potential type issues
						size = (borderBox as { inlineSize?: number }).inlineSize ?? entry.contentRect.width;
					} else {
						// Explicitly cast to access blockSize, handling potential type issues
						size = (borderBox as { blockSize?: number }).blockSize ?? entry.contentRect.height;
					}
				} else {
					// Fallback to contentRect
					size = dimension === 'width' ? entry.contentRect.width : entry.contentRect.height;
				}

				setIsBelowBreakpoint(size < breakpoint);
			}
		});

		observer.observe(element);

		// initial check
		let initialSize: number;

		if (element.getBoundingClientRect) {
			initialSize =
				dimension === 'width' ? element.getBoundingClientRect().width : element.getBoundingClientRect().height;
		} else {
			// fallback for older browsers or different environments
			initialSize = dimension === 'width' ? element.offsetWidth : element.offsetHeight;
		}

		setIsBelowBreakpoint(initialSize < breakpoint);

		return () => {
			observer.disconnect();
		};
	}, [containerRef, dimension, breakpoint]);

	return isBelowBreakpoint;
}
