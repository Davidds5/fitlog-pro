import { describe, it, expect } from 'vitest';
import {
  getComparisonReference,
  calculateSetProgression,
  checkIsSetPR,
  getExerciseRecords,
  getExerciseTimeSeries,
  getPeriodComparison,
  getWeeklyMuscleVolume,
} from './evolution';
import { SetLogEntry, WorkoutSession } from './storage';

describe('Evolution & Comparison Logic', () => {
  const mockHistory: SetLogEntry[] = [
    {
      id: 'log-1',
      date: '2026-10-01',
      exerciseId: 'supino-reto',
      exerciseName: 'Supino Reto',
      muscleGroup: 'Peito',
      serieNumber: 1,
      weight: 60,
      reps: 10,
      oneRM: 80,
      volume: 600,
      timestamp: new Date('2026-10-01T10:00:00Z').getTime(),
    },
    {
      id: 'log-2',
      date: '2026-10-15',
      exerciseId: 'supino-reto',
      exerciseName: 'Supino Reto',
      muscleGroup: 'Peito',
      serieNumber: 1,
      weight: 70,
      reps: 10,
      oneRM: 93.3,
      volume: 700,
      timestamp: new Date('2026-10-15T10:00:00Z').getTime(),
    },
    {
      id: 'log-3',
      date: '2026-10-30',
      exerciseId: 'supino-reto',
      exerciseName: 'Supino Reto',
      muscleGroup: 'Peito',
      serieNumber: 1,
      weight: 75,
      reps: 8,
      oneRM: 95,
      volume: 600,
      timestamp: new Date('2026-10-30T10:00:00Z').getTime(),
    },
    {
      id: 'log-4',
      date: '2026-10-30',
      exerciseId: 'supino-reto',
      exerciseName: 'Supino Reto',
      muscleGroup: 'Peito',
      serieNumber: 2,
      weight: 80,
      reps: 6,
      oneRM: 96,
      volume: 480,
      timestamp: new Date('2026-10-30T10:05:00Z').getTime(),
    },
  ];

  it('deve retornar a referência correta para último treino', () => {
    const ref = getComparisonReference('supino-reto', 1, 'last_workout', mockHistory, '2026-11-06');
    expect(ref).not.toBeNull();
    expect(ref?.date).toBe('2026-10-30');
    expect(ref?.weight).toBe(75);
    expect(ref?.reps).toBe(8);
  });

  it('deve retornar a melhor marca histórica quando selecionado all_time_best', () => {
    const ref = getComparisonReference('supino-reto', 1, 'all_time_best', mockHistory, '2026-11-06');
    expect(ref).not.toBeNull();
    expect(ref?.weight).toBe(80);
    expect(ref?.reps).toBe(6);
  });

  it('deve calcular corretamente o indicador de progressão por série', () => {
    // Aumento de peso
    const prog1 = calculateSetProgression(82, 8, 80, 8);
    expect(prog1.status).toBe('better');
    expect(prog1.label).toBe('↑ +2kg');

    // Queda de peso
    const prog2 = calculateSetProgression(78, 8, 80, 8);
    expect(prog2.status).toBe('worse');
    expect(prog2.label).toBe('↓ -2kg');

    // Mesmo peso, mais reps
    const prog3 = calculateSetProgression(80, 10, 80, 8);
    expect(prog3.status).toBe('better');
    expect(prog3.label).toBe('↑ +2 reps');

    // Mesmo peso, menos reps
    const prog4 = calculateSetProgression(80, 6, 80, 8);
    expect(prog4.status).toBe('worse');
    expect(prog4.label).toBe('↓ -2 reps');

    // Exatamente igual
    const prog5 = calculateSetProgression(80, 8, 80, 8);
    expect(prog5.status).toBe('equal');
    expect(prog5.label).toBe('= igual');

    // Sem referência
    const prog6 = calculateSetProgression(80, 8, 0, 0);
    expect(prog6.status).toBe('neutral');
  });

  it('deve identificar quebra de Recorde Pessoal (PR) de peso', () => {
    const prCheck = checkIsSetPR('supino-reto', 85, 6, mockHistory);
    expect(prCheck.isPR).toBe(true);
    expect(prCheck.type).toBe('weight');
    expect(prCheck.label).toContain('PR +5kg');
  });

  it('não deve apontar falso PR se a carga for inferior', () => {
    const prCheck = checkIsSetPR('supino-reto', 70, 6, mockHistory);
    expect(prCheck.isPR).toBe(false);
  });

  it('deve consolidar recordes do exercício corretamente', () => {
    const records = getExerciseRecords('supino-reto', mockHistory);
    expect(records.maxWeight?.value).toBe(80);
    expect(records.totalSets).toBe(4);
    expect(records.best1RM?.value).toBeGreaterThanOrEqual(96);
    expect(records.bestVolume?.value).toBe(700);
  });

  it('deve gerar pontos de série temporal para o gráfico de linha', () => {
    const points = getExerciseTimeSeries('supino-reto', mockHistory, 'maxWeight', 'all');
    expect(points.length).toBe(3); // 3 datas distintas
    expect(points[0].weight).toBe(60);
    expect(points[2].weight).toBe(80);
  });

  it('deve comparar períodos de sessões sem quebrar com zero histórico', () => {
    const sessions: WorkoutSession[] = [
      {
        id: 'sess-1',
        date: '2026-11-05',
        workoutId: 'ficha-a',
        workoutName: 'Treino A',
        durationMinutes: 45,
        durationSeconds: 2700,
        totalVolumeKg: 4500,
        completedSetsCount: 16,
        totalSetsCount: 16,
        prCount: 1,
        improvedSetsCount: 4,
        timestamp: Date.now() - 24 * 60 * 60 * 1000,
      },
    ];

    const comp = getPeriodComparison(sessions, 'week');
    expect(comp.currentVolume).toBe(4500);
    expect(comp.currentSets).toBe(16);
    expect(comp.currentWorkouts).toBe(1);
  });

  it('deve calcular volume semanal por músculo', () => {
    const recentHistory: SetLogEntry[] = [
      {
        id: 'log-rec-1',
        date: new Date().toISOString().split('T')[0],
        exerciseId: 'supino-reto',
        exerciseName: 'Supino Reto',
        muscleGroup: 'Peito',
        serieNumber: 1,
        weight: 80,
        reps: 10,
        oneRM: 106,
        volume: 800,
        timestamp: Date.now(),
      },
    ];

    const muscleVol = getWeeklyMuscleVolume(recentHistory);
    expect(muscleVol.length).toBe(1);
    expect(muscleVol[0].muscle).toBe('Peito');
    expect(muscleVol[0].volumeKg).toBe(800);
    expect(muscleVol[0].percent).toBe(100);
  });
});
