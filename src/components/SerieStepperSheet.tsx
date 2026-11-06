'use client';

import React, { useState } from 'react';
import { X, Check, Scale, Repeat } from 'lucide-react';

interface SerieStepperSheetProps {
  isOpen: boolean;
  onClose: () => void;
  exerciseName: string;
  serieNumber: number;
  initialWeight: number;
  initialReps: number;
  targetRepsText?: string;
  initialMode?: 'weight' | 'reps';
  onSave: (weight: number, reps: number) => void;
}

export function SerieStepperSheet({
  isOpen,
  onClose,
  exerciseName,
  serieNumber,
  initialWeight,
  initialReps,
  targetRepsText,
  initialMode = 'weight',
  onSave,
}: SerieStepperSheetProps) {
  const [mode, setMode] = useState<'weight' | 'reps'>(initialMode);
  const [weight, setWeight] = useState<number>(initialWeight);
  const [reps, setReps] = useState<number>(initialReps);

  // Sincroniza quando abrir
  React.useEffect(() => {
    if (isOpen) {
      setWeight(initialWeight);
      setReps(initialReps);
      setMode(initialMode);
    }
  }, [isOpen, initialWeight, initialReps, initialMode]);

  if (!isOpen) return null;

  const handleAdjustWeight = (delta: number) => {
    setWeight((prev) => Math.max(0, Math.round((prev + delta) * 10) / 10));
  };

  const handleAdjustReps = (delta: number) => {
    setReps((prev) => Math.max(1, prev + delta));
  };

  const handleConfirm = () => {
    onSave(weight, reps);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-xs p-0 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full sm:max-w-md bg-[var(--surface)] border border-[var(--border)] rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl animate-in slide-in-from-bottom-4 duration-200">
        
        {/* Cabeçalho */}
        <div className="flex items-start justify-between gap-3 pb-3 border-b border-[var(--border)]">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                Série #{serieNumber}
              </span>
              {targetRepsText && (
                <span className="text-xs text-[var(--text-muted)] font-semibold">
                  Meta: {targetRepsText} reps
                </span>
              )}
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)] mt-1 truncate max-w-[280px]">
              {exerciseName}
            </h3>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--surface-subtle)] text-[var(--text-muted)]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Seletor Segmentado de Modo: Peso vs Repetições */}
        <div className="grid grid-cols-2 gap-1.5 p-1 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] my-4">
          <button
            type="button"
            onClick={() => setMode('weight')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'weight'
                ? 'bg-[var(--surface)] text-[var(--brand-primary)] shadow-xs border border-[var(--border)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Scale className="w-4 h-4" />
            <span>Carga ({weight} kg)</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('reps')}
            className={`py-2 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
              mode === 'reps'
                ? 'bg-[var(--surface)] text-[var(--brand-primary)] shadow-xs border border-[var(--border)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
            }`}
          >
            <Repeat className="w-4 h-4" />
            <span>Reps ({reps})</span>
          </button>
        </div>

        {/* Conteúdo do Modo Ativo */}
        {mode === 'weight' ? (
          <div className="space-y-4">
            {/* Stepper Gigante de Carga */}
            <div className="flex items-center justify-between gap-3 px-2">
              <button
                type="button"
                onClick={() => handleAdjustWeight(-1)}
                className="w-16 h-16 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-2xl font-black text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-all shadow-xs"
              >
                −
              </button>

              <div className="flex-1 text-center py-2">
                <input
                  type="number"
                  step="0.5"
                  value={weight || ''}
                  onChange={(e) => setWeight(Math.max(0, Number(e.target.value)))}
                  className="w-28 text-center text-4xl font-black font-mono tabular-nums text-[var(--brand-primary)] bg-transparent border-b-2 border-[var(--border)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)] font-bold block mt-1 uppercase tracking-wider">
                  Quilogramas (kg)
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAdjustWeight(+1)}
                className="w-16 h-16 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-2xl font-black text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-all shadow-xs"
              >
                +
              </button>
            </div>

            {/* Chips Rápidos de Carga */}
            <div className="grid grid-cols-6 gap-1.5 pt-1">
              {[-5, -2.5, -1, +1, +2.5, +5].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() => handleAdjustWeight(delta)}
                  className="py-2 rounded-xl text-xs font-black font-mono tabular-nums bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand-primary)] active:scale-95 transition-all"
                >
                  {delta > 0 ? `+${delta}` : delta}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Stepper Gigante de Repetições */}
            <div className="flex items-center justify-between gap-3 px-2">
              <button
                type="button"
                onClick={() => handleAdjustReps(-1)}
                className="w-16 h-16 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-2xl font-black text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-all shadow-xs"
              >
                −
              </button>

              <div className="flex-1 text-center py-2">
                <input
                  type="number"
                  value={reps || ''}
                  onChange={(e) => setReps(Math.max(1, Number(e.target.value)))}
                  className="w-28 text-center text-4xl font-black font-mono tabular-nums text-[var(--brand-primary)] bg-transparent border-b-2 border-[var(--border)] focus:outline-none focus:border-[var(--brand-primary)]"
                />
                <span className="text-xs text-[var(--text-muted)] font-bold block mt-1 uppercase tracking-wider">
                  Repetições
                </span>
              </div>

              <button
                type="button"
                onClick={() => handleAdjustReps(+1)}
                className="w-16 h-16 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-2xl font-black text-[var(--text-primary)] flex items-center justify-center active:scale-95 transition-all shadow-xs"
              >
                +
              </button>
            </div>

            {/* Chips Rápidos de Repetições */}
            <div className="grid grid-cols-5 gap-1.5 pt-1">
              {[6, 8, 10, 12, 15].map((preset) => (
                <button
                  key={preset}
                  type="button"
                  onClick={() => setReps(preset)}
                  className={`py-2 rounded-xl text-xs font-black font-mono tabular-nums border transition-all ${
                    reps === preset
                      ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-xs'
                      : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]'
                  }`}
                >
                  {preset} reps
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Botão de Salvar / Confirmar */}
        <button
          type="button"
          onClick={handleConfirm}
          className="btn-tactile w-full py-3.5 mt-5 text-sm font-bold flex items-center justify-center gap-2 shadow-md"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>Confirmar Ajuste ({weight}kg × {reps} reps)</span>
        </button>
      </div>
    </div>
  );
}
