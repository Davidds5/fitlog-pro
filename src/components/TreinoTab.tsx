'use client';

import React, { useState, useEffect, useMemo } from 'react';
import defaultFichas from '@/data/fichas.json';
import defaultExercicios from '@/data/exercicios.json';
import { useLocalStorage, SetLogEntry, WorkoutSession } from '@/lib/storage';
import {
  PeriodizationPhase,
  calculate1RM,
  getPhaseSeriesConfig,
  recalculateSeriesForPhase,
  isRepsOutOfRange,
  ExerciseSerie,
} from '@/lib/pyramid';
import {
  ComparisonMode,
  getComparisonReference,
  calculateSetProgression,
  checkIsSetPR,
} from '@/lib/evolution';
import { getMuscleInfo } from '@/lib/muscles';
import { RestTimerModal } from './RestTimerModal';
import { WorkoutEditorModal } from './WorkoutEditorModal';
import { WorkoutTemplatesModal } from './WorkoutTemplatesModal';
import { WorkoutSummaryModal } from './WorkoutSummaryModal';
import { SerieStepperSheet } from './SerieStepperSheet';
import {
  RotateCcw,
  Plus,
  Trash2,
  Check,
  Trophy,
  Edit3,
  Dumbbell,
  Calendar,
  Layers,
  ChevronDown,
  ChevronUp,
  TrendingUp,
} from 'lucide-react';

export interface WorkoutExercise {
  id: string;
  exerciseId: string;
  name: string;
  muscleGroup: string;
  origem?: 'usuario' | 'padrao';
  editadoEm?: string;
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
  origem?: 'usuario' | 'padrao';
  editadoEm?: string;
  exercises: WorkoutExercise[];
}

