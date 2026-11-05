'use client';

import React, { useState } from 'react';
import { WorkoutFicha } from './TreinoTab';
import { X, Plus, Check } from 'lucide-react';

interface AddToWorkoutSheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  muscleGroup: string;
  exerciseId: string;
  fichas: WorkoutFicha[];
  onAddExerciseToFichas: (fichaIds: string[]) => void;
  onOpenCreateWorkout: () => void;
}

export function AddToWorkoutSheet({
  isOpen,
  onClose,
  exerciseName,
  muscleGroup,
  fichas,
  onAddExerciseToFichas,
  onOpenCreateWorkout,
}: AddToWorkoutSheetProps) {
  const [selectedFichaIds, setSelectedFichaIds] = useState<string[]>(
    fichas.length > 0 ? [fichas[0].id] : []
  );

  if (!isOpen) return null;

  const toggleFicha = (id: string) => {
    setSelectedFichaIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const handleConfirm = () => {
    if (selectedFichaIds.length === 0) return;
    onAddExerciseToFichas(selectedFichaIds);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 backdrop-blur-xs p-3 sm:p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--brand-primary)]/15 text-[var(--brand-primary)]">
              {muscleGroup}
            </span>
            <h2 className="text-base font-black text-[var(--text-primary)] mt-1">{exerciseName}</h2>
            <p className="text-xs text-[var(--text-muted)]">Selecione em quais treinos deseja adicionar:</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Treinos com Checkbox */}
        <div className="flex-1 overflow-y-auto space-y-2 my-2 pr-1">
          {fichas.map((f) => {
            const isChecked = selectedFichaIds.includes(f.id);
            return (
              <div
                key={f.id}
                onClick={() => toggleFicha(f.id)}
                className={`flex items-center justify-between p-3 rounded-2xl border cursor-pointer select-none transition-all ${
                  isChecked
                    ? 'bg-[var(--brand-primary)]/15 border-[var(--brand-primary)] text-[var(--text-primary)]'
                    : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-muted)] hover:border-[var(--brand-primary)]'
                }`}
              >
                <div>
                  <span className="text-sm font-bold text-[var(--text-primary)] block">{f.name}</span>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    {f.exercises.length} exercícios na ficha
                  </span>
                </div>

                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition-all ${
                    isChecked
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                      : 'border-[var(--border)] bg-[var(--surface)]'
                  }`}
                >
                  {isChecked && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}

          {/* Botão para Criar Novo Treino Na Hora */}
          <button
            type="button"
            onClick={() => {
              onClose();
              onOpenCreateWorkout();
            }}
            className="btn-secondary-tactile w-full py-2.5 flex items-center justify-center gap-1.5 text-xs font-bold text-[var(--brand-primary)] min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            + Criar Novo Treino
          </button>
        </div>

        {/* Botão de Ação */}
        <div className="mt-3 pt-3 border-t border-[var(--border)] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary-tactile flex-1 text-xs py-2.5 min-h-[42px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            disabled={selectedFichaIds.length === 0}
            className="btn-tactile flex-1 text-xs py-2.5 min-h-[42px] font-bold disabled:opacity-50"
          >
            Adicionar ({selectedFichaIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}
