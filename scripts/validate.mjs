import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');
const json=rel=>JSON.parse(read(rel));
const catalog=json('reference-data/lab-catalog.json');
assert.equal(catalog.samples.length,10);
assert.equal(catalog.samples.reduce((sum,s)=>sum+s.features.length,0),47);
const datasets=[];
for (const s of catalog.samples) {
  const r=json(`reference-data/${s.file}`);
  assert.equal(r.axes.y.symbol,'k'); assert.equal(r.axes.y.unit,'dimensionless');
  assert.equal(r.x.length,r.y.length); assert.equal(r.x.length,r.pointCount);
  assert(r.x.every(Number.isFinite)); assert(r.y.every(Number.isFinite));
  assert(r.x.every((x,i)=>i===0||x<r.x[i-1]),`${s.id}: descending grid`);
  assert.deepEqual(new Set(s.readingOrder),new Set(s.features.map(f=>f.id)));
  for (const f of s.features) {
    const [low,high]=f.rangeCm1;
    let best=-1;
    for(let i=0;i<r.x.length;i++) if(r.x[i]>=low&&r.x[i]<=high&&(best<0||r.y[i]>r.y[best])) best=i;
    assert(best>=0); assert.equal(f.observedCm1,r.x[best]); assert.equal(f.observedK,r.y[best]);
    if(!f.broad) assert(r.y[best]>=r.y[best-1]&&r.y[best]>=r.y[best+1],`${s.id}/${f.id}: local peak`);
  }
  const negativeKCount=r.y.filter(y=>y<0).length;
  if(s.id==='propyne-nasa-2021-8k') { assert.equal(r.sample.phase,'solid'); assert.equal(r.measurement.sampleTemperatureK,8); assert.equal(r.sample.phaseDetail,'amorphous ice'); assert.equal(negativeKCount,20158); }
  if(s.id==='styrene-pnnl-2017') assert.equal(r.sample.phase,'liquid');
  datasets.push({id:s.id,points:r.pointCount,features:s.features.length,phase:r.sample.phase,negativeKCount});
}
const html=read('index.html');
const refs=[...html.matchAll(/(?:src|href)=["'](\.\/[^"']+\.(?:js|css)(?:\?[^"']*)?)["']/g)].map(m=>m[1].split('?')[0]);
for(const rel of refs) { assert(fs.existsSync(path.join(root,rel))); if(rel.endsWith('.js')) new vm.Script(read(rel),{filename:rel}); }
const bundled=read('dist/FTIR课堂单文件版.html');
const scripts=[...bundled.matchAll(/<script(?:\s([^>]*))?>([\s\S]*?)<\/script>/gi)];
for(const [i,s] of scripts.entries()) new vm.Script(s[2],{filename:`single-file-${i}.js`});
assert(!/<script[^>]+src=|<link[^>]+rel=["']stylesheet["']/i.test(bundled),'No external script or CSS');
const bridge=scripts.find(s=>(s[1]||'').includes('single-file-fetch-adapter'));
const records=JSON.parse(bridge[2].match(/const records = Object.freeze\((.*)\);/)[1]);
for(const [rel,text] of Object.entries(records)) assert.equal(text,read(rel),`Bundled JSON must match source: ${rel}`);
for(const s of catalog.samples) assert(Object.hasOwn(records,`reference-data/${s.file}`));
for(const rel of refs) assert(bundled.includes(read(rel).replace(/<\/script/gi,'<\\/script')),`Bundled source must be current: ${rel}`);
const report={date:new Date().toISOString(),samples:catalog.samples.length,features:47,datasets,localAssets:refs.length,inlineScriptsParsed:scripts.length,embeddedJson:Object.keys(records).length,allBundledTextEqualsSource:true,offlineBytes:Buffer.byteLength(bundled),offlineSha256:crypto.createHash('sha256').update(bundled).digest('hex'),note:'Read-only structural, numeric and packaging checks. Source decoding and browser interaction are separately documented.'};
fs.mkdirSync(path.join(root,'docs/verification'),{recursive:true});
fs.writeFileSync(path.join(root,'docs/verification/static-results.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report,null,2));
