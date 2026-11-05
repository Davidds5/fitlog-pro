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
  X,
  Sparkles,
  Check,
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

const CATEGORIES = [
  'Todos',
  'Proteínas',
  'Carboidratos',
  'Frutas',
  'Laticínios',
  'Suplementos',
  'Vegetais',
  'Gorduras',
  'Bebidas',
  'Doces',
] as const;

export function DietaTab() {
  const [profile, setProfile] = useLocalStorage<UserProfile>('fitlog_profile', DEFAULT_PROFILE);
  const [dietLogs, setDietLogs] = useLocalStorage<DailyDietLog[]>('fitlog_diet_logs', []);
  const [customFoods, setCustomFoods] = useLocalStorage<FoodItem[]>('fitlog_custom_foods', []);
  
  const todayStr = new Date().toISOString().split('T')[0];
  const currentDayLog = dietLogs.find((d) => d.date === todayStr) || { date: todayStr, meals: [] };

  const [isProfileModalOpen, setIsProfileModalOpen] = useState<boolean>(false);
  const [isAddFoodModalOpen, setIsAddFoodModalOpen] = useState<boolean>(false);
  const [isCustomFoodModalOpen, setIsCustomFoodModalOpen] = useState<boolean>(false);
  const [selectedMealForAdd, setSelectedMealForAdd] = useState<MealType>('almoco');

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('Todos');
  const [selectedFood, setSelectedFood] = useState<FoodItem>(tacoFoods[0] as FoodItem);
  const [portionGrams, setPortionGrams] = useState<number>(100);

  // Formulário de novo alimento personalizado
  const [newFoodName, setNewFoodName] = useState('');
  const [newFoodCategory, setNewFoodCategory] = useState<string>('Proteínas');
  const [newFoodCalories, setNewFoodCalories] = useState<number>(150);
  const [newFoodProtein, setNewFoodProtein] = useState<number>(20);
  const [newFoodCarbs, setNewFoodCarbs] = useState<number>(10);
  const [newFoodFat, setNewFoodFat] = useState<number>(5);

  const goals = calculateMacroGoals(profile);

  // Unifica alimentos oficiais com os personalizados do usuário
  const allFoods: FoodItem[] = [...customFoods, ...(tacoFoods as FoodItem[])];

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

  const handleOpenAddModal = (meal: MealType) => {
    setSelectedMealForAdd(meal);
    setSearchQuery('');
    setSelectedCategory('Todos');
    setPortionGrams(100);
    setIsAddFoodModalOpen(true);
  };

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

  const handleCreateCustomFood = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFoodName.trim()) return;

    const created: FoodItem = {
      id: `custom-food-${Date.now()}`,
      name: newFoodName.trim(),
      category: newFoodCategory,
      portionBaseGrams: 100,
      calories: Number(newFoodCalories) || 0,
      protein: Number(newFoodProtein) || 0,
      carbs: Number(newFoodCarbs) || 0,
      fat: Number(newFoodFat) || 0,
    };

    setCustomFoods((prev) => [created, ...prev]);
    setSelectedFood(created);
    setIsCustomFoodModalOpen(false);
    // Limpar formulário
    setNewFoodName('');
    setNewFoodCalories(150);
    setNewFoodProtein(20);
    setNewFoodCarbs(10);
    setNewFoodFat(5);
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

  const searchResults = searchFoods(allFoods, searchQuery, selectedCategory);
  const selectedFoodMacros = calculatePortionMacros(selectedFood, portionGrams);
  const calPercent = Math.min(100, Math.round((totals.calories / goals.calories) * 100));

  return (
    <div className="space-y-4">
      {/* Topo com Título e Perfil */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
            <Utensils className="w-5 h-5 text-[var(--brand-primary)]" />
            Dieta & Macros
          </h1>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">
            Tabela Nutricional Brasileira ({allFoods.length} alimentos).
          </p>
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
        {(Object.keys(MEAL_LABELS) as MealType[]).map((mealType) => {
          const mealItems = currentDayLog.meals.filter((m) => m.mealType === mealType);
          const mealCalories = mealItems.reduce((acc, m) => acc + m.calories, 0);

          return (
            <div key={mealType} className="interactive-card p-3.5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xs font-bold text-[var(--text-primary)]">{MEAL_LABELS[mealType]}</h2>
                  {mealCalories > 0 && (
                    <span className="text-[10px] bg-[var(--surface-subtle)] border border-[var(--border)] px-1.5 py-0.5 rounded-md text-[var(--brand-primary)] font-bold tabular-nums">
                      {Math.round(mealCalories)} kcal
                    </span>
                  )}
                </div>
                <button
                  onClick={() => handleOpenAddModal(mealType)}
                  className="btn-secondary-tactile text-[11px] py-1 px-2.5 flex items-center gap-1 min-h-[30px]"
                >
                  <Plus className="w-3 h-3 text-[var(--brand-primary)]" />
                  Alimento
                </button>
              </div>

              {/* Itens da Refeição */}
              {mealItems.length > 0 ? (
                <div className="space-y-1.5 mt-2">
                  {mealItems.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs"
                    >
                      <div>
                        <span className="font-semibold text-[var(--text-primary)] block">{item.foodName}</span>
                        <span className="text-[10px] text-[var(--text-muted)] tabular-nums">
                          {item.grams}g • {Math.round(item.calories)} kcal (P: {item.protein}g | C: {item.carbs}g | G:{' '}
                          {item.fat}g)
                        </span>
                      </div>
                      <button
                        onClick={() => handleRemoveFood(item.id)}
                        className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg transition-colors"
                        title="Remover alimento"
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in">
          <div className="w-full sm:max-w-md rounded-t-3xl sm:rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-4 sm:p-5 shadow-2xl max-h-[92vh] flex flex-col">
            
            {/* Header do Modal */}
            <div className="flex items-center justify-between mb-2">
              <div>
                <h3 className="text-sm sm:text-base font-bold text-[var(--text-primary)] flex items-center gap-1.5">
                  <Utensils className="w-4 h-4 text-[var(--brand-primary)]" />
                  Adicionar ao {MEAL_LABELS[selectedMealForAdd]}
                </h3>
                <p className="text-[11px] text-[var(--text-muted)]">
                  {searchResults.length} alimentos disponíveis • Busque ou filtre por categoria
                </p>
              </div>
              <button
                onClick={() => setIsAddFoodModalOpen(false)}
                className="p-1.5 rounded-full hover:bg-[var(--surface-subtle)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Campo de Busca + Botão Criar Alimento */}
            <div className="flex gap-2 mb-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Buscar frango, arroz, whey, banana..."
                  className="w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-xl pl-9 pr-8 py-2 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2.5 top-2.5 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <button
                onClick={() => setIsCustomFoodModalOpen(true)}
                className="btn-secondary-tactile text-xs px-2.5 py-1.5 flex items-center gap-1 whitespace-nowrap"
                title="Cadastrar alimento com rótulo próprio"
              >
                <Plus className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                <span>+ Novo</span>
              </button>
            </div>

            {/* Chips de Categorias em Quebra Limpa (sem corte lateral) */}
            <div className="flex flex-wrap gap-1.5 py-1 mb-2.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`text-[11px] px-2.5 py-1 rounded-xl whitespace-nowrap transition-all font-semibold border ${
                    selectedCategory === cat
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                      : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Lista com Rolagem Suave */}
            <div className="flex-1 overflow-y-auto max-h-52 sm:max-h-60 space-y-1.5 mb-3 pr-1 divide-y divide-transparent custom-scrollbar">
              {searchResults.length > 0 ? (
                searchResults.map((food) => {
                  const isSelected = selectedFood.id === food.id;
                  const isCustom = food.id.startsWith('custom-');

                  return (
                    <button
                      key={food.id}
                      onClick={() => setSelectedFood(food)}
                      className={`w-full text-left p-2.5 rounded-xl text-xs transition-all border flex flex-col gap-1 ${
                        isSelected
                          ? 'bg-[var(--brand-primary)]/15 border-[var(--brand-primary)] font-bold text-[var(--text-primary)] shadow-xs'
                          : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]/40'
                      }`}
                    >
                      <div className="flex justify-between items-center w-full">
                        <div className="flex items-center gap-1.5 truncate">
                          <span className="truncate">{food.name}</span>
                          {isCustom && (
                            <span className="text-[9px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1 py-0.2 rounded font-semibold">
                              Meu
                            </span>
                          )}
                        </div>
                        <span className="text-[11px] text-[var(--brand-primary)] font-black tabular-nums ml-2 whitespace-nowrap">
                          {food.calories} kcal/100g
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-normal">
                        <span className="bg-[var(--surface)] px-1.5 py-0.5 rounded border border-[var(--border)] text-[var(--text-faint)]">
                          {food.category}
                        </span>
                        <span>P: <strong className="text-blue-500">{food.protein}g</strong></span>
                        <span>C: <strong className="text-amber-500">{food.carbs}g</strong></span>
                        <span>G: <strong className="text-rose-500">{food.fat}g</strong></span>
                      </div>
                    </button>
                  );
                })
              ) : (
                <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                  <p>Nenhum alimento encontrado com esses filtros.</p>
                  <button
                    onClick={() => setIsCustomFoodModalOpen(true)}
                    className="btn-tactile text-xs py-2 px-3 mt-3 inline-flex items-center gap-1.5"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Cadastrar &ldquo;{searchQuery || 'este alimento'}&rdquo;
                  </button>
                </div>
              )}
            </div>

            {/* Controle de Gramas Inteligente */}
            <div className="bg-[var(--surface-subtle)] p-3 rounded-2xl border border-[var(--border)] mb-3">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-[var(--text-primary)]">Quantidade em gramas:</span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setPortionGrams((prev) => Math.max(10, prev - 10))}
                    className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-bold flex items-center justify-center hover:bg-[var(--border)]"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    value={portionGrams || ''}
                    onChange={(e) => setPortionGrams(Math.max(1, Number(e.target.value)))}
                    className="w-16 text-center py-1 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-black tabular-nums text-[var(--brand-primary)]"
                  />
                  <span className="text-xs font-bold text-[var(--text-muted)]">g</span>
                  <button
                    onClick={() => setPortionGrams((prev) => prev + 10)}
                    className="w-7 h-7 rounded-lg bg-[var(--surface)] border border-[var(--border)] text-xs font-bold flex items-center justify-center hover:bg-[var(--border)]"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Botões rápidos de porção */}
              <div className="grid grid-cols-6 gap-1 mb-2">
                {[30, 50, 100, 150, 200, 300].map((g) => (
                  <button
                    key={g}
                    onClick={() => setPortionGrams(g)}
                    className={`text-[11px] py-1.5 rounded-lg border font-bold transition-all ${
                      portionGrams === g
                        ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                        : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {g}g
                  </button>
                ))}
              </div>

              {/* Resumo do que será adicionado */}
              <div className="text-[11px] text-[var(--text-muted)] pt-2 border-t border-[var(--border)] flex justify-between font-semibold">
                <span>
                  Total: <strong className="text-[var(--text-primary)] tabular-nums">{selectedFoodMacros.calories} kcal</strong>
                </span>
                <span>P: <strong className="text-blue-500 tabular-nums">{selectedFoodMacros.protein}g</strong></span>
                <span>C: <strong className="text-amber-500 tabular-nums">{selectedFoodMacros.carbs}g</strong></span>
                <span>G: <strong className="text-rose-500 tabular-nums">{selectedFoodMacros.fat}g</strong></span>
              </div>
            </div>

            {/* Ações */}
            <div className="flex gap-2">
              <button
                onClick={() => setIsAddFoodModalOpen(false)}
                className="btn-secondary-tactile flex-1 text-xs py-2.5"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddFoodToMeal}
                className="btn-tactile flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Adicionar à Refeição
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Criar Alimento Personalizado */}
      {isCustomFoodModalOpen && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
          <form
            onSubmit={handleCreateCustomFood}
            className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl space-y-3"
          >
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[var(--text-primary)] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
                Novo Alimento Personalizado
              </h3>
              <button
                type="button"
                onClick={() => setIsCustomFoodModalOpen(false)}
                className="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-[11px] text-[var(--text-muted)]">
              Valores nutricionais para <strong>100g</strong> (consulte a embalagem ou rótulo):
            </p>

            <div>
              <label className="text-[11px] text-[var(--text-muted)] block mb-1 font-semibold">Nome do Alimento:</label>
              <input
                type="text"
                required
                value={newFoodName}
                onChange={(e) => setNewFoodName(e.target.value)}
                placeholder="Ex: Whey Growth Morango, Pão Pullman..."
                className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--brand-primary)]"
              />
            </div>

            <div>
              <label className="text-[11px] text-[var(--text-muted)] block mb-1 font-semibold">Categoria:</label>
              <select
                value={newFoodCategory}
                onChange={(e) => setNewFoodCategory(e.target.value)}
                className="w-full p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] font-bold"
              >
                {CATEGORIES.filter((c) => c !== 'Todos').map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-[10px] text-[var(--text-muted)] block mb-1 font-semibold">Calorias (kcal):</label>
                <input
                  type="number"
                  required
                  value={newFoodCalories}
                  onChange={(e) => setNewFoodCalories(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-blue-500 block mb-1 font-semibold">Proteína (g):</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newFoodProtein}
                  onChange={(e) => setNewFoodProtein(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-amber-500 block mb-1 font-semibold">Carboidratos (g):</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newFoodCarbs}
                  onChange={(e) => setNewFoodCarbs(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]"
                />
              </div>
              <div>
                <label className="text-[10px] text-rose-500 block mb-1 font-semibold">Gorduras (g):</label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={newFoodFat}
                  onChange={(e) => setNewFoodFat(Number(e.target.value))}
                  className="w-full p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs font-bold text-[var(--text-primary)]"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsCustomFoodModalOpen(false)}
                className="btn-secondary-tactile flex-1 text-xs py-2.5"
              >
                Cancelar
              </button>
              <button
                type="submit"
                className="btn-tactile flex-1 text-xs py-2.5"
              >
                Salvar Alimento
              </button>
            </div>
          </form>
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
