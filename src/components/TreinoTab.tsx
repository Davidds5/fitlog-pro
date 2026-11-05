'use client';

import React, { useState, useEffect } from 'react';
import defaultFichas from '@/data/fichas.json';
import defaultExercicios from '@/data/exercicios.json';
import { useLocalStorage, SetLogEntry } from '@/lib/storage';
import {
  PeriodizationPhase,
  calculate1RM,
  getPhaseSeriesConfig,
  recalculateSeriesForPhase,
  isRepsOutOfRange,
  checkPersonalRecord,
  ExerciseSerie,
} from '@/lib/pyramid';
import { getMuscleInfo } from '@/lib/muscles';
import { RestTimerModal } from './RestTimerModal';
import { WorkoutEditorModal } from './WorkoutEditorModal';
import { WorkoutTemplatesModal } from './WorkoutTemplatesModal';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import {
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  TrendingUp,
  History,
  Check,
  AlertCircle,
  Trophy,
  Edit3,
  Dumbbell,
  Calendar,
  Layers,
} from 'lucide-react';

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  series: ExerciseSerie[];
}

export interface WorkoutFicha {
  id: string;
  name: string;
  letter: string;
  description: string;
  phase: PeriodizationPhase;
  color?: string;
  icon?: string;
  weekDays?: number[]; // 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sáb
  exercises: WorkoutExercise[];
}

