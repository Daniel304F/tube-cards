import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "tubecards-theme";

type Theme = "light" | "dark";

function getInitialTheme(): Theme {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored === "dark" || stored === "light") return stored;
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

interface UseDarkModeReturn {
  isDark: boolean;
  toggle: () => void;
}

export function useDarkMode(): UseDarkModeReturn {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
    localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = useCallback((): void => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  }, []);

  return { isDark: theme === "dark", toggle };
}
