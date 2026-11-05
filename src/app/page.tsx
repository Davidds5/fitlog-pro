'use client';

import React, { useState, useEffect } from 'react';
import { TreinoTab } from '@/components/TreinoTab';
import { DietaTab } from '@/components/DietaTab';
import { GuiaTab } from '@/components/GuiaTab';
import { BottomNav, TabType } from '@/components/BottomNav';
import { Dumbbell, WifiOff, Sun, Moon } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>('treino');
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  // Inicializa tema e detector de rede
  useEffect(() => {
    const savedTheme = window.localStorage.getItem('fitlog_theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle('dark', savedTheme === 'dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if ('serviceWorker' in navigator && process.env.NODE_ENV === 'production') {
      navigator.serviceWorker.register('/sw.js').catch((err) => {
        console.warn('Service Worker erro:', err);
      });
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    window.localStorage.setItem('fitlog_theme', nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
  };

  return (
    <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] flex flex-col font-sans transition-colors duration-150">
      {/* Navbar Clovin Tátil limitada estritamente a max-w-md no desktop */}
      <header className="sticky top-0 z-30 bg-[var(--surface)] border-b border-[var(--border)] px-4 py-3 shadow-xs">
        <div className="max-w-md mx-auto flex items-center justify-between">
          {/* Zona 1: Identidade da Marca */}
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#C85A17] to-[#A25265] flex items-center justify-center text-white font-black shadow-md shadow-[#C85A17]/20">
              <Dumbbell className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-base font-black tracking-tight text-[var(--text-primary)]">
                  FitLog <span className="text-[var(--brand-primary)]">Pro</span>
                </span>
              </div>
              <span className="text-[10px] text-[var(--text-muted)] font-bold uppercase tracking-wider block -mt-1">
                Clovin Tátil
              </span>
            </div>
          </div>

          {/* Zona 2 & 3: Alternador de Tema & Status Offline/Online */}
          <div className="flex items-center gap-2">
            <button
              onClick={toggleTheme}
              title="Alternar Modo Claro / Escuro"
              className="p-2 rounded-xl bg-[var(--surface-subtle)] text-[var(--text-muted)] hover:text-[var(--text-primary)] border border-[var(--border)] transition-all"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-zinc-700" />}
            </button>

            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--surface-subtle)] border border-[var(--border)] text-[11px] font-semibold">
              {isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[var(--text-muted)]">Pronto</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3.5 h-3.5 text-amber-500" />
                  <span className="text-amber-500 font-bold">Offline</span>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Conteúdo Principal com max-w-md centralizado no desktop */}
      <main className="flex-1 p-3.5 sm:p-4 max-w-md mx-auto w-full pb-36 sm:pb-40">
        {activeTab === 'treino' && <TreinoTab />}
        {activeTab === 'dieta' && <DietaTab />}
        {activeTab === 'guia' && <GuiaTab />}
      </main>

      {/* Navegação Inferior Fixa */}
      <BottomNav activeTab={activeTab} onChangeTab={setActiveTab} />
    </div>
  );
}
