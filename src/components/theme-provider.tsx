"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";

export type Theme = "light" | "dark" | "system";
type ThemeContextValue = {
  theme: Theme;
  isDark: boolean;
  setTheme: (nextTheme: Theme) => void;
};

const STORAGE_KEY = "mylink-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

function parseTheme(value: string | null): Theme {
  return value === "light" || value === "dark" || value === "system" ? value : "system";
}

function prefersDark(): boolean {
  return window.matchMedia("(prefers-color-scheme: dark)").matches;
}

function applyTheme(theme: Theme): boolean {
  const dark = theme === "dark" || (theme === "system" && prefersDark());
  document.documentElement.classList.toggle("dark", dark);
  document.documentElement.style.colorScheme = dark ? "dark" : "light";
  return dark;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // SSR과 hydration 첫 렌더에서는 고정값을 사용하고, 실제 색상은 head 스크립트가 먼저 적용합니다.
  const [theme, setThemeState] = useState<Theme>("system");
  const [isDark, setIsDark] = useState(false);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    let active = true;
    let stored: string | null = null;
    try {
      stored = window.localStorage.getItem(STORAGE_KEY);
    } catch {
      // 브라우저 저장소 접근이 제한된 경우 시스템 설정을 사용합니다.
    }

    const initialTheme = parseTheme(stored);
    // 초기 설정 로드는 한 번만 수행합니다. 토글할 때 저장된 값으로 되돌리지 않습니다.
    queueMicrotask(() => {
      if (!active) return;
      setThemeState(initialTheme);
      setIsDark(applyTheme(initialTheme));
      setInitialized(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!initialized) return;
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => {
      const nextDark = applyTheme(theme);
      setIsDark(nextDark);
    };

    // 상태가 바뀐 이후에만 새로 적용하고, 시스템 모드에서만 OS 변경을 추적합니다.
    const onSystemChange = () => {
      if (theme === "system") sync();
    };
    media.addEventListener("change", onSystemChange);
    queueMicrotask(sync);
    return () => media.removeEventListener("change", onSystemChange);
  }, [initialized, theme]);

  const setTheme = useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme);
    setIsDark(applyTheme(nextTheme));
    try {
      window.localStorage.setItem(STORAGE_KEY, nextTheme);
    } catch {
      // 스토리지를 사용할 수 없어도 현재 페이지에서는 테마를 전환할 수 있습니다.
    }
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme은 ThemeProvider 안에서 사용해야 합니다.");
  }
  return context;
}
