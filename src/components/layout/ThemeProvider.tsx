"use client";

import { createContext, useContext, type ReactNode } from "react";
import { useTheme } from "@/hooks/useTheme";
import type { ColorTheme } from "@/types";

interface ThemeContextType {
  theme: "light" | "dark";
  colorTheme: ColorTheme;
  interestTags: string[];
  toggleTheme: () => void;
  setColorTheme: (theme: ColorTheme) => void;
  setInterestTags: (tags: string[]) => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const themeValues = useTheme();

  return (
    <ThemeContext.Provider value={themeValues}>{children}</ThemeContext.Provider>
  );
}

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeContext must be used within a ThemeProvider");
  }
  return context;
}
