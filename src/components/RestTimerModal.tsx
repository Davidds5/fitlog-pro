'use client';

import React, { useState, useEffect } from 'react';
import { playRestCompleteAlarm } from '@/lib/alarm';
import { Timer, X, Plus, Minus, Volume2 } from 'lucide-react';

interface RestTimerModalProps {
  initialSeconds: number;
  isOpen: boolean;
  onClose: () => void;
}

export function RestTimerModal({ initialSeconds, isOpen, onClose }: RestTimerModalProps) {
  const [secondsLeft, setSecondsLeft] = useState<number>(initialSeconds);
  const [isActive, setIsActive] = useState<boolean>(true);

  useEffect(() => {
    if (isOpen) {
      setSecondsLeft(initialSeconds);
      setIsActive(true);
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
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isOpen, isActive, secondsLeft]);

  if (!isOpen) return null;

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
      <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-6 text-center shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-full bg-[var(--surface-subtle)]"
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
              <span className="text-4xl font-black tracking-tight tabular-nums text-[var(--text-primary)]">
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
        <button
          onClick={onClose}
          className="btn-tactile w-full text-sm py-3 flex items-center justify-center gap-2 font-bold"
        >
          <Volume2 className="w-4 h-4" />
          {secondsLeft === 0 ? 'Iniciar Próxima Série' : 'Pular Descanso'}
        </button>
      </div>
    </div>
  );
}
