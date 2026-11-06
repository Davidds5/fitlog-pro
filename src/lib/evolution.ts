import { calculate1RM } from './pyramid';
import { SetLogEntry, WorkoutSession } from './storage';

export type ComparisonMode = 'last_workout' | 'last_week' | 'last_month' | 'all_time_best';

export interface ComparisonReferenceResult {
  weight: number;
  reps: number;
  oneRM: number;
  date: string;
  label: string;
}

export interface SetProgressionResult {
  status: 'better' | 'equal' | 'worse' | 'neutral';
  label: string;
  diffKg: number;
  diffReps: number;
}

export interface ExerciseRecordsSummary {
  maxWeight: { value: number; reps: number; date: string } | null;
  best1RM: { value: number; weight: number; reps: number; date: string } | null;
  bestVolume: { value: number; weight: number; reps: number; date: string } | null;
  totalSets: number;
  prCount: number;
  last30DaysChangePercent: number | null;
  recentDate: string | null;
}

export interface TimeSeriesPoint {
  date: string;
  displayDate: string;
  timestamp: number;
  value: number; // max weight, 1RM or volume
  weight: number;
  reps: number;
  oneRM: number;
  volume: number;
}

/**
 * Normaliza IDs de exercícios para tolerar variações com ou sem o prefixo 'ex-'.
 */
export function isSameExercise(idA: string, idB: string): boolean {
  if (!idA || !idB) return false;
  if (idA === idB) return true;
  return idA.replace(/^ex-/, '') === idB.replace(/^ex-/, '');
}

/**
 * Busca o histórico de referência de acordo com o modo escolhido pelo usuário.
 */
export function getComparisonReference(
  exerciseId: string,
  serieNumber: number,
  mode: ComparisonMode,
  history: SetLogEntry[],
  currentDateStr = new Date().toISOString().split('T')[0]
): ComparisonReferenceResult | null {
  // Filtra apenas logs com peso > 0 e mesmo exercício
  const exLogs = history
    .filter((h) => isSameExercise(h.exerciseId, exerciseId) && h.weight > 0)
    .sort((a, b) => b.timestamp - a.timestamp);

  if (exLogs.length === 0) return null;

  if (mode === 'all_time_best') {
    // Melhor marca histórica global do exercício
    const bestLog = [...exLogs].sort((a, b) => {
      const rmA = a.oneRM || calculate1RM(a.weight, a.reps);
      const rmB = b.oneRM || calculate1RM(b.weight, b.reps);
      if (rmB !== rmA) return rmB - rmA;
      return b.weight - a.weight;
    })[0];

    if (!bestLog) return null;
    return {
      weight: bestLog.weight,
      reps: bestLog.reps,
      oneRM: bestLog.oneRM || calculate1RM(bestLog.weight, bestLog.reps),
      date: bestLog.date,
      label: 'Melhor marca',
    };
  }

  // Agrupa os logs por data para identificar treinos/sessões distintas
  const dateGroups: Record<string, SetLogEntry[]> = {};
  exLogs.forEach((l) => {
    if (!dateGroups[l.date]) dateGroups[l.date] = [];
    dateGroups[l.date].push(l);
  });

  const distinctDates = Object.keys(dateGroups).sort((a, b) => (b > a ? 1 : -1));

  // Remove a data atual se estiver sendo feito um treino agora e já tiver logs
  const pastDates = distinctDates.filter((d) => d < currentDateStr);
  const targetDatesPool = pastDates.length > 0 ? pastDates : distinctDates;

  if (targetDatesPool.length === 0) return null;

  let targetDate = targetDatesPool[0]; // default para last_workout
  let modeLabel = 'Último treino';

  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;

  if (mode === 'last_week') {
    modeLabel = 'Semana passada';
    // Procura a data mais próxima de 7 dias atrás (entre 5 e 12 dias)
    const weekTargetMs = nowMs - 7 * dayMs;
    let closestDiff = Infinity;
    for (const d of targetDatesPool) {
      const dMs = new Date(d).getTime();
      const diff = Math.abs(dMs - weekTargetMs);
      if (diff < closestDiff) {
        closestDiff = diff;
        targetDate = d;
      }
    }
  } else if (mode === 'last_month') {
    modeLabel = 'Mês passado';
    // Procura a data mais próxima de 30 dias atrás
    const monthTargetMs = nowMs - 30 * dayMs;
    let closestDiff = Infinity;
    for (const d of targetDatesPool) {
      const dMs = new Date(d).getTime();
      const diff = Math.abs(dMs - monthTargetMs);
      if (diff < closestDiff) {
        closestDiff = diff;
        targetDate = d;
      }
    }
  }

  const logsFromDate = dateGroups[targetDate] || [];
  // Tenta encontrar a série exata
  const exactSerie = logsFromDate.find(
    (l) => l.serieNumber === serieNumber || (l as unknown as { setNumber?: number }).setNumber === serieNumber
  );

  const chosenLog = exactSerie || logsFromDate[0];
  if (!chosenLog) return null;

  return {
    weight: chosenLog.weight,
    reps: chosenLog.reps,
    oneRM: chosenLog.oneRM || calculate1RM(chosenLog.weight, chosenLog.reps),
    date: chosenLog.date,
    label: modeLabel,
  };
}

