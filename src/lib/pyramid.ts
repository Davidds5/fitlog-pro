export type PeriodizationPhase = 'base' | 'piramide' | 'pico';

export interface PyramidSerieConfig {
  serieNumber: number;
  targetReps: string;
  intensityLabel: string;
  percentageOfMax: number; // ex: 0.60 para 60%
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
 * Retorna as configurações de séries sugeridas para cada fase de periodização.
 */
export function getPhaseSeriesConfig(phase: PeriodizationPhase): PyramidSerieConfig[] {
  switch (phase) {
    case 'base':
      return [
        { serieNumber: 1, targetReps: '12-15', intensityLabel: 'Moderado', percentageOfMax: 0.60 },
        { serieNumber: 2, targetReps: '12-15', intensityLabel: 'Moderado', percentageOfMax: 0.65 },
        { serieNumber: 3, targetReps: '12-15', intensityLabel: 'Moderado', percentageOfMax: 0.65 },
        { serieNumber: 4, targetReps: '12-15', intensityLabel: 'Moderado', percentageOfMax: 0.70 },
      ];
    case 'piramide':
      return [
        { serieNumber: 1, targetReps: '15', intensityLabel: 'Leve (Aquecimento/Ativação)', percentageOfMax: 0.55 },
        { serieNumber: 2, targetReps: '12', intensityLabel: 'Médio', percentageOfMax: 0.65 },
        { serieNumber: 3, targetReps: '10', intensityLabel: 'Pesado', percentageOfMax: 0.75 },
        { serieNumber: 4, targetReps: '8', intensityLabel: 'Carga Máxima', percentageOfMax: 0.85 },
      ];
    case 'pico':
      return [
        { serieNumber: 1, targetReps: '6-8', intensityLabel: 'Carga Alta', percentageOfMax: 0.80 },
        { serieNumber: 2, targetReps: '6-8', intensityLabel: 'Carga Alta', percentageOfMax: 0.825 },
        { serieNumber: 3, targetReps: '6-8', intensityLabel: 'Pico de Força', percentageOfMax: 0.85 },
        { serieNumber: 4, targetReps: '6', intensityLabel: 'Falha Técnica', percentageOfMax: 0.90 },
      ];
  }
}

/**
 * Sugere a carga para uma série com base na 1RM e na fase, arredondando para múltiplos de 1kg ou 2.5kg.
 */
export function suggestWeight(estimated1RM: number, percentageOfMax: number, step = 1): number {
  if (estimated1RM <= 0) return 0;
  const rawWeight = estimated1RM * percentageOfMax;
  const rounded = Math.round(rawWeight / step) * step;
  return Math.round(rounded * 10) / 10;
}

