import { createContext, useContext, useEffect, useState } from 'react';

type ThemeMode = 'dark' | 'light' | 'system';

const ThemeProviderContext = createContext({
	theme: 'system',
	setTheme: (() => {}) as (theme: ThemeMode) => void,
});

type ThemeProviderProps = {
	children: React.ReactNode;
	mode?: ThemeMode;
};

export function ThemeProvider({ children, mode = 'system', ...props }: ThemeProviderProps) {
	const [theme, setTheme] = useState<ThemeMode>(mode);

	useEffect(() => {
		const root = window.document.documentElement;
		const darkModeMediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

		const applyTheme = () => {
			root.classList.remove('light', 'dark');

			if (theme === 'system') {
				root.classList.add(darkModeMediaQuery.matches ? 'dark' : 'light');
			} else {
				root.classList.add(theme);
			}
		};

		applyTheme();

		// if using 'system', listen for OS theme changes
		if (theme === 'system') {
			darkModeMediaQuery.addEventListener('change', applyTheme);
			return () => darkModeMediaQuery.removeEventListener('change', applyTheme);
		}
	}, [theme]);

	return (
		<ThemeProviderContext.Provider {...props} value={{ theme, setTheme }}>
			{children}
		</ThemeProviderContext.Provider>
	);
}

export const useTheme = () => {
	const context = useContext(ThemeProviderContext);

	if (context === undefined) throw new Error('useTheme must be used within a ThemeProvider');

	return context;
};