/**
 * Calcula o indicador de progressão comparando o peso/reps atuais com a referência:
 * ↑ +2kg (verde) | = igual (cinza) | ↓ −1kg (âmbar)
 */
export function calculateSetProgression(
  currentWeight: number,
  currentReps: number,
  refWeight?: number,
  refReps?: number
): SetProgressionResult {
  if (refWeight === undefined || refWeight === null || refWeight <= 0) {
    return { status: 'neutral', label: '', diffKg: 0, diffReps: 0 };
  }

  const diffKg = Math.round((currentWeight - refWeight) * 10) / 10;
  const safeRefReps = refReps || 0;
  const diffReps = currentReps - safeRefReps;

  if (diffKg > 0) {
    return {
      status: 'better',
      label: `↑ +${diffKg}kg`,
      diffKg,
      diffReps,
    };
  }

  if (diffKg < 0) {
    return {
      status: 'worse',
      label: `↓ ${diffKg}kg`,
      diffKg,
      diffReps,
    };
  }

  // Se o peso for igual, avalia repetições
  if (diffReps > 0) {
    return {
      status: 'better',
      label: `↑ +${diffReps} reps`,
      diffKg: 0,
      diffReps,
    };
  }

  if (diffReps < 0) {
    return {
      status: 'worse',
      label: `↓ ${diffReps} reps`,
      diffKg: 0,
      diffReps,
    };
  }

  return {
    status: 'equal',
    label: '= igual',
    diffKg: 0,
    diffReps: 0,
  };
}

/**
 * Verifica se a série atual representa um novo Recorde Pessoal (PR) em Carga, 1RM ou Volume.
 */
export function checkIsSetPR(
  exerciseId: string,
  weight: number,
  reps: number,
  history: SetLogEntry[]
): { isPR: boolean; type?: 'weight' | '1rm' | 'volume'; label?: string } {
  if (weight <= 0 || reps <= 0) return { isPR: false };

  const prevLogs = history.filter((h) => isSameExercise(h.exerciseId, exerciseId) && h.weight > 0);
  if (prevLogs.length === 0) {
    return { isPR: false }; // Primeiro treino não conta como quebra de recorde
  }

  const current1RM = calculate1RM(weight, reps);
  const currentVolume = weight * reps;

  const maxPrevWeight = Math.max(...prevLogs.map((h) => h.weight));
  const maxPrev1RM = Math.max(...prevLogs.map((h) => h.oneRM || calculate1RM(h.weight, h.reps)));
  const maxPrevVolume = Math.max(...prevLogs.map((h) => (h.volume ? h.volume : h.weight * h.reps)));

  if (weight > maxPrevWeight) {
    const diff = Math.round((weight - maxPrevWeight) * 10) / 10;
    return { isPR: true, type: 'weight', label: `PR +${diff}kg` };
  }

  if (current1RM > maxPrev1RM + 0.5) {
    return { isPR: true, type: '1rm', label: `PR 1RM ~${current1RM}kg` };
  }

  if (currentVolume > maxPrevVolume + 10) {
    return { isPR: true, type: 'volume', label: `PR Vol +${Math.round(currentVolume - maxPrevVolume)}kg` };
  }

  return { isPR: false };
}

