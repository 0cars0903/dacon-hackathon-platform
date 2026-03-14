"use client";

import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { UserPreferences, ColorTheme } from "@/types";

const defaultPreferences: UserPreferences = {
  theme: "light",
  colorTheme: "blue",
  interestTags: [],
};

/**
 * 테마 관리 Hook
 * 다크모드 + 커스텀 컬러 테마 지원
 */
export function useTheme() {
  const [preferences, setPreferences] = useLocalStorage<UserPreferences>(
    "user_preferences",
    defaultPreferences
  );

  // HTML 루트에 다크모드 클래스 적용
  useEffect(() => {
    const root = document.documentElement;
    if (preferences.theme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [preferences.theme]);

  // 컬러 테마 CSS 변수 적용
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute("data-color-theme", preferences.colorTheme);
  }, [preferences.colorTheme]);

  // 시스템 테마 감지 (초기 로드 시)
  useEffect(() => {
    const stored = window.localStorage.getItem("user_preferences");
    if (!stored) {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)"
      ).matches;
      if (prefersDark) {
        setPreferences((prev) => ({ ...prev, theme: "dark" }));
      }
    }
  }, [setPreferences]);

  const toggleTheme = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  }, [setPreferences]);

  const setColorTheme = useCallback(
    (colorTheme: ColorTheme) => {
      setPreferences((prev) => ({ ...prev, colorTheme }));
    },
    [setPreferences]
  );

  const setInterestTags = useCallback(
    (tags: string[]) => {
      setPreferences((prev) => ({ ...prev, interestTags: tags }));
    },
    [setPreferences]
  );

  return {
    theme: preferences.theme,
    colorTheme: preferences.colorTheme,
    interestTags: preferences.interestTags,
    toggleTheme,
    setColorTheme,
    setInterestTags,
  };
}
