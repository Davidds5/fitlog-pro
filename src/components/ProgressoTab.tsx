'use client';

import React, { useState, useMemo, useRef } from 'react';
import { useLocalStorage, SetLogEntry, WorkoutSession, BodyWeightEntry } from '@/lib/storage';
import {
  getPeriodComparison,
  getWeeklyMuscleVolume,
  getExerciseRecords,
  getExerciseTimeSeries,
  TimeSeriesPoint,
} from '@/lib/evolution';
import { FitLogBackupSchema } from '@/lib/schemas';
import defaultExercicios from '@/data/exercicios.json';
import {
  TrendingUp,
  Trophy,
  Calendar,
  Flame,
  Scale,
  Download,
  Upload,
  Search,
  ChevronRight,
  ChevronDown,
  Check,
  AlertCircle,
  Dumbbell,
  BarChart2,
  Plus,
  X,
} from 'lucide-react';

interface ProgressoTabProps {
  onGoToTreino: () => void;
}

export function ProgressoTab({ onGoToTreino }: ProgressoTabProps) {
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('fitlog_sessions', []);
  const [history, setHistory] = useLocalStorage<SetLogEntry[]>('fitlog_history', []);
  const [bodyWeights, setBodyWeights] = useLocalStorage<BodyWeightEntry[]>('fitlog_body_weight', []);

  // Período comparativo no topo
  const [comparisonPeriod, setComparisonPeriod] = useState<'week' | 'month'>('week');

  // Controle de busca e seleção de exercício
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);

  // Métrica e filtro de tempo do gráfico de exercício
  const [chartMetric, setChartMetric] = useState<'maxWeight' | 'oneRM' | 'volume'>('maxWeight');
  const [chartRange, setChartRange] = useState<'4w' | '3m' | '6m' | 'all'>('4w');

  // Registro rápido de peso
  const [inputWeight, setInputWeight] = useState('');
  const [weightFeedback, setWeightFeedback] = useState<string | null>(null);

  // Backup / Restauração
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [backupMessage, setBackupMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Estatísticas comparativas de período (semana vs semana ou mês vs mês)
  const periodStats = useMemo(() => {
    return getPeriodComparison(sessions, comparisonPeriod);
  }, [sessions, comparisonPeriod]);

  // Volume muscular da semana
  const weeklyMuscles = useMemo(() => {
    return getWeeklyMuscleVolume(history);
  }, [history]);

  // Lista de exercícios únicos que possuem histórico registrado
  const trainedExercises = useMemo(() => {
    const map = new Map<string, { id: string; name: string; muscleGroup: string; latestDate: string; count: number }>();
    history.forEach((h) => {
      if (!h.exerciseId || h.weight <= 0) return;
      const existing = map.get(h.exerciseId);
      if (!existing) {
        map.set(h.exerciseId, {
          id: h.exerciseId,
          name: h.exerciseName,
          muscleGroup: h.muscleGroup || 'Geral',
          latestDate: h.date,
          count: 1,
        });
      } else {
        existing.count += 1;
        if (h.date > existing.latestDate) {
          existing.latestDate = h.date;
        }
      }
    });

    const list = Array.from(map.values());

    // Se nenhum exercício foi treinado ainda, inclui os exercícios do guia como sugestão
    if (list.length === 0) {
      return defaultExercicios.slice(0, 10).map((ex) => ({
        id: ex.id,
        name: ex.name,
        muscleGroup: ex.muscleGroup,
        latestDate: 'Sem histórico',
        count: 0,
      }));
    }

    return list.sort((a, b) => (b.latestDate > a.latestDate ? 1 : -1));
  }, [history]);

  // Filtra exercícios pela busca
  const filteredExercises = useMemo(() => {
    if (!searchQuery.trim()) return trainedExercises;
    const q = searchQuery.toLowerCase();
    return trainedExercises.filter(
      (e) => e.name.toLowerCase().includes(q) || e.muscleGroup.toLowerCase().includes(q)
    );
  }, [trainedExercises, searchQuery]);

  // Exercício selecionado para o gráfico
  const selectedExercise = useMemo(() => {
    if (!selectedExerciseId) return null;
    return (
      trainedExercises.find((e) => e.id === selectedExerciseId) ||
      defaultExercicios.find((e) => e.id === selectedExerciseId) ||
      null
    );
  }, [selectedExerciseId, trainedExercises]);

  // Recordes do exercício selecionado
  const selectedRecords = useMemo(() => {
    if (!selectedExerciseId) return null;
    return getExerciseRecords(selectedExerciseId, history);
  }, [selectedExerciseId, history]);

  // Série temporal para o gráfico SVG do exercício
  const timeSeriesData: TimeSeriesPoint[] = useMemo(() => {
    if (!selectedExerciseId) return [];
    return getExerciseTimeSeries(selectedExerciseId, history, chartMetric, chartRange);
  }, [selectedExerciseId, history, chartMetric, chartRange]);

  // Histórico em tabela do exercício selecionado
  const selectedExerciseLogs = useMemo(() => {
    if (!selectedExerciseId) return [];
    return history
      .filter((h) => h.exerciseId === selectedExerciseId && h.weight > 0)
      .sort((a, b) => b.timestamp - a.timestamp);
  }, [selectedExerciseId, history]);

  // Calendário dos últimos 28 dias de treino
  const recentDaysCalendar = useMemo(() => {
    const days: { dateStr: string; dayNumber: number; dayLetter: string; isTrained: boolean; isToday: boolean }[] = [];
    const now = new Date();
    const trainedDates = new Set(sessions.map((s) => s.date));
    history.forEach((h) => trainedDates.add(h.date));

    const dayLetters = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

    for (let i = 27; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayOfWeek = d.getDay();
      days.push({
        dateStr,
        dayNumber: d.getDate(),
        dayLetter: dayLetters[dayOfWeek],
        isTrained: trainedDates.has(dateStr),
        isToday: i === 0,
      });
    }
    return days;
  }, [sessions, history]);

  // Salva peso corporal
  const handleSaveWeight = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(inputWeight.replace(',', '.'));
    if (isNaN(val) || val < 30 || val > 300) {
      setWeightFeedback('Informe um peso válido (30 a 300 kg).');
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const newEntry: BodyWeightEntry = {
      id: `weight-${Date.now()}`,
      date: todayStr,
      weight: Math.round(val * 10) / 10,
      timestamp: Date.now(),
    };

    setBodyWeights((prev) => [newEntry, ...prev.filter((w) => w.date !== todayStr)]);
    setInputWeight('');
    setWeightFeedback(`Peso de ${val}kg registrado com sucesso!`);
    setTimeout(() => setWeightFeedback(null), 3000);
  };

  // Exportar Backup JSON
  const handleExportBackup = () => {
    try {
      const backupData = {
        version: 2,
        exportedAt: new Date().toISOString(),
        fichas: JSON.parse(window.localStorage.getItem('fitlog_fichas') || '[]'),
        sessions: JSON.parse(window.localStorage.getItem('fitlog_sessions') || '[]'),
        history: JSON.parse(window.localStorage.getItem('fitlog_history') || '[]'),
        profile: JSON.parse(window.localStorage.getItem('fitlog_profile') || 'null'),
        dietLogs: JSON.parse(window.localStorage.getItem('fitlog_diet_logs') || '[]'),
        bodyWeightLogs: JSON.parse(window.localStorage.getItem('fitlog_body_weight') || '[]'),
        customFoods: JSON.parse(window.localStorage.getItem('fitlog_custom_foods') || '[]'),
        customExercises: JSON.parse(window.localStorage.getItem('fitlog_custom_exercises') || '[]'),
      };

      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `fitlog-pro-backup-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setBackupMessage({ type: 'success', text: 'Backup exportado com sucesso!' });
      setTimeout(() => setBackupMessage(null), 4000);
    } catch (err) {
      console.error(err);
      setBackupMessage({ type: 'error', text: 'Erro ao gerar arquivo de backup.' });
    }
  };

  // Importar Backup JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        const validation = FitLogBackupSchema.safeParse(parsed);
        if (!validation.success) {
          setBackupMessage({
            type: 'error',
            text: 'Arquivo de backup inválido ou incompatível.',
          });
          return;
        }

        const data = validation.data;
        if (data.fichas) window.localStorage.setItem('fitlog_fichas', JSON.stringify(data.fichas));
        if (data.sessions) {
          window.localStorage.setItem('fitlog_sessions', JSON.stringify(data.sessions));
          setSessions(data.sessions as WorkoutSession[]);
        }
        if (data.history) {
          window.localStorage.setItem('fitlog_history', JSON.stringify(data.history));
          setHistory(data.history as SetLogEntry[]);
        }
        if (data.profile) window.localStorage.setItem('fitlog_profile', JSON.stringify(data.profile));
        if (data.dietLogs) window.localStorage.setItem('fitlog_diet_logs', JSON.stringify(data.dietLogs));
        if (data.bodyWeightLogs) {
          window.localStorage.setItem('fitlog_body_weight', JSON.stringify(data.bodyWeightLogs));
          setBodyWeights(data.bodyWeightLogs as BodyWeightEntry[]);
        }
        if (data.customFoods) window.localStorage.setItem('fitlog_custom_foods', JSON.stringify(data.customFoods));
        if (data.customExercises) window.localStorage.setItem('fitlog_custom_exercises', JSON.stringify(data.customExercises));

        // Dispara evento global para recarregar componentes
        window.dispatchEvent(new Event('storage'));

        setBackupMessage({ type: 'success', text: 'Dados restaurados com sucesso!' });
        setTimeout(() => setBackupMessage(null), 5000);
      } catch (err) {
        console.error(err);
        setBackupMessage({ type: 'error', text: 'Erro ao ler arquivo JSON.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Estado Vazio se ainda não há treinos finalizados nem histórico
  const hasHistory = history.some((h) => h.weight > 0) || sessions.length > 0;

  return (
    <div className="space-y-4 max-w-md mx-auto pb-28">
      {/* 1. CABEÇALHO DA ABA PROGRESSO */}
      <div className="interactive-card p-4 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-[var(--brand-primary)]/10 text-[var(--brand-primary)] flex items-center justify-center font-black">
              <TrendingUp className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-base font-black text-[var(--text-primary)]">Evolução & Progresso</h1>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">
                Histórico de carga, recordes e frequência
              </p>
            </div>
          </div>

          {/* Seletor de Período Comparativo */}
          <div className="flex items-center p-0.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <button
              onClick={() => setComparisonPeriod('week')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                comparisonPeriod === 'week'
                  ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Semana
            </button>
            <button
              onClick={() => setComparisonPeriod('month')}
              className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all ${
                comparisonPeriod === 'month'
                  ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              Mês
            </button>
          </div>
        </div>

        {/* CARDS COMPARATIVOS (PERÍODO VS PERÍODO) */}
        <div className="grid grid-cols-2 gap-2">
          {/* Card Volume Total */}
          <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Flame className="w-3 h-3 text-[var(--brand-primary)]" /> Volume Total
              </span>
              {periodStats.volumeChangePercent !== null && (
                <span
                  className={`text-[10px] font-black px-1.5 py-0.2 rounded-md ${
                    periodStats.volumeChangePercent >= 0
                      ? 'bg-emerald-500/15 text-emerald-500'
                      : 'bg-amber-500/15 text-amber-500'
                  }`}
                >
                  {periodStats.volumeChangePercent >= 0 ? `+${periodStats.volumeChangePercent}%` : `${periodStats.volumeChangePercent}%`}
                </span>
              )}
            </div>
            <div className="text-base font-black text-[var(--text-primary)] mt-1 tabular-nums font-mono">
              {periodStats.currentVolume > 0
                ? `${periodStats.currentVolume.toLocaleString('pt-BR')} kg`
                : '—'}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              vs {periodStats.previousVolume.toLocaleString('pt-BR')} kg {comparisonPeriod === 'week' ? 'anterior' : 'mês ant.'}
            </div>
          </div>

          {/* Card Séries Feitas */}
          <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
                <Check className="w-3 h-3 text-emerald-500" /> Séries Feitas
              </span>
              <span className="text-[10px] font-bold text-[var(--text-muted)]">
                {periodStats.currentWorkouts} {periodStats.currentWorkouts === 1 ? 'treino' : 'treinos'}
              </span>
            </div>
            <div className="text-base font-black text-[var(--text-primary)] mt-1 tabular-nums font-mono">
              {periodStats.currentSets} <span className="text-xs text-[var(--text-muted)] font-normal">séries</span>
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              vs {periodStats.previousSets} no período ant.
            </div>
          </div>

          {/* Card PRs Conquistados */}
          <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Trophy className="w-3 h-3 text-amber-500" /> Recordes (PR)
            </span>
            <div className="text-base font-black text-amber-500 mt-1 tabular-nums font-mono">
              {periodStats.currentPRs > 0 ? `${periodStats.currentPRs} batido(s)! 🏆` : '—'}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              {comparisonPeriod === 'week' ? 'nesta semana' : 'neste mês'}
            </div>
          </div>

          {/* Card Peso Corporal */}
          <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
            <span className="text-[10px] uppercase font-bold text-[var(--text-muted)] flex items-center gap-1">
              <Scale className="w-3 h-3 text-blue-500" /> Peso Atual
            </span>
            <div className="text-base font-black text-[var(--text-primary)] mt-1 tabular-nums font-mono">
              {bodyWeights.length > 0 ? `${bodyWeights[0].weight} kg` : '—'}
            </div>
            <div className="text-[10px] text-[var(--text-muted)] mt-0.5">
              {bodyWeights.length > 1 ? `ant. ${bodyWeights[1].weight} kg` : 'registre abaixo'}
            </div>
          </div>
        </div>
      </div>

      {/* 2. FREQUÊNCIA DE TREINOS (CALENDÁRIO DE 28 DIAS) */}
      <div className="interactive-card p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2.5">
          <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Frequência de Treinos (Últimos 28 dias)
          </span>
          <span className="text-[11px] font-bold text-[var(--brand-primary)]">
            {recentDaysCalendar.filter((d) => d.isTrained).length} dias ativos
          </span>
        </div>

        {/* Grade de 4 semanas (7 dias por linha) */}
        <div className="grid grid-cols-7 gap-1.5 text-center">
          {recentDaysCalendar.map((item) => (
            <div
              key={item.dateStr}
              title={`${item.dateStr}: ${item.isTrained ? 'Treino concluído!' : 'Sem treino registrado'}`}
              className={`p-1.5 rounded-xl border flex flex-col items-center justify-center transition-all ${
                item.isTrained
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 font-bold'
                  : item.isToday
                  ? 'bg-[var(--surface-subtle)] border-[var(--brand-primary)] text-[var(--brand-primary)] font-bold'
                  : 'bg-[var(--surface-subtle)] border-[var(--border)] text-[var(--text-faint)]'
              }`}
            >
              <span className="text-[9px] uppercase leading-none opacity-80">{item.dayLetter}</span>
              <span className="text-xs font-mono tabular-nums mt-0.5 leading-none">{item.dayNumber}</span>
              {item.isTrained && <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 mt-1" />}
            </div>
          ))}
        </div>
      </div>

      {/* 3. VOLUME SEMANAL POR GRUPO MUSCULAR */}
      {weeklyMuscles.length > 0 && (
        <div className="interactive-card p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <BarChart2 className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Volume Semanal por Músculo
            </span>
            <span className="text-[10px] text-[var(--text-muted)] font-medium">Últimos 7 dias</span>
          </div>

          <div className="space-y-2 mt-2">
            {weeklyMuscles.slice(0, 5).map((m) => (
              <div key={m.muscle} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[var(--text-primary)]">{m.muscle}</span>
                  <span className="font-mono text-[var(--text-muted)] tabular-nums text-[11px]">
                    {m.volumeKg.toLocaleString('pt-BR')} kg ({m.sets} séries)
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-[var(--surface-subtle)] overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[var(--brand-primary)] to-amber-500"
                    style={{ width: `${Math.min(100, Math.max(5, m.percent))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. EVOLUÇÃO POR EXERCÍCIO (BUSCA & GRÁFICO SVG) */}
      <div className="interactive-card p-4 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-black text-[var(--text-primary)] flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-[var(--brand-primary)]" /> Evolução por Exercício
            </h2>
            <p className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Toque no exercício para ver gráfico de carga e 1RM
            </p>
          </div>
        </div>

        {/* Busca rápida */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou músculo..."
            className="w-full pl-9 pr-3 py-2 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-[var(--brand-primary)]"
          />
        </div>

        {/* Lista de Exercícios com histórico */}
        <div className="space-y-1.5 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
          {filteredExercises.map((ex) => {
            const isSelected = selectedExerciseId === ex.id;
            const records = getExerciseRecords(ex.id, history);

            return (
              <button
                key={ex.id}
                type="button"
                onClick={() => setSelectedExerciseId(isSelected ? null : ex.id)}
                className={`w-full p-2.5 rounded-2xl border text-left flex items-center justify-between transition-all select-none ${
                  isSelected
                    ? 'bg-[var(--brand-primary)]/10 border-[var(--brand-primary)] text-[var(--text-primary)]'
                    : 'bg-[var(--surface-subtle)] border-[var(--border)] hover:border-[var(--brand-primary)]/50'
                }`}
              >
                <div>
                  <div className="text-xs font-bold text-[var(--text-primary)]">{ex.name}</div>
                  <div className="text-[10px] text-[var(--text-muted)] flex items-center gap-1.5 mt-0.5">
                    <span className="uppercase font-semibold text-[var(--brand-primary)]">{ex.muscleGroup}</span>
                    <span>•</span>
                    <span>{records.totalSets} séries registradas</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {records.maxWeight ? (
                    <div className="text-right">
                      <div className="text-xs font-black text-amber-500 tabular-nums font-mono">
                        Max {records.maxWeight.value} kg
                      </div>
                      <div className="text-[9px] text-[var(--text-muted)]">1RM ~{records.best1RM?.value}kg</div>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[var(--text-muted)]">—</span>
                  )}
                  {isSelected ? (
                    <ChevronDown className="w-4 h-4 text-[var(--brand-primary)] shrink-0" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-[var(--text-muted)] shrink-0" />
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. MODAL / DETALHE DO EXERCÍCIO SELECIONADO (GRÁFICO & TABELA) */}
      {selectedExercise && selectedRecords && (
        <div className="interactive-card p-4 shadow-sm space-y-4 border-[var(--brand-primary)]/40 bg-[var(--surface)] animate-in fade-in duration-200">
          <div className="flex items-start justify-between border-b border-[var(--border)] pb-3">
            <div>
              <span className="text-[10px] font-black uppercase text-[var(--brand-primary)] tracking-wide">
                {selectedExercise.muscleGroup}
              </span>
              <h3 className="text-base font-black text-[var(--text-primary)] mt-0.5">{selectedExercise.name}</h3>
            </div>
            <button
              onClick={() => setSelectedExerciseId(null)}
              className="p-1 rounded-full text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface-subtle)]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* CARDS DE RECORDES DO EXERCÍCIO */}
          <div className="grid grid-cols-3 gap-2 text-center">
            <div className="p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Melhor Carga</span>
              <span className="text-sm font-black text-amber-500 font-mono tabular-nums block mt-0.5">
                {selectedRecords.maxWeight ? `${selectedRecords.maxWeight.value} kg` : '—'}
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                {selectedRecords.maxWeight ? selectedRecords.maxWeight.date.split('-').slice(1).join('/') : '—'}
              </span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Melhor 1RM</span>
              <span className="text-sm font-black text-[var(--brand-primary)] font-mono tabular-nums block mt-0.5">
                {selectedRecords.best1RM ? `~${selectedRecords.best1RM.value} kg` : '—'}
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">Fórmula Epley</span>
            </div>

            <div className="p-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Últimos 30d</span>
              <span
                className={`text-sm font-black font-mono tabular-nums block mt-0.5 ${
                  selectedRecords.last30DaysChangePercent && selectedRecords.last30DaysChangePercent >= 0
                    ? 'text-emerald-500'
                    : 'text-[var(--text-muted)]'
                }`}
              >
                {selectedRecords.last30DaysChangePercent !== null
                  ? `${selectedRecords.last30DaysChangePercent >= 0 ? '+' : ''}${selectedRecords.last30DaysChangePercent}%`
                  : '—'}
              </span>
              <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">evolução</span>
            </div>
          </div>

          {/* CONTROLES DO GRÁFICO (MÉTRICA & RANGE) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1 p-0.5 rounded-lg bg-[var(--surface-subtle)] border border-[var(--border)]">
                <button
                  type="button"
                  onClick={() => setChartMetric('maxWeight')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    chartMetric === 'maxWeight'
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Carga (kg)
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('oneRM')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    chartMetric === 'oneRM'
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  1RM Estimado
                </button>
                <button
                  type="button"
                  onClick={() => setChartMetric('volume')}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                    chartMetric === 'volume'
                      ? 'bg-[var(--brand-primary)] text-white'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  Volume
                </button>
              </div>

              <div className="flex items-center gap-1 text-[10px] text-[var(--text-muted)] font-bold">
                {(['4w', '3m', '6m', 'all'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setChartRange(r)}
                    className={`px-1.5 py-0.5 rounded uppercase ${
                      chartRange === r ? 'bg-[var(--text-primary)] text-[var(--surface)]' : 'hover:text-[var(--text-primary)]'
                    }`}
                  >
                    {r === '4w' ? '4s' : r === 'all' ? 'Tudo' : r}
                  </button>
                ))}
              </div>
            </div>

            {/* GRÁFICO SVG RESPONSIVO */}
            <div className="p-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)]">
              {timeSeriesData.length > 1 ? (
                <div className="w-full">
                  {(() => {
                    const width = 360;
                    const height = 150;
                    const padding = 24;

                    const values = timeSeriesData.map((d) => d.value);
                    const minVal = Math.max(0, Math.min(...values) * 0.9);
                    const maxVal = Math.max(...values) * 1.1 || 10;
                    const rangeVal = maxVal - minVal || 1;

                    const points = timeSeriesData.map((d, idx) => {
                      const x = padding + (idx / (timeSeriesData.length - 1)) * (width - 2 * padding);
                      const y = height - padding - ((d.value - minVal) / rangeVal) * (height - 2 * padding);
                      return { x, y, ...d };
                    });

                    const pathString = points.reduce((acc, pt, idx) => {
                      return idx === 0 ? `M ${pt.x} ${pt.y}` : `${acc} L ${pt.x} ${pt.y}`;
                    }, '');

                    const areaString = `${pathString} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

                    return (
                      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-36 overflow-visible select-none">
                        <defs>
                          <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#C85A17" stopOpacity="0.4" />
                            <stop offset="100%" stopColor="#C85A17" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>

                        {/* Linhas de grade sutis */}
                        <line
                          x1={padding}
                          y1={padding}
                          x2={width - padding}
                          y2={padding}
                          stroke="currentColor"
                          strokeOpacity="0.1"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1={padding}
                          y1={height / 2}
                          x2={width - padding}
                          y2={height / 2}
                          stroke="currentColor"
                          strokeOpacity="0.1"
                          strokeDasharray="3 3"
                        />
                        <line
                          x1={padding}
                          y1={height - padding}
                          x2={width - padding}
                          y2={height - padding}
                          stroke="currentColor"
                          strokeOpacity="0.2"
                        />

                        {/* Área com gradiente */}
                        <path d={areaString} fill="url(#chartGradient)" />

                        {/* Linha principal */}
                        <path
                          d={pathString}
                          fill="none"
                          stroke="#C85A17"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />

                        {/* Pontos de dados */}
                        {points.map((pt) => (
                          <g key={pt.date} className="group cursor-pointer">
                            <circle
                              cx={pt.x}
                              cy={pt.y}
                              r="4"
                              fill="#C85A17"
                              stroke="var(--surface)"
                              strokeWidth="2"
                              className="transition-transform group-hover:scale-150"
                            />
                            {/* Rótulo de data no eixo X */}
                            <text
                              x={pt.x}
                              y={height - 6}
                              textAnchor="middle"
                              fontSize="9"
                              fill="var(--text-muted)"
                              fontFamily="monospace"
                            >
                              {pt.displayDate}
                            </text>
                            {/* Valor acima do ponto */}
                            <text
                              x={pt.x}
                              y={pt.y - 8}
                              textAnchor="middle"
                              fontSize="10"
                              fontWeight="bold"
                              fill="var(--text-primary)"
                              fontFamily="monospace"
                            >
                              {pt.value}
                            </text>
                          </g>
                        ))}
                      </svg>
                    );
                  })()}
                </div>
              ) : timeSeriesData.length === 1 ? (
                <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                  <span className="font-bold text-[var(--text-primary)]">1 treino registrado:</span> {timeSeriesData[0].value} kg em {timeSeriesData[0].date}.
                  <p className="mt-1">Faça mais treinos para visualizar a curva de evolução no gráfico!</p>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-[var(--text-muted)]">
                  Nenhum registro para este período.
                </div>
              )}
            </div>
          </div>

          {/* TABELA DE SÉRIES POR DATA */}
          <div>
            <span className="text-xs font-bold text-[var(--text-primary)] block mb-2">
              Histórico Detalhado ({selectedExerciseLogs.length} séries)
            </span>
            <div className="max-h-48 overflow-y-auto no-scrollbar space-y-1.5 border border-[var(--border)] rounded-2xl p-2 bg-[var(--surface-subtle)]">
              {selectedExerciseLogs.length > 0 ? (
                selectedExerciseLogs.map((log) => (
                  <div
                    key={log.id}
                    className="p-2 rounded-xl bg-[var(--surface)] border border-[var(--border)] flex items-center justify-between text-xs font-mono"
                  >
                    <div>
                      <span className="font-bold text-[var(--text-primary)]">
                        Série {log.serieNumber || (log as unknown as { setNumber?: number }).setNumber || 1}: {log.weight}kg × {log.reps} reps
                      </span>
                      <span className="text-[10px] text-[var(--text-muted)] block">
                        1RM ~{log.oneRM}kg • Vol {log.volume || log.weight * log.reps}kg
                      </span>
                    </div>
                    <span className="text-[11px] text-[var(--text-muted)]">{log.date}</span>
                  </div>
                ))
              ) : (
                <div className="text-center py-4 text-xs text-[var(--text-muted)]">
                  Nenhum registro em tabela.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 6. REGISTRO RÁPIDO DE PESO CORPORAL */}
      <div className="interactive-card p-4 shadow-xs">
        <span className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5 mb-2">
          <Scale className="w-3.5 h-3.5 text-blue-500" /> Registro Rápido de Peso Corporal
        </span>
        <form onSubmit={handleSaveWeight} className="flex gap-2">
          <input
            type="number"
            step="0.1"
            value={inputWeight}
            onChange={(e) => setInputWeight(e.target.value)}
            placeholder="Ex: 78.5"
            className="flex-1 px-3 py-2.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-sm font-mono text-[var(--text-primary)] placeholder-[var(--text-muted)] outline-none focus:border-blue-500"
          />
          <button type="submit" className="btn-tactile text-xs px-4 font-bold flex items-center gap-1">
            <Plus className="w-4 h-4" /> Salvar Peso
          </button>
        </form>
        {weightFeedback && (
          <p className="text-[11px] font-bold text-emerald-500 mt-2 flex items-center gap-1">
            <Check className="w-3.5 h-3.5" /> {weightFeedback}
          </p>
        )}
      </div>

      {/* 7. GERENCIAMENTO DE BACKUP (EXPORTAR / IMPORTAR JSON) */}
      <div className="interactive-card p-4 shadow-xs">
        <div className="flex items-center justify-between mb-2">
          <div>
            <h3 className="text-xs font-bold text-[var(--text-primary)] flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Backup dos Seus Dados
            </h3>
            <p className="text-[10px] text-[var(--text-muted)]">
              Exporte para salvar no celular/computador ou restaure em caso de limpeza de cache
            </p>
          </div>
        </div>

        {backupMessage && (
          <div
            className={`p-2.5 rounded-xl border mb-3 text-xs flex items-center gap-1.5 font-bold ${
              backupMessage.type === 'success'
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-500'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-500'
            }`}
          >
            {backupMessage.type === 'success' ? <Check className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
            <span>{backupMessage.text}</span>
          </div>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={handleExportBackup}
            className="btn-secondary-tactile flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[42px]"
          >
            <Download className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Exportar Backup
          </button>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImportBackup}
            accept=".json,application/json"
            className="hidden"
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="btn-secondary-tactile flex-1 py-2.5 text-xs font-bold flex items-center justify-center gap-1.5 min-h-[42px]"
          >
            <Upload className="w-3.5 h-3.5 text-emerald-500" /> Restaurar Backup
          </button>
        </div>
      </div>

      {/* ESTADO VAZIO CASO NÃO HAJA NENHUM TREINO */}
      {!hasHistory && (
        <div className="p-6 rounded-3xl bg-[var(--surface-subtle)] border border-[var(--border)] text-center space-y-2">
          <Dumbbell className="w-8 h-8 text-[var(--brand-primary)] mx-auto" />
          <h4 className="text-sm font-black text-[var(--text-primary)]">
            Complete seu primeiro treino para ver sua evolução
          </h4>
          <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto">
            Assim que você concluir séries na aba Treino, os gráficos de carga, estimativa de 1RM e volume semanal aparecerão aqui!
          </p>
          <button
            type="button"
            onClick={onGoToTreino}
            className="btn-tactile text-xs py-2 px-4 font-bold inline-flex items-center gap-1 mt-2"
          >
            Ir para Treinos
          </button>
        </div>
      )}
    </div>
  );
}
