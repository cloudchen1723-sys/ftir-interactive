const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const out = path.join(__dirname, 'pass1-v3');
fs.mkdirSync(out, { recursive: true });
const edge = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: edge });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 });
  const errors = []; page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); }); page.on('pageerror', e => errors.push(String(e)));
  async function waitFor(predicate, timeout = 1800) { const end = Date.now() + timeout; while (Date.now() < end) { if (await page.evaluate(predicate)) return; await page.waitForTimeout(40); } throw new Error('state timeout'); }
  async function enter(width, height, prefix) {
    await page.setViewportSize({ width, height }); await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /开始探索/ }).click();
    await page.screenshot({ path: path.join(out, `${prefix}-scene01-entry-${width}x${height}.png`), fullPage: false });
    await page.locator('.p1-stage').focus(); await page.keyboard.press('Space'); await waitFor(() => document.querySelector('.p1-stage')?.dataset.beat === '1'); await page.screenshot({ path: path.join(out, `${prefix}-scene01-middle-${width}x${height}.png`), fullPage: false });
    await page.keyboard.press('Space'); await waitFor(() => document.querySelector('.p1-stage')?.dataset.beat === '2'); await page.screenshot({ path: path.join(out, `${prefix}-scene01-final-${width}x${height}.png`), fullPage: false });
    await page.keyboard.press('Space'); await waitFor(() => document.querySelector('.p1-progress')?.textContent === '2 / 09' && document.querySelector('.p1-stage')?.dataset.beat === '0'); await page.screenshot({ path: path.join(out, `${prefix}-scene02-entry-${width}x${height}.png`), fullPage: false });
    await page.keyboard.press('Space'); await waitFor(() => document.querySelector('.p1-stage')?.dataset.beat === '1'); await page.screenshot({ path: path.join(out, `${prefix}-scene02-middle-${width}x${height}.png`), fullPage: false });
    await page.keyboard.press('Space'); await waitFor(() => document.querySelector('.p1-stage')?.dataset.beat === '2'); await page.screenshot({ path: path.join(out, `${prefix}-scene02-final-${width}x${height}.png`), fullPage: false });
    return await page.evaluate(() => ({ gsap: window.gsap?.version, beat: document.querySelector('.p1-stage')?.dataset.beat, progress: document.querySelector('.p1-progress')?.textContent, total: document.querySelector('.p1-total strong')?.textContent, values: [...document.querySelectorAll('.p1-value')].map(e => e.textContent), stage: document.querySelector('.p1-stage')?.getBoundingClientRect().toJSON() }));
  }
  const evidence = { viewport1280: await enter(1280, 720, 'scene01-02'), viewport1024: await enter(1024, 768, 'scene01-02'), errors };
  fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify(evidence, null, 2));
  console.log(JSON.stringify(evidence)); await browser.close();
})();
