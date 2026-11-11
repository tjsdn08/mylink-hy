"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

type Theme = "light" | "dark" | "system";
type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  setTheme: (theme: Theme) => void;
};

const STORAGE_KEY = "mylink-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function isTheme(value: string | null): value is Theme {
  return value === "light" || value === "dark" || value === "system";
}

function applyTheme(dark: boolean) {
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(false);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // 브라우저 저장소가 차단된 경우에도 현재 세션에서 전환할 수 있습니다.
    }
  }, []);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // 저장소에 접근할 수 없으면 시스템 설정을 사용합니다.
    }
    // hydration 완료 후 저장된 테마를 적용합니다.
    Promise.resolve().then(() => setThemeState(isTheme(stored) ? stored : "system"));
    const onSystemChange = () => {
      if (theme !== "system") return;
      applyTheme(media.matches);
      setIsDark(media.matches);
    };
    media.addEventListener("change", onSystemChange);
    return () => media.removeEventListener("change", onSystemChange);
  }, [theme]);

  useEffect(() => {
    const dark = theme === "dark" || (theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    applyTheme(dark);
    // effect 안의 동기적 setState를 피하면서 UI 토글 상태를 맞춥니다.
    Promise.resolve().then(() => setIsDark(dark));
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme은 ThemeProvider 안에서 사용해야 합니다.");
  return context;
}
