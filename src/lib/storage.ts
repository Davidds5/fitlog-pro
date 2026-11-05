'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { validateStorageData } from '@/lib/schemas';

/**
 * Hook reativo para LocalStorage seguro para Next.js (SSR friendly)
 * e livre de loops infinitos de renderização (Maximum update depth exceeded).
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const initialValueRef = useRef<T>(initialValue);
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Carrega do localStorage apenas uma vez na montagem do componente no client
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          const rawParsed = JSON.parse(item);
          const sanitized = validateStorageData<T>(key, rawParsed, initialValueRef.current);
          setStoredValue(sanitized);
        } else {
          window.localStorage.setItem(key, JSON.stringify(initialValueRef.current));
        }
      }
    } catch (error) {
      console.warn(`Erro lendo localStorage para chave "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key]); // Depende unicamente da chave, evitando loops com referências de objetos/arrays

  // Atualizador estável
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            window.dispatchEvent(new CustomEvent(`local-storage-${key}`, { detail: valueToStore }));
          }
          return valueToStore;
        });
      } catch (error) {
        console.warn(`Erro salvando localStorage para chave "${key}":`, error);
      }
    },
    [key]
  );

  // Sincronização entre abas e componentes
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleCustomChange = (e: Event) => {
      const customEvent = e as CustomEvent<T>;
      if (customEvent.detail !== undefined) {
        setStoredValue(customEvent.detail);
      }
    };

    const handleStorageEvent = (e: StorageEvent) => {
      if (e.key === key && e.newValue) {
        try {
          const rawParsed = JSON.parse(e.newValue);
          const sanitized = validateStorageData<T>(key, rawParsed, initialValueRef.current);
          setStoredValue(sanitized);
        } catch {
          // ignora
        }
      }
    };

    window.addEventListener(`local-storage-${key}`, handleCustomChange);
    window.addEventListener('storage', handleStorageEvent);

    return () => {
      window.removeEventListener(`local-storage-${key}`, handleCustomChange);
      window.removeEventListener('storage', handleStorageEvent);
    };
  }, [key]);

  return [storedValue, setValue, isLoaded];
}

export interface SetLogEntry {
  id: string;
  date: string;
  exerciseId: string;
  exerciseName: string;
  serieNumber: number;
  weight: number;
  reps: number;
  oneRM: number;
  timestamp: number;
}

export interface DailyDietLog {
  date: string;
  meals: {
    id: string;
    mealType: 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'pos_treino';
    foodName: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
    unitDisplay?: string;
  }[];
}
