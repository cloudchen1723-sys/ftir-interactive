const fs=require('node:fs');
const {chromium}=require('C:/Users/Chen/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base='review/continuity-prototype/screenshots';
fs.mkdirSync(base,{recursive:true});
(async()=>{
  const browser=await chromium.launch({headless:true,timeout:5000,executablePath:'C:/Program Files/Google/Chrome/Application/chrome.exe'});
  try{
    for(const [name,width,height] of [['1280x720',1280,720],['1920x1080',1920,1080]]){
      const page=await browser.newPage({viewport:{width,height}});await page.route('**/vendor/three.min.js',route=>route.abort());await page.route('**/vendor/OrbitControls.js',route=>route.abort());await page.emulateMedia({reducedMotion:'reduce'});
      await page.goto('http://127.0.0.1:4173/continuity-prototype.html',{waitUntil:'domcontentloaded',timeout:5000});await page.waitForSelector('.cp-stage');
      for(const [state,label] of [[0,'S0'],[4,'S4'],[9,'S9']]){for(let i=0;i<state;i++)await page.keyboard.press('Space');await page.screenshot({path:`${base}/${name}-${label}-fallback.png`});if(state<9){await page.keyboard.press('r');}}
      await page.close();
    }
    const page=await browser.newPage({viewport:{width:1280,height:720}});await page.route('**/vendor/three.min.js',route=>route.abort());await page.route('**/vendor/OrbitControls.js',route=>route.abort());await page.emulateMedia({reducedMotion:'reduce'});await page.goto('http://127.0.0.1:4173/continuity-prototype.html',{waitUntil:'domcontentloaded',timeout:5000});await page.waitForSelector('.cp-stage');for(let i=0;i<4;i++)await page.keyboard.press('Space');await page.screenshot({path:`${base}/reduced-S4-fallback.png`});await page.keyboard.press('r');for(let i=0;i<8;i++)await page.keyboard.press('Space');await page.screenshot({path:`${base}/reduced-S8-fallback.png`});await page.close();
    console.log('PASS continuity prototype fallback screenshots');
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
