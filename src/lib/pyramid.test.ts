import { describe, it, expect } from 'vitest';
import {
  calculate1RM,
  isRepsOutOfRange,
  recalculateSeriesForPhase,
  checkPersonalRecord,
  ExerciseSerie,
  LastPerformanceData,
  HistoryEntryLike,
} from './pyramid';

describe('pyramid lib', () => {
  it('deve calcular 1RM com fórmula de Epley', () => {
    expect(calculate1RM(80, 10)).toBe(106.7);
    expect(calculate1RM(100, 1)).toBe(100);
    expect(calculate1RM(0, 10)).toBe(0);
  });

  it('Fase Base: todas as séries com a mesma carga e reps de 12 a 15', () => {
    const lastPerf: LastPerformanceData = { weight: 100, reps: 1, oneRM: 100 };
    const initialSeries: ExerciseSerie[] = [
      { id: '1', serieNumber: 1, weight: 0, reps: 10, completed: false },
      { id: '2', serieNumber: 2, weight: 0, reps: 10, completed: false },
      { id: '3', serieNumber: 3, weight: 0, reps: 10, completed: false },
      { id: '4', serieNumber: 4, weight: 0, reps: 10, completed: false },
    ];

    const result = recalculateSeriesForPhase(initialSeries, 'base', lastPerf);

    expect(result[0].weight).toBe(65);
    expect(result[1].weight).toBe(65);
    expect(result[2].weight).toBe(65);
    expect(result[3].weight).toBe(65);

    result.forEach((s) => {
      expect(s.reps).toBeGreaterThanOrEqual(12);
      expect(s.reps).toBeLessThanOrEqual(15);
    });
  });

  it('Fase Pirâmide: carga crescente e reps decrescentes (15 -> 12 -> 10 -> 8)', () => {
    const lastPerf: LastPerformanceData = { weight: 80, reps: 10, oneRM: 106.7 };
    const initialSeries: ExerciseSerie[] = [
      { id: '1', serieNumber: 1, weight: 0, reps: 10, completed: false },
      { id: '2', serieNumber: 2, weight: 0, reps: 10, completed: false },
      { id: '3', serieNumber: 3, weight: 0, reps: 10, completed: false },
      { id: '4', serieNumber: 4, weight: 0, reps: 10, completed: false },
    ];

    const result = recalculateSeriesForPhase(initialSeries, 'piramide', lastPerf);

    expect(result[0].reps).toBe(15);
    expect(result[1].reps).toBe(12);
    expect(result[2].reps).toBe(10);
    expect(result[3].reps).toBe(8);

    expect(result[0].weight).toBeLessThan(result[1].weight);
    expect(result[1].weight).toBeLessThan(result[2].weight);
    expect(result[2].weight).toBeLessThan(result[3].weight);
  });

  it('Fase Pico: 4 séries de 6-8 reps com cargas altas e próximas', () => {
    const lastPerf: LastPerformanceData = { weight: 100, reps: 1, oneRM: 100 };
    const initialSeries: ExerciseSerie[] = [
      { id: '1', serieNumber: 1, weight: 0, reps: 10, completed: false },
      { id: '2', serieNumber: 2, weight: 0, reps: 10, completed: false },
      { id: '3', serieNumber: 3, weight: 0, reps: 10, completed: false },
      { id: '4', serieNumber: 4, weight: 0, reps: 10, completed: false },
    ];

    const result = recalculateSeriesForPhase(initialSeries, 'pico', lastPerf);

    result.forEach((s) => {
      expect(s.reps).toBeGreaterThanOrEqual(6);
      expect(s.reps).toBeLessThanOrEqual(8);
    });

    expect(result[0].weight).toBe(83);
    expect(result[1].weight).toBe(85);
    expect(result[2].weight).toBe(88);
    expect(result[3].weight).toBe(90);
  });

  it('Não deve sobrescrever séries já concluídas ao recalcular fase', () => {
    const lastPerf: LastPerformanceData = { weight: 100, reps: 1, oneRM: 100 };
    const initialSeries: ExerciseSerie[] = [
      { id: '1', serieNumber: 1, weight: 50, reps: 12, completed: true },
      { id: '2', serieNumber: 2, weight: 0, reps: 10, completed: false },
    ];

    const result = recalculateSeriesForPhase(initialSeries, 'pico', lastPerf);

    expect(result[0].weight).toBe(50);
    expect(result[0].reps).toBe(12);
    expect(result[0].completed).toBe(true);

    expect(result[1].weight).toBe(85);
    expect(result[1].reps).toBe(8);
  });

  it('Sem treino anterior: começar vazio/zero com o botão + pronto', () => {
    const initialSeries: ExerciseSerie[] = [
      { id: '1', serieNumber: 1, weight: 0, reps: 10, completed: false },
    ];

    const result = recalculateSeriesForPhase(initialSeries, 'piramide', null);
    expect(result[0].weight).toBe(0);
    expect(result[0].reps).toBe(15);
  });

  it('isRepsOutOfRange detecta reps fora da faixa da meta', () => {
    expect(isRepsOutOfRange(10, 12, 15)).toBe(true);
    expect(isRepsOutOfRange(16, 12, 15)).toBe(true);
    expect(isRepsOutOfRange(12, 12, 15)).toBe(false);
    expect(isRepsOutOfRange(15, 12, 15)).toBe(false);
  });

  it('checkPersonalRecord detecta quando o usuário quebra o recorde de carga', () => {
    const history: HistoryEntryLike[] = [
      { exerciseId: 'supino', weight: 80, reps: 10, oneRM: 106.7 },
      { exerciseId: 'supino', weight: 85, reps: 8, oneRM: 107.7 },
    ];

    // Carga maior que 85kg -> PR!
    const resPR = checkPersonalRecord('supino', 90, 8, history);
    expect(resPR.isPR).toBe(true);
    expect(resPR.label).toContain('PR +5kg');

    // Carga menor que o recorde -> Sem PR
    const resNoPR = checkPersonalRecord('supino', 80, 8, history);
    expect(resNoPR.isPR).toBe(false);
  });
});
