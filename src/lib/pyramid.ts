export type PeriodizationPhase = 'base' | 'piramide' | 'pico';

export interface PyramidSerieConfig {
  serieNumber: number;
  targetReps: string;
  defaultReps: number;
  minReps: number;
  maxReps: number;
  intensityLabel: string;
  percentageOfMax: number;
}

export interface ExerciseSerie {
  id: string;
  serieNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
}

export interface LastPerformanceData {
  weight: number;
  reps: number;
  oneRM: number;
}

/**
 * Fórmula de Epley para estimar 1 Repetição Máxima (1RM).
 * 1RM = Peso * (1 + Reps / 30)
 * Se reps for 1, retorna o próprio peso.
 */
export function calculate1RM(weight: number, reps: number): number {
  if (weight <= 0 || reps <= 0) return 0;
  if (reps === 1) return Math.round(weight * 10) / 10;
  const oneRM = weight * (1 + reps / 30);
  return Math.round(oneRM * 10) / 10;
}

/**
 * Configuração padrão de cada série de acordo com a fase de periodização.
 */
export function getPhaseSeriesConfig(phase: PeriodizationPhase): PyramidSerieConfig[] {
  switch (phase) {
    case 'base':
      return [
        { serieNumber: 1, targetReps: '12-15', defaultReps: 15, minReps: 12, maxReps: 15, intensityLabel: 'Moderado', percentageOfMax: 0.65 },
        { serieNumber: 2, targetReps: '12-15', defaultReps: 14, minReps: 12, maxReps: 15, intensityLabel: 'Moderado', percentageOfMax: 0.65 },
        { serieNumber: 3, targetReps: '12-15', defaultReps: 13, minReps: 12, maxReps: 15, intensityLabel: 'Moderado', percentageOfMax: 0.65 },
        { serieNumber: 4, targetReps: '12-15', defaultReps: 12, minReps: 12, maxReps: 15, intensityLabel: 'Moderado', percentageOfMax: 0.65 },
      ];
    case 'piramide':
      return [
        { serieNumber: 1, targetReps: '15', defaultReps: 15, minReps: 14, maxReps: 16, intensityLabel: 'Leve / Ativação', percentageOfMax: 0.60 },
        { serieNumber: 2, targetReps: '12', defaultReps: 12, minReps: 11, maxReps: 13, intensityLabel: 'Médio', percentageOfMax: 0.70 },
        { serieNumber: 3, targetReps: '10', defaultReps: 10, minReps: 9, maxReps: 11, intensityLabel: 'Pesado', percentageOfMax: 0.80 },
        { serieNumber: 4, targetReps: '8', defaultReps: 8, minReps: 7, maxReps: 9, intensityLabel: 'Carga Máxima', percentageOfMax: 0.85 },
      ];
    case 'pico':
      return [
        { serieNumber: 1, targetReps: '6-8', defaultReps: 8, minReps: 6, maxReps: 8, intensityLabel: 'Carga Alta', percentageOfMax: 0.825 },
        { serieNumber: 2, targetReps: '6-8', defaultReps: 8, minReps: 6, maxReps: 8, intensityLabel: 'Carga Alta', percentageOfMax: 0.85 },
        { serieNumber: 3, targetReps: '6-8', defaultReps: 6, minReps: 6, maxReps: 8, intensityLabel: 'Pico de Força', percentageOfMax: 0.875 },
        { serieNumber: 4, targetReps: '6-8', defaultReps: 6, minReps: 6, maxReps: 8, intensityLabel: 'Falha Técnica', percentageOfMax: 0.90 },
      ];
  }
}

/**
 * Sugere a carga para uma série com base na 1RM e na fase, arredondando para múltiplos de step (padrão 1kg).
 */
export function suggestWeight(estimated1RM: number, percentageOfMax: number, step = 1): number {
  if (estimated1RM <= 0) return 0;
  const rawWeight = estimated1RM * percentageOfMax;
  const rounded = Math.round(rawWeight / step) * step;
  return Math.round(rounded * 10) / 10;
}

/**
 * Verifica se as repetições informadas estão fora da faixa da meta.
 */
export function isRepsOutOfRange(reps: number, minReps: number, maxReps: number): boolean {
  if (reps <= 0) return true;
  return reps < minReps || reps > maxReps;
}

/**
 * Recalcula valores sugeridos das séries com base na fase e no último treino.
 * NÃO sobrescreve séries já concluídas.
 */
export function recalculateSeriesForPhase(
  currentSeries: ExerciseSerie[],
  phase: PeriodizationPhase,
  lastPerformance: LastPerformanceData | null
): ExerciseSerie[] {
  const configs = getPhaseSeriesConfig(phase);
  const oneRM = lastPerformance && lastPerformance.weight > 0
    ? (lastPerformance.oneRM > 0 ? lastPerformance.oneRM : calculate1RM(lastPerformance.weight, lastPerformance.reps))
    : 0;

  return currentSeries.map((serie, index) => {
    // Não sobrescrever séries já concluídas
    if (serie.completed) {
      return serie;
    }

    const cfg = configs[index] || configs[configs.length - 1];
    const suggestedW = oneRM > 0 ? suggestWeight(oneRM, cfg.percentageOfMax) : 0;

    return {
      ...serie,
      weight: suggestedW,
      reps: cfg.defaultReps,
    };
  });
}
