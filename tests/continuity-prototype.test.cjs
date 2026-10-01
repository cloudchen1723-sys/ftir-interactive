const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
(async()=>{
  const browser=await chromium.launch({headless:true,timeout:5000,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    const page=await browser.newPage({viewport:{width:1280,height:720}});await page.route('https://cdn.jsdelivr.net/**',route=>route.abort());await page.emulateMedia({reducedMotion:'reduce'});
    await page.goto('http://127.0.0.1:4173/continuity-prototype.html',{waitUntil:'domcontentloaded',timeout:5000});await page.waitForTimeout(250);
    await page.waitForSelector('.cp-stage');
    assert.equal(await page.locator('.cp-stage').getAttribute('data-state'),'0');
    assert.ok(await page.locator('.model-hotspot').count()>=4 || await page.locator('.cp-instrument .cp-status').count()===1);
    for(let i=1;i<=9;i++){await page.keyboard.press('Space');assert.equal(await page.locator('.cp-stage').getAttribute('data-state'),String(i));if(i===1){assert.match(await page.locator('.cp-stage').innerText(),/一次测量发生了什么/);assert.ok(await page.locator('[data-flow].is-active').count()>=4);}if(i===3)assert.ok(await page.locator('.model-hotspot:not([hidden])').count()>=4);if(i===4)assert.equal(await page.locator('.cp-svg .anchor').count(),0);if(i===5)assert.equal(await page.locator('#cpMovingMirror').getAttribute('transform'),'translate(85 0)');if(i===6){assert.equal(await page.locator('#cpOut').evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await page.locator('#cpReturn').evaluate(e=>getComputedStyle(e).opacity),'0.16');assert.equal(await page.locator('#cpOutDelta').textContent(),'+Δx');}if(i===7){assert.equal(await page.locator('#cpOut').evaluate(e=>getComputedStyle(e).opacity),'0.16');assert.equal(await page.locator('#cpReturn').evaluate(e=>getComputedStyle(e).opacity),'1');assert.equal(await page.locator('#cpOutDelta').textContent(),'+Δx');assert.equal(await page.locator('#cpReturnDelta').textContent(),'+Δx');}if(i===8)assert.match(await page.locator('.cp-formula').innerText(),/2Δx/);}
    const graphText=await page.locator('.cp-svg').first().evaluate(el=>el.textContent);assert.match(graphText,/1000 cm⁻¹.*1 周期/s);assert.match(graphText,/3000 cm⁻¹.*3 周期/s);
    await page.keyboard.press('ArrowLeft');assert.equal(await page.locator('.cp-stage').getAttribute('data-state'),'8');
    await page.keyboard.press('r');assert.equal(await page.locator('.cp-stage').getAttribute('data-state'),'0');
    assert.equal(await page.locator('#cpBack').innerText(),'上一步');assert.equal(await page.locator('#cpReplay').innerText(),'重播');await page.keyboard.press('a');assert.equal(await page.locator('#cpAuto').innerText(),'自动播放（暂停）');await page.keyboard.press('a');assert.equal(await page.locator('#cpAuto').innerText(),'自动播放');
    console.log('PASS continuity prototype browser flow: S0-S9, anchors, formulas, shared axis, Back, Replay, Auto and reduced motion');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
