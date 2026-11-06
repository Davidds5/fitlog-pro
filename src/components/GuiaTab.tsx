'use client';

import React, { useState } from 'react';
import defaultExercicios from '@/data/exercicios.json';
import defaultFichas from '@/data/fichas.json';
import { useLocalStorage } from '@/lib/storage';
import { WorkoutFicha, WorkoutExercise } from './TreinoTab';
import { AddToWorkoutSheet } from './AddToWorkoutSheet';
import { CustomExerciseModal, CustomExerciseItem } from './CustomExerciseModal';
import { WorkoutEditorModal } from './WorkoutEditorModal';
import { normalizeSearchTerm } from '@/lib/macros';
import {
  Search,
  Plus,
  Dumbbell,
  X,
  ChevronDown,
  ChevronUp,
  Info,
} from 'lucide-react';

interface ExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  subGroup?: string;
  equipment: string;
  tip?: string;
}

const MUSCLE_GROUPS = ['Todos', 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Abdômen'] as const;
const EQUIPMENT_OPTIONS = ['Todos', 'Halteres', 'Barra', 'Polia / Cabo', 'Máquina', 'Peso Corporal'] as const;

const MUSCLE_ORDER: Record<string, number> = {
  Peito: 1,
  Costas: 2,
  Ombros: 3,
  Bíceps: 4,
  Tríceps: 5,
  Pernas: 6,
  Abdômen: 7,
};

const SUBGROUP_ORDER: Record<string, number> = {
  Superior: 1,
  'Médio & Geral': 2,
  Inferior: 3,
  'Largura (Puxadas)': 1,
  'Espessura (Remadas)': 2,
  'Lombar & Cadeia Posterior': 3,
  'Deltoide Anterior': 1,
  'Deltoide Lateral': 2,
  'Posterior & Trapézio': 3,
  'Bíceps Braquial': 1,
  'Braquial & Antebraço': 2,
  'Cabeça Lateral & Medial': 1,
  'Cabeça Longa': 2,
  'Compostos & Peso Corporal': 3,
  Quadríceps: 1,
  'Posteriores de Coxa': 2,
  'Glúteos & Adutores': 3,
  Panturrilhas: 4,
  'Infra & Dinâmico': 1,
  'Supra & Isometria': 2,
};

export function GuiaTab() {
  const [fichas, setFichas] = useLocalStorage<WorkoutFicha[]>('fitlog_fichas', defaultFichas as unknown as WorkoutFicha[]);
  const [customExercises, setCustomExercises] = useLocalStorage<CustomExerciseItem[]>('fitlog_custom_exercises', []);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');
  const [selectedEquipment, setSelectedEquipment] = useState<string>('Todos');

  // Controle de expansão de dicas
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);

  // Bottom Sheet para Adicionar a Fichas
  const [sheetExercise, setSheetExercise] = useState<ExerciseItem | null>(null);

  // Modal para criar exercício customizado
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  // Modal para criar novo treino caso o usuário clique em "+ Criar novo treino"
  const [isCreateWorkoutModalOpen, setIsCreateWorkoutModalOpen] = useState<boolean>(false);

  // Unifica exercícios nativos e personalizados ordenados de forma anatômica
  const allExercises: ExerciseItem[] = [...customExercises, ...defaultExercicios].sort((a, b) => {
    const orderA = MUSCLE_ORDER[a.muscleGroup] || 99;
    const orderB = MUSCLE_ORDER[b.muscleGroup] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  const filteredExercises = allExercises.filter((ex) => {
    const matchesMuscle = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle;
    const matchesEquip =
      selectedEquipment === 'Todos' ||
      (selectedEquipment === 'Polia / Cabo'
        ? ex.equipment.toLowerCase().includes('polia') || ex.equipment.toLowerCase().includes('cabo')
        : selectedEquipment === 'Peso Corporal'
        ? ex.equipment.toLowerCase().includes('corporal') ||
          ex.equipment.toLowerCase().includes('barra fixa') ||
          ex.equipment.toLowerCase().includes('paralelas')
        : ex.equipment.toLowerCase().includes(selectedEquipment.toLowerCase()));

    const normalizedQuery = normalizeSearchTerm(searchTerm);
    if (!normalizedQuery) return matchesMuscle && matchesEquip;

    const normalizedName = normalizeSearchTerm(ex.name);
    const normalizedSub = normalizeSearchTerm(ex.subGroup || '');
    const normalizedEquip = normalizeSearchTerm(ex.equipment || '');
    return (
      matchesMuscle &&
      matchesEquip &&
      (normalizedName.includes(normalizedQuery) ||
        normalizedSub.includes(normalizedQuery) ||
        normalizedEquip.includes(normalizedQuery))
    );
  });

  // Agrupa os exercícios filtrados por grupo e subgrupo para evitar lista uniforme longa
  const groupedExercises = React.useMemo(() => {
    const groups: { title: string; subtitle?: string; items: ExerciseItem[] }[] = [];

    if (selectedMuscle === 'Todos' && !searchTerm.trim()) {
      // Quando exibe todos, agrupa por Músculo principal
      const muscleKeys = ['Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Abdômen'];
      for (const m of muscleKeys) {
        const items = filteredExercises.filter((e) => e.muscleGroup === m);
        if (items.length > 0) {
          groups.push({ title: m, items });
        }
      }
    } else {
      // Quando filtra por músculo específico, agrupa por Subgrupo anatômico
      const subGroupMap = new Map<string, ExerciseItem[]>();
      for (const ex of filteredExercises) {
        const sub = ex.subGroup || 'Geral';
        if (!subGroupMap.has(sub)) {
          subGroupMap.set(sub, []);
        }
        subGroupMap.get(sub)!.push(ex);
      }

      const sortedSubTitles = Array.from(subGroupMap.keys()).sort((a, b) => {
        const orderA = SUBGROUP_ORDER[a] || 99;
        const orderB = SUBGROUP_ORDER[b] || 99;
        if (orderA !== orderB) return orderA - orderB;
        return a.localeCompare(b);
      });

      for (const subTitle of sortedSubTitles) {
        const items = subGroupMap.get(subTitle) || [];
        groups.push({
          title: selectedMuscle !== 'Todos' ? `${selectedMuscle} • ${subTitle}` : subTitle,
          items,
        });
      }
    }

    return groups;
  }, [filteredExercises, selectedMuscle, searchTerm]);

  const handleOpenAddSheet = (ex: ExerciseItem) => {
    setSheetExercise(ex);
  };

  const handleAddExerciseToFichas = (targetFichaIds: string[]) => {
    if (!sheetExercise) return;

    setFichas((prev) =>
      prev.map((f, fIdx) => {
        if (!targetFichaIds.includes(f.id)) return f;
        const newEx: WorkoutExercise = {
          id: `ex-${Date.now()}-${fIdx}-${Math.random().toString(36).substring(2, 6)}`,
          exerciseId: sheetExercise.id,
          name: sheetExercise.name,
          muscleGroup: sheetExercise.muscleGroup,
          series: [
            { id: `s-1-${Date.now()}-${fIdx}-${Math.random().toString(36).substring(2, 6)}`, serieNumber: 1, weight: 0, reps: 15, completed: false },
            { id: `s-2-${Date.now()}-${fIdx}-${Math.random().toString(36).substring(2, 6)}`, serieNumber: 2, weight: 0, reps: 14, completed: false },
            { id: `s-3-${Date.now()}-${fIdx}-${Math.random().toString(36).substring(2, 6)}`, serieNumber: 3, weight: 0, reps: 13, completed: false },
            { id: `s-4-${Date.now()}-${fIdx}-${Math.random().toString(36).substring(2, 6)}`, serieNumber: 4, weight: 0, reps: 12, completed: false },
          ],
        };
        return { ...f, exercises: [...f.exercises, newEx] };
      })
    );
  };

  const handleSaveCustomExercise = (item: CustomExerciseItem) => {
    setCustomExercises((prev) => [item, ...prev]);
  };

  const handleCreateNewWorkout = (newFicha: WorkoutFicha) => {
    setFichas((prev) => [...prev, newFicha]);
  };

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* Topo do Guia */}
      <div className="interactive-card p-4 shadow-sm">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-base font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
              Guia de Exercícios
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Catálogo anatômico com execução e adição rápida aos treinos.
            </p>
          </div>

          <button
            onClick={() => setIsCustomModalOpen(true)}
            title="Criar exercício personalizado"
            className="btn-secondary-tactile text-xs py-1.5 px-2.5 min-h-[36px] flex items-center gap-1 font-bold text-[var(--brand-primary)]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Criar Próprio</span>
          </button>
        </div>

        {/* Campo de Busca Rápida */}
        <div className="relative">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome, subgrupo ou equipamento..."
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl pl-10 pr-9 py-2.5 text-xs text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)] placeholder-[var(--text-faint)]"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-3 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Chips de Músculos em Grid 4x2 Perfeito (100% visível, sem cortes) */}
        <div className="grid grid-cols-4 gap-1.5 mt-3">
          {MUSCLE_GROUPS.map((group) => {
            const isSelected = selectedMuscle === group;
            return (
              <button
                key={group}
                onClick={() => setSelectedMuscle(group)}
                className={`py-2 px-1 text-center rounded-xl text-xs font-bold transition-all border min-h-[36px] flex items-center justify-center truncate ${
                  isSelected
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand-primary)] hover:text-[var(--text-primary)]'
                }`}
              >
                {group}
              </button>
            );
          })}
        </div>

        {/* Filtro por Equipamento */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-2.5">
          <span className="text-[10px] font-black uppercase tracking-wider text-[var(--text-faint)] shrink-0">
            Equip:
          </span>
          {EQUIPMENT_OPTIONS.map((equip) => {
            const isSelected = selectedEquipment === equip;
            return (
              <button
                key={equip}
                type="button"
                onClick={() => setSelectedEquipment(equip)}
                className={`px-2.5 py-1 rounded-xl text-[11px] font-bold shrink-0 transition-all border ${
                  isSelected
                    ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                    : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand-primary)]/40 hover:text-[var(--text-primary)]'
                }`}
              >
                {equip}
              </button>
            );
          })}
        </div>

        {/* Contador de Resultados */}
        <div className="text-[11px] text-[var(--text-faint)] font-semibold mt-2.5 flex items-center justify-between">
          <span>{filteredExercises.length} exercícios encontrados</span>
          <div className="flex items-center gap-2">
            {selectedMuscle !== 'Todos' && <span className="text-[var(--brand-primary)] font-bold">Músculo: {selectedMuscle}</span>}
            {selectedEquipment !== 'Todos' && <span className="text-[var(--brand-primary)] font-bold">Equip: {selectedEquipment}</span>}
          </div>
        </div>
      </div>

      {/* Lista Agrupada por Subgrupo com Cabeçalhos */}
      {groupedExercises.length > 0 ? (
        <div className="space-y-4">
          {groupedExercises.map((group) => (
            <div key={group.title} className="space-y-2">
              {/* Cabeçalho da Seção */}
              <div className="flex items-center gap-2 px-1 pt-1">
                <span className="text-xs font-black text-[var(--text-primary)] uppercase tracking-wider">
                  {group.title}
                </span>
                <span className="text-[10px] text-[var(--text-faint)] font-bold">({group.items.length})</span>
                <span className="h-px bg-[var(--border)] flex-1" />
              </div>

              {/* Cards de Exercício da Seção */}
              <div className="space-y-2">
                {group.items.map((ex) => {
                  const isTipExpanded = expandedTipId === ex.id;
                  const isCustom = ex.id.startsWith('custom-');

                  return (
                    <div
                      key={ex.id}
                      className="interactive-card p-3 sm:p-3.5 shadow-xs border border-[var(--border)] hover:border-[var(--brand-primary)]/40 transition-all"
                    >
                      <div className="flex items-start justify-between gap-3">
                        {/* Detalhes do Exercício */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[10px] font-bold text-[var(--text-muted)] bg-[var(--surface-subtle)] border border-[var(--border)] px-1.5 py-0.5 rounded-md">
                              {ex.equipment}
                            </span>
                            {isCustom && (
                              <span className="text-[9px] font-bold bg-amber-500/15 text-amber-500 border border-amber-500/30 px-1.5 py-0.2 rounded-md">
                                Meu
                              </span>
                            )}
                          </div>

                          <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1 leading-snug">
                            {ex.name}
                          </h3>
                        </div>

                        {/* Botão Compacto Ícone '+' */}
                        <button
                          type="button"
                          onClick={() => handleOpenAddSheet(ex)}
                          title={`Adicionar ${ex.name} à ficha`}
                          aria-label={`Adicionar ${ex.name} à ficha`}
                          className="btn-secondary-tactile w-10 h-10 min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center shrink-0 text-[var(--brand-primary)] hover:border-[var(--brand-primary)] active:scale-95 transition-all shadow-xs"
                        >
                          <Plus className="w-4 h-4 stroke-[2.5]" />
                        </button>
                      </div>

                      {/* Dica de Execução (Recolhida por padrão) */}
                      {ex.tip && (
                        <div className="mt-2 pt-2 border-t border-[var(--border)]">
                          <button
                            type="button"
                            onClick={() => setExpandedTipId(isTipExpanded ? null : ex.id)}
                            className="flex items-center gap-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--brand-primary)] transition-colors"
                          >
                            <Info className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
                            <span>{isTipExpanded ? 'Ocultar dica' : 'Ver dica de execução'}</span>
                            {isTipExpanded ? (
                              <ChevronUp className="w-3 h-3 text-[var(--brand-primary)]" />
                            ) : (
                              <ChevronDown className="w-3 h-3 text-[var(--text-muted)]" />
                            )}
                          </button>

                          {isTipExpanded && (
                            <p className="text-[11px] text-[var(--text-muted)] mt-1.5 p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] leading-relaxed animate-in fade-in">
                              {ex.tip}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="interactive-card p-8 text-center text-xs text-[var(--text-muted)]">
          <p>Nenhum exercício encontrado para &ldquo;{searchTerm}&rdquo;.</p>
          <button
            onClick={() => setIsCustomModalOpen(true)}
            className="btn-tactile text-xs py-2 px-3 mt-3 inline-flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            Criar Exercício Personalizado
          </button>
        </div>
      )}

      {/* Bottom Sheet para Adicionar a Treinos */}
      <AddToWorkoutSheet
        isOpen={Boolean(sheetExercise)}
        onClose={() => setSheetExercise(null)}
        exerciseName={sheetExercise ? sheetExercise.name : ''}
        muscleGroup={sheetExercise ? sheetExercise.muscleGroup : ''}
        exerciseId={sheetExercise ? sheetExercise.id : ''}
        fichas={fichas}
        onAddExerciseToFichas={handleAddExerciseToFichas}
        onOpenCreateWorkout={() => setIsCreateWorkoutModalOpen(true)}
      />

      {/* Modal Criar Exercício Personalizado */}
      <CustomExerciseModal
        isOpen={isCustomModalOpen}
        onClose={() => setIsCustomModalOpen(false)}
        onSave={handleSaveCustomExercise}
      />

      {/* Modal Criar Novo Treino (caso chamado de dentro da bottom sheet) */}
      <WorkoutEditorModal
        isOpen={isCreateWorkoutModalOpen}
        onClose={() => setIsCreateWorkoutModalOpen(false)}
        onSave={handleCreateNewWorkout}
      />
    </div>
  );
}
