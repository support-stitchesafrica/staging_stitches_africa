"use client";

import React from "react";
import { useTranslatedText } from "@/lib/i18n/useTranslatedText";

interface TranslatedValueProps {
	value: string | number | undefined | null;
	fallback?: string;
}

export const TranslatedValue: React.FC<TranslatedValueProps> = ({
	value,
	fallback = "",
}) => {
	const text = String(value || fallback);
	const translated = useTranslatedText(text);

	if (!value && !fallback) return null;

	return <>{translated}</>;
};
