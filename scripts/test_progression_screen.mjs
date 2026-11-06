import { chromium } from 'playwright';
import path from 'path';

const outDir = 'C:/Users/david/.gemini/antigravity/brain/52f88beb-a7b9-4002-ad07-dfd3c7bd71b9/qa_v3';

(async () => {
  const browser = await chromium.launch();
  const context = await browser.newContext({
    viewport: { width: 390, height: 844 },
  });
  const page = await context.newPage();
  await page.goto('http://localhost:3000');
  await page.waitForTimeout(1000);

  // Injeta histórico prévio para testar comparação, badges e gráfico
  await page.evaluate(() => {
    const prevHistory = [
      {
        id: 'mock-1',
        date: '2026-10-25',
        exerciseId: 'ex-supino-inclinado-halteres',
        exerciseName: 'Supino Inclinado com Halteres',
        muscleGroup: 'Peito',
        workoutId: 'ficha-a',
        serieNumber: 1,
        weight: 22,
        reps: 12,
        oneRM: 30.8,
        volume: 264,
        timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'mock-2',
        date: '2026-10-25',
        exerciseId: 'ex-supino-inclinado-halteres',
        exerciseName: 'Supino Inclinado com Halteres',
        muscleGroup: 'Peito',
        workoutId: 'ficha-a',
        serieNumber: 2,
        weight: 24,
        reps: 10,
        oneRM: 32,
        volume: 240,
        timestamp: Date.now() - 12 * 24 * 60 * 60 * 1000,
      },
      {
        id: 'mock-3',
        date: '2026-11-01',
        exerciseId: 'ex-supino-inclinado-halteres',
        exerciseName: 'Supino Inclinado com Halteres',
        muscleGroup: 'Peito',
        workoutId: 'ficha-a',
        serieNumber: 1,
        weight: 24,
        reps: 12,
        oneRM: 33.6,
        volume: 288,
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      },
    ];

    const prevSessions = [
      {
        id: 'sess-mock-1',
        date: '2026-11-01',
        workoutId: 'ficha-a',
        workoutName: 'Treino A: Peito, Tríceps & Ombro Frontal',
        durationMinutes: 48,
        durationSeconds: 2880,
        totalVolumeKg: 4200,
        completedSetsCount: 16,
        totalSetsCount: 16,
        prCount: 1,
        improvedSetsCount: 3,
        timestamp: Date.now() - 5 * 24 * 60 * 60 * 1000,
      },
    ];

    // Atualiza fichas com carga atual para gerar indicador ↑ +2kg e PR
    const currentFichas = JSON.parse(window.localStorage.getItem('fitlog_fichas') || '[]');
    if (currentFichas.length > 0 && currentFichas[0].exercises.length > 0) {
      currentFichas[0].exercises[0].series[0].weight = 26; // maior que 24 (+2kg PR)
      currentFichas[0].exercises[0].series[0].reps = 12;
      currentFichas[0].exercises[0].series[0].completed = true;

      currentFichas[0].exercises[0].series[1].weight = 24; // igual a 24 (= igual)
      currentFichas[0].exercises[0].series[1].reps = 10;
      window.localStorage.setItem('fitlog_fichas', JSON.stringify(currentFichas));
    }

    window.localStorage.setItem('fitlog_history', JSON.stringify(prevHistory));
    window.localStorage.setItem('fitlog_sessions', JSON.stringify(prevSessions));
    window.localStorage.setItem('fitlog_body_weight', JSON.stringify([
      { id: 'w1', date: '2026-11-06', weight: 78.4, timestamp: Date.now() }
    ]));
  });

  await page.reload();
  await page.waitForTimeout(1000);

  // 1. Screenshot Treino com ↑ +2kg e PR 🏆
  await page.screenshot({
    path: path.join(outDir, 'demo-treino-com-progresso-badges.png'),
  });

  // 2. Vai para Evolução
  await page.click('button:has-text("Evolução")');
  await page.waitForTimeout(600);

  // Clica no exercício para expandir o gráfico
  await page.click('button:has-text("Supino Inclinado com Halteres")');
  await page.waitForTimeout(600);

  // Screenshot Evolução com Gráfico Aberto
  await page.screenshot({
    path: path.join(outDir, 'demo-evolucao-com-grafico.png'),
    fullPage: true,
  });

  await context.close();
  await browser.close();
  console.log('DEMO_SCREENSHOTS_SAVED');
})();
