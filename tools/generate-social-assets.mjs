/**
 * Gera os assets sociais e de ícone da landing page a partir das fontes SVG/HTML.
 *
 *   npm install --no-save playwright && npx playwright install chromium
 *   node tools/generate-social-assets.mjs
 *
 * Saídas:
 *   assets/og/og-image.png            1200x630  (Open Graph / Twitter Card)
 *   assets/logo/favicon-96x96.png     96x96     (fallback PNG do favicon)
 *   assets/logo/apple-touch-icon.png  180x180   (iOS home screen, fundo opaco)
 *   assets/logo/icon-192.png          192x192   (web app manifest)
 *   assets/logo/icon-512.png          512x512   (web app manifest)
 *
 * Rode este script sempre que a copy do card social ou o isotipo mudarem.
 */
import { chromium } from 'playwright';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { readFileSync } from 'node:fs';

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, '..');

const VOID = '#0C0C0F';

/** Página mínima que centraliza o isotipo em um quadrado com padding proporcional. */
function iconPage(svgMarkup, { size, background, padding }) {
  return `<!DOCTYPE html><meta charset="utf-8">
<style>
  *{margin:0;padding:0}
  html,body{width:${size}px;height:${size}px}
  body{background:${background};display:flex;align-items:center;justify-content:center}
  svg{width:${size - padding * 2}px;height:${size - padding * 2}px;display:block}
</style>
${svgMarkup}`;
}

const icons = [
  { file: 'assets/logo/favicon-96x96.png', size: 96, background: 'transparent', padding: 0 },
  { file: 'assets/logo/apple-touch-icon.png', size: 180, background: VOID, padding: 26 },
  { file: 'assets/logo/icon-192.png', size: 192, background: VOID, padding: 28 },
  { file: 'assets/logo/icon-512.png', size: 512, background: VOID, padding: 74 },
];

const browser = await chromium.launch();

try {
  // ---- Open Graph card ----------------------------------------------------
  const ogPage = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await ogPage.goto(`file://${join(here, 'og-card.html')}`, { waitUntil: 'networkidle' });
  await ogPage.evaluate(() => document.fonts.ready);
  await ogPage.screenshot({ path: join(root, 'assets/og/og-image.png') });
  await ogPage.close();
  console.log('✓ assets/og/og-image.png (1200x630)');

  // ---- Ícones -------------------------------------------------------------
  const isotipo = readFileSync(join(root, 'assets/logo/isotipo-gradiente.svg'), 'utf8');

  for (const icon of icons) {
    const page = await browser.newPage({
      viewport: { width: icon.size, height: icon.size },
      deviceScaleFactor: 1,
    });
    await page.setContent(iconPage(isotipo, icon), { waitUntil: 'load' });
    await page.screenshot({
      path: join(root, icon.file),
      omitBackground: icon.background === 'transparent',
    });
    await page.close();
    console.log(`✓ ${icon.file} (${icon.size}x${icon.size})`);
  }
} finally {
  await browser.close();
}
