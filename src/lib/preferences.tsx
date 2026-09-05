"use client";

/**
 * Användarpreferenser: tema (ljus/mörkt/system) och ljud (opt-in).
 *
 * Tema-klassen sätts i ett inline-script i layout.tsx innan hydrering
 * (för att undvika flimmer); den här providen håller tillståndet i sync
 * och följer systeminställningen när temat är "system".
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { isSoundEnabled, play, setSoundEnabled } from "@/lib/sound";

export type Theme = "light" | "dark" | "system";

type PreferencesState = {
  theme: Theme;
  resolvedTheme: "light" | "dark";
  setTheme: (t: Theme) => void;
  toggleTheme: () => void;
  sound: boolean;
  setSound: (on: boolean) => void;
};

const THEME_KEY = "hp-lift-theme";

const PreferencesContext = createContext<PreferencesState | null>(null);

function readStoredTheme(): Theme {
  try {
    const v = localStorage.getItem(THEME_KEY);
    return v === "light" || v === "dark" ? v : "system";
  } catch {
    return "system";
  }
}

function systemDark(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches
  );
}

function resolve(theme: Theme): "light" | "dark" {
  return theme === "system" ? (systemDark() ? "dark" : "light") : theme;
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => readStoredTheme());
  // Inline-scriptet i layout.tsx har redan satt klassen — läs därifrån så
  // att initialvärdet matchar DOM:en exakt (inga hydreringsvarningar).
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">(() =>
    typeof document !== "undefined" && document.documentElement.classList.contains("dark")
      ? "dark"
      : "light",
  );
  const [sound, setSoundState] = useState<boolean>(() => isSoundEnabled());

  const apply = useCallback((t: Theme) => {
    const r = resolve(t);
    setResolvedTheme(r);
    document.documentElement.classList.toggle("dark", r === "dark");
  }, []);

  const setTheme = useCallback(
    (t: Theme) => {
      setThemeState(t);
      try {
        if (t === "system") localStorage.removeItem(THEME_KEY);
        else localStorage.setItem(THEME_KEY, t);
      } catch {
        /* ignorera */
      }
      apply(t);
    },
    [apply],
  );

  const toggleTheme = useCallback(() => {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
    play("toggle");
  }, [resolvedTheme, setTheme]);

  // Följ systemets tema när inställningen är "system".
  useEffect(() => {
    if (theme !== "system") return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => apply("system");
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, [theme, apply]);

  const setSound = useCallback((on: boolean) => {
    setSoundState(on);
    setSoundEnabled(on);
  }, []);

  return (
    <PreferencesContext.Provider
      value={{ theme, resolvedTheme, setTheme, toggleTheme, sound, setSound }}
    >
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferences(): PreferencesState {
  const ctx = useContext(PreferencesContext);
  if (!ctx) throw new Error("usePreferences måste användas inuti <PreferencesProvider>");
  return ctx;
}
