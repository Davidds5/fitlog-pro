import { describe, it, expect } from 'vitest';
import {
  UserProfileSchema,
  WorkoutFichaSchema,
  validateStorageData,
} from './schemas';

describe('Zod LocalStorage Schemas & Sanitization', () => {
  it('deve validar um perfil válido com sucesso', () => {
    const validProfile = {
      weight: 80,
      height: 180,
      age: 26,
      gender: 'masculino',
      activityLevel: 'moderado',
      goal: 'ganhar',
    };

    const result = UserProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it('deve rejeitar perfil adulterado (valores inválidos ou negativos)', () => {
    const invalidProfile = {
      weight: -10, // peso negativo
      height: 9999, // altura impossível
      age: 0,
      gender: 'alien',
      activityLevel: 'ultra',
      goal: 'hack',
    };

    const result = UserProfileSchema.safeParse(invalidProfile);
    expect(result.success).toBe(false);
  });

  it('validateStorageData deve restaurar fallback seguro quando JSON for corrompido', () => {
    const fallback = {
      weight: 75,
      height: 175,
      age: 25,
      gender: 'masculino' as const,
      activityLevel: 'moderado' as const,
      goal: 'manter' as const,
    };

    // Objeto corrompido que violaria a integridade da aplicação
    const corruptedData = { weight: 'cem quilos', height: null };

    const sanitized = validateStorageData('fitlog_profile', corruptedData, fallback);
    expect(sanitized).toEqual(fallback);
  });

  it('deve validar ficha de treino completa com séries', () => {
    const ficha = {
      id: 'ficha-teste',
      name: 'Treino A',
      letter: 'A',
      description: 'Treino de Peito',
      phase: 'piramide' as const,
      exercises: [
        {
          id: 'ex-1',
          exerciseId: 'ex-supino',
          name: 'Supino Reto',
          muscleGroup: 'Peito',
          series: [
            { id: 's-1', serieNumber: 1, weight: 80, reps: 10, completed: false },
          ],
        },
      ],
    };

    const result = WorkoutFichaSchema.safeParse(ficha);
    expect(result.success).toBe(true);
  });
});