/**
 * Retorna todos os recordes consolidados de um exercício.
 */
export function getExerciseRecords(exerciseId: string, history: SetLogEntry[]): ExerciseRecordsSummary {
  const logs = history.filter((h) => isSameExercise(h.exerciseId, exerciseId) && h.weight > 0);
  if (logs.length === 0) {
    return {
      maxWeight: null,
      best1RM: null,
      bestVolume: null,
      totalSets: 0,
      prCount: 0,
      last30DaysChangePercent: null,
      recentDate: null,
    };
  }

  let maxWLog = logs[0];
  let best1RMLog = logs[0];
  let bestVolLog = logs[0];

  logs.forEach((log) => {
    const rm = log.oneRM || calculate1RM(log.weight, log.reps);
    const vol = log.volume || log.weight * log.reps;

    const currentBestRM = best1RMLog.oneRM || calculate1RM(best1RMLog.weight, best1RMLog.reps);
    const currentBestVol = bestVolLog.volume || bestVolLog.weight * bestVolLog.reps;

    if (log.weight > maxWLog.weight) maxWLog = log;
    if (rm > currentBestRM) best1RMLog = log;
    if (vol > currentBestVol) bestVolLog = log;
  });

  // Calcula variação nos últimos 30 dias
  const nowMs = Date.now();
  const thirtyDaysAgoMs = nowMs - 30 * 24 * 60 * 60 * 1000;
  const recentLogs = logs.filter((l) => l.timestamp >= thirtyDaysAgoMs);
  const olderLogs = logs.filter((l) => l.timestamp < thirtyDaysAgoMs);

  let last30DaysChangePercent: number | null = null;
  if (recentLogs.length > 0 && olderLogs.length > 0) {
    const recentMax = Math.max(...recentLogs.map((l) => l.weight));
    const olderMax = Math.max(...olderLogs.map((l) => l.weight));
    if (olderMax > 0) {
      last30DaysChangePercent = Math.round(((recentMax - olderMax) / olderMax) * 1000) / 10;
    }
  }

  return {
    maxWeight: { value: maxWLog.weight, reps: maxWLog.reps, date: maxWLog.date },
    best1RM: {
      value: best1RMLog.oneRM || calculate1RM(best1RMLog.weight, best1RMLog.reps),
      weight: best1RMLog.weight,
      reps: best1RMLog.reps,
      date: best1RMLog.date,
    },
    bestVolume: {
      value: bestVolLog.volume || bestVolLog.weight * bestVolLog.reps,
      weight: bestVolLog.weight,
      reps: bestVolLog.reps,
      date: bestVolLog.date,
    },
    totalSets: logs.length,
    prCount: 0,
    last30DaysChangePercent,
    recentDate: logs.sort((a, b) => b.timestamp - a.timestamp)[0]?.date || null,
  };
}

/**
 * Retorna série temporal agregada por dia para gráficos de linha.
 */
export function getExerciseTimeSeries(
  exerciseId: string,
  history: SetLogEntry[],
  metric: 'maxWeight' | 'oneRM' | 'volume',
  timeRange: '4w' | '3m' | '6m' | 'all' = 'all'
): TimeSeriesPoint[] {
  const exLogs = history.filter((h) => isSameExercise(h.exerciseId, exerciseId) && h.weight > 0);
  if (exLogs.length === 0) return [];

  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  let minMs = 0;

  if (timeRange === '4w') minMs = nowMs - 28 * dayMs;
  else if (timeRange === '3m') minMs = nowMs - 90 * dayMs;
  else if (timeRange === '6m') minMs = nowMs - 180 * dayMs;

  const filteredLogs = minMs > 0 ? exLogs.filter((l) => l.timestamp >= minMs) : exLogs;

  // Agrupa por data (dia) pegando o melhor ponto de cada treino
  const byDate: Record<string, SetLogEntry[]> = {};
  filteredLogs.forEach((l) => {
    if (!byDate[l.date]) byDate[l.date] = [];
    byDate[l.date].push(l);
  });

  const sortedDates = Object.keys(byDate).sort();

  return sortedDates.map((dateStr) => {
    const dayLogs = byDate[dateStr];
    // Encontra o melhor daquele dia de acordo com a métrica
    let bestVal = 0;
    let bestLog = dayLogs[0];

    dayLogs.forEach((l) => {
      const rm = l.oneRM || calculate1RM(l.weight, l.reps);
      const vol = l.volume || l.weight * l.reps;
      let curVal = l.weight;
      if (metric === 'oneRM') curVal = rm;
      if (metric === 'volume') curVal = vol;

      if (curVal >= bestVal) {
        bestVal = curVal;
        bestLog = l;
      }
    });

    const dParts = dateStr.split('-');
    const displayDate = dParts.length === 3 ? `${dParts[2]}/${dParts[1]}` : dateStr;

    return {
      date: dateStr,
      displayDate,
      timestamp: bestLog.timestamp,
      value: Math.round(bestVal * 10) / 10,
      weight: bestLog.weight,
      reps: bestLog.reps,
      oneRM: bestLog.oneRM || calculate1RM(bestLog.weight, bestLog.reps),
      volume: bestLog.volume || bestLog.weight * bestLog.reps,
    };
  });
}

