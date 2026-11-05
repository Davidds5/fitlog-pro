'use client';

import React from 'react';
import { WORKOUT_TEMPLATES, WorkoutTemplate } from '@/lib/templates';
import { WorkoutFicha } from './TreinoTab';
import { X, Sparkles, ArrowRight } from 'lucide-react';

interface WorkoutTemplatesModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (fichas: WorkoutFicha[]) => void;
}

export function WorkoutTemplatesModal({ isOpen, onClose, onApplyTemplate }: WorkoutTemplatesModalProps) {
  if (!isOpen) return null;

  const handleSelect = (tpl: WorkoutTemplate) => {
    onApplyTemplate(tpl.fichas);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-md rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl max-h-[85vh] flex flex-col">
        {/* Topo */}
        <div className="flex items-center justify-between pb-3 border-b border-[var(--border)]">
          <div>
            <h2 className="text-base font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-[var(--brand-primary)]" />
              Modelos Prontos de Treino
            </h2>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">
              Escolha uma estrutura para começar. Você poderá editar tudo depois.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de Modelos */}
        <div className="flex-1 overflow-y-auto space-y-2.5 my-3 pr-1">
          {WORKOUT_TEMPLATES.map((tpl) => (
            <div
              key={tpl.id}
              className="interactive-card p-3.5 border border-[var(--border)] rounded-2xl flex flex-col justify-between hover:border-[var(--brand-primary)]"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-black text-[var(--text-primary)]">{tpl.name}</span>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                      {tpl.tag}
                    </span>
                  </div>
                  <p className="text-xs text-[var(--text-muted)] mt-1">{tpl.description}</p>
                </div>
              </div>

              {/* Badges de treinos incluídos */}
              <div className="flex flex-wrap gap-1 my-2">
                {tpl.fichas.map((f) => (
                  <span
                    key={f.id}
                    className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-[var(--surface-subtle)] text-[var(--text-primary)] border border-[var(--border)]"
                  >
                    {f.name.split(':')[0]} ({f.exercises.length} ex)
                  </span>
                ))}
              </div>

              <button
                onClick={() => handleSelect(tpl)}
                className="btn-secondary-tactile text-xs py-2 px-3 mt-1 w-full flex items-center justify-center gap-1.5 font-bold min-h-[38px]"
              >
                <span>Aplicar este modelo</span>
                <ArrowRight className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
              </button>
            </div>
          ))}
        </div>

        {/* Rodapé */}
        <button
          onClick={onClose}
          className="btn-secondary-tactile w-full text-xs py-2.5 min-h-[42px]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
