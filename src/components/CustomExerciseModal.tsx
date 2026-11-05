'use client';

import React, { useState } from 'react';
import { X, Plus, Dumbbell } from 'lucide-react';

export interface CustomExerciseItem {
  id: string;
  name: string;
  muscleGroup: string;
  subTarget: string;
  equipment: string;
  tip: string;
}

interface CustomExerciseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (exercise: CustomExerciseItem) => void;
}

const MUSCLE_OPTIONS = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Bíceps', 'Tríceps', 'Abdômen'];

export function CustomExerciseModal({ isOpen, onClose, onSave }: CustomExerciseModalProps) {
  const [name, setName] = useState<string>('');
  const [muscleGroup, setMuscleGroup] = useState<string>(MUSCLE_OPTIONS[0]);
  const [subTarget, setSubTarget] = useState<string>('');
  const [equipment, setEquipment] = useState<string>('Halteres / Máquina');
  const [tip, setTip] = useState<string>('');

  if (!isOpen) return null;

  const handleSave = () => {
    if (!name.trim()) return;

    const newEx: CustomExerciseItem = {
      id: `custom-ex-${Date.now()}`,
      name: name.trim(),
      muscleGroup,
      subTarget: subTarget.trim() || 'Foco Geral',
      equipment: equipment.trim() || 'Livre',
      tip: tip.trim() || 'Execução controlada com cadência constante.',
    };

    onSave(newEx);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-1.5">
            <Dumbbell className="w-4 h-4 text-[var(--brand-primary)]" />
            Criar Exercício Personalizado
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3 text-xs">
          <div>
            <label className="text-[var(--text-muted)] font-bold block mb-1">Nome do Exercício:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Supino Declinado com Halteres..."
              className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          <div>
            <label className="text-[var(--text-muted)] font-bold block mb-1">Grupo Muscular:</label>
            <select
              value={muscleGroup}
              onChange={(e) => setMuscleGroup(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] font-bold focus:outline-none"
            >
              {MUSCLE_OPTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[var(--text-muted)] font-bold block mb-1">Foco / Sub-alvo (opcional):</label>
            <input
              type="text"
              value={subTarget}
              onChange={(e) => setSubTarget(e.target.value)}
              placeholder="Ex: Peitoral Inferior, Pico de Bíceps..."
              className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[var(--text-muted)] font-bold block mb-1">Equipamento:</label>
            <input
              type="text"
              value={equipment}
              onChange={(e) => setEquipment(e.target.value)}
              placeholder="Ex: Polia, Barra, Halteres, Máquina..."
              className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[var(--text-muted)] font-bold block mb-1">Dica de Execução Segura (opcional):</label>
            <textarea
              rows={2}
              value={tip}
              onChange={(e) => setTip(e.target.value)}
              placeholder="Ex: Mantenha as escápulas travadas e cotovelos alinhados."
              className="w-full p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none resize-none"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-[var(--border)] flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary-tactile flex-1 text-xs py-2.5 min-h-[42px]"
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="btn-tactile flex-1 text-xs py-2.5 min-h-[42px] font-bold flex items-center justify-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Salvar Exercício
          </button>
        </div>
      </div>
    </div>
  );
}

