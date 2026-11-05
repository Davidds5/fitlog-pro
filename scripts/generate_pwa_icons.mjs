import { chromium } from 'playwright';
import path from 'path';
import fs from 'fs';

async function generateIcons() {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();
  
  const svgPath = path.resolve('public', 'icon.svg');
  const svgContent = fs.readFileSync(svgPath, 'utf8');

  // HTML com o SVG renderizado em tamanho total
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { display: flex; align-items: center; justify-content: center; width: 100vw; height: 100vh; background: transparent; }
          svg { width: 100%; height: 100%; }
        </style>
      </head>
      <body>
        ${svgContent}
      </body>
    </html>
  `;

  await page.setContent(html);

  // Gera icon-192.png
  await page.setViewportSize({ width: 192, height: 192 });
  await page.screenshot({ path: path.resolve('public', 'icon-192.png'), omitBackground: true });

  // Gera icon-512.png
  await page.setViewportSize({ width: 512, height: 512 });
  await page.screenshot({ path: path.resolve('public', 'icon-512.png'), omitBackground: true });

  await browser.close();
  console.log('Ícones PWA icon-192.png e icon-512.png gerados com sucesso!');
}

generateIcons().catch((err) => {
  console.error('Erro gerando ícones:', err);
  process.exit(1);
});
