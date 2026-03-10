"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark";

interface ThemeContextType {
	theme: Theme;
	toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
	children,
}) => {
	const [theme, setTheme] = useState<Theme>("light"); // Always start with light

	// ✅ Enforce light theme
	useEffect(() => {
		setTheme("light");
	}, []);

	useEffect(() => {
		if (typeof window === "undefined") return;
		const root = window.document.documentElement;
		root.classList.remove("dark");
		root.classList.add("light");
		localStorage.setItem("theme", "light");
	}, [theme]);

	const toggleTheme = () => {
		// No-op: Force light mode
		setTheme("light");
	};

	return (
		<ThemeContext.Provider value={{ theme, toggleTheme }}>
			{children}
		</ThemeContext.Provider>
	);
};

export const useTheme = () => {
	const context = useContext(ThemeContext);
	if (!context) {
		throw new Error("useTheme must be used within ThemeProvider");
	}
	return context;
};
