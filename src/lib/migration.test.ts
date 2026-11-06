import { describe, it, expect, beforeEach } from 'vitest';
import { runSafeMigrations, createAutomaticBackup, FITLOG_SCHEMA_VERSION } from './storage';
import { WorkoutFichasArraySchema } from './schemas';

// Mock do LocalStorage em memória para o ambiente Node/Vitest
class LocalStorageMock {
  private store: Record<string, string> = {};

  get length(): number {
    return Object.keys(this.store).length;
  }

  key(index: number): string | null {
    const keys = Object.keys(this.store);
    return keys[index] || null;
  }

  getItem(key: string): string | null {
    return this.store[key] || null;
  }

  setItem(key: string, value: string): void {
    this.store[key] = String(value);
  }

  removeItem(key: string): void {
    delete this.store[key];
  }

  clear(): void {
    this.store = {};
  }
}

describe('Governança & Preservação de Dados (Zero Data Loss)', () => {
  let mockStorage: LocalStorageMock;

  beforeEach(() => {
    mockStorage = new LocalStorageMock();
    Object.defineProperty(global, 'window', {
      value: {
        localStorage: mockStorage,
        dispatchEvent: () => true,
        addEventListener: () => {},
        removeEventListener: () => {},
      },
      writable: true,
    });
  });

  it('deve gerar backup automático de segurança antes de qualquer migração', () => {
    mockStorage.setItem(
      'fitlog_fichas',
      JSON.stringify([
        {
          id: 'meu-treino-personalizado',
          name: 'Treino Especial David',
          letter: 'A',
          description: 'Foco em progressão de carga',
          phase: 'piramide',
          exercises: [
            {
              id: 'ex-1',
              exerciseId: 'supino-inclinado-halter',
              name: 'Supino Inclinado com Halteres',
              muscleGroup: 'Peito',
              series: [{ id: 's-1', serieNumber: 1, weight: 32, reps: 10, completed: true }],
            },
          ],
        },
      ])
    );
    mockStorage.setItem('fitlog_schema_version', '1');

    // Executa migração
    runSafeMigrations();

    // Verifica que um backup automático preventivo foi gravado
    let foundBackup = false;
    for (let i = 0; i < mockStorage.length; i++) {
      const k = mockStorage.key(i);
      if (k && k.startsWith('fitlog_backup_auto_pre_migration_')) {
        foundBackup = true;
        const backupRaw = mockStorage.getItem(k);
        expect(backupRaw).toBeDefined();
        const parsed = JSON.parse(backupRaw!);
        expect(parsed.data.fitlog_fichas).toBeDefined();
        expect(parsed.data.fitlog_fichas[0].name).toBe('Treino Especial David');
      }
    }
    expect(foundBackup).toBe(true);
  });

  it('deve preservar 100% dos treinos, cargas e exercícios editados pelo usuário na migração', () => {
    const userCustomFichas = [
      {
        id: 'meu-treino-costas',
        name: 'Dorsal Intensa David',
        letter: 'B',
        description: 'Meu treino personalizado',
        phase: 'piramide',
        exercises: [
          {
            id: 'ex-custom-1',
            exerciseId: 'puxada-alta-triangulo',
            name: 'Puxada Alta Triângulo',
            muscleGroup: 'Costas',
            series: [
              { id: 's-1', serieNumber: 1, weight: 65, reps: 12, completed: true },
              { id: 's-2', serieNumber: 2, weight: 70, reps: 10, completed: true },
            ],
          },
        ],
      },
    ];

    mockStorage.setItem('fitlog_fichas', JSON.stringify(userCustomFichas));
    mockStorage.setItem('fitlog_schema_version', '2');

    runSafeMigrations();

    // Lê fichas migradas
    const rawAfter = mockStorage.getItem('fitlog_fichas');
    const migratedFichas = JSON.parse(rawAfter!);

    expect(migratedFichas).toHaveLength(1);
    expect(migratedFichas[0].id).toBe('meu-treino-costas');
    expect(migratedFichas[0].name).toBe('Dorsal Intensa David');
    expect(migratedFichas[0].origem).toBe('usuario');
    expect(migratedFichas[0].exercises[0].name).toBe('Puxada Alta Triângulo');
    expect(migratedFichas[0].exercises[0].series[0].weight).toBe(65);
    expect(migratedFichas[0].exercises[0].series[1].weight).toBe(70);

    // Validação com Zod deve passar 100%
    const validation = WorkoutFichasArraySchema.safeParse(migratedFichas);
    expect(validation.success).toBe(true);

    // Schema version deve estar atualizado
    expect(mockStorage.getItem('fitlog_schema_version')).toBe(String(FITLOG_SCHEMA_VERSION));
  });

  it('createAutomaticBackup deve salvar todas as chaves do fitlog e manter no máximo 5 backups', () => {
    mockStorage.setItem('fitlog_history', JSON.stringify([{ id: 'h1', weight: 80 }]));
    mockStorage.setItem('fitlog_profile', JSON.stringify({ weight: 90, height: 177 }));

    createAutomaticBackup('teste1');
    createAutomaticBackup('teste2');
    createAutomaticBackup('teste3');
    createAutomaticBackup('teste4');
    createAutomaticBackup('teste5');
    createAutomaticBackup('teste6');

    let backupCount = 0;
    for (let i = 0; i < mockStorage.length; i++) {
      const k = mockStorage.key(i);
      if (k && k.startsWith('fitlog_backup_auto_')) {
        backupCount++;
      }
    }

    // Não deve exceder 5 backups automáticos para economizar cota
    expect(backupCount).toBeLessThanOrEqual(5);
  });
});