/**
 * Compara duas sessões ou dois períodos de tempo.
 */
export function getPeriodComparison(
  sessions: WorkoutSession[],
  period: 'week' | 'month'
): {
  currentVolume: number;
  previousVolume: number;
  volumeChangePercent: number | null;
  currentSets: number;
  previousSets: number;
  currentPRs: number;
  previousPRs: number;
  currentWorkouts: number;
  previousWorkouts: number;
} {
  const nowMs = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const days = period === 'week' ? 7 : 30;

  const currentPeriodStart = nowMs - days * dayMs;
  const previousPeriodStart = nowMs - 2 * days * dayMs;

  const currentSessions = sessions.filter((s) => s.timestamp >= currentPeriodStart);
  const previousSessions = sessions.filter((s) => s.timestamp >= previousPeriodStart && s.timestamp < currentPeriodStart);

  const currentVolume = currentSessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);
  const previousVolume = previousSessions.reduce((acc, s) => acc + s.totalVolumeKg, 0);

  let volumeChangePercent: number | null = null;
  if (previousVolume > 0) {
    volumeChangePercent = Math.round(((currentVolume - previousVolume) / previousVolume) * 1000) / 10;
  }

  const currentSets = currentSessions.reduce((acc, s) => acc + s.completedSetsCount, 0);
  const previousSets = previousSessions.reduce((acc, s) => acc + s.completedSetsCount, 0);

  const currentPRs = currentSessions.reduce((acc, s) => acc + (s.prCount || 0), 0);
  const previousPRs = previousSessions.reduce((acc, s) => acc + (s.prCount || 0), 0);

  return {
    currentVolume: Math.round(currentVolume),
    previousVolume: Math.round(previousVolume),
    volumeChangePercent,
    currentSets,
    previousSets,
    currentPRs,
    previousPRs,
    currentWorkouts: currentSessions.length,
    previousWorkouts: previousSessions.length,
  };
}

/**
 * Calcula volume semanal por grupo muscular (últimos 7 dias).
 */
export function getWeeklyMuscleVolume(
  history: SetLogEntry[]
): { muscle: string; volumeKg: number; sets: number; percent: number }[] {
  const sevenDaysAgoMs = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentLogs = history.filter((h) => h.timestamp >= sevenDaysAgoMs && h.weight > 0);

  const muscleMap: Record<string, { volumeKg: number; sets: number }> = {};
  let totalVol = 0;

  recentLogs.forEach((l) => {
    const muscle = l.muscleGroup || 'Outros';
    const vol = (l.volume || l.weight * l.reps) || 0;
    if (!muscleMap[muscle]) {
      muscleMap[muscle] = { volumeKg: 0, sets: 0 };
    }
    muscleMap[muscle].volumeKg += vol;
    muscleMap[muscle].sets += 1;
    totalVol += vol;
  });

  return Object.entries(muscleMap)
    .map(([muscle, data]) => ({
      muscle,
      volumeKg: Math.round(data.volumeKg),
      sets: data.sets,
      percent: totalVol > 0 ? Math.round((data.volumeKg / totalVol) * 100) : 0,
    }))
    .sort((a, b) => b.volumeKg - a.volumeKg);
}
