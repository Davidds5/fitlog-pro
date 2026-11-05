'use client';

import React, { useState } from 'react';
import defaultFichas from '@/data/fichas.json';
import defaultExercicios from '@/data/exercicios.json';
import { useLocalStorage, SetLogEntry } from '@/lib/storage';
import {
  PeriodizationPhase,
  calculate1RM,
  getPhaseSeriesConfig,
  recalculateSeriesForPhase,
  isRepsOutOfRange,
  ExerciseSerie,
} from '@/lib/pyramid';
import { RestTimerModal } from './RestTimerModal';
import {
  Flame,
  CheckCircle2,
  Clock,
  RotateCcw,
  Plus,
  Trash2,
  TrendingUp,
  History,
  Check,
  AlertCircle,
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
  exercises: WorkoutExercise[];
}

export function TreinoTab() {
  const [fichas, setFichas] = useLocalStorage<WorkoutFicha[]>('fitlog_fichas', defaultFichas as unknown as WorkoutFicha[]);
  const [history, setHistory] = useLocalStorage<SetLogEntry[]>('fitlog_history', []);
  const [activeFichaId, setActiveFichaId] = useState<string>('ficha-a');

  // Controle do cronômetro de descanso
  const [isTimerOpen, setIsTimerOpen] = useState<boolean>(false);
  const [timerDuration, setTimerDuration] = useState<number>(90);

  // Modal para adicionar exercício
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [selectedExToAdd, setSelectedExToAdd] = useState<string>(defaultExercicios[0]?.id || '');

  const activeFicha = fichas.find((f) => f.id === activeFichaId) || fichas[0];

  // Helper para buscar último registro do exercício no histórico
  const getLastPerformance = (exerciseId: string) => {
    const logs = history.filter((h) => h.exerciseId === exerciseId);
    if (!logs.length) return null;
    return logs[logs.length - 1];
  };

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

  // Concluir uma série (salva no histórico e abre o cronômetro)
  const completeSerie = (exercise: WorkoutExercise, serie: ExerciseSerie) => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const estimated1RM = calculate1RM(serie.weight, serie.reps);

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

  // Trocar de fase com recálculo inteligente (não sobrescreve concluídas)
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
  };

  const handleAddExercise = () => {
    const baseEx = defaultExercicios.find((e) => e.id === selectedExToAdd);
    if (!baseEx) return;

    const lastLog = getLastPerformance(baseEx.id);
    const configs = getPhaseSeriesConfig(activeFicha.phase || 'piramide');
    const oneRM = lastLog && lastLog.weight > 0 ? (lastLog.oneRM > 0 ? lastLog.oneRM : calculate1RM(lastLog.weight, lastLog.reps)) : 0;

    const initialSeries: ExerciseSerie[] = configs.map((cfg, idx) => ({
      id: `s-${idx + 1}-${Date.now()}`,
      serieNumber: cfg.serieNumber,
      weight: oneRM > 0 ? Math.round(oneRM * cfg.percentageOfMax) : 0,
      reps: cfg.defaultReps,
      completed: false,
    }));

    const newEx: WorkoutExercise = {
      id: `ex-${Date.now()}`,
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

    setIsAddModalOpen(false);
  };

  const removeExercise = (exerciseId: string) => {
    setFichas((prev) =>
      prev.map((ficha) => {
        if (ficha.id !== activeFicha.id) return ficha;
        return { ...ficha, exercises: ficha.exercises.filter((e) => e.id !== exerciseId) };
      })
    );
  };

  const phaseConfig = getPhaseSeriesConfig(activeFicha.phase || 'piramide');

  return (
    <div className="space-y-4 max-w-md mx-auto">
      {/* 1. SELETOR DE FICHA ABC EM 3 BOTÕES TÁTEIS EQUILIBRADOS */}
      <div className="grid grid-cols-3 gap-2">
        {fichas.map((ficha) => {
          const isActive = activeFicha.id === ficha.id;
          return (
            <button
              key={ficha.id}
              onClick={() => setActiveFichaId(ficha.id)}
              className={isActive ? 'btn-tactile text-sm py-2.5 w-full font-bold' : 'btn-secondary-tactile text-sm py-2.5 w-full font-bold'}
            >
              Treino {ficha.letter}
            </button>
          );
        })}
      </div>

      {/* 2. CARD DO TREINO ATUAL & PERIODIZAÇÃO DA SEMANA */}
      <div className="interactive-card p-4 shadow-sm">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
              Ficha Ativa
            </span>
            <h1 className="text-lg font-black text-[var(--text-primary)] mt-1">{activeFicha.name}</h1>
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{activeFicha.description}</p>
          </div>

          <button
            onClick={resetWorkoutCompletion}
            title="Resetar séries para novo treino"
            className="btn-secondary-tactile p-2 min-h-[44px] min-w-[44px] rounded-xl text-[var(--text-muted)] hover:text-[var(--brand-primary)]"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>

        {/* Segmented Control da Fase da Semana */}
        <div className="mt-3.5 pt-3 border-t border-[var(--border)]">
          <div className="flex items-center gap-1.5 mb-2 text-xs font-bold text-[var(--text-primary)]">
            <Flame className="w-3.5 h-3.5 text-[var(--brand-primary)]" />
            <span>FASE DA SEMANA:</span>
          </div>

          <div className="grid grid-cols-3 gap-1.5">
            <button
              onClick={() => changePhase('base')}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                activeFicha.phase === 'base'
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] border-[var(--brand-primary)] shadow-xs'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand-primary)]'
              }`}
            >
              Base (12-15)
            </button>
            <button
              onClick={() => changePhase('piramide')}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                activeFicha.phase === 'piramide'
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] border-[var(--brand-primary)] shadow-xs'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand-primary)]'
              }`}
            >
              Pirâmide ▲
            </button>
            <button
              onClick={() => changePhase('pico')}
              className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                activeFicha.phase === 'pico'
                  ? 'bg-[var(--brand-primary)] text-[var(--brand-contrast)] border-[var(--brand-primary)] shadow-xs'
                  : 'bg-[var(--surface-subtle)] text-[var(--text-muted)] border-[var(--border)] hover:border-[var(--brand-primary)]'
              }`}
            >
              Pico (6-8)
            </button>
          </div>
        </div>
      </div>

      {/* 3. LISTA DE EXERCÍCIOS */}
      <div className="space-y-4">
        {activeFicha.exercises.map((exercise, exIndex) => {
          const lastLog = getLastPerformance(exercise.exerciseId);

          return (
            <div
              key={exercise.id}
              className="interactive-card p-4 shadow-sm"
            >
              {/* Cabeçalho do Exercício */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-black tracking-wider px-2 py-0.5 rounded-md bg-[var(--brand-primary)]/15 text-[var(--brand-primary)] border border-[var(--brand-primary)]/30">
                      {exercise.muscleGroup}
                    </span>
                    <span className="text-xs text-[var(--text-faint)] font-bold">#{exIndex + 1}</span>
                  </div>
                  <h3 className="text-base font-bold text-[var(--text-primary)] mt-1 leading-snug">{exercise.name}</h3>

                  {/* Histórico Imediato */}
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

                <button
                  onClick={() => removeExercise(exercise.id)}
                  title="Remover exercício da ficha"
                  className="p-2 text-[var(--text-muted)] hover:text-red-500 rounded-xl hover:bg-[var(--surface-subtle)] transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              {/* LISTA DE SÉRIES - LAYOUT BULLET-PROOF RESPONSIVO */}
              <div className="space-y-3">
                {exercise.series.map((serie, sIndex) => {
                  const targetConfig = phaseConfig[sIndex] || phaseConfig[phaseConfig.length - 1];
                  const current1RM = calculate1RM(serie.weight, serie.reps);
                  const isOutOfRange = isRepsOutOfRange(serie.reps, targetConfig.minReps, targetConfig.maxReps);

                  return (
                    <div
                      key={serie.id}
                      className={`p-3.5 rounded-2xl border transition-all ${
                        serie.completed
                          ? 'bg-emerald-500/10 border-emerald-500/40'
                          : 'bg-[var(--surface-subtle)]/70 border-[var(--border)]'
                      }`}
                    >
                      {/* LINHA 1: IDENTIFICAÇÃO, META E 1RM */}
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
                          
                          {/* Alerta discreto se o usuário ajustou reps fora da meta */}
                          {isOutOfRange && (
                            <span
                              title="Repetições fora da meta da fase"
                              className="inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/30"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Fora da faixa
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1 text-[11px] text-[var(--brand-primary)] font-bold whitespace-nowrap">
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span className="tabular-nums font-mono">1RM: ~{current1RM}kg</span>
                        </div>
                      </div>

                      {/* LINHA 2: CONTROLES DE CARGA + REPETIÇÕES (ÁREA DE TOQUE 48x48px) + BOTÃO CONCLUIR */}
                      <div className="space-y-2.5">
                        <div className="grid grid-cols-2 gap-2">
                          {/* Stepper de Carga (kg) */}
                          <div className="flex items-center justify-between bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)] shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, -2.5)}
                              className="min-w-[40px] min-h-[44px] px-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 transition-all flex items-center justify-center select-none"
                              title="-2.5kg"
                            >
                              -2.5
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, -1)}
                              className="min-w-[36px] min-h-[44px] px-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 transition-all flex items-center justify-center select-none"
                              title="-1kg"
                            >
                              -1
                            </button>

                            <div className="text-center px-1">
                              <span className="text-base font-black tabular-nums font-mono text-[var(--brand-primary)] block leading-tight">
                                {serie.weight}
                              </span>
                              <span className="text-[9px] text-[var(--text-faint)] font-bold -mt-0.5 block">kg</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, 1)}
                              className="min-w-[36px] min-h-[44px] px-1 text-xs font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 transition-all flex items-center justify-center select-none"
                              title="+1kg"
                            >
                              +1
                            </button>
                            <button
                              type="button"
                              onClick={() => updateSerieWeight(exercise.id, serie.id, 2.5)}
                              className="min-w-[40px] min-h-[44px] px-1 text-[11px] font-bold text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 transition-all flex items-center justify-center select-none"
                              title="+2.5kg"
                            >
                              +2.5
                            </button>
                          </div>

                          {/* Stepper de Repetições (Botões amplos 48x48px com espaçamento) */}
                          <div className="flex items-center justify-between bg-[var(--surface)] p-1 rounded-2xl border border-[var(--border)] shadow-2xs">
                            <button
                              type="button"
                              onClick={() => updateSerieReps(exercise.id, serie.id, -1)}
                              className="min-w-[48px] min-h-[48px] text-lg font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 transition-all flex items-center justify-center select-none"
                            >
                              -
                            </button>

                            <div className="text-center px-1">
                              <span className="text-base font-black tabular-nums font-mono text-[var(--text-primary)] block leading-tight">
                                {serie.reps}
                              </span>
                              <span className="text-[9px] text-[var(--text-faint)] font-bold -mt-0.5 block">reps</span>
                            </div>

                            <button
                              type="button"
                              onClick={() => updateSerieReps(exercise.id, serie.id, 1)}
                              className="min-w-[48px] min-h-[48px] text-lg font-black text-[var(--text-muted)] hover:text-[var(--text-primary)] rounded-xl hover:bg-[var(--surface-subtle)] active:scale-95 transition-all flex items-center justify-center select-none"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        {/* Botão Concluir Série (Largo, Tátil e Confortável) */}
                        <button
                          type="button"
                          onClick={() => completeSerie(exercise, serie)}
                          className={
                            serie.completed
                              ? 'btn-success-tactile w-full min-h-[44px] text-xs font-bold'
                              : 'btn-tactile w-full min-h-[44px] text-xs font-bold'
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
      </div>

      {/* 4. AÇÕES DA FICHA (BOTÕES TÁTEIS) */}
      <div className="space-y-2.5 pt-2">
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="btn-tactile w-full py-3.5 flex items-center justify-center gap-2 font-bold text-sm min-h-[48px]"
        >
          <Plus className="w-4 h-4" />
          Adicionar Novo Exercício à Ficha
        </button>

        <button
          onClick={() => {
            setTimerDuration(90);
            setIsTimerOpen(true);
          }}
          className="btn-secondary-tactile w-full py-3 flex items-center justify-center gap-2 text-xs font-bold min-h-[48px]"
        >
          <Clock className="w-4 h-4 text-[var(--brand-primary)]" />
          Abrir Cronômetro de Descanso Manual
        </button>
      </div>

      {/* MODAL ADICIONAR EXERCÍCIO */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-xs p-4 animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl bg-[var(--surface)] border border-[var(--border)] p-5 shadow-2xl">
            <h3 className="text-base font-bold text-[var(--text-primary)] mb-1">Adicionar Exercício</h3>
            <p className="text-xs text-[var(--text-muted)] mb-3">Selecione para incluir no Treino {activeFicha.letter}:</p>

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
                onClick={() => setIsAddModalOpen(false)}
                className="btn-secondary-tactile flex-1 text-xs py-2.5 min-h-[44px]"
              >
                Cancelar
              </button>
              <button
                onClick={handleAddExercise}
                className="btn-tactile flex-1 text-xs py-2.5 min-h-[44px]"
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CRONÔMETRO DE DESCANSO */}
      <RestTimerModal
        initialSeconds={timerDuration}
        isOpen={isTimerOpen}
        onClose={() => setIsTimerOpen(false)}
      />
    </div>
  );
}
