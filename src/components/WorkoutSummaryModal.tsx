'use client';

import React from 'react';
import { Trophy, CheckCircle, Flame, Clock, Award, X } from 'lucide-react';

interface WorkoutSummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  workoutName: string;
  completedSets: number;
  totalSets: number;
  totalVolumeKg: number;
  durationMinutes: number;
  prCount: number;
  onResetCompleted: () => void;
}

export function WorkoutSummaryModal({
  isOpen,
  onClose,
  workoutName,
  completedSets,
  totalSets,
  totalVolumeKg,
  durationMinutes,
  prCount,
  onResetCompleted,
}: WorkoutSummaryModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)]"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Ícone de Troféu com Gradiente */}
        <div className="w-16 h-16 rounded-3xl bg-gradient-to-tr from-[#e06d28] to-[#eab308] mx-auto flex items-center justify-center text-white shadow-lg shadow-[#e06d28]/30 mb-3 animate-bounce">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="text-xl font-black text-[var(--text-primary)]">Treino Finalizado! 🔥</h2>
        <p className="text-xs text-[var(--text-muted)] mt-1 font-medium">{workoutName}</p>

        {/* Grade de Estatísticas da Sessão */}
        <div className="grid grid-cols-2 gap-2.5 my-5 text-left">
          <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> Séries Feitas
            </span>
            <div className="text-lg font-black text-[var(--text-primary)] mt-1 tabular-nums font-mono">
              {completedSets} <span className="text-xs text-[var(--text-muted)] font-normal">/ {totalSets}</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Flame className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Volume Total
            </span>
            <div className="text-lg font-black text-[var(--brand-primary)] mt-1 tabular-nums font-mono">
              {Math.round(totalVolumeKg).toLocaleString('pt-BR')} <span className="text-xs">kg</span>
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> Duração
            </span>
            <div className="text-lg font-black text-[var(--text-primary)] mt-1 tabular-nums font-mono">
              {durationMinutes > 0 ? `${durationMinutes} min` : '< 1 min'}
            </div>
          </div>

          <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Award className="w-3.5 h-3.5 text-amber-500" /> Recordes (PR)
            </span>
            <div className="text-lg font-black text-amber-500 mt-1 tabular-nums font-mono">
              {prCount > 0 ? `${prCount} batido(s)! 🏆` : 'Constância 👊'}
            </div>
          </div>
        </div>

        {/* Mensagem Motivacional Clovin */}
        <p className="text-xs text-[var(--text-primary)] bg-[var(--surface-subtle)] p-3 rounded-2xl border border-[var(--border)] mb-5 font-medium leading-relaxed">
          &ldquo;Consistência supera motivação. Cada quilo levantado hoje te deixa um passo mais forte.&rdquo;
        </p>

        {/* Ações */}
        <div className="space-y-2">
          <button
            onClick={() => {
              onResetCompleted();
              onClose();
            }}
            className="btn-tactile w-full py-3.5 text-xs font-bold min-h-[46px]"
          >
            Concluir & Resetar para a Próxima
          </button>
          <button
            onClick={onClose}
            className="btn-secondary-tactile w-full py-2.5 text-xs font-bold min-h-[42px]"
          >
            Fechar sem resetar
          </button>
        </div>
      </div>
    </div>
  );
}

