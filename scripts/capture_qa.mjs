import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

const OUT_DIR = 'C:\\Users\\david\\.gemini\\antigravity\\brain\\52f88beb-a7b9-4002-ad07-dfd3c7bd71b9\\qa';
if (!fs.existsSync(OUT_DIR)) {
  fs.mkdirSync(OUT_DIR, { recursive: true });
}

async function run() {
  const browser = await chromium.launch({ headless: true });

  const viewports = [
    { name: 'mobile', width: 390, height: 844 },
    { name: 'desktop', width: 1440, height: 900 },
  ];

  for (const vp of viewports) {
    const page = await browser.newPage({
      viewport: { width: vp.width, height: vp.height },
      deviceScaleFactor: 2,
    });

    await page.goto('http://localhost:3000', { waitUntil: 'networkidle' });

    // 1. Dark Mode por padrão
    // Aba Treino
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-treino-dark.png`), fullPage: false });

    // Aba Dieta
    await page.click('button:has-text("Dieta")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-dieta-dark.png`), fullPage: false });

    // Aba Guia
    await page.click('button:has-text("Guia")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-guia-dark.png`), fullPage: false });

    // Clica no filtro Peito no Guia
    await page.click('button:text-is("Peito")');
    await page.waitForTimeout(200);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-guia-peito-dark.png`), fullPage: false });

    // 2. Alterna para Light Mode
    await page.click('button[title*="Alternar Modo"]');
    await page.waitForTimeout(300);

    // Guia Light
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-guia-peito-light.png`), fullPage: false });

    // Treino Light
    await page.click('button:has-text("Treino")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-treino-light.png`), fullPage: false });

    // Dieta Light
    await page.click('button:has-text("Dieta")');
    await page.waitForTimeout(300);
    await page.screenshot({ path: path.join(OUT_DIR, `${vp.name}-dieta-light.png`), fullPage: false });

    await page.close();
  }

  await browser.close();
  console.log('Screenshots capturados com sucesso em:', OUT_DIR);
}

run().catch((err) => {
  console.error('Erro ao capturar screenshots:', err);
  process.exit(1);
});
