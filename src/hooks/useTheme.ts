"use client";

import { useCallback, useEffect } from "react";
import { useLocalStorage } from "./useLocalStorage";
import type { UserPreferences } from "@/types";

const defaultPreferences: UserPreferences = {
  theme: "light",
  interestTags: [],
};

/**
 * 테마 관리 Hook
 * 다크모드 + 관심 태그
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

  // 라이트모드를 기본값으로 강제 (시스템 다크모드 무시)
  useEffect(() => {
    const stored = window.localStorage.getItem("user_preferences");
    if (!stored) {
      document.documentElement.classList.remove("dark");
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setPreferences((prev) => ({
      ...prev,
      theme: prev.theme === "light" ? "dark" : "light",
    }));
  }, [setPreferences]);

  const setInterestTags = useCallback(
    (tags: string[]) => {
      setPreferences((prev) => ({ ...prev, interestTags: tags }));
    },
    [setPreferences]
  );

  return {
    theme: preferences.theme,
    interestTags: preferences.interestTags,
    toggleTheme,
    setInterestTags,
  };
}
