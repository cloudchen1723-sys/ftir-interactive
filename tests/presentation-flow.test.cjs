const assert = require('node:assert/strict');
const fs = require('node:fs');
const { chromium } = require('C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');

const storySource = fs.readFileSync(require('node:path').join(__dirname, '..', 'story.js'), 'utf8');
assert.match(storySource, /为什么需要 Background \/ Sample/);
assert.match(storySource, /完成闭环/);

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    const page = await browser.newPage({ viewport: { width: 1280, height: 720 } });
    await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
    await page.getByRole('button', { name: /开始探索/ }).click();
    await page.locator('.p1-stage').focus();
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(750); }
    assert.equal(await page.locator('.po-stage h1').innerText(), 'Michelson 如何编码波数？');
    assert.equal(await page.locator('.po-stage').getAttribute('data-n4'), null);
    for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(1250); }
    assert.equal(await page.locator('.po-stage').getAttribute('data-n4'), 'true');
    assert.equal(await page.locator('.po-stage').getAttribute('data-beat'), '0');
    await page.keyboard.press('Space'); await page.waitForTimeout(1250);
    const component = await page.locator('[data-n4-comp="2"]').getAttribute('d');
    assert.ok(component && component.length > 100, '1700 cm⁻¹ component should be independently drawn');
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(1250); }
    assert.equal(await page.locator('.po-stage').getAttribute('data-beat'), '5');
    const handoff = await page.locator('.po-stage').getAttribute('data-record-id');
    assert.ok(handoff);
    await page.keyboard.press('Space'); await page.waitForTimeout(300);
    assert.ok(await page.locator('#fourierPlot').count());
    assert.match(await page.locator('#storyScene').innerText(), new RegExp(handoff));
    for (let i = 0; i < 4; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(900); }
    assert.ok(await page.locator('#referenceChart').count());
    for (let i = 0; i < 3; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(900); }
    assert.match(await page.locator('#referenceValues').innerText(), /A/);
    await page.keyboard.press('Space'); await page.waitForTimeout(900);
    assert.ok(await page.locator('#meaningChart').count());
    await page.keyboard.press('Space'); await page.waitForTimeout(500);
    assert.ok(await page.locator('#returnOpening').count());
    await page.locator('#returnOpening').click();
    assert.ok(await page.locator('.p1-stage').count());
    console.log('PASS presentation flow: N4 component handoff → N5 Fourier → N6 ratio → N7 meaning');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
