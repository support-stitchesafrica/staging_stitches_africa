"use client";

import React, {
	createContext,
	useContext,
	useState,
	useEffect,
	ReactNode,
} from "react";
import { Dictionary } from "./types";
import { en } from "./dictionaries/en";
import { fr } from "./dictionaries/fr";
import { es } from "./dictionaries/es";
import { de } from "./dictionaries/de";
import { zh } from "./dictionaries/zh";

type Language = "en" | "fr" | "es" | "de" | "zh";

interface LanguageContextType {
	language: Language;
	setLanguage: (lang: Language) => void;
	t: Dictionary;
}

const dictionaries: Record<Language, Dictionary> = {
	en,
	fr,
	es,
	de,
	zh,
};

const LanguageContext = createContext<LanguageContextType | undefined>(
	undefined,
);

export function LanguageProvider({ children }: { children: ReactNode }) {
	const [language, setLanguageState] = useState<Language>("en");
	const [mounted, setMounted] = useState(false);

	useEffect(() => {
		// Load persisted language preference
		const saved = localStorage.getItem("user_language") as Language;
		if (saved && ["en", "fr", "es", "de", "zh"].includes(saved)) {
			setLanguageState(saved);
		}
		setMounted(true);
	}, []);

	const setLanguage = (lang: Language) => {
		setLanguageState(lang);
		localStorage.setItem("user_language", lang);
	};

	if (!mounted) {
		// Return with default 'en' to avoid hydration mismatch, or a loading spinner
		// For now, render children with default language (server default)
		// to match initial server render if using app router
	}

	return (
		<LanguageContext.Provider
			value={{ language, setLanguage, t: dictionaries[language] }}
		>
			{children}
		</LanguageContext.Provider>
	);
}

export function useLanguage() {
	const context = useContext(LanguageContext);
	if (context === undefined) {
		throw new Error("useLanguage must be used within a LanguageProvider");
	}
	return context;
}
