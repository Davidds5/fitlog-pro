'use client';

import React from 'react';
import { Dumbbell, Utensils, BookOpen, TrendingUp } from 'lucide-react';

export type TabType = 'treino' | 'dieta' | 'guia' | 'progresso';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)] border-t border-[var(--border)] px-2.5 pt-2 shadow-sm"
      style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom))' }}
    >
      <div className="max-w-md mx-auto grid grid-cols-4 gap-1.5 py-1">
        {/* Aba Treino */}
        <button
          type="button"
          onClick={() => onChangeTab('treino')}
          className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl min-h-[52px] select-none transition-all outline-none ${
            activeTab === 'treino'
              ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] font-bold shadow-xs'
              : 'text-[var(--text-muted)] bg-transparent active:bg-[var(--surface-subtle)]'
          }`}
        >
          <Dumbbell className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-wide font-bold">Treino</span>
        </button>

        {/* Aba Dieta */}
        <button
          type="button"
          onClick={() => onChangeTab('dieta')}
          className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl min-h-[52px] select-none transition-all outline-none ${
            activeTab === 'dieta'
              ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] font-bold shadow-xs'
              : 'text-[var(--text-muted)] bg-transparent active:bg-[var(--surface-subtle)]'
          }`}
        >
          <Utensils className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-wide font-bold">Dieta</span>
        </button>

        {/* Aba Guia */}
        <button
          type="button"
          onClick={() => onChangeTab('guia')}
          className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl min-h-[52px] select-none transition-all outline-none ${
            activeTab === 'guia'
              ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] font-bold shadow-xs'
              : 'text-[var(--text-muted)] bg-transparent active:bg-[var(--surface-subtle)]'
          }`}
        >
          <BookOpen className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-wide font-bold">Guia</span>
        </button>

        {/* Aba Progresso */}
        <button
          type="button"
          onClick={() => onChangeTab('progresso')}
          className={`flex flex-col items-center justify-center py-2 px-1.5 rounded-2xl min-h-[52px] select-none transition-all outline-none ${
            activeTab === 'progresso'
              ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] font-bold shadow-xs'
              : 'text-[var(--text-muted)] bg-transparent active:bg-[var(--surface-subtle)]'
          }`}
        >
          <TrendingUp className="w-5 h-5 mb-1" />
          <span className="text-[11px] tracking-wide font-bold">Evolução</span>
        </button>
      </div>
    </nav>
  );
}
