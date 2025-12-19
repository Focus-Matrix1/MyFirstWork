import { useState, useEffect } from 'react';

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    try {
      if (typeof window === 'undefined') return initialValue;
      const saved = localStorage.getItem(key);
      if (saved !== null) {
          const parsed = JSON.parse(saved);
          // Simple validation for arrays (common in this app)
          if (Array.isArray(initialValue) && !Array.isArray(parsed)) return initialValue;
          return parsed;
      }
      return initialValue;
    } catch (error) {
      console.warn(`LocalStorage load failed for ${key}:`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.warn(`Failed to save ${key} to LocalStorage:`, error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}