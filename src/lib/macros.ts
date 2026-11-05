export type ActivityLevel = 'sedentario' | 'leve' | 'moderado' | 'ativo' | 'muito_ativo';
export type Gender = 'masculino' | 'feminino';

export interface UserProfile {
  weight: number; // kg
  height: number; // cm
  age: number; // anos
  gender: Gender;
  activityLevel: ActivityLevel;
  goal: 'manter' | 'perder' | 'ganhar';
}

export interface MacroGoals {
  calories: number;
  protein: number; // g
  carbs: number; // g
  fat: number; // g
  tmb: number;
  tdee: number;
}

export interface FoodItem {
  id: string;
  name: string;
  category: string;
  portionBaseGrams: number; // normalmente 100g
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

export interface CalculatedFoodPortion {
  grams: number;
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * Fórmula de Mifflin-St Jeor para Taxa Metabólica Basal (TMB).
 * Homem: (10 × peso) + (6.25 × altura) - (5 × idade) + 5
 * Mulher: (10 × peso) + (6.25 × altura) - (5 × idade) - 161
 */
export function calculateTMB(weight: number, height: number, age: number, gender: Gender): number {
  if (weight <= 0 || height <= 0 || age <= 0) return 0;
  const base = 10 * weight + 6.25 * height - 5 * age;
  const tmb = gender === 'masculino' ? base + 5 : base - 161;
  return Math.round(tmb);
}

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  sedentario: 1.2,
  leve: 1.375,
  moderado: 1.55,
  ativo: 1.725,
  muito_ativo: 1.9,
};

/**
 * Calcula o Gasto Energético Total Diário (TDEE).
 */
export function calculateTDEE(tmb: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.375;
  return Math.round(tmb * multiplier);
}

/**
 * Calcula as metas diárias de calorias e macros (Proteína ~2g/kg, Gordura ~0.9g/kg, resto em Carbos).
 */
export function calculateMacroGoals(profile: UserProfile): MacroGoals {
  const tmb = calculateTMB(profile.weight, profile.height, profile.age, profile.gender);
  const tdee = calculateTDEE(tmb, profile.activityLevel);

  let targetCalories = tdee;
  if (profile.goal === 'perder') {
    targetCalories = Math.max(1200, Math.round(tdee - 400));
  } else if (profile.goal === 'ganhar') {
    targetCalories = Math.round(tdee + 350);
  }

  // Proteína: 2.0g/kg
  const protein = Math.round(profile.weight * 2.0);
  // Gordura: ~0.9g/kg
  const fat = Math.round(profile.weight * 0.9);
  
  // Calorias de proteína (4 kcal/g) e gordura (9 kcal/g)
  const caloriesFromProteinAndFat = (protein * 4) + (fat * 9);
  const remainingCalories = Math.max(0, targetCalories - caloriesFromProteinAndFat);
  // Carboidrato (4 kcal/g)
  const carbs = Math.round(remainingCalories / 4);

  return {
    calories: targetCalories,
    protein,
    carbs,
    fat,
    tmb,
    tdee,
  };
}

/**
 * Calcula calorias e macronutrientes para uma porção em gramas com base em 100g.
 */
export function calculatePortionMacros(food: FoodItem, grams: number): CalculatedFoodPortion {
  if (grams <= 0) {
    return { grams: 0, calories: 0, protein: 0, carbs: 0, fat: 0 };
  }
  const factor = grams / food.portionBaseGrams;
  return {
    grams,
    calories: Math.round(food.calories * factor * 10) / 10,
    protein: Math.round(food.protein * factor * 10) / 10,
    carbs: Math.round(food.carbs * factor * 10) / 10,
    fat: Math.round(food.fat * factor * 10) / 10,
  };
}

/**
 * Normaliza string removendo acentos e espaços extras para busca rápida e tolerante.
 */
export function normalizeSearchTerm(term: string): string {
  return term
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim();
}

/**
 * Busca alimentos de forma rápida e tolerante a acentos.
 */
export function searchFoods(foods: FoodItem[], query: string): FoodItem[] {
  const normalizedQuery = normalizeSearchTerm(query);
  if (!normalizedQuery) return foods.slice(0, 20);

  const tokens = normalizedQuery.split(/\s+/).filter(Boolean);
  return foods.filter((food) => {
    const normalizedName = normalizeSearchTerm(food.name);
    const normalizedCategory = normalizeSearchTerm(food.category);
    return tokens.every((token) => normalizedName.includes(token) || normalizedCategory.includes(token));
  });
}

