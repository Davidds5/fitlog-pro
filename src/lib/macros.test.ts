import { describe, it, expect } from 'vitest';
import {
  calculateTMB,
  calculateMacroGoals,
  calculatePortionMacros,
  searchFoods,
  FoodItem,
  UserProfile,
} from './macros';

describe('macros lib', () => {
  it('deve calcular TMB corretamente com Mifflin-St Jeor', () => {
    // Homem: 80kg, 175cm, 25 anos -> (10 * 80) + (6.25 * 175) - (5 * 25) + 5
    // 800 + 1093.75 - 125 + 5 = 1773.75 -> 1774
    const tmb = calculateTMB(80, 175, 25, 'masculino');
    expect(tmb).toBe(1774);
  });

  it('deve calcular TDEE e divisão de macros para hipertrofia (ganhar)', () => {
    const profile: UserProfile = {
      weight: 80,
      height: 175,
      age: 25,
      gender: 'masculino',
      activityLevel: 'moderado',
      goal: 'ganhar',
    };
    const goals = calculateMacroGoals(profile);
    // TDEE = 1774 * 1.55 = 2750 -> target = 2750 + 350 = 3100
    expect(goals.calories).toBeGreaterThan(2500);
    // Proteína: 80 * 2 = 160g
    expect(goals.protein).toBe(160);
    // Gordura: 80 * 0.9 = 72g
    expect(goals.fat).toBe(72);
    expect(goals.carbs).toBeGreaterThan(200);
  });

  it('deve calcular porção em gramas proporcional a 100g', () => {
    const frango: FoodItem = {
      id: '1',
      name: 'Peito de Frango Grelhado',
      category: 'Carnes e Ovos',
      portionBaseGrams: 100,
      calories: 165,
      protein: 31,
      carbs: 0,
      fat: 3.6,
    };

    const portion150g = calculatePortionMacros(frango, 150);
    expect(portion150g.grams).toBe(150);
    expect(portion150g.calories).toBe(247.5);
    expect(portion150g.protein).toBe(46.5);
    expect(portion150g.fat).toBe(5.4);
  });

  it('deve buscar alimentos tolerando acentos e maiúsculas', () => {
    const mockFoods: FoodItem[] = [
      { id: '1', name: 'Pão Francês', category: 'Cereais', portionBaseGrams: 100, calories: 300, protein: 8, carbs: 58, fat: 3 },
      { id: '2', name: 'Arroz Integral Cozido', category: 'Cereais', portionBaseGrams: 100, calories: 124, protein: 2.6, carbs: 25.8, fat: 1 },
      { id: '3', name: 'Feijão Preto Cozido', category: 'Leguminosas', portionBaseGrams: 100, calories: 77, protein: 4.5, carbs: 14, fat: 0.5 },
    ];

    const result = searchFoods(mockFoods, 'pao frances');
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');

    const resultFeijao = searchFoods(mockFoods, 'FEIJAO');
    expect(resultFeijao).toHaveLength(1);
    expect(resultFeijao[0].id).toBe('3');
  });
});

