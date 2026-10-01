const { chromium } = require('C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const path = require('node:path');

(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  try {
    for (const viewport of [{ width: 1280, height: 720 }, { width: 1024, height: 768 }]) {
      const tag = `${viewport.width}x${viewport.height}`;
      const page = await browser.newPage({ viewport });
      await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' });
      await page.getByRole('button', { name: /开始探索/ }).click();
      await page.locator('.p1-stage').focus();
      for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(750); }
      for (let i = 0; i < 6; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(1250); }
      await page.screenshot({ path: path.join(__dirname, `n4-beat0-${tag}.png`), fullPage: false });
      for (let i = 0; i < 3; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(1250); }
      await page.screenshot({ path: path.join(__dirname, `n4-beat3-${tag}.png`), fullPage: false });
      for (let i = 0; i < 2; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(1250); }
      await page.screenshot({ path: path.join(__dirname, `n4-beat5-${tag}.png`), fullPage: false });
      await page.keyboard.press('Space'); await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(__dirname, `n5-fourier-${tag}.png`), fullPage: false });
      for (let i = 0; i < 3; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(900); }
      await page.screenshot({ path: path.join(__dirname, `n6-reference-${tag}.png`), fullPage: false });
      for (let i = 0; i < 3; i++) { await page.keyboard.press('Space'); await page.waitForTimeout(900); }
      await page.screenshot({ path: path.join(__dirname, `n7-meaning-${tag}.png`), fullPage: false });
      await page.close();
    }
    console.log('captured full-flow screenshots');
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exitCode = 1; });
