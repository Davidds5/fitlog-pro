import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const outDir = 'C:/Users/david/.gemini/antigravity/brain/52f88beb-a7b9-4002-ad07-dfd3c7bd71b9/qa_v3';
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

const prefix = process.argv[2] || 'antes';

(async () => {
  const browser = await chromium.launch();

  const configs = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const cfg of configs) {
    for (const theme of ['dark', 'light']) {
      const context = await browser.newContext({
        viewport: { width: cfg.width, height: cfg.height },
      });
      const page = await context.newPage();
      await page.goto('http://localhost:3000');
      await page.waitForTimeout(1200);

      // Configurar tema
      await page.evaluate((t) => {
        window.localStorage.setItem('fitlog_theme', t);
        if (t === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }, theme);
      await page.reload();
      await page.waitForTimeout(1000);

      // 1. Treino tab
      await page.screenshot({
        path: path.join(outDir, `${prefix}-${cfg.name}-treino-${theme}.png`),
      });

      // 2. Dieta tab
      await page.click('button:has-text("Dieta")');
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(outDir, `${prefix}-${cfg.name}-dieta-${theme}.png`),
      });

      // 3. Guia tab
      await page.click('button:has-text("Guia")');
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(outDir, `${prefix}-${cfg.name}-guia-${theme}.png`),
      });

      // 4. Progresso / Evolução tab
      await page.click('button:has-text("Evolução")');
      await page.waitForTimeout(600);
      await page.screenshot({
        path: path.join(outDir, `${prefix}-${cfg.name}-evolucao-${theme}.png`),
      });

      await context.close();
    }
  }

  await browser.close();
  console.log(`QA_SCREENSHOTS_${prefix.toUpperCase()}_SAVED`);
})();

