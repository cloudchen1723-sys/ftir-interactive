const assert = require('node:assert/strict');
const { chromium } = require('C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
async function boot(page) { await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' }); await page.getByRole('button', { name: /开始探索/ }).click(); }
async function run() {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } }); await boot(page);
  assert.equal(await page.evaluate(() => window.gsap?.version), '3.13.0');
  const atom = page.locator('[data-atom="left"]'); await atom.evaluate(el => { el.dataset.identity = 'keep'; });
  await page.keyboard.press('Space'); await page.waitForTimeout(800); assert.equal(await page.locator('.p1-beat').innerText(), '比较'); assert.equal(await atom.getAttribute('data-identity'), 'keep');
  await page.keyboard.press('ArrowLeft'); assert.equal(await page.locator('.p1-beat').innerText(), '观察');
  await page.getByRole('button', { name: '对称伸缩', exact: true }).press('Space'); assert.equal(await page.locator('.p1-beat').innerText(), '观察'); await page.locator('.p1-stage').focus();
  await page.keyboard.press('Space'); await page.waitForTimeout(800); await page.keyboard.press('Space'); await page.waitForTimeout(600); await page.keyboard.press('Space');
  assert.equal(await page.locator('.p1-progress').innerText(), '2 / 09'); assert.equal(await page.locator('.p1-total strong').innerText(), '2.0');
  await page.keyboard.press('Space'); await page.waitForTimeout(800); assert.deepEqual(await page.locator('.p1-value').allTextContents(), ['0.2', '1.6', '0.2']);
  const bar = page.locator('[data-bar="1"]'); await bar.evaluate(el => { el.dataset.identity = 'keep'; }); await page.keyboard.press('ArrowLeft'); assert.equal(await page.locator('.p1-beat').innerText(), '观察'); assert.equal(await bar.getAttribute('data-identity'), 'keep');
  await browser.close();
  const reducedBrowser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const reducedPage = await reducedBrowser.newPage({ viewport: { width: 1280, height: 720 } }); await reducedPage.emulateMedia({ reducedMotion: 'reduce' }); await boot(reducedPage); await reducedPage.locator('.p1-stage').focus(); await reducedPage.keyboard.press('Space'); await reducedPage.waitForTimeout(300); assert.equal(await reducedPage.locator('.p1-beat').innerText(), '比较'); await reducedBrowser.close();
}
run().then(() => console.log('PASS browser presentation behavior: GSAP runtime, DOM identity, keyboard isolation, previous beat, and constant-total morph')).catch(error => { console.error(error); process.exitCode = 1; });
