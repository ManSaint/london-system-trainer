import { useState, useCallback, useEffect } from 'react';

/**
 * Hook for reading/writing JSON values to localStorage with SSR safety.
 * Always initializes with `initialValue` during SSR, then hydrates from
 * localStorage on mount to avoid hydration mismatches.
 */
export function useLocalStorage<T>(key: string, initialValue: T) {
  const [storedValue, setStoredValue] = useState<T>(initialValue);

  // Hydrate from localStorage after mount (client-only)
  useEffect(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (item) setStoredValue(JSON.parse(item));
    } catch {
      /* localStorage unavailable */
    }
  }, [key]);

  const setValue = useCallback((value: T | ((val: T) => T)) => {
    setStoredValue(prev => {
      const valueToStore = value instanceof Function ? value(prev) : value;
      try {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch {
        /* localStorage full or unavailable */
      }
      return valueToStore;
    });
  }, [key]);

  return [storedValue, setValue] as const;
}
