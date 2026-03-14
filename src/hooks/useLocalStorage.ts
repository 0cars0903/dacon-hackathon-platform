"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * localStorage 연동 Hook
 * 서버 사이드에서는 초기값 반환, 클라이언트에서 localStorage와 동기화
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState(false);

  // 클라이언트에서 localStorage 읽기
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`localStorage read error for key "${key}":`, error);
    }
    setIsLoaded(true);
  }, [key]);

  // 값 변경 시 localStorage에 저장
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.warn(`localStorage write error for key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue, isLoaded] as const;
}
