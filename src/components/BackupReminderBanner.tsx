'use client';

import React, { useState, useEffect } from 'react';
import { ShieldAlert, Download, X } from 'lucide-react';
import { FitLogBackupSchema } from '@/lib/schemas';

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

export function BackupReminderBanner() {
  const [shouldShow, setShouldShow] = useState<boolean>(false);

  useEffect(() => {
    try {
      if (typeof window === 'undefined') return;

      const rawFichas = window.localStorage.getItem('fitlog_fichas');
      const rawHistory = window.localStorage.getItem('fitlog_history');

      // Só exibe se o usuário já tiver dados reais cadastrados
      const hasUserData = (rawFichas && rawFichas.length > 50) || (rawHistory && rawHistory.length > 10);
      if (!hasUserData) return;

      const lastPromptStr = window.localStorage.getItem('fitlog_last_backup_prompt');
      const lastPrompt = lastPromptStr ? Number(lastPromptStr) : 0;
      const now = Date.now();

      if (now - lastPrompt > SEVEN_DAYS_MS) {
        setShouldShow(true);
      }
    } catch {
      // ignora
    }
  }, []);

  const handleDismiss = () => {
    try {
      window.localStorage.setItem('fitlog_last_backup_prompt', String(Date.now()));
      setShouldShow(false);
    } catch {
      setShouldShow(false);
    }
  };

  const handleDownloadBackup = () => {
    try {
      const backupData = {
        version: 3,
        exportedAt: new Date().toISOString(),
        fichas: JSON.parse(window.localStorage.getItem('fitlog_fichas') || '[]'),
        sessions: JSON.parse(window.localStorage.getItem('fitlog_sessions') || '[]'),
        history: JSON.parse(window.localStorage.getItem('fitlog_history') || '[]'),
        profile: JSON.parse(window.localStorage.getItem('fitlog_profile') || '{}'),
        dietLogs: JSON.parse(window.localStorage.getItem('fitlog_diet_logs') || '[]'),
        bodyWeightLogs: JSON.parse(window.localStorage.getItem('fitlog_body_weight') || '[]'),
        customFoods: JSON.parse(window.localStorage.getItem('fitlog_custom_foods') || '[]'),
        customExercises: JSON.parse(window.localStorage.getItem('fitlog_custom_exercises') || '[]'),
      };

      const validation = FitLogBackupSchema.safeParse(backupData);
      if (!validation.success) {
        console.warn('Backup com avisos de validação, exportando com fallback:', validation.error);
      }

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      const dateStr = new Date().toISOString().split('T')[0];
      a.href = url;
      a.download = `fitlog-backup-${dateStr}.json`;
      a.click();
      URL.revokeObjectURL(url);

      window.localStorage.setItem('fitlog_last_backup_prompt', String(Date.now()));
      setShouldShow(false);
    } catch (err) {
      console.error('Erro ao exportar backup rápido:', err);
    }
  };

  if (!shouldShow) return null;

  return (
    <aside
      aria-label="Lembrete de backup semanal"
      className="mb-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between gap-2.5 text-xs animate-in slide-in-from-top-2 duration-200"
    >
      <div className="flex items-center gap-2 min-w-0">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
        <span className="text-[var(--text-primary)] font-medium leading-tight truncate">
          <strong className="text-amber-500">Backup semanal:</strong> proteja seus treinos e histórico.
        </span>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <button
          type="button"
          onClick={handleDownloadBackup}
          className="btn-tactile text-[11px] py-1 px-2.5 flex items-center gap-1 font-bold"
        >
          <Download className="w-3 h-3" />
          <span>Baixar</span>
        </button>
        <button
          type="button"
          onClick={handleDismiss}
          title="Lembrar em 7 dias"
          aria-label="Lembrar em 7 dias"
          className="p-1 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </aside>
  );
}
