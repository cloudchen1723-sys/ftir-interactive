// Optional browser QA. Set FTIR_PLAYWRIGHT_MODULE to an existing Playwright
// module and FTIR_CHROME_EXECUTABLE to a local Chromium/Chrome executable.
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import assert from 'node:assert/strict';
import { pathToFileURL } from 'node:url';
import { createServer, root } from './serve.mjs';

if (!process.env.FTIR_PLAYWRIGHT_MODULE || !process.env.FTIR_CHROME_EXECUTABLE) throw Error('Set FTIR_PLAYWRIGHT_MODULE and FTIR_CHROME_EXECUTABLE; browser QA is optional and uses an existing local runtime.');
const {chromium}=await import(pathToFileURL(process.env.FTIR_PLAYWRIGHT_MODULE).href);
const catalog=JSON.parse(fs.readFileSync(path.join(root,'reference-data/lab-catalog.json'),'utf8'));
const out=path.join(root,'docs/verification'),images=path.join(root,'docs/images');
fs.mkdirSync(out,{recursive:true}); fs.mkdirSync(images,{recursive:true});
const temp=fs.mkdtempSync(path.join(os.tmpdir(),'ftir-isolated-'));
const isolated=path.join(temp,'FTIR课堂单文件版.html');
fs.copyFileSync(path.join(root,'dist/FTIR课堂单文件版.html'),isolated);
const server=createServer(); await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}/`;
const browser=await chromium.launch({executablePath:process.env.FTIR_CHROME_EXECUTABLE,headless:true,args:['--disable-gpu']});
const results=[], errors=[];
const check=(name,condition,detail)=>{results.push({name,pass:Boolean(condition),...(detail===undefined?{}:{detail})});assert(condition,name);};
async function ready(page,id) { await page.waitForFunction(id=>document.querySelector('[data-lab-sample]')?.value===id&&document.querySelector('[data-lab-loading]')?.hidden&&document.querySelector('[data-lab-chart]')?.dataset.view==='full',id); }
async function settled(page) { await page.waitForFunction(()=>window.__ftirPresentation?.getState()?.busy===false); }
async function photo(page,name) { await page.screenshot({path:path.join(images,name+'.png')}); }
async function audit(page,record,feature=null,zoom=false) {
 return page.evaluate(({record,feature,zoom})=>{
  const c=document.querySelector('[data-lab-chart]'),box=c.getBoundingClientRect();
  const pad=feature?Math.max(30,(feature.rangeCm1[1]-feature.rangeCm1[0])*.2):0;
  const low=zoom?Math.max(400,feature.rangeCm1[0]-pad):400,high=zoom?Math.min(4000,feature.rangeCm1[1]+pad):4000;
  const points=record.x.map((x,i)=>[x,record.y[i]]).filter(p=>p[0]>=low&&p[0]<=high);
  const min=Math.min(...points.map(p=>p[1])),max=Math.max(...points.map(p=>p[1]));
  const span=Math.max(0,max)-Math.min(0,min),margin=span>0?span*.08:Math.max(Math.abs(max)*.08,.001);
  const top=Math.max(0,max)+margin,bottom=min<0?min-margin:0;
  const actual=c.__auditBluePath||[];
  let error=Infinity;
  if(actual.length===points.length) error=Math.max(...points.map(([x,y],i)=>Math.max(Math.abs(actual[i][0]-(68+(high-x)/(high-low)*(box.width-90))),Math.abs(actual[i][1]-(24+(box.height-78)*(1-(y-bottom)/(top-bottom)))))));
  return {expectedPoints:points.length,actualPoints:actual.length,maxPixelError:error,yBottom:Number(c.dataset.yBottom),yMin:Number(c.dataset.yMin)};
 },{record,feature,zoom});
}
try {
 for(const entry of [
  {name:'source-1280x720',url,viewport:{width:1280,height:720},walk:true,screenshots:true},
  {name:'source-1024x768-reduced',url,viewport:{width:1024,height:768},reducedMotion:'reduce'},
  {name:'isolated-file-offline',url:pathToFileURL(isolated).href,viewport:{width:1280,height:720},offline:true}
 ]) {
  const context=await browser.newContext({viewport:entry.viewport,reducedMotion:entry.reducedMotion||'no-preference',offline:Boolean(entry.offline)});
  await context.addInitScript(()=>{
   const proto=CanvasRenderingContext2D.prototype,states=new WeakMap();
   for(const method of ['beginPath','moveTo','lineTo','stroke']) {const original=proto[method];proto[method]=function(...args){if(this.canvas.matches('[data-lab-chart]')){if(method==='beginPath')states.set(this,[]);if(method==='moveTo'||method==='lineTo')states.get(this)?.push(args.slice(0,2));if(method==='stroke'&&this.strokeStyle==='#075b73')this.canvas.__auditBluePath=structuredClone(states.get(this)||[]);}return original.apply(this,args);};}
  });
  const page=await context.newPage(),requests=[];
  page.on('request',r=>requests.push(r.url()));
  page.on('pageerror',e=>errors.push({case:entry.name,error:e.message}));
  page.on('console',m=>{if(m.type()==='error')errors.push({case:entry.name,error:m.text()});});
  await page.goto(entry.url,{waitUntil:'load'});
  await page.locator('[data-go="story"]').first().waitFor();
  if(entry.screenshots) await photo(page,'home');
  await page.locator('[data-go="story"]').first().click(); await settled(page);
  if(entry.walk) {
   let steps=0;
   while(true) { const s=await page.evaluate(()=>window.__ftirPresentation.getState());if(s.slide===8&&s.beat===2) break; assert(steps++<60,'Main flow terminates'); await page.keyboard.press('Space'); await settled(page); }
   check(`${entry.name}: complete keyboard classroom to final beat`,true,{advances:steps});
  } else {
   await page.evaluate(()=>window.__ftirPresentation.goToSlide(8)); await settled(page);
   while((await page.evaluate(()=>window.__ftirPresentation.getState().beat))<2){await page.keyboard.press('Space');await settled(page);}
  }
  const cta=page.locator('#thNextPrompt');
  check(`${entry.name}: final CTA has button semantics and keyboard focus`,await cta.evaluate(el=>(el.tagName==='BUTTON'||el.getAttribute('role')==='button')&&el.tabIndex===0));
  await cta.focus();await page.keyboard.press('Enter');
  await page.waitForFunction(()=>document.querySelector('.simulation-lab')?.dataset.open==='true');
  await page.waitForFunction(()=>document.querySelector('[data-lab-instrument] canvas'));
  check(`${entry.name}: 3D instrument available`,await page.locator('[data-lab-fallback]').isHidden());
  await page.locator('[data-lab-view="top"]').click();
  check(`${entry.name}: instrument top control`,await page.locator('[data-lab-view="top"]').getAttribute('aria-pressed')==='true');
  if(entry.screenshots) {await page.locator('[data-lab-view="overview"]').click();await page.waitForTimeout(700);await photo(page,'instrument');}
  await page.locator('[data-lab-mode="spectrum"]').click();await ready(page,catalog.samples[0].id);
  check(`${entry.name}: all ten catalog choices`,await page.locator('[data-lab-sample] option').count()===10);
  for(const sample of catalog.samples){
   await page.locator('[data-lab-sample]').selectOption(sample.id);await ready(page,sample.id);
   const record=JSON.parse(fs.readFileSync(path.join(root,'reference-data',sample.file),'utf8'));
   const full=await audit(page,record);check(`${entry.name}/${sample.id}: full raw curve exact`,full.maxPixelError<1e-8,full);
   check(`${entry.name}/${sample.id}: k axis and source`,(await page.locator('[data-lab-chart]').getAttribute('aria-label')).includes('虚部折射率 k')&&(await page.locator('[data-lab-source]').getAttribute('href'))===record.source.url);
   check(`${entry.name}/${sample.id}: feature count`,(await page.locator('[data-lab-feature] option').count())===sample.features.length+1);
   if(sample.id.includes('propyne')){
    check(`${entry.name}: propyne 8 K amorphous conditions visible`,(await page.locator('[data-lab-conditions]').textContent()).includes('8 K')&&(await page.locator('[data-lab-conditions]').textContent()).includes('非晶'));
    check(`${entry.name}: propyne negative source baseline retained`,full.yMin<0&&full.yBottom<full.yMin&&(await page.locator('[data-lab-caution]').textContent()).includes('不代表物理负吸收'));
    if(entry.screenshots)await photo(page,'propyne');
   }
   const feature=sample.features.find(f=>f.id===sample.readingOrder[0]);
   await page.locator('[data-lab-next-feature]').click();
   check(`${entry.name}/${sample.id}: first guide reads actual maximum`,(await page.locator('[data-lab-feature]').inputValue())===feature.id&&Number(await page.locator('[data-lab-chart]').getAttribute('data-observed-cm1'))===feature.observedCm1);
   await page.locator('[data-lab-zoom]').click();
   const zoom=await audit(page,record,feature,true);check(`${entry.name}/${sample.id}: zoom preserves original points`,zoom.maxPixelError<1e-8,zoom);
   if(entry.screenshots&&sample.id.includes('acetonitrile'))await photo(page,'nitrile');
   await page.locator('[data-lab-zoom]').click();
   await page.locator('[data-lab-next-feature]').click();
   check(`${entry.name}/${sample.id}: next follows reading order`,await page.locator('[data-lab-feature]').inputValue()===sample.readingOrder[1]);
  }
  const beat=await page.evaluate(()=>window.__ftirPresentation.getState().beat);
  await page.locator('.simulation-lab__provenance summary').focus();await page.keyboard.press('Space');
  check(`${entry.name}: modal Space isolation`,await page.evaluate(()=>window.__ftirPresentation.getState().beat)===beat);
  await page.keyboard.press('Space');await page.keyboard.press('Tab');
  check(`${entry.name}: modal Tab trap`,await page.locator('[data-lab-close]').evaluate(el=>el===document.activeElement));
  await page.keyboard.press('Escape');
  check(`${entry.name}: Escape restores CTA focus`,await cta.evaluate(el=>el===document.activeElement)&&await page.locator('.simulation-lab').isHidden());
  await page.keyboard.press('Enter');await page.waitForFunction(()=>document.querySelector('.simulation-lab')?.dataset.open==='true');
  check(`${entry.name}: reentry works`,await page.locator('.simulation-lab').isVisible());await page.keyboard.press('Escape');
  await page.locator('.theater-stage').focus();await page.keyboard.press('ArrowLeft');await settled(page);
  check(`${entry.name}: backward stable beat`,await page.evaluate(()=>window.__ftirPresentation.getState().beat)===1);
  await page.keyboard.press('r');await settled(page);
  check(`${entry.name}: reset current classroom state`,await page.evaluate(()=>window.__ftirPresentation.getState().beat)===0);
  if(entry.offline)check(`${entry.name}: no external or sidecar requests`,requests.length===1&&requests[0]===entry.url,{requestCount:requests.length,onlyIsolatedHtml:requests.length===1&&requests[0]===entry.url});
  await context.close();console.log(`${entry.name}: completed`);
 }
 check('No console or page errors',errors.length===0,errors);
} finally {
 await browser.close();await new Promise(resolve=>server.close(resolve));
 fs.writeFileSync(path.join(out,'browser-results.json'),JSON.stringify({checkedAt:new Date().toISOString(),browser:'Chrome headless (existing local runtime)',isolatedDirectory:'Temporary directory containing only the bundled HTML',results,errors,passed:results.filter(r=>r.pass).length,failed:results.filter(r=>!r.pass).length},null,2)+'\n');
}
console.log(`PASS: ${results.length} browser checks`);
