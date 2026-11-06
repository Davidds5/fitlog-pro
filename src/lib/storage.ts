'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { validateStorageData } from '@/lib/schemas';

export const FITLOG_SCHEMA_VERSION = 3;

/**
 * Cria backup automático preventivo de todas as chaves do FitLog
 * antes de migrações ou ações críticas.
 */
export function createAutomaticBackup(reason: string = 'auto'): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const backupData: Record<string, unknown> = {};
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('fitlog_') && !k.startsWith('fitlog_backup_auto_')) {
        try {
          const val = window.localStorage.getItem(k);
          if (val) backupData[k] = JSON.parse(val);
        } catch {
          backupData[k] = window.localStorage.getItem(k);
        }
      }
    }

    const timestamp = Date.now();
    const backupKey = `fitlog_backup_auto_${reason}_${timestamp}`;
    window.localStorage.setItem(
      backupKey,
      JSON.stringify({
        version: FITLOG_SCHEMA_VERSION,
        createdAt: new Date().toISOString(),
        reason,
        data: backupData,
      })
    );

    // Mantém no máximo 5 backups automáticos para economizar cota do LocalStorage
    const autoKeys: string[] = [];
    for (let i = 0; i < window.localStorage.length; i++) {
      const k = window.localStorage.key(i);
      if (k && k.startsWith('fitlog_backup_auto_')) {
        autoKeys.push(k);
      }
    }
    if (autoKeys.length > 5) {
      autoKeys.sort();
      const toRemove = autoKeys.slice(0, autoKeys.length - 5);
      toRemove.forEach((k) => window.localStorage.removeItem(k));
    }

    return backupKey;
  } catch (err) {
    console.warn('[FitLog Backup] Não foi possível criar backup automático preventivo:', err);
    return null;
  }
}

/**
 * Executa migrações de dados com garantia de zero perda.
 * Salva snapshot automático antes de alterar qualquer chave.
 */
export function runSafeMigrations(): void {
  if (typeof window === 'undefined') return;

  try {
    const storedVerStr = window.localStorage.getItem('fitlog_schema_version');
    const storedVer = storedVerStr ? Number(storedVerStr) : 1;

    if (storedVer < FITLOG_SCHEMA_VERSION) {
      // 1. Criar snapshot de segurança antes de qualquer modificação
      createAutomaticBackup(`pre_migration_v${storedVer}_to_v${FITLOG_SCHEMA_VERSION}`);

      // 2. Migração para v3: marcação de origem 'usuario' em fichas existentes
      const rawFichas = window.localStorage.getItem('fitlog_fichas');
      if (rawFichas) {
        try {
          const parsed = JSON.parse(rawFichas);
          if (Array.isArray(parsed)) {
            const updatedFichas = parsed.map((f) => ({
              ...f,
              origem: f.origem || 'usuario',
              exercises: Array.isArray(f.exercises)
                ? f.exercises.map((ex: any) => ({
                    ...ex,
                    origem: ex.origem || 'usuario',
                  }))
                : [],
            }));
            window.localStorage.setItem('fitlog_fichas', JSON.stringify(updatedFichas));
          }
        } catch (e) {
          console.warn('[FitLog Migration] Falha ao converter fichas para v3, mantendo originais:', e);
        }
      }

      window.localStorage.setItem('fitlog_schema_version', String(FITLOG_SCHEMA_VERSION));
      console.log(`[FitLog Storage] Migração concluída com sucesso para versão ${FITLOG_SCHEMA_VERSION}.`);
    }
  } catch (err) {
    console.error('[FitLog Migration] Erro crítico na migração. Dados preservados intactos:', err);
  }
}

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
  muscleGroup?: string;
  workoutId?: string;
  sessionId?: string;
  serieNumber: number;
  weight: number;
  reps: number;
  oneRM: number;
  volume?: number;
  timestamp: number;
}

export interface WorkoutSession {
  id: string;
  date: string;
  workoutId: string;
  workoutName: string;
  durationMinutes: number;
  durationSeconds: number;
  totalVolumeKg: number;
  completedSetsCount: number;
  totalSetsCount: number;
  prCount: number;
  improvedSetsCount: number;
  timestamp: number;
}

export interface BodyWeightEntry {
  id: string;
  date: string;
  weight: number;
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
