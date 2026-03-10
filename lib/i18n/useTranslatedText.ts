"use client";

import { useState, useEffect } from "react";
import { useLanguage } from "./LanguageContext";
import { TranslationService } from "../services/translation-service";

type CacheEntry = {
  text: string;
  timestamp: number;
};

// In-memory cache for the session (simple optimization)
// Key format: `${lang}_${text_hash_or_raw}`
const memoryCache: Record<string, string> = {};

export function useTranslatedText(text: string | undefined): string {
  const { language } = useLanguage();
  const [translatedText, setTranslatedText] = useState<string>(text || "");

  useEffect(() => {
    if (!text) {
        setTranslatedText("");
        return;
    }

    // If English, return original (assuming source is English)
    if (language === 'en') {
      setTranslatedText(text);
      return;
    }

    const cacheKey = `${language}_${text}`;

    // Check memory cache first
    if (memoryCache[cacheKey]) {
      setTranslatedText(memoryCache[cacheKey]);
      return;
    }

    // Check localStorage (persistent cache)
    const storageKey = `trans_cache_${language}_${encodeURIComponent(text.substring(0, 32))}_${text.length}`; 
    // Truncating key for safety, but collisions possible. 
    // Better strategy for prod: hash the text. For now, use simple key.
    // Actually, localStorage limitation: large keys. Let's rely on memory first.
    // Ideally we persist essential translations.

    const fetchTranslation = async () => {
      try {
        const result = await TranslationService.translateText(text, language);
        if (result.translatedText) {
          memoryCache[cacheKey] = result.translatedText;
          setTranslatedText(result.translatedText);
        }
      } catch (error) {
        console.warn("Translation failed:", error);
        // Fallback to original text on error
        setTranslatedText(text);
      }
    };

    fetchTranslation();
  }, [text, language]);

  return translatedText;
}
