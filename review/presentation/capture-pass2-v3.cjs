const { chromium } = require('C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const out = path.join(__dirname, 'pass2-v3'); fs.mkdirSync(out, { recursive: true });
const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
(async () => { const browser = await chromium.launch({ headless: true, executablePath: chrome });
  try { const page = await browser.newPage({ viewport: { width: 1280, height: 720 }, deviceScaleFactor: 1 }); const errors = [];
    page.on('pageerror', e => errors.push(String(e))); page.on('console', m => { if (m.type() === 'error') errors.push(m.text()); });
    async function enter(w, h) { await page.setViewportSize({ width: w, height: h }); await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' }); await page.getByRole('button', { name: /开始探索/ }).click(); await page.locator('.p1-stage').focus(); for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(1000); } }
    await enter(1280, 720); assert.equal(await page.locator('.po-stage h1').innerText(), 'Michelson 如何编码波数？');
    async function shot(name) { await page.screenshot({ path: path.join(out, `${name}.png`), fullPage: false }); }
    await shot('stable0-1280x720');
    for (let beat = 1; beat <= 5; beat++) { await page.keyboard.press('Space'); if (beat === 2) { await page.waitForTimeout(250); await shot('outbound-only-1280x720'); } if (beat === 3) { await page.waitForTimeout(350); await shot('mid-shrink-1280x720'); } if (beat === 4) { await page.waitForTimeout(550); await shot('mid-scan-1280x720'); } await page.waitForTimeout(1350); await shot(`stable${beat}-1280x720`); }
    const evidence = await page.evaluate(() => { const q = s => document.querySelector(s); const p = q('[data-power]').textContent; const label = q('[data-response]').textContent; const d1 = q('[data-dot1000]'), d3 = q('[data-dot3000]'); const t1 = q('[data-trace1000]').getAttribute('d'), t3 = q('[data-trace3000]').getAttribute('d'); return { beat: q('.po-stage').dataset.beat, progress: q('.po-stage').dataset.progress, label, power: p, recordOpacity: getComputedStyle(q('.po-record')).opacity, dot1: { x: d1.getAttribute('cx'), y: d1.getAttribute('cy') }, dot3: { x: d3.getAttribute('cx'), y: d3.getAttribute('cy') }, trace1Length: t1.length, trace3Length: t3.length, mirrorLabel: q('[data-moving] text').getAttribute('x'), ticks: q('.po-tick').getAttribute('d') }; });
    assert.equal(evidence.beat, '5'); assert.equal(evidence.mirrorLabel, '330'); assert.match(evidence.label, /3000/); assert.ok(evidence.trace3Length > 100); assert.match(evidence.ticks, /1165/);
    await page.keyboard.press('ArrowLeft'); await page.waitForTimeout(50); assert.equal(await page.locator('.po-stage').getAttribute('data-beat'), '4'); await page.keyboard.press('r'); await page.waitForTimeout(50); assert.equal(await page.locator('.po-stage').getAttribute('data-beat'), '0');
    await enter(1024, 768); await shot('stable0-1024x768'); fs.writeFileSync(path.join(out, 'evidence.json'), JSON.stringify({ evidence, errors }, null, 2)); console.log(JSON.stringify({ evidence, errors }));
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