export function TreinoTab() {
  const [fichas, setFichas] = useLocalStorage<WorkoutFicha[]>('fitlog_fichas', defaultFichas as unknown as WorkoutFicha[]);
  const [history, setHistory] = useLocalStorage<SetLogEntry[]>('fitlog_history', []);
  const [sessions, setSessions] = useLocalStorage<WorkoutSession[]>('fitlog_sessions', []);
  const [comparisonMode, setComparisonMode] = useLocalStorage<ComparisonMode>('fitlog_comparison_mode', 'last_workout');
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

  // Controle de colapso de exercícios: mapeia exerciseId -> boolean (true = recolhido)
  const [collapsedMap, setCollapsedMap] = useState<Record<string, boolean>>({});

  // Bottom Sheet de Stepper de Carga/Reps
  const [stepperState, setStepperState] = useState<{
    isOpen: boolean;
    exerciseId: string;
    exerciseName: string;
    serieId: string;
    serieNumber: number;
    initialWeight: number;
    initialReps: number;
    targetRepsText?: string;
    initialMode: 'weight' | 'reps';
  }>({
    isOpen: false,
    exerciseId: '',
    exerciseName: '',
    serieId: '',
    serieNumber: 1,
    initialWeight: 0,
    initialReps: 12,
    initialMode: 'weight',
  });

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
      if (!fId || seenFichaIds.has(fId)) {
        hasDuplicates = true;
        fId = `ficha-${Date.now()}-${fIdx}-${Math.random().toString(36).substring(2, 6)}`;
      }
      seenFichaIds.add(fId);

      const seenExIds = new Set<string>();
      const sanitizedExs = f.exercises.map((ex, exIdx) => {
        let exId = ex.id;
        if (!exId || seenExIds.has(exId)) {
          hasDuplicates = true;
          exId = `ex-${Date.now()}-${exIdx}-${Math.random().toString(36).substring(2, 6)}`;
        }
        seenExIds.add(exId);

        const seenSerieIds = new Set<string>();
        const sanitizedSeries = ex.series.map((s, sIdx) => {
          let sId = s.id;
          if (!sId || seenSerieIds.has(sId)) {
            hasDuplicates = true;
            sId = `s-${sIdx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
          }
          seenSerieIds.add(sId);
          return { ...s, id: sId, serieNumber: sIdx + 1 };
        });

        return { ...ex, id: exId, series: sanitizedSeries };
      });

      return { ...f, id: fId, exercises: sanitizedExs };
    });

    if (hasDuplicates) {
      setFichas(sanitized);
    }
  }, [fichas, setFichas]);

  // Busca a ficha ativa
  const activeFichaIndex = fichas.findIndex((f) => f.id === activeFichaId);
  const activeFicha = activeFichaIndex >= 0 ? fichas[activeFichaIndex] : fichas[0];

  useEffect(() => {
    if (!activeFicha && fichas.length > 0) {
      setActiveFichaId(fichas[0].id);
    }
  }, [activeFicha, fichas]);

  const todayDayOfWeek = new Date().getDay();

  // Histórico anterior para uma série de acordo com o modo de comparação
  const getPreviousSerieLog = (exerciseId: string, serieNumber: number) => {
    return getComparisonReference(exerciseId, serieNumber, comparisonMode, history);
  };

  // Pré-preenche a série com o valor da referência
  const prefillSerie = (exerciseId: string, serieId: string, refWeight: number, refReps: number) => {
    if (!activeFicha || refWeight <= 0) return;
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          exercises: ficha.exercises.map((ex) => {
            if (ex.id !== exerciseId) return ex;
            return {
              ...ex,
              series: ex.series.map((s) => (s.id === serieId ? { ...s, weight: refWeight, reps: refReps || s.reps } : s)),
            };
          }),
        };
      })
    );
  };

  // Salva alteração feita pelo Bottom Sheet Stepper
  const handleSaveStepper = (weight: number, reps: number) => {
    if (!activeFicha) return;
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          exercises: ficha.exercises.map((ex) => {
            if (ex.id !== stepperState.exerciseId) return ex;
            return {
              ...ex,
              series: ex.series.map((s) => (s.id === stepperState.serieId ? { ...s, weight, reps } : s)),
            };
          }),
        };
      })
    );
  };

  // Alterna conclusão da série com 1 toque
  const toggleCompleteSerie = (exercise: WorkoutExercise, serie: ExerciseSerie) => {
    if (!activeFicha) return;
    if (!isWorkoutTimerRunning) {
      setIsWorkoutTimerRunning(true);
    }

    const nextCompleted = !serie.completed;

    // Vibração háptica física
    if (typeof window !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(nextCompleted ? [40, 30, 40] : [20]);
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
              series: ex.series.map((s) => (s.id === serie.id ? { ...s, completed: nextCompleted } : s)),
            };
          }),
        };
      })
    );

    if (nextCompleted) {
      const estimated1RM = calculate1RM(serie.weight, serie.reps);
      const now = new Date();
      const dateStr = now.toISOString().split('T')[0];

      const newEntry: SetLogEntry = {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        date: dateStr,
        exerciseId: exercise.exerciseId,
        exerciseName: exercise.name,
        muscleGroup: exercise.muscleGroup,
        workoutId: activeFicha.id,
        serieNumber: serie.serieNumber,
        weight: serie.weight,
        reps: serie.reps,
        oneRM: estimated1RM,
        volume: serie.weight * serie.reps,
        timestamp: Date.now(),
      };
      setHistory((prev) => [...prev, newEntry]);

      // Inicia descanso automático com pill flutuante
      setTimerDuration(90);
      setIsTimerOpen(true);
    }
  };

  // Alterna colapso do exercício
  const toggleExerciseCollapse = (exerciseId: string) => {
    setCollapsedMap((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  };

  // Trocar fase da periodização
  const changePhase = (newPhase: PeriodizationPhase) => {
    if (!activeFicha) return;
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          phase: newPhase,
          exercises: ficha.exercises.map((ex) => {
            const lastLog = getPreviousSerieLog(ex.exerciseId, 1);
            return {
              ...ex,
              series: recalculateSeriesForPhase(ex.series, newPhase, lastLog),
            };
          }),
        };
      })
    );
  };

  // Resetar séries para novo treino
  const resetWorkoutCompletion = () => {
    if (!activeFicha) return;
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

  // Remover exercício
  const removeExercise = (exerciseId: string) => {
    if (!activeFicha) return;
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return {
          ...ficha,
          exercises: ficha.exercises.filter((ex) => ex.id !== exerciseId),
        };
      })
    );
  };

  // Adicionar exercício rápido
  const handleAddExercise = () => {
    if (!activeFicha) return;
    const baseEx = defaultExercicios.find((e) => e.id === selectedExToAdd);
    if (!baseEx) return;

    const lastLog = getPreviousSerieLog(baseEx.id, 1);
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
        return {
          ...ficha,
          exercises: [...ficha.exercises, newEx],
        };
      })
    );
    setIsAddExModalOpen(false);
  };

  // Salvar Ficha editada
  const handleSaveFicha = (savedFicha: WorkoutFicha) => {
    const exists = fichas.some((f) => f.id === savedFicha.id);
    if (exists) {
      setFichas((prev) => prev.map((f) => (f.id === savedFicha.id ? savedFicha : f)));
    } else {
      setFichas((prev) => [...prev, savedFicha]);
      setActiveFichaId(savedFicha.id);
    }
  };

  // Excluir Ficha
  const handleDeleteFicha = (fichaId: string) => {
    setFichas((prev) => {
      const remaining = prev.filter((f) => f.id !== fichaId);
      if (remaining.length > 0) {
        setActiveFichaId(remaining[0].id);
      }
      return remaining;
    });
  };

  // Duplicar Ficha
  const handleDuplicateFicha = (fichaToDup: WorkoutFicha) => {
    const newId = `ficha-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const duplicated: WorkoutFicha = {
      ...fichaToDup,
      id: newId,
      name: `${fichaToDup.name} (Cópia)`,
      letter: `${fichaToDup.letter}+`,
      exercises: fichaToDup.exercises.map((ex, exIdx) => ({
        ...ex,
        id: `ex-${Date.now()}-${exIdx}-${Math.random().toString(36).substring(2, 6)}`,
        series: ex.series.map((s, sIdx) => ({
          ...s,
          id: `s-${sIdx + 1}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          completed: false,
        })),
      })),
    };
    setFichas((prev) => [...prev, duplicated]);
    setActiveFichaId(newId);
  };

  // Aplicar Template
  const handleApplyTemplate = (newFichas: WorkoutFicha[]) => {
    setFichas(newFichas);
    if (newFichas.length > 0) {
      setActiveFichaId(newFichas[0].id);
    }
  };

  // Métricas do Treino Ativo
  const totalSeriesCount = activeFicha ? activeFicha.exercises.reduce((acc, ex) => acc + ex.series.length, 0) : 0;
  const completedSeriesCount = activeFicha
    ? activeFicha.exercises.reduce((acc, ex) => acc + ex.series.filter((s) => s.completed).length, 0)
    : 0;
  const totalVolumeKg = activeFicha
    ? activeFicha.exercises.reduce(
        (acc, ex) =>
          acc +
          ex.series
            .filter((s) => s.completed)
            .reduce((sAcc, s) => sAcc + s.weight * s.reps, 0),
        0
      )
    : 0;

  const workoutMinutes = Math.floor(workoutSeconds / 60);
  const workoutSecs = workoutSeconds % 60;
  const formattedDuration = `${String(workoutMinutes).padStart(2, '0')}:${String(workoutSecs).padStart(2, '0')}`;
  const progressPercent = totalSeriesCount > 0 ? Math.round((completedSeriesCount / totalSeriesCount) * 100) : 0;

  // PRs batidos no treino atual
  const currentPRCount = useMemo(() => {
    if (!activeFicha) return 0;
    let count = 0;
    activeFicha.exercises.forEach((ex) => {
      ex.series.forEach((s) => {
        if (s.completed && s.weight > 0) {
          const pr = checkIsSetPR(ex.exerciseId, s.weight, s.reps, history);
          if (pr.isPR) count++;
        }
      });
    });
    return count;
  }, [activeFicha, history]);

  // Séries que evoluíram comparadas à referência
  const currentImprovedCount = useMemo(() => {
    if (!activeFicha) return 0;
    let count = 0;
    activeFicha.exercises.forEach((ex) => {
      ex.series.forEach((s) => {
        if (s.completed && s.weight > 0) {
          const ref = getComparisonReference(ex.exerciseId, s.serieNumber, comparisonMode, history);
          if (ref && ref.weight > 0) {
            const prog = calculateSetProgression(s.weight, s.reps, ref.weight, ref.reps);
            if (prog.status === 'better') count++;
          }
        }
      });
    });
    return count;
  }, [activeFicha, history, comparisonMode]);

  // Última sessão concluída deste mesmo treino
  const previousSession = useMemo(() => {
    if (!activeFicha) return null;
    return sessions.find((s) => s.workoutId === activeFicha.id) || sessions[0] || null;
  }, [activeFicha, sessions]);

  // Variação percentual de volume total vs sessão anterior
  const volumeDiffPercent = useMemo(() => {
    if (!previousSession || previousSession.totalVolumeKg <= 0 || totalVolumeKg <= 0) return null;
    return Math.round(((totalVolumeKg - previousSession.totalVolumeKg) / previousSession.totalVolumeKg) * 1000) / 10;
  }, [previousSession, totalVolumeKg]);

  // Grava a sessão ao concluir o treino
  const handleFinishAndSaveSession = () => {
    if (!activeFicha) return;
    const newSession: WorkoutSession = {
      id: `sess-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      date: new Date().toISOString().split('T')[0],
      workoutId: activeFicha.id,
      workoutName: activeFicha.name,
      durationMinutes: workoutMinutes,
      durationSeconds: workoutSeconds,
      totalVolumeKg,
      completedSetsCount: completedSeriesCount,
      totalSetsCount: totalSeriesCount,
      prCount: currentPRCount,
      improvedSetsCount: currentImprovedCount,
      timestamp: Date.now(),
    };

    setSessions((prev) => [newSession, ...prev]);
    resetWorkoutCompletion();
  };

  const phaseConfig = getPhaseSeriesConfig(activeFicha?.phase || 'piramide');

  // Encontra o primeiro exercício que ainda tem séries pendentes
  const firstPendingExerciseId = activeFicha?.exercises.find((ex) => ex.series.some((s) => !s.completed))?.id;

  // Estado Vazio se o usuário não tiver treinos criados
  if (!activeFicha || fichas.length === 0) {
    return (
      <div className="space-y-4 max-w-md mx-auto">
        <div className="interactive-card p-8 text-center shadow-sm">
          <div className="w-16 h-16 rounded-3xl bg-[var(--surface-subtle)] text-[var(--brand-primary)] mx-auto flex items-center justify-center mb-3">
            <Dumbbell className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-black text-[var(--text-primary)]">Crie seu primeiro treino</h2>
          <p className="text-xs text-[var(--text-muted)] mt-1 max-w-xs mx-auto">
            Personalize suas fichas com foco em hipertrofia ou aplique um dos nossos modelos profissionais.
          </p>
          <div className="flex gap-2.5 justify-center mt-5">
            <button
              onClick={() => setIsEditorOpen(true)}
              className="btn-tactile text-xs py-2.5 px-4 font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" /> Novo Treino
            </button>
            <button
              onClick={() => setIsTemplatesOpen(true)}
              className="btn-secondary-tactile text-xs py-2.5 px-4 font-bold flex items-center gap-1.5"
            >
              <Layers className="w-4 h-4 text-[var(--brand-primary)]" /> Modelos Prontos
            </button>
          </div>
        </div>

        <WorkoutEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          fichaToEdit={null}
          onSave={handleSaveFicha}
          onDelete={handleDeleteFicha}
          onDuplicate={handleDuplicateFicha}
        />
        <WorkoutTemplatesModal
          isOpen={isTemplatesOpen}
          onClose={() => setIsTemplatesOpen(false)}
          onApplyTemplate={handleApplyTemplate}
        />
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-md mx-auto pb-28">
      {/* 1. SELETOR DE TREINOS DO USUÁRIO (CHIPS COMPACTOS) */}
      <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
        {fichas.map((ficha) => {
          const isActive = ficha.id === activeFicha.id;
          const isToday = ficha.weekDays && ficha.weekDays.includes(todayDayOfWeek);

          return (
            <button
              key={ficha.id}
              onClick={() => setActiveFichaId(ficha.id)}
              className={`px-3 py-2 rounded-2xl text-xs font-black transition-all shrink-0 min-h-[42px] border flex items-center gap-1.5 select-none ${
                isActive
                  ? 'bg-[var(--brand-primary)] text-white border-[var(--brand-primary)] shadow-sm scale-102'
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

        {/* Botão Novo Treino */}
        <button
          onClick={() => setIsEditorOpen(true)}
          title="Criar novo treino"
          className="p-2 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--brand-primary)] hover:border-[var(--brand-primary)] shrink-0 min-h-[42px] min-w-[42px] flex items-center justify-center font-bold"
        >
          <Plus className="w-4 h-4" />
        </button>

        {/* Botão Modelos Prontos */}
        <button
          onClick={() => setIsTemplatesOpen(true)}
          title="Modelos Prontos"
          className="px-2.5 py-2 rounded-2xl bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-muted)] hover:text-[var(--text-primary)] shrink-0 min-h-[42px] flex items-center gap-1 text-xs font-bold"
        >
          <Layers className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
          <span>Modelos</span>
        </button>
      </div>

      {/* 2. CABEÇALHO DO TREINO ENXUTO (V3) */}
      <div className="interactive-card p-4 shadow-sm space-y-3">
        {/* Linha 1: Nome do Treino + Ações */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0 pr-2">
            <div className="flex items-center gap-1.5 mb-1">
              <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                {activeFicha.letter || 'Treino'}
              </span>
              {activeFicha.weekDays && activeFicha.weekDays.includes(todayDayOfWeek) && (
                <span className="text-[10px] font-black uppercase px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 border border-emerald-500/30 flex items-center gap-1">
                  <Calendar className="w-3 h-3" /> Hoje
                </span>
              )}
            </div>
            <h1 className="text-base font-black text-[var(--text-primary)] leading-snug break-words">
              {activeFicha.name}
            </h1>
          </div>

          <div className="flex items-center gap-1 shrink-0 pt-0.5">
            <button
              onClick={() => setIsEditorOpen(true)}
              title="Editar treino"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 transition-all"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={resetWorkoutCompletion}
              title="Resetar séries para nova sessão"
              className="p-2 text-[var(--text-muted)] hover:text-[var(--brand-primary)] rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] min-h-[38px] min-w-[38px] flex items-center justify-center active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Linha 2: 3 Métricas em 1 Linha Única + Barra de Progresso */}
        <div className="space-y-1.5 pt-1 border-t border-[var(--border)]">
          <div className="flex items-center justify-between text-xs font-mono tabular-nums text-[var(--text-muted)] font-bold">
            <span>
              Séries: <strong className="text-[var(--text-primary)]">{completedSeriesCount}/{totalSeriesCount}</strong>
            </span>
            <span>
              Volume: <strong className="text-[var(--brand-primary)]">{Math.round(totalVolumeKg)} kg</strong>
            </span>
            <span>
              Tempo: <strong className="text-[var(--text-primary)]">{formattedDuration}</strong>
            </span>
          </div>

          <div className="w-full h-1.5 bg-[var(--surface-subtle)] rounded-full overflow-hidden border border-[var(--border)]">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Linha 3: Segmented Control de Periodização (Largura Total, Altura 40px) */}
        <div className="grid grid-cols-3 gap-1 bg-[var(--surface-subtle)] p-1 rounded-2xl border border-[var(--border)] h-11">
          {(['base', 'piramide', 'pico'] as PeriodizationPhase[]).map((phaseKey) => {
            const isSelected = activeFicha.phase === phaseKey;
            const labels: Record<PeriodizationPhase, string> = {
              base: 'Base (12-15)',
              piramide: 'Pirâmide ▲',
              pico: 'Pico (6-8)',
            };
            return (
              <button
                key={phaseKey}
                type="button"
                onClick={() => changePhase(phaseKey)}
                className={`h-full rounded-xl text-xs font-bold transition-all flex items-center justify-center ${
                  isSelected
                    ? 'bg-[var(--surface)] text-[var(--brand-primary)] shadow-xs border border-[var(--border)]'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {labels[phaseKey]}
              </button>
            );
          })}
        </div>

        {/* Linha 4: Seletor de Comparação (Último treino | Semana passada | Mês passado | Melhor marca) */}
        <div className="flex items-center justify-between gap-1 pt-1.5 border-t border-[var(--border)] text-xs">
          <span className="text-[11px] font-bold text-[var(--text-muted)] flex items-center gap-1 shrink-0">
            <TrendingUp className="w-3.5 h-3.5 text-[var(--brand-primary)]" /> Comparar com:
          </span>
          <div className="flex items-center gap-1 p-0.5 rounded-xl bg-[var(--surface-subtle)] border border-[var(--border)] overflow-x-auto no-scrollbar">
            {(
              [
                { key: 'last_workout', label: 'Último' },
                { key: 'last_week', label: 'Semana' },
                { key: 'last_month', label: 'Mês' },
                { key: 'all_time_best', label: 'Melhor' },
              ] as const
            ).map((opt) => (
              <button
                key={opt.key}
                type="button"
                onClick={() => setComparisonMode(opt.key)}
                className={`px-2 py-0.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${
                  comparisonMode === opt.key
                    ? 'bg-[var(--brand-primary)] text-white shadow-xs'
                    : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* 3. LISTA DE EXERCÍCIOS COM TABELA DE SÉRIES E COLAPSO (V3) */}
      <div className="space-y-3">
        {activeFicha.exercises.map((exercise, exIndex) => {
          const muscle = getMuscleInfo(exercise.muscleGroup);
          const isAllDone = exercise.series.length > 0 && exercise.series.every((s) => s.completed);

          // Estado colapsado: se foi explicitamente colapsado ou (se ainda não tocado) se já está 100% concluído e não for o primeiro pendente
          const isExplicit = collapsedMap[exercise.id];
          const isCollapsed = isExplicit !== undefined ? isExplicit : (isAllDone && exercise.id !== firstPendingExerciseId);

          const maxWeight = Math.max(0, ...exercise.series.map((s) => s.weight));
          const completedCount = exercise.series.filter((s) => s.completed).length;

          // CARD COLAPSADO (1 linha elegante com check verde e resumo)
          if (isCollapsed) {
            return (
              <div
                key={exercise.id}
                onClick={() => toggleExerciseCollapse(exercise.id)}
                className="interactive-card p-3 shadow-xs border border-emerald-500/30 bg-emerald-500/5 hover:bg-emerald-500/10 transition-all cursor-pointer flex items-center justify-between"
              >
                <div className="flex items-center gap-2.5 truncate">
                  <span className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </span>
                  <div className="truncate">
                    <h4 className="text-xs font-bold text-[var(--text-primary)] truncate">{exercise.name}</h4>
                    <span className="text-[10px] text-[var(--text-muted)] font-mono tabular-nums">
                      {completedCount}/{exercise.series.length} séries • {maxWeight > 0 ? `${maxWeight}kg máx` : 'concluído'}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[var(--text-faint)]">
                  <ChevronDown className="w-4 h-4" />
                </div>
              </div>
            );
          }

          // CARD EXPANDIDO COM TABELA DE SÉRIES (~56px por linha)
          return (
            <div key={exercise.id} className="interactive-card p-3.5 shadow-sm space-y-2.5">
              {/* Topo do Exercício */}
              <div className="flex items-center justify-between gap-2">
                <button
                  type="button"
                  onClick={() => toggleExerciseCollapse(exercise.id)}
                  className="flex items-center gap-2 text-left truncate flex-1"
                >
                  <span
                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border ${muscle.badgeBg} ${muscle.badgeText} ${muscle.badgeBorder}`}
                  >
                    {exercise.muscleGroup}
                  </span>
                  <span className="text-xs text-[var(--text-faint)] font-bold">#{exIndex + 1}</span>
                  <h3 className="text-sm font-bold text-[var(--text-primary)] truncate">
                    {exercise.name}
                  </h3>
                </button>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => removeExercise(exercise.id)}
                    title="Remover exercício"
                    className="p-1 text-[var(--text-muted)] hover:text-red-500 rounded-lg hover:bg-[var(--surface-subtle)]"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => toggleExerciseCollapse(exercise.id)}
                    className="p-1 text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-lg hover:bg-[var(--surface-subtle)]"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* TABELA DE SÉRIES (# | Anterior | kg | reps | ✓) */}
              <div className="space-y-1.5">
                {/* Cabeçalho da Tabela */}
                <div className="grid grid-cols-[28px_1fr_68px_60px_44px] items-center gap-2 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-[var(--text-faint)] border-b border-[var(--border)]">
                  <span className="text-center">#</span>
                  <span>Anterior</span>
                  <span className="text-center">Carga</span>
                  <span className="text-center">Reps</span>
                  <span className="text-center">✓</span>
                </div>

                {/* Linhas das Séries */}
                {exercise.series.map((serie, sIndex) => {
                  const targetConfig = phaseConfig[sIndex] || phaseConfig[phaseConfig.length - 1];
                  const prevLog = getPreviousSerieLog(exercise.exerciseId, serie.serieNumber);
                  const isOutOfRange = isRepsOutOfRange(serie.reps, targetConfig.minReps, targetConfig.maxReps);
                  
                  // Progressão comparada à referência
                  const progression =
                    prevLog && prevLog.weight > 0 && serie.weight > 0 && serie.reps > 0
                      ? calculateSetProgression(serie.weight, serie.reps, prevLog.weight, prevLog.reps)
                      : null;

                  // Recorde Pessoal (PR)
                  const prCheck =
                    serie.completed && serie.weight > 0
                      ? checkIsSetPR(exercise.exerciseId, serie.weight, serie.reps, history)
                      : { isPR: false };

                  return (
                    <div
                      key={serie.id}
                      className={`grid grid-cols-[24px_1fr_68px_54px_42px] items-center gap-1.5 px-2.5 py-2 rounded-xl transition-all border min-h-[54px] ${
                        serie.completed
                          ? 'bg-emerald-500/10 border-emerald-500/30'
                          : 'bg-[var(--surface-subtle)]/70 border-[var(--border)] hover:border-[var(--brand-primary)]/30'
                      }`}
                    >
                      {/* # Série */}
                      <span className="text-xs font-black text-center tabular-nums text-[var(--text-muted)]">
                        {serie.serieNumber}
                      </span>

                      {/* Anterior (Coluna Legível >= 13px com Toque para Preencher e Indicadores) */}
                      <div className="flex flex-col justify-center min-w-0 pr-1">
                        {prevLog && prevLog.weight > 0 ? (
                          <button
                            type="button"
                            onClick={() => {
                              if (serie.weight === 0) {
                                prefillSerie(exercise.id, serie.id, prevLog.weight, prevLog.reps);
                              }
                            }}
                            title={serie.weight === 0 ? 'Toque para copiar carga anterior' : `${prevLog.label}: ${prevLog.date}`}
                            className={`text-[13px] font-mono tabular-nums leading-tight text-left truncate ${
                              serie.weight === 0
                                ? 'text-[var(--brand-primary)] hover:underline font-bold cursor-pointer'
                                : 'text-[var(--text-primary)] font-medium'
                            }`}
                          >
                            {prevLog.weight}kg × {prevLog.reps}
                          </button>
                        ) : (
                          <span className="text-[13px] font-mono text-[var(--text-faint)] leading-tight">—</span>
                        )}

                        {/* Badges de Evolução (↑ +2kg / = igual / ↓ -1kg) e PR */}
                        <div className="flex items-center gap-1 mt-0.5 flex-wrap">
                          {progression && progression.status !== 'neutral' && (
                            <span
                              className={`text-[10px] font-black px-1 py-0.2 rounded leading-none ${
                                progression.status === 'better'
                                  ? 'bg-emerald-500/15 text-emerald-500 border border-emerald-500/20'
                                  : progression.status === 'worse'
                                  ? 'bg-amber-500/15 text-amber-500 border border-amber-500/20'
                                  : 'text-[var(--text-muted)] bg-[var(--surface)] border border-[var(--border)]'
                              }`}
                            >
                              {progression.label}
                            </span>
                          )}

                          {prCheck.isPR && (
                            <span
                              title={prCheck.label}
                              className="text-[9px] font-black px-1.5 py-0.2 rounded bg-gradient-to-r from-amber-500 to-yellow-400 text-black shadow-xs font-sans leading-none"
                            >
                              PR 🏆
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Botão Carga (kg) - Mostra valor ou placeholder da referência */}
                      <button
                        type="button"
                        onClick={() =>
                          setStepperState({
                            isOpen: true,
                            exerciseId: exercise.id,
                            exerciseName: exercise.name,
                            serieId: serie.id,
                            serieNumber: serie.serieNumber,
                            initialWeight: serie.weight > 0 ? serie.weight : (prevLog?.weight || 0),
                            initialReps: serie.reps > 0 ? serie.reps : (prevLog?.reps || targetConfig?.defaultReps || 12),
                            targetRepsText: targetConfig?.targetReps,
                            initialMode: 'weight',
                          })
                        }
                        className="h-9 px-1 rounded-xl bg-[var(--surface)] border border-[var(--border)] text-xs font-black font-mono tabular-nums text-[var(--text-primary)] hover:border-[var(--brand-primary)] active:scale-95 transition-all flex items-center justify-center shadow-xs"
                      >
                        {serie.weight > 0 ? (
                          `${serie.weight}kg`
                        ) : prevLog && prevLog.weight > 0 ? (
                          <span className="text-[var(--text-muted)] opacity-60 font-semibold">{prevLog.weight}kg</span>
                        ) : (
                          '0kg'
                        )}
                      </button>

                      {/* Botão Reps */}
                      <button
                        type="button"
                        onClick={() =>
                          setStepperState({
                            isOpen: true,
                            exerciseId: exercise.id,
                            exerciseName: exercise.name,
                            serieId: serie.id,
                            serieNumber: serie.serieNumber,
                            initialWeight: serie.weight > 0 ? serie.weight : (prevLog?.weight || 0),
                            initialReps: serie.reps,
                            targetRepsText: targetConfig?.targetReps,
                            initialMode: 'reps',
                          })
                        }
                        className={`h-9 px-1 rounded-xl border text-xs font-black font-mono tabular-nums active:scale-95 transition-all flex items-center justify-center shadow-xs ${
                          isOutOfRange
                            ? 'bg-amber-500/10 border-amber-500/40 text-amber-500'
                            : 'bg-[var(--surface)] border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--brand-primary)]'
                        }`}
                      >
                        {serie.reps}
                      </button>

                      {/* Botão Checkmark ✓ */}
                      <button
                        type="button"
                        onClick={() => toggleCompleteSerie(exercise, serie)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all active:scale-90 shadow-xs ${
                          serie.completed
                            ? 'bg-emerald-600 text-white'
                            : 'bg-[var(--surface)] border border-[var(--border)] text-[var(--text-faint)] hover:border-emerald-500/60 hover:text-emerald-500'
                        }`}
                        title={serie.completed ? 'Desmarcar série' : 'Concluir série e iniciar descanso'}
                      >
                        <Check className={`w-4 h-4 ${serie.completed ? 'stroke-[3]' : 'stroke-[2]'}`} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {/* Adicionar Exercício */}
        <button
          onClick={() => setIsAddExModalOpen(true)}
          className="btn-secondary-tactile w-full py-3 flex items-center justify-center gap-1.5 text-xs font-bold min-h-[44px]"
        >
          <Plus className="w-4 h-4 text-[var(--brand-primary)]" />
          <span>Adicionar Exercício ao Treino</span>
        </button>
      </div>

      {/* 4. BOTÃO FLUTUANTE FINALIZAR TREINO (Aparece só quando houver séries feitas) */}
      {completedSeriesCount > 0 && (
        <aside
          aria-label="Ações de finalização do treino"
          className="fixed bottom-24 left-1/2 -translate-x-1/2 z-30 max-w-md w-[calc(100%-2rem)] px-2 animate-in slide-in-from-bottom-3 duration-200"
        >
          <button
            type="button"
            onClick={() => setIsSummaryOpen(true)}
            className="btn-success-tactile w-full py-3.5 rounded-2xl shadow-xl flex items-center justify-center gap-2 font-black text-sm"
          >
            <Trophy className="w-4 h-4" />
            <span>Finalizar Treino ({completedSeriesCount}/{totalSeriesCount} séries)</span>
          </button>
        </aside>
      )}

      {/* BOTTOM SHEET STEPPER DE CARGA E REPS */}
      <SerieStepperSheet
        isOpen={stepperState.isOpen}
        onClose={() => setStepperState((prev) => ({ ...prev, isOpen: false }))}
        exerciseName={stepperState.exerciseName}
        serieNumber={stepperState.serieNumber}
        initialWeight={stepperState.initialWeight}
        initialReps={stepperState.initialReps}
        targetRepsText={stepperState.targetRepsText}
        initialMode={stepperState.initialMode}
        onSave={handleSaveStepper}
      />

      {/* MODAL ADICIONAR EXERCÍCIO RÁPIDO */}
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

      {/* MODAL EDITOR DE TREINOS */}
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
        prCount={currentPRCount}
        improvedSetsCount={currentImprovedCount}
        volumeDiffPercent={volumeDiffPercent}
        onResetCompleted={handleFinishAndSaveSession}
      />

      {/* CRONÔMETRO DE DESCANSO (PÍLULA FLUTUANTE) */}
      <RestTimerModal initialSeconds={timerDuration} isOpen={isTimerOpen} onClose={() => setIsTimerOpen(false)} />
    </div>
  );
}
