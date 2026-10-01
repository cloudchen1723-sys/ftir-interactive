const fs=require('node:fs');
const assert=require('node:assert/strict');
const {chromium}=require('C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='review/continuity-prototype/screenshots';fs.mkdirSync(base,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,timeout:5000,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    for(const [name,width,height,states] of [['1280x720',1280,720,[0,1,3,4,6,8,9]],['1920x1080',1920,1080,[0,4,9]]]){
      const page=await browser.newPage({viewport:{width,height}});await page.emulateMedia({reducedMotion:'no-preference'});await page.goto('http://127.0.0.1:4173/continuity-prototype.html',{waitUntil:'domcontentloaded',timeout:5000});await page.waitForSelector('.cp-stage');
      assert.equal(await page.locator('canvas').count(),1,'3D canvas missing');assert.equal(await page.locator('.cp-status').count(),1,'status node missing');assert.equal(await page.locator('.cp-status').isVisible(),false,'3D fallback is active');
      let current=0;for(const state of states){for(;current<state;current++){await page.keyboard.press('Space');const expected=current+1;if(expected===4){await page.waitForTimeout(180);assert.ok(await page.locator('.cp-svg .anchor').count()>=4,'mid-trace anchors missing');await page.screenshot({path:`${base}/${name}-S4-mid-trace-3d.png`});await page.waitForTimeout(1800);assert.ok(await page.locator('.cp-svg .anchor').count()>=4,'mid-handoff anchors missing');await page.screenshot({path:`${base}/${name}-S4-mid-handoff-3d.png`});}await page.waitForFunction(expected=>{const r=document.querySelector('#continuityPrototype').__continuity;return r&&r.getState().state===expected&&!r.getState().busy;},expected,{timeout:15000});}if(state===4)assert.equal(await page.locator('.cp-svg .anchor').count(),0,'stable S4 retains anchor fan');await page.screenshot({path:`${base}/${name}-S${state}-3d.png`});}
      await page.close();
    }
    const reduced=await browser.newPage({viewport:{width:1280,height:720}});await reduced.emulateMedia({reducedMotion:'reduce'});await reduced.goto('http://127.0.0.1:4173/continuity-prototype.html',{waitUntil:'domcontentloaded',timeout:5000});await reduced.waitForSelector('.cp-stage');assert.equal(await reduced.locator('canvas').count(),1,'reduced 3D canvas missing');for(const state of [4,8]){await reduced.evaluate(()=>document.querySelector('#continuityPrototype').__continuity.reset());for(let i=0;i<state;i++)await reduced.keyboard.press('Space');await reduced.screenshot({path:`${base}/reduced-S${state}-3d.png`});}await reduced.close();
    console.log('PASS continuity prototype 3D screenshots');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
