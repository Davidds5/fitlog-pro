import { z } from 'zod';

/**
 * FitLog Pro: Schemas de Validação e Sanitização de Dados (Zod)
 * Protege contra dados corrompidos, adulterados ou injeções no LocalStorage.
 */

// Schema de Perfil do Usuário
export const UserProfileSchema = z.object({
  weight: z.number().min(20).max(400),
  height: z.number().min(80).max(280),
  age: z.number().min(10).max(120),
  gender: z.enum(['masculino', 'feminino']),
  activityLevel: z.enum(['sedentario', 'leve', 'moderado', 'ativo', 'muito_ativo']),
  goal: z.enum(['manter', 'perder', 'ganhar']),
});

// Schema de Série de Exercício
export const ExerciseSerieSchema = z.object({
  id: z.string().max(120),
  serieNumber: z.number().min(1).max(50),
  weight: z.number().min(0).max(1000),
  reps: z.number().min(0).max(200),
  completed: z.boolean(),
});

// Schema de Exercício na Ficha
export const WorkoutExerciseSchema = z.object({
  id: z.string().max(120),
  exerciseId: z.string().max(120),
  name: z.string().min(1).max(120),
  muscleGroup: z.string().max(60),
  series: z.array(ExerciseSerieSchema).max(30),
});

// Schema de Ficha de Treino
export const WorkoutFichaSchema = z.object({
  id: z.string().max(120),
  name: z.string().min(1).max(100),
  letter: z.string().max(30),
  description: z.string().max(500).default(''),
  phase: z.enum(['base', 'piramide', 'pico']).default('piramide'),
  color: z.string().max(40).optional(),
  icon: z.string().max(40).optional(),
  weekDays: z.array(z.number().min(0).max(6)).optional(),
  exercises: z.array(WorkoutExerciseSchema).max(50),
});

export const WorkoutFichasArraySchema = z.array(WorkoutFichaSchema).max(20);

// Schema de Histórico de Desempenho
export const SetLogEntrySchema = z.object({
  id: z.string().max(120),
  exerciseId: z.string().max(120),
  exerciseName: z.string().max(120),
  date: z.string().max(30),
  setNumber: z.number().min(1).max(50),
  weight: z.number().min(0).max(1000),
  reps: z.number().min(0).max(200),
  oneRM: z.number().min(0).max(1500),
  timestamp: z.number().min(0),
});

export const HistoryArraySchema = z.array(SetLogEntrySchema).max(5000);

// Schema de Item de Refeição
export const MealItemLogSchema = z.object({
  id: z.string().max(120),
  mealType: z.enum(['cafe', 'almoco', 'lanche', 'jantar', 'pos_treino']),
  foodName: z.string().min(1).max(120),
  grams: z.number().min(1).max(10000),
  calories: z.number().min(0).max(20000),
  protein: z.number().min(0).max(1000),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(1000),
  unitDisplay: z.string().max(60).optional(),
});

// Schema de Log Diário de Dieta
export const DailyDietLogSchema = z.object({
  date: z.string().max(30),
  meals: z.array(MealItemLogSchema).max(50),
});

export const DailyDietLogsArraySchema = z.array(DailyDietLogSchema).max(365);

// Schema de Alimento Personalizado
export const CustomFoodItemSchema = z.object({
  id: z.string().max(120),
  name: z.string().min(1).max(120),
  category: z.string().max(60),
  portionBaseGrams: z.number().min(1).max(1000).default(100),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(500),
  fat: z.number().min(0).max(500),
  unitWeightGrams: z.number().min(1).max(2000).optional(),
  unitName: z.string().max(30).optional(),
});

export const CustomFoodsArraySchema = z.array(CustomFoodItemSchema).max(500);

// Schema de Exercício Personalizado
export const CustomExerciseItemSchema = z.object({
  id: z.string().max(120),
  name: z.string().min(1).max(120),
  muscleGroup: z.string().max(60),
  equipment: z.string().max(100),
  tip: z.string().max(1000).optional(),
});

export const CustomExercisesArraySchema = z.array(CustomExerciseItemSchema).max(300);

/**
 * Mapa central de validadores por chave de LocalStorage
 */
export const STORAGE_VALIDATORS: Record<string, z.ZodTypeAny> = {
  fitlog_profile: UserProfileSchema,
  fitlog_fichas: WorkoutFichasArraySchema,
  fitlog_history: HistoryArraySchema,
  fitlog_diet_logs: DailyDietLogsArraySchema,
  fitlog_custom_foods: CustomFoodsArraySchema,
  fitlog_custom_exercises: CustomExercisesArraySchema,
};

/**
 * Validador seguro que retorna o dado sanitizado ou fallback
 */
export function validateStorageData<T>(key: string, data: unknown, fallback: T): T {
  const validator = STORAGE_VALIDATORS[key];
  if (!validator) {
    return data as T;
  }

  const result = validator.safeParse(data);
  if (result.success) {
    return result.data as T;
  }

  console.warn(`[FitLog Security] Dados inválidos ou adulterados no LocalStorage para "${key}". Restaurando fallback seguro.`, result.error.format());
  return fallback;
}

