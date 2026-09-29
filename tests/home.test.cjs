const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const P=require('../physics.js');
test('首页背景状态不应成为冒泡导航监听器',()=>{
  const source=fs.readFileSync(path.join(__dirname,'../lesson.js'),'utf8');
  assert.doesNotMatch(source,/querySelectorAll\('\[data-view\]'\)/);
  assert.match(source,/querySelectorAll\('button\[data-view\]'\)/);
});
test('首页使用同一合成记录的正反变换，不写入测量状态',()=>{
  let records=0,transforms=0;
  const tracked={...P,densityRecord(...args){records++;return P.densityRecord(...args);},transform(...args){transforms++;return P.transform(...args);}};
  const context={window:{FTIRPhysics:tracked,mountFTIRHomeTransition:()=>()=>{}}};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../home-signal.js'),'utf8'),context);
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../home.js'),'utf8'),context);
  const host={innerHTML:'',querySelector:()=>({getContext:()=>null})};context.window.mountFTIRHome(host);
  assert.match(host.innerHTML,/从一道干涉图/);
  assert.match(host.innerHTML,/data-transition-start/);
  assert.match(host.innerHTML,/data-go="story"/);assert.match(host.innerHTML,/data-go="instrument"/);
  assert.match(host.innerHTML,/合成教学数据/);assert.doesNotMatch(host.innerHTML,/NaN|Infinity/);
  assert.match(host.innerHTML,/<canvas class="signal-material"/);
  assert.match(host.innerHTML,/细线数量不代表物理谱分量数/);
  assert.doesNotMatch(host.innerHTML.match(/<figure class="home-signal">([\s\S]*?)<\/figure>/)[1],/<svg|<path/);
  assert.doesNotMatch(host.innerHTML,/<marker|marker-end/);
  assert.match(host.innerHTML,/不是傅里叶变换过程动画/);
  context.window.mountFTIRHome(host);assert.equal(records,1);assert.equal(transforms,1);
});
test('首页谱损失的傅里叶恢复与原合成带形一致',()=>{
  const density=w=>P.response(w)*(1-P.transmission(w));
  const r=P.densityRecord(density,{n:4096,h:.000025}),s=P.transform(r);
  const error=Math.max(...s.wn.map((w,i)=>Math.abs(s.values[i]-density(w))));
  assert.ok(error<1e-10);assert.equal(r.xs[r.n/2],0);
});
