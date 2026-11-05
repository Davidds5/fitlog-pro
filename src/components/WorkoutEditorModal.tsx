'use client';

import React, { useState, useEffect } from 'react';
import { WorkoutFicha } from './TreinoTab';
import { X, Trash2, Copy, Palette, Calendar } from 'lucide-react';

interface WorkoutEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  fichaToEdit?: WorkoutFicha | null; // null se for criação de novo treino
  onSave: (ficha: WorkoutFicha) => void;
  onDelete?: (fichaId: string) => void;
  onDuplicate?: (ficha: WorkoutFicha) => void;
}

const COLOR_OPTIONS = [
  '#e06d28', // Terracota Clovin
  '#f97316', // Laranja
  '#3b82f6', // Azul
  '#a855f7', // Roxo
  '#10b981', // Verde
  '#eab308', // Dourado
  '#ec4899', // Rosa
];

const WEEK_DAYS = [
  { day: 1, label: 'Seg' },
  { day: 2, label: 'Ter' },
  { day: 3, label: 'Qua' },
  { day: 4, label: 'Qui' },
  { day: 5, label: 'Sex' },
  { day: 6, label: 'Sáb' },
  { day: 0, label: 'Dom' },
];

export function WorkoutEditorModal({
  isOpen,
  onClose,
  fichaToEdit,
  onSave,
  onDelete,
  onDuplicate,
}: WorkoutEditorModalProps) {
  const [name, setName] = useState<string>('');
  const [letter, setLetter] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [color, setColor] = useState<string>(COLOR_OPTIONS[0]);
  const [weekDays, setWeekDays] = useState<number[]>([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);

  useEffect(() => {
    if (fichaToEdit) {
      setName(fichaToEdit.name);
      setLetter(fichaToEdit.letter || fichaToEdit.name.substring(0, 4));
      setDescription(fichaToEdit.description || '');
      setColor(fichaToEdit.color || COLOR_OPTIONS[0]);
      setWeekDays(fichaToEdit.weekDays || []);
    } else {
      setName('Novo Treino');
      setLetter('Treino');
      setDescription('');
      setColor(COLOR_OPTIONS[0]);
      setWeekDays([]);
    }
    setShowDeleteConfirm(false);
  }, [fichaToEdit, isOpen]);

  if (!isOpen) return null;

  const toggleDay = (d: number) => {
    setWeekDays((prev) => (prev.includes(d) ? prev.filter((x) => x !== d) : [...prev, d]));
  };

  const handleSave = () => {
    if (!name.trim()) return;

    const updated: WorkoutFicha = {
      id: fichaToEdit ? fichaToEdit.id : `ficha-${Date.now()}`,
      name: name.trim(),
      letter: letter.trim() || name.substring(0, 4),
      description: description.trim(),
      phase: fichaToEdit ? fichaToEdit.phase : 'base',
      color,
      weekDays,
      exercises: fichaToEdit ? fichaToEdit.exercises : [],
    };

    onSave(updated);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)] mb-4">
          <h2 className="text-base font-black text-[var(--text-primary)]">
            {fichaToEdit ? 'Editar Treino' : 'Novo Treino Personalizado'}
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3.5 text-xs">
          {/* Nome do Treino */}
          <div>
            <label className="text-[var(--text-muted)] font-bold block mb-1">Nome do Treino:</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Peito e Tríceps, Push, Perna Pesada..."
              className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] font-bold text-sm focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Nome Curto no Chip */}
          <div>
            <label className="text-[var(--text-muted)] font-bold block mb-1">
              Rótulo Curto no Chip (topo):
            </label>
            <input
              type="text"
              maxLength={8}
              value={letter}
              onChange={(e) => setLetter(e.target.value)}
              placeholder="Ex: Push, A, Perna..."
              className="w-full p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] font-bold focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Descrição / Foco */}
          <div>
            <label className="text-[var(--text-muted)] font-bold block mb-1">Descrição / Foco:</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Foco em empurrar e peitoral superior"
              className="w-full p-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--brand-primary)]"
            />
          </div>

          {/* Cor de Identificação */}
          <div>
            <label className="text-[var(--text-muted)] font-bold flex items-center gap-1 mb-1.5">
              <Palette className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              Cor de Destaque:
            </label>
            <div className="flex gap-2">
              {COLOR_OPTIONS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`w-7 h-7 rounded-full border-2 transition-transform ${
                    color === c ? 'scale-115 border-white shadow-md' : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
          </div>

          {/* Dias da Semana (Para sugerir o Treino de Hoje) */}
          <div>
            <label className="text-[var(--text-muted)] font-bold flex items-center gap-1 mb-1.5">
              <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              Dias da Semana (Sugerir no dia certo):
            </label>
            <div className="grid grid-cols-7 gap-1">
              {WEEK_DAYS.map((wd) => {
                const isSelected = weekDays.includes(wd.day);
                return (
                  <button
                    key={wd.day}
                    type="button"
                    onClick={() => toggleDay(wd.day)}
                    className={`py-1.5 rounded-lg text-xs font-bold transition-all border ${
                      isSelected
                        ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-2xs'
                        : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)]'
                    }`}
                  >
                    {wd.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Confirmação de Exclusão */}
        {showDeleteConfirm && (
          <div className="mt-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-xs">
            <p className="text-red-500 font-bold mb-2">Excluir este treino permanentemente?</p>
            <div className="flex gap-2">
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="btn-secondary-tactile flex-1 py-1.5 text-xs min-h-[36px]"
              >
                Não, voltar
              </button>
              <button
                onClick={() => {
                  if (fichaToEdit && onDelete) onDelete(fichaToEdit.id);
                  onClose();
                }}
                className="btn-tactile bg-red-600 border-red-700 flex-1 py-1.5 text-xs min-h-[36px] text-white"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        )}

        {/* Ações Inferiores */}
        <div className="mt-5 pt-3 border-t border-[var(--border)] flex items-center justify-between gap-2">
          {fichaToEdit && onDelete && !showDeleteConfirm && (
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                title="Excluir treino"
                className="p-2 rounded-xl text-red-500 hover:bg-red-500/15 border border-red-500/20"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              {onDuplicate && (
                <button
                  type="button"
                  onClick={() => {
                    onDuplicate(fichaToEdit);
                    onClose();
                  }}
                  title="Duplicar treino"
                  className="p-2 rounded-xl text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] border border-[var(--border)]"
                >
                  <Copy className="w-4 h-4" />
                </button>
              )}
            </div>
          )}

          <div className="flex gap-2 flex-1 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="btn-secondary-tactile text-xs py-2 px-3 min-h-[42px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="btn-tactile text-xs py-2 px-4 min-h-[42px] font-bold"
            >
              Salvar Treino
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

