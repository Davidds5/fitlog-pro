'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Hook reativo para LocalStorage seguro para Next.js (SSR friendly)
 * e com sincronização instantânea na mesma janela ou entre abas.
 */
export function useLocalStorage<T>(key: string, initialValue: T): [T, (value: T | ((prev: T) => T)) => void, boolean] {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoaded, setIsLoaded] = useState<boolean>(false);

  // Carrega o valor inicial no cliente
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item) {
          setStoredValue(JSON.parse(item));
        } else {
          window.localStorage.setItem(key, JSON.stringify(initialValue));
        }
      }
    } catch (error) {
      console.warn(`Erro lendo localStorage para chave "${key}":`, error);
    } finally {
      setIsLoaded(true);
    }
  }, [key, initialValue]);

  // Atualizador com emissão de evento customizado para reatividade interna
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue((currentValue) => {
          const valueToStore = value instanceof Function ? value(currentValue) : value;
          if (typeof window !== 'undefined') {
            window.localStorage.setItem(key, JSON.stringify(valueToStore));
            // Dispara evento para sincronizar componentes na mesma aba
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

  // Escuta mudanças de outros componentes
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
          setStoredValue(JSON.parse(e.newValue));
        } catch {
          // ignora erro de parse
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
  date: string; // YYYY-MM-DD
  exerciseId: string;
  exerciseName: string;
  serieNumber: number;
  weight: number;
  reps: number;
  oneRM: number;
  timestamp: number;
}

export interface DailyDietLog {
  date: string; // YYYY-MM-DD
  meals: {
    id: string;
    mealType: 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'pos_treino';
    foodName: string;
    grams: number;
    calories: number;
    protein: number;
    carbs: number;
    fat: number;
  }[];
}

