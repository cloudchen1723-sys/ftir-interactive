const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require('C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const ROOT = path.join(__dirname, '..');
const OUT = path.join(ROOT, 'review', 'presentation');
const URL = 'http://127.0.0.1:4173/index.html';
fs.mkdirSync(OUT, { recursive: true });

async function waitPassBeat(page, beat) {
  await page.waitForFunction(expected => {
    const stage = document.querySelector('.p1-stage');
    return stage && stage.dataset.beat === String(expected);
  }, beat, { timeout: 5000 });
}

async function enterBridge(page) {
  const cta = page.locator('.home-ref01-cta');
  await assert.doesNotReject(() => cta.click({ timeout: 5000 }));
  await page.waitForFunction(() => document.body.dataset.view === 'story', null, { timeout: 5000 });
  await page.waitForSelector('.p1-stage');
  for (let scene = 0; scene < 2; scene++) {
    for (const beat of [1, 2]) {
      await page.keyboard.press('Space');
      await waitPassBeat(page, beat);
    }
    await page.keyboard.press('Space');
    if (scene === 0) await page.waitForSelector('.p1-scene-2');
  }
  await page.waitForSelector('.pib-stage');
}

async function waitPrelude(page, value, timeout = 12000) {
  await page.waitForFunction(expected => {
    const stage = document.querySelector('.pib-stage');
    return stage && stage.dataset.prelude === String(expected) && stage.dataset.busy === 'false';
  }, value, { timeout });
}

async function waitPoBeat(page, beat) {
  await page.waitForFunction(expected => {
    const stage = document.querySelector('.po-stage');
    return stage && stage.dataset.beat === String(expected) && Number(stage.dataset.progress) >= .999;
  }, beat, { timeout: 5000 });
}

async function shot(page, size, name) {
  await page.screenshot({ path: path.join(OUT, `bridge-${size}-${name}.png`) });
}

async function runViewport(browser, viewport) {
  const size = `${viewport.width}x${viewport.height}`;
  const page = await browser.newPage({ viewport });
  const pageErrors = [];
  const consoleErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  page.on('console', message => {
    if (message.type() === 'error' && !message.text().includes('404')) consoleErrors.push(message.text());
  });

  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5000 });
  await enterBridge(page);
  assert.equal(await page.locator('body').getAttribute('data-view'), 'story');
  assert.equal(await page.locator('.pib-stage').count(), 1, 'step 2 did not mount the 3D bridge');
  assert.equal(await page.locator('.pib-model canvas').count(), 1, 'local Three.js canvas missing');
  await shot(page, size, '01-full-instrument');

  await page.keyboard.press('Space');
  await waitPrelude(page, 1);
  assert.equal(await page.locator('.pib-stage').getAttribute('data-progress'), '1.000');

  await page.keyboard.press('Space');
  await waitPrelude(page, 2);
  await shot(page, size, '02-michelson-highlight');
  assert.deepEqual(await page.locator('.pib-model .model-hotspot:not([hidden])').allTextContents(), [
    '分束器beam splitter', '固定镜fixed mirror', '动镜moving mirror'
  ]);

  await page.keyboard.press('Space');
  await waitPrelude(page, 3);
  await shot(page, size, '03-top-view');

  await page.keyboard.press('Space');
  await waitPrelude(page, 4);
  await page.waitForSelector('.po-stage');
  await waitPoBeat(page, 0);
  await shot(page, size, '04-handoff-po-beat0');
  assert.ok(await page.locator('.po-svg').count() >= 1, 'existing presentation renderer not mounted');

  for (const beat of [1, 2, 3, 4, 5]) {
    await page.keyboard.press('Space');
    await waitPoBeat(page, beat);
  }
  await shot(page, size, '05-1000-3000-compare');
  assert.match(await page.locator('.po-takeaway').innerText(), /高波数留下更密的周期/);

  await page.keyboard.press('ArrowLeft');
  await waitPoBeat(page, 4);
  assert.equal(await page.locator('.po-stage').getAttribute('data-beat'), '4', 'Back did not return one stable PO beat');
  await page.keyboard.press('r');
  await waitPoBeat(page, 0);
  assert.equal(await page.locator('.po-stage').getAttribute('data-beat'), '0', 'Replay did not restore PO beat 0');

  assert.deepEqual(pageErrors, [], `pageerror: ${pageErrors.join(' | ')}`);
  assert.deepEqual(consoleErrors, [], `console error: ${consoleErrors.join(' | ')}`);
  await page.close();
}

async function runControls(browser) {
  const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5000 });
  await enterBridge(page);
  await page.keyboard.press('a');
  await page.waitForFunction(() => document.querySelector('.pib-stage')?.dataset.prelude === '1', null, { timeout: 6000 });
  await page.keyboard.press('a');
  await page.waitForFunction(() => document.querySelector('.pib-stage')?.dataset.busy === 'false', null, { timeout: 10000 });
  await page.keyboard.press('ArrowLeft');
  await waitPrelude(page, 0);
  await page.keyboard.press('r');
  await waitPrelude(page, 0);
  await page.close();

  const reduced = await browser.newPage({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
  await reduced.goto(URL, { waitUntil: 'domcontentloaded', timeout: 5000 });
  await enterBridge(reduced);
  for (const prelude of [1, 2, 3, 4]) {
    await reduced.keyboard.press('Space');
    await waitPrelude(reduced, prelude, 3000);
  }
  await reduced.waitForSelector('.po-stage');
  assert.equal(await reduced.locator('.pib-stage').getAttribute('data-busy'), 'false');
  await reduced.close();
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    timeout: 5000,
    executablePath: 'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'
  });
  try {
    await runViewport(browser, { width: 1280, height: 720 });
    await runViewport(browser, { width: 1920, height: 1080 });
    await runControls(browser);
    console.log('PASS presentation instrument bridge: CTA navigation, 3D prelude, PO handoff, Back/Replay/Auto/reduced motion, two viewport screenshots');
  } finally {
    await browser.close();
  }
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});
