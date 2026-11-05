'use client';

import React from 'react';
import { Dumbbell, Utensils, BookOpen } from 'lucide-react';

export type TabType = 'treino' | 'dieta' | 'guia';

interface BottomNavProps {
  activeTab: TabType;
  onChangeTab: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onChangeTab }: BottomNavProps) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[var(--surface)]/95 backdrop-blur-md border-t border-[var(--border)] pb-safe px-3 pt-2 shadow-lg">
      <div className="max-w-lg mx-auto grid grid-cols-3 gap-2 py-1">
        <button
          onClick={() => onChangeTab('treino')}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl min-h-[52px] transition-all ${
            activeTab === 'treino'
              ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] font-bold shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Dumbbell className={`w-5 h-5 mb-1 ${activeTab === 'treino' ? 'scale-110' : ''}`} />
          <span className="text-xs tracking-wide font-bold">Treino</span>
        </button>

        <button
          onClick={() => onChangeTab('dieta')}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl min-h-[52px] transition-all ${
            activeTab === 'dieta'
              ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] font-bold shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <Utensils className={`w-5 h-5 mb-1 ${activeTab === 'dieta' ? 'scale-110' : ''}`} />
          <span className="text-xs tracking-wide font-bold">Dieta</span>
        </button>

        <button
          onClick={() => onChangeTab('guia')}
          className={`flex flex-col items-center justify-center py-2 px-3 rounded-2xl min-h-[52px] transition-all ${
            activeTab === 'guia'
              ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] font-bold shadow-md'
              : 'text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)]'
          }`}
        >
          <BookOpen className={`w-5 h-5 mb-1 ${activeTab === 'guia' ? 'scale-110' : ''}`} />
          <span className="text-xs tracking-wide font-bold">Guia</span>
        </button>
      </div>
    </nav>
  );
}
