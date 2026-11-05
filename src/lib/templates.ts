import { WorkoutExercise, WorkoutFicha } from '@/components/TreinoTab';
import defaultExercicios from '@/data/exercicios.json';

export interface WorkoutTemplate {
  id: string;
  name: string;
  description: string;
  tag: string;
  fichas: WorkoutFicha[];
}

function createExercise(exId: string): WorkoutExercise {
  const base = defaultExercicios.find((e) => e.id === exId);
  return {
    id: `ex-${exId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    exerciseId: exId,
    name: base ? base.name : exId,
    muscleGroup: base ? base.muscleGroup : 'Geral',
    series: [
      { id: `s-1-${Date.now()}-${Math.random()}`, serieNumber: 1, weight: 0, reps: 15, completed: false },
      { id: `s-2-${Date.now()}-${Math.random()}`, serieNumber: 2, weight: 0, reps: 14, completed: false },
      { id: `s-3-${Date.now()}-${Math.random()}`, serieNumber: 3, weight: 0, reps: 13, completed: false },
      { id: `s-4-${Date.now()}-${Math.random()}`, serieNumber: 4, weight: 0, reps: 12, completed: false },
    ],
  };
}

export const WORKOUT_TEMPLATES: WorkoutTemplate[] = [
  {
    id: 'ppl',
    name: 'Push / Pull / Legs (PPL)',
    description: 'Divisão moderna de 3 ou 6 dias focada em padrões motores fundamentais.',
    tag: 'Hipertrofia Popular',
    fichas: [
      {
        id: 'tpl-ppl-push',
        name: 'Push (Peito, Tríceps & Ombro)',
        letter: 'Push',
        description: 'Empurrar: foco em peitoral, deltoide anterior e tríceps.',
        phase: 'piramide',
        weekDays: [1, 4], // Seg, Qui
        color: '#f97316',
        exercises: [
          createExercise('ex-supino-inclinado-halteres'),
          createExercise('ex-supino-reto-barra'),
          createExercise('ex-desenvolvimento-halteres'),
          createExercise('ex-elevacao-lateral'),
          createExercise('ex-triceps-corda'),
        ],
      },
      {
        id: 'tpl-ppl-pull',
        name: 'Pull (Costas, Bíceps & Ombro Post.)',
        letter: 'Pull',
        description: 'Puxar: largura e densidade dorsal, antebraço e bíceps.',
        phase: 'piramide',
        weekDays: [2, 5], // Ter, Sex
        color: '#3b82f6',
        exercises: [
          createExercise('ex-puxada-alta-aberta'),
          createExercise('ex-remada-baixa-triangulo'),
          createExercise('ex-remada-curvada-barra'),
          createExercise('ex-crucifixo-invertido-cross'),
          createExercise('ex-rosca-direta-barra-w'),
        ],
      },
      {
        id: 'tpl-ppl-legs',
        name: 'Legs (Pernas Completas & Abdômen)',
        letter: 'Legs',
        description: 'Membros inferiores: quadríceps, isquiotibiais e panturrilha.',
        phase: 'piramide',
        weekDays: [3, 6], // Qua, Sáb
        color: '#a855f7',
        exercises: [
          createExercise('ex-agachamento-livre'),
          createExercise('ex-leg-press-45'),
          createExercise('ex-cadeira-extensora'),
          createExercise('ex-mesa-flexora'),
          createExercise('ex-panturrilha-em-pe'),
          createExercise('ex-abdominal-infra-paralela'),
        ],
      },
    ],
  },
  {
    id: 'abc',
    name: 'ABC Clássico',
    description: 'A divisão tradicional mais consagrada: Peito/Tríceps, Costas/Bíceps e Pernas.',
    tag: 'Clássico',
    fichas: [
      {
        id: 'tpl-abc-a',
        name: 'Treino A: Peito & Tríceps',
        letter: 'A',
        description: 'Peitoral completo e tríceps isolado.',
        phase: 'base',
        weekDays: [1], // Seg
        color: '#f97316',
        exercises: [
          createExercise('ex-supino-inclinado-halteres'),
          createExercise('ex-supino-reto-barra'),
          createExercise('ex-crucifixo-cabo-polia'),
          createExercise('ex-triceps-corda'),
          createExercise('ex-triceps-testa'),
        ],
      },
      {
        id: 'tpl-abc-b',
        name: 'Treino B: Costas & Bíceps',
        letter: 'B',
        description: 'Dorsais, espessura e flexores de cotovelo.',
        phase: 'base',
        weekDays: [3], // Qua
        color: '#3b82f6',
        exercises: [
          createExercise('ex-puxada-alta-aberta'),
          createExercise('ex-remada-baixa-triangulo'),
          createExercise('ex-rosca-direta-barra-w'),
          createExercise('ex-rosca-martelo'),
        ],
      },
      {
        id: 'tpl-abc-c',
        name: 'Treino C: Pernas & Ombros',
        letter: 'C',
        description: 'Inferiores completos e deltoides.',
        phase: 'base',
        weekDays: [5], // Sex
        color: '#22c55e',
        exercises: [
          createExercise('ex-agachamento-livre'),
          createExercise('ex-leg-press-45'),
          createExercise('ex-mesa-flexora'),
          createExercise('ex-desenvolvimento-halteres'),
          createExercise('ex-elevacao-lateral'),
          createExercise('ex-panturrilha-em-pe'),
        ],
      },
    ],
  },
  {
    id: 'upper-lower',
    name: 'Upper / Lower (Superior / Inferior)',
    description: 'Divisão de 4 dias de alta frequência e excelente recuperação muscular.',
    tag: 'Frequência 2x',
    fichas: [
      {
        id: 'tpl-ul-u',
        name: 'Upper (Membros Superiores)',
        letter: 'Upper',
        description: 'Peito, costas, ombros e braços num só treino.',
        phase: 'piramide',
        weekDays: [1, 4],
        color: '#f59e0b',
        exercises: [
          createExercise('ex-supino-reto-barra'),
          createExercise('ex-puxada-alta-aberta'),
          createExercise('ex-desenvolvimento-halteres'),
          createExercise('ex-rosca-direta-barra-w'),
          createExercise('ex-triceps-corda'),
        ],
      },
      {
        id: 'tpl-ul-l',
        name: 'Lower (Membros Inferiores & Core)',
        letter: 'Lower',
        description: 'Agachamento, posteriores, panturrilhas e abdômen.',
        phase: 'piramide',
        weekDays: [2, 5],
        color: '#8b5cf6',
        exercises: [
          createExercise('ex-agachamento-livre'),
          createExercise('ex-leg-press-45'),
          createExercise('ex-stiff-halteres'),
          createExercise('ex-panturrilha-em-pe'),
          createExercise('ex-prancha-isometrica'),
        ],
      },
    ],
  },
  {
    id: 'abcd',
    name: 'ABCD (4 Treinos Especializados)',
    description: 'Divisão para maior volume por grupo com recuperação estendida.',
    tag: '4 Dias',
    fichas: [
      {
        id: 'tpl-abcd-a',
        name: 'A: Peito & Deltoide Frontal',
        letter: 'A',
        description: 'Foco total no peitoral superior e médio.',
        phase: 'piramide',
        weekDays: [1],
        color: '#ea580c',
        exercises: [
          createExercise('ex-supino-inclinado-halteres'),
          createExercise('ex-supino-reto-barra'),
          createExercise('ex-crucifixo-cabo-polia'),
          createExercise('ex-desenvolvimento-halteres'),
        ],
      },
      {
        id: 'tpl-abcd-b',
        name: 'B: Costas & Deltoide Posterior',
        letter: 'B',
        description: 'Puxadas pesadas e trapézio/romboides.',
        phase: 'piramide',
        weekDays: [2],
        color: '#2563eb',
        exercises: [
          createExercise('ex-puxada-alta-aberta'),
          createExercise('ex-remada-curvada-barra'),
          createExercise('ex-remada-baixa-triangulo'),
          createExercise('ex-crucifixo-invertido-cross'),
        ],
      },
      {
        id: 'tpl-abcd-c',
        name: 'C: Pernas Completas',
        letter: 'C',
        description: 'Volume intenso para quadríceps e posteriores.',
        phase: 'piramide',
        weekDays: [4],
        color: '#9333ea',
        exercises: [
          createExercise('ex-agachamento-livre'),
          createExercise('ex-leg-press-45'),
          createExercise('ex-mesa-flexora'),
          createExercise('ex-panturrilha-em-pe'),
        ],
      },
      {
        id: 'tpl-abcd-d',
        name: 'D: Braços & Ombros Laterais',
        letter: 'D',
        description: 'Super-séries de bíceps, tríceps e elevação lateral.',
        phase: 'piramide',
        weekDays: [5],
        color: '#16a34a',
        exercises: [
          createExercise('ex-rosca-direta-barra-w'),
          createExercise('ex-triceps-corda'),
          createExercise('ex-rosca-martelo'),
          createExercise('ex-triceps-testa'),
          createExercise('ex-elevacao-lateral'),
        ],
      },
    ],
  },
  {
    id: 'abcde',
    name: 'ABCDE (1 Músculo por Dia)',
    description: 'Foco máximo de intensidade para atletas que treinam 5x por semana.',
    tag: '5 Dias Focado',
    fichas: [
      { id: 'tpl-abcde-a', name: 'A: Peito', letter: 'A', description: 'Peito completo', phase: 'piramide', weekDays: [1], color: '#f97316', exercises: [createExercise('ex-supino-inclinado-halteres'), createExercise('ex-supino-reto-barra'), createExercise('ex-crucifixo-cabo-polia')] },
      { id: 'tpl-abcde-b', name: 'B: Costas', letter: 'B', description: 'Costas completas', phase: 'piramide', weekDays: [2], color: '#3b82f6', exercises: [createExercise('ex-puxada-alta-aberta'), createExercise('ex-remada-baixa-triangulo'), createExercise('ex-remada-curvada-barra')] },
      { id: 'tpl-abcde-c', name: 'C: Pernas', letter: 'C', description: 'Inferiores pesados', phase: 'piramide', weekDays: [3], color: '#a855f7', exercises: [createExercise('ex-agachamento-livre'), createExercise('ex-leg-press-45'), createExercise('ex-mesa-flexora')] },
      { id: 'tpl-abcde-d', name: 'D: Ombros & Trapézio', letter: 'D', description: 'Deltoides 3D', phase: 'piramide', weekDays: [4], color: '#eab308', exercises: [createExercise('ex-desenvolvimento-halteres'), createExercise('ex-elevacao-lateral'), createExercise('ex-crucifixo-invertido-cross')] },
      { id: 'tpl-abcde-e', name: 'E: Braços (Bíceps & Tríceps)', letter: 'E', description: 'Braços completos', phase: 'piramide', weekDays: [5], color: '#10b981', exercises: [createExercise('ex-rosca-direta-barra-w'), createExercise('ex-triceps-corda'), createExercise('ex-rosca-martelo'), createExercise('ex-triceps-testa')] },
    ],
  },
  {
    id: 'full-body',
    name: 'Full Body (Corpo Inteiro 3x)',
    description: 'Estímulo sistêmico para quem treina 2 a 3 vezes por semana.',
    tag: 'Eficiente',
    fichas: [
      {
        id: 'tpl-fb-1',
        name: 'Full Body 1',
        letter: 'FB1',
        description: 'Corpo inteiro com ênfase em compostos.',
        phase: 'base',
        weekDays: [1, 5],
        color: '#06b6d4',
        exercises: [
          createExercise('ex-agachamento-livre'),
          createExercise('ex-supino-reto-barra'),
          createExercise('ex-puxada-alta-aberta'),
          createExercise('ex-desenvolvimento-halteres'),
          createExercise('ex-prancha-isometrica'),
        ],
      },
    ],
  },
  {
    id: 'blank',
    name: 'Em Branco (Personalizado do Zero)',
    description: 'Comece com uma folha limpa e crie seus próprios treinos livremente.',
    tag: 'Custom',
    fichas: [
      {
        id: 'tpl-custom-1',
        name: 'Meu Treino 1',
        letter: 'T1',
        description: 'Treino personalizado',
        phase: 'piramide',
        weekDays: [],
        color: '#f97316',
        exercises: [],
      },
    ],
  },
];

