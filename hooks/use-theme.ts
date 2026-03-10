"use client";

import { useEffect, useState, useCallback } from "react";

export function useTheme() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [isClient, setIsClient] = useState(false);

  // Detect client
  useEffect(() => {
    setIsClient(true);
  }, []);

  // Load theme from localStorage
  useEffect(() => {
    if (!isClient) return;

    try {
      const savedTheme = localStorage.getItem("theme") as "light" | "dark" | null;

      if (savedTheme) {
        setTheme(savedTheme);
        applyTheme(savedTheme);
      } else {
        const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
        const defaultTheme = systemPrefersDark ? "dark" : "light";
        setTheme(defaultTheme);
        applyTheme(defaultTheme);
      }
    } catch (err) {
      console.error("Failed to load theme:", err);
    }
  }, [isClient]);

  const applyTheme = useCallback((newTheme: "light" | "dark") => {
    if (!isClient) return;
    if (newTheme === "dark") {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [isClient]);

  const toggleTheme = useCallback(() => {
    if (!isClient) return;
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }, [theme, isClient, applyTheme]);

  const setThemeMode = useCallback((newTheme: "light" | "dark") => {
    if (!isClient) return;
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    applyTheme(newTheme);
  }, [isClient, applyTheme]);

  return {
    theme,
    toggleTheme,
    setTheme: setThemeMode,
  };
}
