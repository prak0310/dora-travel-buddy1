import { useState, useEffect } from "react";

export function useSessionStorage<T>(key: string, initialValue: T | (() => T)) {
  const [value, setValue] = useState<T>(() => {
    try {
      const item = window.sessionStorage.getItem(key);
      return item ? JSON.parse(item) : (typeof initialValue === "function" ? (initialValue as () => T)() : initialValue);
    } catch (error) {
      console.error("Error reading sessionStorage", error);
      return typeof initialValue === "function" ? (initialValue as () => T)() : initialValue;
    }
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
    } catch (error) {
      console.error("Error setting sessionStorage", error);
    }
  }, [key, value]);

  return [value, setValue] as const;
}
