'use client';

import React, { useState } from 'react';
import defaultExercicios from '@/data/exercicios.json';
import defaultFichas from '@/data/fichas.json';
import { useLocalStorage } from '@/lib/storage';
import { WorkoutFicha, WorkoutExercise } from './TreinoTab';
import { Search, Plus, Check, ShieldAlert, Dumbbell } from 'lucide-react';
import { normalizeSearchTerm } from '@/lib/macros';

export function GuiaTab() {
  const [fichas, setFichas] = useLocalStorage<WorkoutFicha[]>('fitlog_fichas', defaultFichas as unknown as WorkoutFicha[]);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedMuscle, setSelectedMuscle] = useState<string>('Todos');
  const [addedSuccessId, setAddedSuccessId] = useState<string | null>(null);

  const muscleGroups = ['Todos', 'Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen'];

  const filteredExercises = defaultExercicios.filter((ex) => {
    const matchesMuscle = selectedMuscle === 'Todos' || ex.muscleGroup === selectedMuscle;
    const normalizedQuery = normalizeSearchTerm(searchTerm);
    if (!normalizedQuery) return matchesMuscle;

    const normalizedName = normalizeSearchTerm(ex.name);
    const normalizedTarget = normalizeSearchTerm(ex.subTarget);
    return matchesMuscle && (normalizedName.includes(normalizedQuery) || normalizedTarget.includes(normalizedQuery));
  });

  const handleAddDirectToFicha = (ex: (typeof defaultExercicios)[0], fichaId: string) => {
    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      exerciseId: ex.id,
      name: ex.name,
      muscleGroup: ex.muscleGroup,
      series: [
        { id: `s-1-${Date.now()}`, serieNumber: 1, weight: 20, reps: 15, completed: false },
        { id: `s-2-${Date.now()}`, serieNumber: 2, weight: 24, reps: 12, completed: false },
        { id: `s-3-${Date.now()}`, serieNumber: 3, weight: 28, reps: 10, completed: false },
        { id: `s-4-${Date.now()}`, serieNumber: 4, weight: 32, reps: 8, completed: false },
      ],
    };

    setFichas((prev) =>
      prev.map((f) => {
        if (f.id !== fichaId) return f;
        return { ...f, exercises: [...f.exercises, newEx] };
      })
    );

    setAddedSuccessId(`${ex.id}-${fichaId}`);
    setTimeout(() => setAddedSuccessId(null), 2000);
  };

  return (
    <div className="space-y-4">
      {/* Cabeçalho */}
      <div className="interactive-card p-4">
        <h1 className="text-lg font-black text-[var(--text-primary)] flex items-center gap-2">
          <Dumbbell className="w-5 h-5 text-[var(--brand-primary)]" />
          Guia de Exercícios por Músculo
        </h1>
        <p className="text-xs text-[var(--text-muted)] mt-0.5">
          Escolha os melhores exercícios e adicione diretamente à sua ficha.
        </p>

        {/* Barra de Busca */}
        <div className="relative mt-3">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Buscar por nome ou foco (ex: supino, remada)..."
            className="w-full bg-[var(--surface-subtle)] border border-[var(--border)] rounded-2xl pl-10 pr-4 py-2.5 text-xs text-[var(--text-primary)] placeholder-[var(--text-faint)] focus:outline-none focus:border-[var(--brand-primary)]"
          />
        </div>

        {/* Pílulas de filtro por músculo */}
        <div className="flex gap-1.5 overflow-x-auto pt-3 pb-1 no-scrollbar">
          {muscleGroups.map((group) => (
            <button
              key={group}
              onClick={() => setSelectedMuscle(group)}
              className={
                selectedMuscle === group
                  ? 'btn-tactile text-xs py-1 px-3 min-h-[34px] font-bold'
                  : 'btn-secondary-tactile text-xs py-1 px-3 min-h-[34px]'
              }
            >
              {group}
            </button>
          ))}
        </div>
      </div>

      {/* Lista de Exercícios Filtrados */}
      <div className="space-y-3">
        {filteredExercises.map((ex) => (
          <div
            key={ex.id}
            className="interactive-card p-4 shadow-sm"
          >
            <div className="flex items-start justify-between gap-2 mb-1.5">
              <div>
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                  {ex.muscleGroup} • {ex.subTarget}
                </span>
                <h3 className="text-base font-bold text-[var(--text-primary)] mt-1.5 leading-snug">{ex.name}</h3>
                <span className="text-xs text-[var(--text-muted)] font-medium block mt-0.5">
                  Equipamento: {ex.equipment}
                </span>
              </div>
            </div>

            {/* Dica de Execução Segura */}
            <div className="mt-2.5 p-2.5 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] flex items-start gap-2 text-xs text-[var(--text-primary)]">
              <ShieldAlert className="w-4 h-4 text-[var(--brand-primary)] shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px]">{ex.tip}</p>
            </div>

            {/* Ações: Adicionar ao Treino A, B ou C */}
            <div className="mt-3 pt-2.5 border-t border-[var(--border)] flex items-center justify-between">
              <span className="text-[11px] text-[var(--text-muted)] font-semibold">Adicionar à ficha:</span>
              <div className="flex gap-1.5">
                {fichas.map((f) => {
                  const isSuccess = addedSuccessId === `${ex.id}-${f.id}`;
                  return (
                    <button
                      key={f.id}
                      onClick={() => handleAddDirectToFicha(ex, f.id)}
                      className={
                        isSuccess
                          ? 'btn-success-tactile text-xs min-h-[34px] py-1 px-2.5'
                          : 'btn-secondary-tactile text-xs min-h-[34px] py-1 px-2.5'
                      }
                    >
                      {isSuccess ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                      Treino {f.letter}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
