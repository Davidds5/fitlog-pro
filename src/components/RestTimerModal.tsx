'use client';

import React, { useState, useEffect } from 'react';
import { playRestCompleteAlarm } from '@/lib/alarm';
import { Timer, X, Plus, Minus, Volume2, Maximize2 } from 'lucide-react';

interface RestTimerProps {
  initialSeconds: number;
  isOpen: boolean;
  onClose: () => void;
}

export function RestTimerModal({ initialSeconds, isOpen, onClose }: RestTimerProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(initialSeconds);
      setIsActive(true);
      setIsExpanded(false); // Por padrão inicia como pílula flutuante limpa
    }
  }, [isOpen, initialSeconds]);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isOpen && isActive && secondsLeft > 0) {
      interval = setInterval(() => {
        setSecondsLeft((prev) => prev - 1);
      }, 1000);
    } else if (isOpen && secondsLeft === 0 && isActive) {
      setIsActive(false);
      playRestCompleteAlarm();
      if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
        navigator.vibrate([200, 100, 200]);
      }
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isActive, secondsLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
  const isFinished = secondsLeft === 0;

  // 1. MODO PÍLULA FLUTUANTE (Não bloqueia a tela, foco em uso na academia)
  if (!isExpanded) {
    return (
      <aside
        aria-label="Cronômetro de descanso"
        className={`fixed top-14 left-1/2 -translate-x-1/2 z-50 max-w-sm w-[92%] sm:w-auto px-3.5 py-2 rounded-2xl border shadow-xl flex items-center justify-between gap-3 animate-in slide-in-from-top-3 duration-200 ${
          isFinished
            ? 'bg-emerald-600 text-white border-emerald-400 animate-pulse'
            : 'bg-[var(--surface)] text-[var(--text-primary)] border-[var(--brand-primary)]/50 backdrop-blur-md'
        }`}
      >
        <button
          type="button"
          onClick={() => setIsExpanded(true)}
          className="flex items-center gap-2 hover:opacity-80 transition-opacity"
          title="Toque para expandir cronômetro"
        >
          <Timer className={`w-4 h-4 ${isFinished ? 'text-white' : 'text-[var(--brand-primary)] animate-spin'}`} />
          <div className="flex flex-col text-left">
            <span className="text-xs font-black tabular-nums font-mono leading-none">
              {isFinished ? 'Descanso Concluído!' : formattedTime}
            </span>
            <span className="text-[9px] opacity-75 font-semibold leading-tight">
              {isFinished ? 'Pronto para a série 🔥' : 'Descanso ativo'}
            </span>
          </div>
        </button>

        <div className="flex items-center gap-1">
          {!isFinished && (
            <button
              type="button"
              onClick={() => setSecondsLeft((s) => s + 15)}
              className="px-2 py-1 rounded-lg text-[10px] font-bold bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] active:scale-95"
              title="Adicionar 15 segundos"
            >
              +15s
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsExpanded(true)}
            className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-subtle)]"
            title="Expandir"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onClose}
            className={`p-1 rounded-lg text-xs font-bold active:scale-95 ${
              isFinished
                ? 'bg-white text-emerald-700 px-2'
                : 'text-[var(--text-muted)] hover:text-red-500 hover:bg-[var(--surface-subtle)]'
            }`}
            title="Pular / Fechar"
          >
            {isFinished ? 'OK' : <X className="w-3.5 h-3.5" />}
          </button>
        </div>
      </aside>
    );
  }

  // 2. MODO EXPANDIDO / MODAL COMPLETO
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 text-center shadow-2xl relative">
        <button
          onClick={() => setIsExpanded(false)}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full bg-[var(--surface-subtle)]"
          title="Minimizar para pílula flutuante"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center justify-center gap-2 mb-2 text-[var(--brand-primary)] font-bold text-xs uppercase tracking-wider">
          <Timer className="w-4 h-4 animate-pulse" />
          Descanso Entre Séries
        </div>

        {/* Círculo do cronômetro */}
        <div className="my-5 relative flex items-center justify-center">
          <div className="relative w-40 h-40 flex items-center justify-center rounded-full border-4 border-[var(--brand-primary)] bg-[var(--surface-subtle)] shadow-inner">
            <div className="text-center">
              <span className="text-4xl font-black tracking-tight tabular-nums text-[var(--text-primary)] font-mono">
                {formattedTime}
              </span>
              <p className="text-xs text-[var(--text-muted)] mt-1 font-semibold">
                {secondsLeft === 0 ? 'PRÓXIMA SÉRIE! 🔥' : 'Recupere o fôlego'}
              </p>
            </div>
          </div>
        </div>

        {/* Ajustes rápidos */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <button
            onClick={() => setSecondsLeft((s) => Math.max(0, s - 15))}
            className="btn-secondary-tactile text-xs flex items-center justify-center gap-1 py-2 min-h-[38px]"
          >
            <Minus className="w-3.5 h-3.5" /> 15s
          </button>
          <button
            onClick={() => {
              setSecondsLeft(90);
              setIsActive(true);
            }}
            className="btn-secondary-tactile text-xs py-2 min-h-[38px] font-bold"
          >
            90s
          </button>
          <button
            onClick={() => setSecondsLeft((s) => s + 15)}
            className="btn-secondary-tactile text-xs flex items-center justify-center gap-1 py-2 min-h-[38px]"
          >
            <Plus className="w-3.5 h-3.5" /> 15s
          </button>
        </div>

        {/* Botão de ação */}
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(false)}
            className="btn-secondary-tactile flex-1 text-xs py-2.5 font-bold"
          >
            Minimizar
          </button>
          <button
            onClick={onClose}
            className="btn-tactile flex-1 text-xs py-2.5 flex items-center justify-center gap-1.5 font-bold"
          >
            <Volume2 className="w-4 h-4" />
            {secondsLeft === 0 ? 'Iniciar Próxima' : 'Pular Descanso'}
          </button>
        </div>
      </div>
    </div>
  );
}
