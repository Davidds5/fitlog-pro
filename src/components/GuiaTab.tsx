'use client';

import React, { useState } from 'react';
import defaultExercicios from '@/data/exercicios.json';
import defaultFichas from '@/data/fichas.json';
import { useLocalStorage } from '@/lib/storage';
import { WorkoutFicha, WorkoutExercise } from './TreinoTab';
import { AddToWorkoutSheet } from './AddToWorkoutSheet';
import { CustomExerciseModal, CustomExerciseItem } from './CustomExerciseModal';
import { WorkoutEditorModal } from './WorkoutEditorModal';
import { getMuscleInfo } from '@/lib/muscles';
import { normalizeSearchTerm } from '@/lib/macros';
import {
  Search,
  Plus,
  ShieldAlert,
  Dumbbell,
  X,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

export function GuiaTab() {
  const [fichas, setFichas] = useLocalStorage<WorkoutFicha[]>('fitlog_fichas', defaultFichas as unknown as WorkoutFicha[]);
  const [customExercises, setCustomExercises] = useLocalStorage<CustomExerciseItem[]>('fitlog_custom_exercises', []);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');

  // Controle de expansão de dicas
  const [expandedTipId, setExpandedTipId] = useState<string | null>(null);

  // Bottom Sheet para Adicionar a Fichas
  const [sheetExercise, setSheetExercise] = useState<(typeof defaultExercicios)[0] | null>(null);

  // Modal para criar exercício customizado
  const [isCustomModalOpen, setIsCustomModalOpen] = useState<boolean>(false);

  // Modal para criar novo treino caso o usuário clique em "+ Criar novo treino"
  const [isCreateWorkoutModalOpen, setIsCreateWorkoutModalOpen] = useState<boolean>(false);

  const muscleGroups = ['Todos', 'Peito', 'Costas', 'Ombros', 'Bíceps', 'Tríceps', 'Pernas', 'Abdômen'];

  const MUSCLE_ORDER: Record<string, number> = {
    Peito: 1,
    Costas: 2,
    Ombros: 3,
    Bíceps: 4,
    Tríceps: 5,
    Pernas: 6,
    Abdômen: 7,
  };

  // Unifica exercícios nativos e personalizados ordenados de forma anatômica
  const allExercises = [...customExercises, ...defaultExercicios].sort((a, b) => {
    const orderA = MUSCLE_ORDER[a.muscleGroup] || 99;
    const orderB = MUSCLE_ORDER[b.muscleGroup] || 99;
    if (orderA !== orderB) return orderA - orderB;
    return a.name.localeCompare(b.name);
  });

  const filteredExercises = allExercises.filter((ex) => {
    const matchesMuscle = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle;
    const normalizedQuery = normalizeSearchTerm(searchTerm);
    if (!normalizedQuery) return matchesMuscle;

    const normalizedName = normalizeSearchTerm(ex.name);
    const normalizedTarget = normalizeSearchTerm(ex.subTarget || '');
    return matchesMuscle && (normalizedName.includes(normalizedQuery) || normalizedTarget.includes(normalizedQuery));
  });

  const handleOpenAddSheet = (ex: (typeof defaultExercicios)[0]) => {
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
        <div className="flex items-center justify-between mb-2">
          <div>
            <h1 className="text-base font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
              Guia de Exercícios
            </h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Catálogo com dicas de execução e adição expressa aos seus treinos.
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

        {/* Barra de Busca com Botão Limpar e Contador */}
        <div className="relative mt-2.5">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou músculo..."
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

        {/* Chips de Músculos com Rolagem Suave sem Barra Visível */}
        <div className="relative mt-3 -mx-1 px-1">
          <div className="flex gap-1.5 overflow-x-auto pb-1 no-scrollbar scroll-smooth pr-6">
            {muscleGroups.map((group) => {
              const isSelected = selectedMuscle === group;
              return (
                <button
                  key={group}
                  onClick={() => setSelectedMuscle(group)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border shrink-0 min-h-[34px] ${
                    isSelected
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                      : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand-primary)]'
                  }`}
                >
                  {group}
                </button>
              );
            })}
          </div>
        </div>

        {/* Contador de Resultados */}
        <div className="text-[11px] text-[var(--text-faint)] font-semibold mt-2.5 flex items-center justify-between">
          <span>{filteredExercises.length} exercícios encontrados</span>
          {selectedMuscle !== 'Todos' && <span>Filtro: {selectedMuscle}</span>}
        </div>
      </div>

      {/* Lista de Exercícios Compactos */}
      <div className="space-y-3">
        {filteredExercises.map((ex) => {
          const muscle = getMuscleInfo(ex.muscleGroup);
          const isTipExpanded = expandedTipId === ex.id;

          return (
            <div key={ex.id} className="interactive-card p-4 shadow-sm">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${muscle.badgeBg} ${muscle.badgeText} ${muscle.badgeBorder}`}
                    >
                      {ex.muscleGroup}
                    </span>
                    {ex.subTarget && (
                      <span className="text-[10px] font-bold text-[var(--text-muted)]">• {ex.subTarget}</span>
                    )}
                  </div>

                  <h3 className="text-sm font-bold text-[var(--text-primary)] mt-1.5 leading-snug">{ex.name}</h3>
                  <span className="text-xs text-[var(--text-muted)] font-medium block mt-0.5">
                    Equipamento: {ex.equipment}
                  </span>
                </div>

                <button
                  onClick={() => handleOpenAddSheet(ex as (typeof defaultExercicios)[0])}
                  className="btn-tactile text-xs py-1.5 px-3 min-h-[36px] flex items-center gap-1 font-bold shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Adicionar</span>
                </button>
              </div>

              {/* Dica Recolhida / Expansível */}
              {ex.tip && (
                <div className="mt-2.5 pt-2 border-t border-[var(--border)]">
                  <button
                    onClick={() => setExpandedTipId(isTipExpanded ? null : ex.id)}
                    className="flex items-center gap-1 text-[11px] font-bold text-[var(--brand-primary)] hover:underline"
                  >
                    <ShieldAlert className="w-3.5 h-3.5" />
                    <span>{isTipExpanded ? 'Ocultar dica de execução' : 'Ver dica de execução'}</span>
                    {isTipExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                  </button>

                  {isTipExpanded && (
                    <p className="mt-1.5 p-2.5 rounded-xl bg-[var(--surface-subtle)] text-xs text-[var(--text-primary)] leading-relaxed border border-[var(--border)] animate-in fade-in">
                      {ex.tip}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Sheet de Adição a Treinos */}
      <AddToWorkoutSheet
        isOpen={sheetExercise !== null}
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

      {/* Modal Criar Novo Treino (disparado a partir do Guia) */}
      <WorkoutEditorModal
        isOpen={isCreateWorkoutModalOpen}
        onClose={() => setIsCreateWorkoutModalOpen(false)}
        fichaToEdit={null}
        onSave={handleCreateNewWorkout}
      />
    </div>
  );
}
