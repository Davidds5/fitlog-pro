export interface MuscleGroupInfo {
  name: string;
  badgeBg: string;
  badgeText: string;
  badgeBorder: string;
  iconName: string;
}

export const MUSCLE_GROUPS_INFO: Record<string, MuscleGroupInfo> = {
  Peito: {
    name: 'Peito',
    badgeBg: 'bg-orange-500/15',
    badgeText: 'text-orange-500 dark:text-orange-400',
    badgeBorder: 'border-orange-500/30',
    iconName: 'Flame',
  },
  Costas: {
    name: 'Costas',
    badgeBg: 'bg-blue-500/15',
    badgeText: 'text-blue-500 dark:text-blue-400',
    badgeBorder: 'border-blue-500/30',
    iconName: 'Compass',
  },
  Pernas: {
    name: 'Pernas',
    badgeBg: 'bg-purple-500/15',
    badgeText: 'text-purple-500 dark:text-purple-400',
    badgeBorder: 'border-purple-500/30',
    iconName: 'Zap',
  },
  Ombros: {
    name: 'Ombros',
    badgeBg: 'bg-amber-500/15',
    badgeText: 'text-amber-500 dark:text-amber-400',
    badgeBorder: 'border-amber-500/30',
    iconName: 'Shield',
  },
  Bíceps: {
    name: 'Bíceps',
    badgeBg: 'bg-emerald-500/15',
    badgeText: 'text-emerald-500 dark:text-emerald-400',
    badgeBorder: 'border-emerald-500/30',
    iconName: 'Dumbbell',
  },
  Tríceps: {
    name: 'Tríceps',
    badgeBg: 'bg-rose-500/15',
    badgeText: 'text-rose-500 dark:text-rose-400',
    badgeBorder: 'border-rose-500/30',
    iconName: 'Target',
  },
  Abdômen: {
    name: 'Abdômen',
    badgeBg: 'bg-cyan-500/15',
    badgeText: 'text-cyan-500 dark:text-cyan-400',
    badgeBorder: 'border-cyan-500/30',
    iconName: 'Activity',
  },
};

export function getMuscleInfo(group: string): MuscleGroupInfo {
  return (
    MUSCLE_GROUPS_INFO[group] || {
      name: group,
      badgeBg: 'bg-zinc-500/15',
      badgeText: 'text-zinc-400',
      badgeBorder: 'border-zinc-500/30',
      iconName: 'Dumbbell',
    }
  );
}

