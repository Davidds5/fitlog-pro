'use client';

import React, { useState } from 'react';
import tacoFoods from '@/data/taco.json';
import {
  UserProfile,
  calculateMacroGoals,
  calculatePortionMacros,
  searchFoods,
  FoodItem,
} from '@/lib/macros';
import { useLocalStorage, DailyDietLog } from '@/lib/storage';
import {
  Utensils,
  Plus,
  Trash2,
  Search,
  Settings2,
} from 'lucide-react';

const DEFAULT_PROFILE: UserProfile = {
  weight: 78,
  height: 175,
  age: 26,
  gender: 'masculino',
  activityLevel: 'moderado',
  goal: 'ganhar',
};

type MealType = 'cafe' | 'almoco' | 'lanche' | 'jantar' | 'pos_treino';

const MEAL_LABELS: Record<MealType, string> = {
  cafe: 'Café da Manhã',
  almoco: 'Almoço',
  lanche: 'Lanche da Tarde',
  jantar: 'Jantar',
  pos_treino: 'Pós-Treino / Ceia',
};

export function DietaTab() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('fitlog_profile', DEFAULT_PROFILE);
  const [dietLogs, setDietLogs] = useLocalStorage<DailyDietLog[]>('fitlog_diet_logs', []);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const currentDayLog = dietLogs.find((d) => d.date === todayStr) || { date: todayStr, meals: [] };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState<boolean>(false);
  const [selectedMealForAdd, setSelectedMealForAdd] = useState<MealType>('almoco');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedFood, setSelectedFood] = useState<FoodItem>(tacoFoods[0] as FoodItem);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  const goals = calculateMacroGoals(profile);

  const totals = currentDayLog.meals.reduce(
    (acc, meal) => {
      acc.calories += meal.calories;
      acc.protein += meal.protein;
      acc.carbs += meal.carbs;
      acc.fat += meal.fat;
      return acc;
    },
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  );

  const handleAddFoodToMeal = () => {
    const macros = calculatePortionMacros(selectedFood, portionGrams);
    const newMealItem = {
      id: `food-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      mealType: selectedMealForAdd,
      foodName: selectedFood.name,
      grams: portionGrams,
      calories: macros.calories,
      protein: macros.protein,
      carbs: macros.carbs,
      fat: macros.fat,
    };

    setDietLogs((prev) => {
      const existingDayIndex = prev.findIndex((d) => d.date === todayStr);
      if (existingDayIndex >= 0) {
        const updated = [...prev];
        updated[existingDayIndex] = {
          ...updated[existingDayIndex],
          meals: [...updated[existingDayIndex].meals, newMealItem],
        };
        return updated;
      } else {
        return [...prev, { date: todayStr, meals: [newMealItem] }];
      }
    });

    setIsAddFoodModalOpen(false);
  };

  const handleRemoveFood = (foodId: string) => {
    setDietLogs((prev) => {
      return prev.map((day) => {
        if (day.date !== todayStr) return day;
        return {
          ...day,
          meals: day.meals.filter((m) => m.id !== foodId),
        };
      });
    });
  };

  const searchResults = searchFoods(tacoFoods as FoodItem[], searchQuery);
  const selectedFoodMacros = calculatePortionMacros(selectedFood, portionGrams);
  const calPercent = Math.min(100, Math.round((totals.calories / goals.calories) * 100));

  return (
    <div className="space-y-4">
      {/* Topo com Título e Perfil */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[var(--brand-primary)]" />
            Dieta & Macros TACO
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">Tabela Nutricional Brasileira oficial.</p>
        </div>
        <button
          onClick={() => setIsProfileModalOpen(true)}
          className="btn-secondary-tactile text-xs py-2 px-3 flex items-center gap-1.5 min-h-[36px]"
        >
          <Settings2 className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
          Perfil
        </button>
      </div>

      {/* Card Principal de Calorias e Macros */}
      <div className="interactive-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-2">
          <div>
            <span className="text-[10px] font-black text-[var(--text-muted)] uppercase tracking-wider block">
              Calorias Diárias
            </span>
            <div className="flex items-baseline gap-1 mt-0.5">
              <span className="text-2xl font-black tabular-nums text-[var(--text-primary)]">
                {Math.round(totals.calories)}
              </span>
              <span className="text-xs font-semibold text-[var(--text-muted)]">/ {goals.calories} kcal</span>
            </div>
          </div>

          <div className="text-right">
            <span className="text-sm font-black text-[var(--brand-primary)]">{calPercent}%</span>
            <span className="text-[10px] text-[var(--text-faint)] block">da meta atingida</span>
          </div>
        </div>

        {/* Barra de Calorias */}
        <div className="w-full h-2.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden mb-4 border border-[var(--border)]">
          <div
            className="h-full bg-[var(--brand-primary)] transition-all duration-300 rounded-full"
            style={{ width: `${calPercent}%` }}
          />
        </div>

        {/* Grid dos 3 Macros */}
        <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--border)]">
          <div className="bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl p-2.5 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-500">Proteína</span>
            <div className="mt-0.5">
              <span className="text-sm font-black tabular-nums text-[var(--text-primary)]">
                {Math.round(totals.protein)}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">/{goals.protein}g</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-blue-500 rounded-full"
                style={{ width: `${Math.min(100, (totals.protein / goals.protein) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl p-2.5 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-amber-500">Carbos</span>
            <div className="mt-0.5">
              <span className="text-sm font-black tabular-nums text-[var(--text-primary)]">
                {Math.round(totals.carbs)}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">/{goals.carbs}g</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-amber-500 rounded-full"
                style={{ width: `${Math.min(100, (totals.carbs / goals.carbs) * 100)}%` }}
              />
            </div>
          </div>

          <div className="bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl p-2.5 text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-rose-500">Gorduras</span>
            <div className="mt-0.5">
              <span className="text-sm font-black tabular-nums text-[var(--text-primary)]">
                {Math.round(totals.fat)}
              </span>
              <span className="text-[10px] text-[var(--text-muted)]">/{goals.fat}g</span>
            </div>
            <div className="w-full h-1 bg-[var(--border)] rounded-full mt-1.5 overflow-hidden">
              <div
                className="h-full bg-rose-500 rounded-full"
                style={{ width: `${Math.min(100, (totals.fat / goals.fat) * 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Refeições */}
      <div className="space-y-3">
        {(['cafe', 'almoco', 'lanche', 'jantar', 'pos_treino'] as MealType[]).map((mealType) => {
          const mealFoods = currentDayLog.meals.filter((m) => m.mealType === mealType);
          const mealCalories = mealFoods.reduce((acc, m) => acc + m.calories, 0);

          return (
            <div
              key={mealType}
              className="interactive-card p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-primary)]">{MEAL_LABELS[mealType]}</h3>
                  <span className="text-[11px] text-[var(--text-muted)] font-semibold tabular-nums">
                    {Math.round(mealCalories)} kcal
                  </span>
                </div>

                <button
                  onClick={() => {
                    setSelectedMealForAdd(mealType);
                    setIsAddFoodModalOpen(true);
                  }}
                  className="btn-secondary-tactile text-xs py-1 px-3 min-h-[34px] flex items-center gap-1 font-bold text-[var(--brand-primary)]"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar
                </button>
              </div>

              {mealFoods.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {mealFoods.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs"
                    >
                      <div className="flex-1 pr-2">
                        <span className="font-bold text-[var(--text-primary)] block">{item.foodName}</span>
                        <span className="text-[11px] text-[var(--text-muted)] tabular-nums">
                          {item.grams}g • {Math.round(item.calories)} kcal (P: {item.protein}g | C: {item.carbs}g | G: {item.fat}g)
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFood(item.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-[11px] text-[var(--text-faint)] italic mt-1">Nenhum alimento registrado ainda.</p>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Adicionar Alimento */}
      {isAddFoodModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl max-h-[90vh] flex flex-col">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">
              Adicionar ao {MEAL_LABELS[selectedMealForAdd]}
            </h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">Busque na Tabela TACO:</p>

            <div className="relative mb-3">
              <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Ex: Frango, ovo, arroz..."
                className="w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl pl-9 pr-3 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>

            <div className="flex-1 overflow-y-auto max-h-44 space-y-1.5 mb-3 pr-1">
              {searchResults.map((food) => (
                <button
                  key={food.id}
                  onClick={() => setSelectedFood(food)}
                  className={`w-full text-left p-2 rounded-xl text-xs transition-all border ${
                    selectedFood.id === food.id
                      ? 'bg-[var(--brand-primary)]/15 border-[var(--brand-primary)] font-bold text-[var(--text-primary)]'
                      : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)]'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <span>{food.name}</span>
                    <span className="text-[10px] text-[var(--brand-primary)] font-bold">{food.calories} kcal/100g</span>
                  </div>
                </button>
              ))}
            </div>

            {/* Controle de Gramas */}
            <div className="bg-[var(--surface-subtle)] p-3 rounded-2xl border border-[var(--border)] mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">Quantidade:</span>
                <span className="text-sm font-black tabular-nums text-[var(--brand-primary)]">{portionGrams}g</span>
              </div>

              <div className="grid grid-cols-4 gap-1.5 mb-2">
                {[50, 100, 150, 200].map((g) => (
                  <button
                    key={g}
                    onClick={() => setPortionGrams(g)}
                    className={
                      portionGrams === g
                        ? 'btn-tactile text-xs py-1 min-h-[32px] font-bold'
                        : 'btn-secondary-tactile text-xs py-1 min-h-[32px]'
                    }
                  >
                    {g}g
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)] flex justify-between font-semibold">
                <span>Total: <strong className="text-[var(--text-primary)] tabular-nums">{selectedFoodMacros.calories} kcal</strong></span>
                <span>P: <strong className="text-blue-500 tabular-nums">{selectedFoodMacros.protein}g</strong></span>
                <span>C: <strong className="text-amber-500 tabular-nums">{selectedFoodMacros.carbs}g</strong></span>
                <span>G: <strong className="text-rose-500 tabular-nums">{selectedFoodMacros.fat}g</strong></span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAddFoodModalOpen(false)}
                className="btn-secondary-tactile flex-1 text-xs py-2.5"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddFoodToMeal}
                className="btn-tactile flex-1 text-xs py-2.5"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Perfil */}
      {isProfileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-3">Configurar Perfil & Metas</h3>

            <div className="space-y-3 mb-4 text-xs">
              <div>
                <label className="text-[var(--text-muted)] block mb-1 font-semibold">Peso Atual (kg):</label>
                <input
                  type="number"
                  value={profile.weight}
                  onChange={(e) => setProfile((p) => ({ ...p, weight: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] font-bold"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1 font-semibold">Altura (cm):</label>
                <input
                  type="number"
                  value={profile.height}
                  onChange={(e) => setProfile((p) => ({ ...p, height: Number(e.target.value) }))}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] font-bold"
                />
              </div>

              <div>
                <label className="text-[var(--text-muted)] block mb-1 font-semibold">Objetivo:</label>
                <select
                  value={profile.goal}
                  onChange={(e) => setProfile((p) => ({ ...p, goal: e.target.value as any }))}
                  className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] font-bold"
                >
                  <option value="ganhar">Hipertrofia (+350 kcal)</option>
                  <option value="manter">Manutenção de Peso</option>
                  <option value="perder">Definição (-400 kcal)</option>
                </select>
              </div>
            </div>

            <button
              onClick={() => setIsProfileModalOpen(false)}
              className="btn-tactile w-full text-xs py-3"
            >
              Salvar Metas
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