export function TreinoTab() {
  const [fichas, setFichas] = useLocalStorage<WorkoutFicha[]>('fitlog_fichas', defaultFichas as unknown as WorkoutFicha[]);
  const [history, setHistory] = useLocalStorage<SetLogEntry[]>('fitlog_history', []);
  const [activeFichaId, setActiveFichaId] = useState<string>('ficha-a');

  // Modais de Controle
  const [isTimerOpen, setIsTimerOpen] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(90);

  const [isEditorOpen, setIsEditorOpen] = useState<boolean>(false);
  const [isTemplatesOpen, setIsTemplatesOpen] = useState<boolean>(false);
  const [isSummaryOpen, setIsSummaryOpen] = useState<boolean>(false);

  // Modal para adicionar exercício rápido
  const [isAddExModalOpen, setIsAddExModalOpen] = useState<boolean>(false);
  const [selectedExToAdd, setSelectedExToAdd] = useState<string>(defaultExercicios[0]?.id || '');

  // Expansão manual de séries (qual série está expandida em cada exercício)
  const [expandedSeriesMap, setExpandedSeriesMap] = useState<Record<string, string>>({});

  // Cronômetro de tempo de treino
  const [workoutSeconds, setWorkoutSeconds] = useState<number>(0);
  const [isWorkoutTimerRunning, setIsWorkoutTimerRunning] = useState<boolean>(false);

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    if (isWorkoutTimerRunning) {
      interval = setInterval(() => {
        setWorkoutSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isWorkoutTimerRunning]);

  // Sanitizador automático para curar IDs duplicados existentes no localStorage
  useEffect(() => {
    let hasDuplicates = false;
    const seenFichaIds = new Set<string>();

    const sanitized = fichas.map((f, fIdx) => {
      let fId = f.id;
      if (seenFichaIds.has(fId)) {
        fId = `${fId}-${fIdx}-${Math.random().toString(36).substring(2, 5)}`;
        hasDuplicates = true;
      }
      seenFichaIds.add(fId);

      const seenExIds = new Set<string>();
      const sanitizedExercises = f.exercises.map((ex, exIdx) => {
        let exId = ex.id;
        if (seenExIds.has(exId)) {
          exId = `${exId}-${exIdx}-${Math.random().toString(36).substring(2, 5)}`;
          hasDuplicates = true;
        }
        seenExIds.add(exId);

        const seenSIds = new Set<string>();
        const sanitizedSeries = ex.series.map((s, sIdx) => {
          let sId = s.id;
          if (seenSIds.has(sId)) {
            sId = `${sId}-${sIdx}-${Math.random().toString(36).substring(2, 5)}`;
            hasDuplicates = true;
          }
          seenSIds.add(sId);
          return sId === s.id ? s : { ...s, id: sId };
        });

        return exId === ex.id && sanitizedSeries === ex.series
          ? ex
          : { ...ex, id: exId, series: sanitizedSeries };
      });

      return fId === f.id && sanitizedExercises === f.exercises
        ? f
        : { ...f, id: fId, exercises: sanitizedExercises };
    });

    if (hasDuplicates) {
      setFichas(sanitized);
    }
  }, [fichas, setFichas]);

  const activeFicha = fichas.find((f) => f.id === activeFichaId) || fichas[0] || {
    id: 'empty',
    name: 'Nenhum Treino',
    letter: 'Vazio',
    description: '',
    phase: 'base',
    exercises: [],
  };

  // Dia de hoje (0=Dom, 1=Seg, etc.)
  const todayDayOfWeek = new Date().getDay();

  // Histórico do exercício
  const getLastPerformance = (exerciseId: string) => {
    const logs = history.filter((h) => h.exerciseId === exerciseId);
    if (!logs.length) return null;
    return logs[logs.length - 1];
  };

  // Métricas do Treino
  const allSeries = activeFicha.exercises.flatMap((ex) => ex.series);
  const completedSeriesCount = allSeries.filter((s) => s.completed).length;
  const totalSeriesCount = allSeries.length;
  const progressPercent = totalSeriesCount > 0 ? Math.round((completedSeriesCount / totalSeriesCount) * 100) : 0;

  const totalVolumeKg = activeFicha.exercises.reduce((accEx, ex) => {
    return (
      accEx +
      ex.series.reduce((accS, s) => {
        return s.completed ? accS + s.weight * s.reps : accS;
      }, 0)
    );
  }, 0);

  // Alterar peso de uma série
  const updateSerieWeight = (exerciseId: string, serieId: string, delta: number) => {
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          exercises: ficha.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              series: ex.series.map((s) => {
                if (s.id !== serieId) return s;
                const newWeight = Math.max(0, Math.round((s.weight + delta) * 10) / 10);
                return { ...s, weight: newWeight };
              }),
            };
          }),
        };
      })
    );
  };

  // Digitar peso diretamente
  const promptDirectWeight = (exerciseId: string, serieId: string, currentWeight: number) => {
    const input = window.prompt('Digite a carga em kg:', String(currentWeight));
    if (input === null) return;
    const parsed = parseFloat(input.replace(',', '.'));
    if (!isNaN(parsed) && parsed >= 0) {
      setFichas((prev) =>
        prev.map((ficha) => {
          if (ficha.id !== activeFicha.id) return ficha;
          return {
            ...ficha,
            exercises: ficha.exercises.map((ex) => {
              if (ex.id !== exerciseId) return ex;
              return {
                ...ex,
                series: ex.series.map((s) => (s.id === serieId ? { ...s, weight: Math.round(parsed * 10) / 10 } : s)),
              };
            }),
          };
        })
      );
    }
  };

  // Alterar repetições
  const updateSerieReps = (exerciseId: string, serieId: string, delta: number) => {
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          exercises: ficha.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              series: ex.series.map((s) => {
                if (s.id !== serieId) return s;
                const newReps = Math.max(1, s.reps + delta);
                return { ...s, reps: newReps };
              }),
            };
          }),
        };
      })
    );
  };

  // Digitar repetições diretamente
  const promptDirectReps = (exerciseId: string, serieId: string, currentReps: number) => {
    const input = window.prompt('Digite as repetições:', String(currentReps));
    if (input === null) return;
    const parsed = parseInt(input, 10);
    if (!isNaN(parsed) && parsed > 0) {
      setFichas((prev) =>
        prev.map((ficha) => {
          if (ficha.id !== activeFicha.id) return ficha;
          return {
            ...ficha,
            exercises: ficha.exercises.map((ex) => {
              if (ex.id !== exerciseId) return ex;
              return {
                ...ex,
                series: ex.series.map((s) => (s.id === serieId ? { ...s, reps: parsed } : s)),
              };
            }),
          };
        })
      );
    }
  };

  // Concluir uma série
  const completeSerie = (exercise: WorkoutExercise, serie: ExerciseSerie) => {
    if (!isWorkoutTimerRunning) {
      setIsWorkoutTimerRunning(true);
    }

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const estimated1RM = calculate1RM(serie.weight, serie.reps);

    // Vibração háptica
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate([150, 60, 150]);
      } catch {
        // ignora
      }
    }

    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          exercises: ficha.exercises.map((ex) => {
            if (ex.id !== exercise.id) return ex;
            return {
              ...ex,
              series: ex.series.map((s) => (s.id === serie.id ? { ...s, completed: !s.completed } : s)),
            };
          }),
        };
      })
    );

    if (!serie.completed) {
      const newEntry: SetLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: dateStr,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        serieNumber: serie.serieNumber,
        weight: serie.weight,
        reps: serie.reps,
        oneRM: estimated1RM,
        timestamp: Date.now(),
      };
      setHistory((prev) => [...prev, newEntry]);

      // Abre cronômetro de descanso
      setTimerDuration(90);
      setIsTimerOpen(true);
    }
  };

  // Trocar fase
  const changePhase = (newPhase: PeriodizationPhase) => {
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          phase: newPhase,
          exercises: ficha.exercises.map((ex) => {
            const lastLog = getLastPerformance(ex.exerciseId);
            return {
              ...ex,
              series: recalculateSeriesForPhase(ex.series, newPhase, lastLog),
            };
          }),
        };
      })
    );
  };

  // Resetar séries
  const resetWorkoutCompletion = () => {
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          exercises: ficha.exercises.map((ex) => ({
            ...ex,
            series: ex.series.map((s) => ({ ...s, completed: false })),
          })),
        };
      })
    );
    setWorkoutSeconds(0);
    setIsWorkoutTimerRunning(false);
  };

  // Adicionar exercício rápido
  const handleAddExercise = () => {
    const baseEx = defaultExercicios.find((e) => e.id === selectedExToAdd);
    if (!baseEx) return;

    const lastLog = getLastPerformance(baseEx.id);
    const configs = getPhaseSeriesConfig(activeFicha.phase || 'piramide');
    const oneRM = lastLog && lastLog.weight > 0 ? (lastLog.oneRM > 0 ? lastLog.oneRM : calculate1RM(lastLog.weight, lastLog.reps)) : 0;

    const initialSeries: ExerciseSerie[] = configs.map((cfg, idx) => ({
      id: `s-${idx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      serieNumber: cfg.serieNumber,
      weight: oneRM > 0 ? Math.round(oneRM * cfg.percentageOfMax) : 0,
      reps: cfg.defaultReps,
      completed: false,
    }));

    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      exerciseId: baseEx.id,
      name: baseEx.name,
      muscleGroup: baseEx.muscleGroup,
      series: initialSeries,
    };

    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return { ...ficha, exercises: [...ficha.exercises, newEx] };
      })
    );

    setIsAddExModalOpen(false);
  };

  // Duplicar exercício
  const handleDuplicateExercise = (exercise: WorkoutExercise) => {
    const duplicated: WorkoutExercise = {
      ...exercise,
      id: `ex-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: `${exercise.name} (Cópia)`,
      series: exercise.series.map((s) => ({
        ...s,
        id: `s-${Date.now()}-${Math.random()}`,
        completed: false,
      })),
    };

    setFichas((prev) =>
      prev.map((f) => {
        if (f.id !== activeFicha.id) return f;
        return { ...f, exercises: [...f.exercises, duplicated] };
      })
    );
  };

  // Remover exercício
  const removeExercise = (exerciseId: string) => {
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return { ...ficha, exercises: ficha.exercises.filter((e) => e.id !== exerciseId) };
      })
    );
  };

  // Salvar treino editado ou criado
  const handleSaveFicha = (savedFicha: WorkoutFicha) => {
    setFichas((prev) => {
      const idx = prev.findIndex((f) => f.id === savedFicha.id);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = savedFicha;
        return copy;
      }
      return [...prev, savedFicha];
    });
    setActiveFichaId(savedFicha.id);
  };

  // Excluir treino
  const handleDeleteFicha = (fichaId: string) => {
    setFichas((prev) => {
      const filtered = prev.filter((f) => f.id !== fichaId);
      if (filtered.length > 0) {
        setActiveFichaId(filtered[0].id);
      }
      return filtered;
    });
  };

  // Duplicar treino
  const handleDuplicateFicha = (f: WorkoutFicha) => {
    const copy: WorkoutFicha = {
      ...f,
      id: `ficha-${Date.now()}`,
      name: `${f.name} (Cópia)`,
      letter: `${f.letter}²`,
      exercises: f.exercises.map((ex) => ({
        ...ex,
        id: `ex-${Date.now()}-${Math.random()}`,
        series: ex.series.map((s) => ({ ...s, id: `s-${Date.now()}-${Math.random()}`, completed: false })),
      })),
    };
    setFichas((prev) => [...prev, copy]);
    setActiveFichaId(copy.id);
  };

  // Aplicar modelo pronto
  const handleApplyTemplate = (newFichas: WorkoutFicha[]) => {
    setFichas(newFichas);
    if (newFichas.length > 0) {
      setActiveFichaId(newFichas[0].id);
    }
  };

  const phaseConfig = getPhaseSeriesConfig(activeFicha.phase || 'piramide');

  const workoutMinutes = Math.floor(workoutSeconds / 60);
  const workoutSecs = workoutSeconds % 60;
  const formattedDuration = `${String(workoutMinutes).padStart(2, '0')}:${String(workoutSecs).padStart(2, '0')}`;

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* 1. SELETOR DE TREINO: CARROSSEL DE CHIPS HORIZONTAIS + BOTÃO NOVO */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar">
        {fichas.map((ficha, fIdx) => {
          const isActive = activeFicha.id === ficha.id;
          const isToday = ficha.weekDays && ficha.weekDays.includes(todayDayOfWeek);

          return (
            <button
              key={`${ficha.id}-${fIdx}`}
              onClick={() => setActiveFichaId(ficha.id)}
              className={`relative px-3.5 py-2 rounded-2xl text-xs font-black whitespace-nowrap transition-all border shrink-0 min-h-[42px] flex items-center gap-1.5 ${
                isActive
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-md shadow-[var(--brand-primary)]/20'
                  : 'bg-[var(--surface)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand-primary)]'
              }`}
            >
              <span>{ficha.letter || ficha.name}</span>
              {isToday && (
                <span
                  className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                    isActive ? 'bg-black/30 text-white' : 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30'
                  }`}
                >
                  Hoje
                </span>
              )}
            </button>
          );
        })}

        {/* Chip para Abrir Novo Treino / Modelos */}
        <button
          onClick={() => setIsEditorOpen(true)}
          title="Criar novo treino"
          className="p-2 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--brand-primary)] hover:border-[var(--brand-primary)] shrink-0 min-h-[42px] min-w-[42px] flex items-center justify-center font-bold"
        >
          <Plus className="w-4 h-4" />
        </button>

        <button
          onClick={() => setIsTemplatesOpen(true)}
          title="Modelos Prontos"
          className="px-2.5 py-2 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 min-h-[42px] flex items-center gap-1 text-xs font-bold"
        >
          <Layers className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
          <span>Modelos</span>
        </button>
      </div>

      {/* 2. HEADER MOTIVACIONAL DO TREINO (PROGRESSO, VOLUME, TEMPO & FINALIZAR) */}
      <div className="interactive-card p-4 shadow-sm relative overflow-hidden">
        {/* Faixa Superior com Nome e Botão de Editar */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                {activeFicha.letter || 'Treino'}
              </span>
              {activeFicha.weekDays && activeFicha.weekDays.includes(todayDayOfWeek) && (
                <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Treino de Hoje
                </span>
              )}
            </div>
            <h1 className="text-lg font-black text-[var(--text-primary)] mt-1">{activeFicha.name}</h1>
            {activeFicha.description && (
              <p className="text-xs text-[var(--text-muted)] mt-0.5">{activeFicha.description}</p>
            )}
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setIsEditorOpen(true)}
              title="Editar treino (nome, cor, dias)"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={resetWorkoutCompletion}
              title="Resetar séries para nova sessão"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] min-h-[40px] min-w-[40px] flex items-center justify-center"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dashboard de Métricas da Sessão */}
        <div className="grid grid-cols-3 gap-2 py-2.5 px-3 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] mb-3">
          <div>
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Séries</span>
            <span className="text-sm font-black tabular-nums font-mono text-[var(--text-primary)]">
              {completedSeriesCount} / {totalSeriesCount}
            </span>
          </div>

          <div>
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Volume</span>
            <span className="text-sm font-black tabular-nums font-mono text-[var(--brand-primary)]">
              {Math.round(totalVolumeKg)} <span className="text-[10px]">kg</span>
            </span>
          </div>

          <div>
            <span className="text-[9px] uppercase font-bold text-[var(--text-muted)] block">Tempo</span>
            <span className="text-sm font-black tabular-nums font-mono text-[var(--text-primary)]">
              {formattedDuration}
            </span>
          </div>
        </div>

        {/* Barra de Progresso do Treino */}
        <div className="w-full h-2 bg-[var(--surface-subtle)] rounded-full overflow-hidden mb-3.5 border border-[var(--border)]">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>

        {/* Seletor de Periodização & Botão Finalizar Treino */}
        <div className="flex items-center justify-between gap-2 pt-2 border-t border-[var(--border)]">
          <div className="flex items-center gap-1">
            <button
              onClick={() => changePhase('base')}
              className={`py-1 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                activeFicha.phase === 'base'
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)]'
              }`}
            >
              Base
            </button>
            <button
              onClick={() => changePhase('piramide')}
              className={`py-1 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                activeFicha.phase === 'piramide'
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)]'
              }`}
            >
              Pirâmide ▲
            </button>
            <button
              onClick={() => changePhase('pico')}
              className={`py-1 px-2 rounded-lg text-[11px] font-bold border transition-all ${
                activeFicha.phase === 'pico'
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)]'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)]'
              }`}
            >
              Pico
            </button>
          </div>

          <button
            onClick={() => setIsSummaryOpen(true)}
            disabled={completedSeriesCount === 0}
            className="btn-success-tactile text-xs py-1.5 px-3 min-h-[38px] flex items-center gap-1.5 font-bold disabled:opacity-40"
          >
            <Trophy className="w-3.5 h-3.5" />
            <span>Finalizar Treino</span>
          </button>
        </div>
      </div>

      {/* 3. LISTA DE EXERCÍCIOS COM SÉRIES COMPACTADAS / EXPANDIDAS */}
      <div className="space-y-4">
        {activeFicha.exercises.map((exercise, exIndex) => {
          const lastLog = getLastPerformance(exercise.exerciseId);
          const muscle = getMuscleInfo(exercise.muscleGroup);

          // Qual série exibir expandida: a primeira pendente ou a selecionada manualmente
          const activePendingSerie =
            exercise.series.find((s) => !s.completed) || exercise.series[exercise.series.length - 1];
          const expandedSerieId = expandedSeriesMap[exercise.id] || (activePendingSerie ? activePendingSerie.id : '');

          return (
            <div key={`${exercise.id}-${exIndex}`} className="interactive-card p-4 shadow-sm">
              {/* Topo do Card de Exercício */}
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${muscle.badgeBg} ${muscle.badgeText} ${muscle.badgeBorder}`}
                    >
                      {exercise.muscleGroup}
                    </span>
                    <span className="text-xs text-[var(--text-faint)] font-bold">#{exIndex + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mt-1 leading-snug">{exercise.name}</h3>

                  {/* Última vez */}
                  {lastLog ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold mt-1">
                      <History className="w-3.5 h-3.5" />
                      <span>
                        Última vez: <strong className="tabular-nums font-mono">{lastLog.weight}kg</strong> ×{' '}
                        <strong className="tabular-nums font-mono">{lastLog.reps} reps</strong> (1RM ~{lastLog.oneRM}kg)
                      </span>
                    </div>
                  ) : (
                    <span className="text-[11px] text-[var(--text-faint)] mt-0.5 block">Sem treino anterior registrado</span>
                  )}
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleDuplicateExercise(exercise)}
                    title="Duplicar este exercício"
                    className="p-1.5 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-subtle)]"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => removeExercise(exercise.id)}
                    title="Remover exercício da ficha"
                    className="p-1.5 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--surface-subtle)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* LISTA DAS SÉRIES */}
              <div className="space-y-2.5 mt-3">
                {exercise.series.map((serie, sIndex) => {
                  const targetConfig = phaseConfig[sIndex] || phaseConfig[phaseConfig.length - 1];
                  const current1RM = calculate1RM(serie.weight, serie.reps);
                  const isOutOfRange = isRepsOutOfRange(serie.reps, targetConfig.minReps, targetConfig.maxReps);
                  const prResult = checkPersonalRecord(exercise.exerciseId, serie.weight, serie.reps, history);

                  // Estado recolhido se a série já estiver concluída e NÃO for a explicitamente selecionada
                  const isCollapsed = serie.completed && expandedSerieId !== serie.id;

                  if (isCollapsed) {
                    return (
                      <div
                        key={`${serie.id}-${sIndex}`}
                        onClick={() =>
                          setExpandedSeriesMap((prev) => ({
                            ...prev,
                            [exercise.id]: serie.id,
                          }))
                        }
                        className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 cursor-pointer hover:bg-emerald-500/15 transition-all text-xs"
                      >
                        <div className="flex items-center gap-2 font-bold text-[var(--text-primary)]">
                          <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                          <span>Série {serie.serieNumber}</span>
                          <span className="text-[var(--text-muted)] font-normal font-mono tabular-nums">
                            {serie.weight}kg × {serie.reps} reps
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          {prResult.isPR && (
                            <span className="text-[10px] font-black px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-500 border border-amber-500/40">
                              PR 🏆
                            </span>
                          )}
                          <span className="text-[10px] text-[var(--text-muted)]">Toque para editar</span>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <div
                      key={`${serie.id}-${sIndex}`}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        serie.completed
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-[var(--surface-subtle)]/80 border-[var(--border)]'
                      }`}
                    >
                      {/* Linha de Cabeçalho da Série */}
                      <div className="flex items-center justify-between pb-2.5 mb-2.5 border-b border-[var(--border)]">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs font-black ${
                              serie.completed ? 'bg-emerald-600 text-white' : 'bg-[var(--brand-primary)] text-white'
                            }`}
                          >
                            {serie.serieNumber}
                          </span>
                          <span className="text-xs font-bold text-[var(--text-primary)] whitespace-nowrap">
                            Meta: {targetConfig.targetReps} reps
                          </span>

                          {isOutOfRange && (
                            <span
                              title="Repetições fora da meta da fase"
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-500 border border-amber-500/30"
                            >
                              <AlertCircle className="w-3 h-3" /> Fora da faixa
                            </span>
                          )}

                          {prResult.isPR && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-md bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-xs animate-pulse">
                              <Trophy className="w-3 h-3" /> {prResult.label || 'PR'}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-[var(--brand-primary)] font-bold whitespace-nowrap font-mono tabular-nums">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>1RM: ~{current1RM}kg</span>
                        </div>
                      </div>

                      {/* CONTROLES DE CARGA E REPS EM DUAS LINHAS EMPILHADAS */}
                      <div className="space-y-2.5">
                        {/* Linha 1: Stepper de Peso com Botões 48x48px + Toque no número para digitar */}
                        <div className="space-y-1.5">
                          <div className="flex items-center justify-between bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)]">
                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, -1)}
                              className="min-w-[48px] min-h-[48px] text-xl font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 flex items-center justify-center select-none"
                            >
                              −
                            </button>

                            <div
                              onClick={() => promptDirectWeight(exercise.id, serie.id, serie.weight)}
                              title="Toque para digitar o peso"
                              className="text-center px-3 py-1 cursor-pointer hover:bg-[var(--surface-subtle)] rounded-xl transition-colors"
                            >
                              <span className="text-xl font-black tabular-nums font-mono text-[var(--brand-primary)] block leading-tight">
                                {serie.weight}
                              </span>
                              <span className="text-[10px] text-[var(--text-faint)] font-bold -mt-0.5 block">
                                kg (toque p/ digitar)
                              </span>
                            </div>

                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, 1)}
                              className="min-w-[48px] min-h-[48px] text-xl font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 flex items-center justify-center select-none"
                            >
                              +
                            </button>
                          </div>

                          {/* Chips rápidos de ajuste de carga ±1 e ±2,5kg */}
                          <div className="grid grid-cols-4 gap-1">
                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, -2.5)}
                              className="py-1 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] rounded-lg active:scale-95 text-center"
                            >
                              -2.5kg
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, -1)}
                              className="py-1 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] rounded-lg active:scale-95 text-center"
                            >
                              -1kg
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, 1)}
                              className="py-1 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] rounded-lg active:scale-95 text-center"
                            >
                              +1kg
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, 2.5)}
                              className="py-1 text-[10px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] bg-[var(--surface)] border border-[var(--border)] rounded-lg active:scale-95 text-center"
                            >
                              +2.5kg
                            </button>
                          </div>
                        </div>

                        {/* Linha 2: Stepper de Repetições (Área 48x48px com espaçamento amplo) */}
                        <div className="flex items-center justify-between bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)]">
                          <button
                            type="button"
                            onClick={() => updateSerieReps(exercise.id, serie.id, -1)}
                            className="min-w-[48px] min-h-[48px] text-xl font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 flex items-center justify-center select-none"
                          >
                            −
                          </button>

                          <div
                            onClick={() => promptDirectReps(exercise.id, serie.id, serie.reps)}
                            title="Toque para digitar as reps"
                            className="text-center px-3 py-1 cursor-pointer hover:bg-[var(--surface-subtle)] rounded-xl transition-colors"
                          >
                            <span className="text-xl font-black tabular-nums font-mono text-[var(--text-primary)] block leading-tight">
                              {serie.reps}
                            </span>
                            <span className="text-[10px] text-[var(--text-faint)] font-bold -mt-0.5 block">
                              reps (toque p/ digitar)
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => updateSerieReps(exercise.id, serie.id, 1)}
                            className="min-w-[48px] min-h-[48px] text-xl font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 flex items-center justify-center select-none"
                          >
                            +
                          </button>
                        </div>

                        {/* Botão Largo Concluir Série */}
                        <button
                          type="button"
                          onClick={() => completeSerie(exercise, serie)}
                          className={
                            serie.completed
                              ? 'btn-success-tactile w-full min-h-[46px] text-xs font-bold'
                              : 'btn-tactile w-full min-h-[46px] text-xs font-bold'
                          }
                        >
                          {serie.completed ? (
                            <span className="flex items-center justify-center gap-1.5 font-bold">
                              <Check className="w-4 h-4 stroke-[3]" /> Série Concluída ✓
                            </span>
                          ) : (
                            <span className="flex items-center justify-center gap-1.5 font-bold">
                              <CheckCircle2 className="w-4 h-4" /> Concluir Série
                            </span>
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Estado Vazio se o Treino não tiver Exercícios */}
        {activeFicha.exercises.length === 0 && (
          <div className="interactive-card p-8 text-center">
            <div className="w-14 h-14 rounded-3xl bg-[var(--surface-subtle)] mx-auto flex items-center justify-center text-[var(--brand-primary)] mb-3">
              <Dumbbell className="w-7 h-7" />
            </div>
            <h3 className="text-base font-bold text-[var(--text-primary)]">Este treino está sem exercícios</h3>
            <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
              Adicione exercícios do catálogo ou crie um exercício personalizado agora mesmo.
            </p>
            <button
              onClick={() => setIsAddExModalOpen(true)}
              className="btn-tactile mt-4 py-2.5 px-4 text-xs font-bold"
            >
              + Adicionar Exercício
            </button>
          </div>
        )}
      </div>

      {/* 4. AÇÕES DA FICHA (BOTÕES TÁTEIS) */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={() => setIsAddExModalOpen(true)}
          className="btn-tactile w-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm min-h-[48px]"
        >
          <Plus className="w-4 h-4" />
          Adicionar Exercício ao Treino
        </button>

        <button
          onClick={() => {
            setTimerDuration(90);
            setIsTimerOpen(true);
          }}
          className="btn-secondary-tactile w-full py-3 flex items-center justify-center gap-2 text-xs font-bold min-h-[48px]"
        >
          <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
          Abrir Cronômetro de Descanso
        </button>
      </div>

      {/* MODAL ADICIONAR EXERCÍCIO */}
      {isAddExModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Adicionar Exercício</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">Selecione para incluir em {activeFicha.name}:</p>

            <select
              value={selectedExToAdd}
              onChange={(e) => setSelectedExToAdd(e.target.value)}
              className="w-full p-3 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] text-sm mb-4 outline-none font-medium"
            >
              {defaultExercicios.map((ex) => (
                <option key={ex.id} value={ex.id}>
                  [{ex.muscleGroup}] {ex.name}
                </option>
              ))}
            </select>

            <div className="flex gap-2">
              <button
                onClick={() => setIsAddExModalOpen(false)}
                className="btn-secondary-tactile flex-1 text-xs py-2.5 min-h-[44px]"
              >
                Cancelar
              </button>
              <button onClick={handleAddExercise} className="btn-tactile flex-1 text-xs py-2.5 min-h-[44px]">
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDITOR DE TREINOS (NOVO / EDITAR) */}
      <WorkoutEditorModal
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        fichaToEdit={activeFicha}
        onSave={handleSaveFicha}
        onDelete={handleDeleteFicha}
        onDuplicate={handleDuplicateFicha}
      />

      {/* MODAL DE MODELOS PRONTOS */}
      <WorkoutTemplatesModal
        isOpen={isTemplatesOpen}
        onClose={() => setIsTemplatesOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* MODAL DE RESUMO DO TREINO */}
      <WorkoutSummaryModal
        isOpen={isSummaryOpen}
        onClose={() => setIsSummaryOpen(false)}
        workoutName={activeFicha.name}
        completedSets={completedSeriesCount}
        totalSets={totalSeriesCount}
        totalVolumeKg={totalVolumeKg}
        durationMinutes={workoutMinutes}
        prCount={0}
        onResetCompleted={resetWorkoutCompletion}
      />

      {/* CRONÔMETRO DE DESCANSO */}
      <RestTimerModal initialSeconds={timerDuration} isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />
    </div>
  );
}
