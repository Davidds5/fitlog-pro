import { describe, it, expect } from 'vitest';
import { calculate1RM, getPhaseSeriesConfig, suggestWeight } from './pyramid';

describe('pyramid lib', () => {
  it('deve calcular 1RM com precisão usando a fórmula de Epley', () => {
    // 1RM para 80kg x 10 reps = 80 * (1 + 10/30) = 80 * 1.3333 = 106.7
    expect(calculate1RM(80, 10)).toBe(106.7);
    // Para 1 repetição, deve retornar o próprio peso
    expect(calculate1RM(100, 1)).toBe(100);
    // Para valores zerados ou negativos
    expect(calculate1RM(0, 10)).toBe(0);
    expect(calculate1RM(100, 0)).toBe(0);
  });

  it('deve retornar configurações corretas para a fase de pirâmide', () => {
    const config = getPhaseSeriesConfig('piramide');
    expect(config).toHaveLength(4);
    expect(config[0].targetReps).toBe('15');
    expect(config[3].targetReps).toBe('8');
    expect(config[3].percentageOfMax).toBe(0.85);
  });

  it('deve sugerir cargas arredondadas por múltiplos', () => {
    const oneRM = 100;
    // 75% com passo de 1kg
    expect(suggestWeight(oneRM, 0.75, 1)).toBe(75);
    // 75% de 83 = 62.25 -> com passo de 2.5kg vira 62.5
    expect(suggestWeight(83, 0.75, 2.5)).toBe(62.5);
  });
});

