const {test}=require('node:test');
const assert=require('node:assert/strict');
const S=require('../home-signal.js');
const P=require('../physics.js');
test('材质扰动只读取科学骨架，蓝金不是换色复制',()=>{
  const d=S.backbone(P),before=JSON.stringify(d);let difference=0;
  for(let i=0;i<=1800;i++)for(const f of [0,1]){
    const p=S.point(d,i/1800,f,.6,.8);assert.ok(Number.isFinite(p.y));
    assert.ok(p.energy>=0&&p.energy<=1);
    difference+=Math.abs(p.y-S.point(d,i/1800,1-f,.6,.8).y);
  }
  assert.ok(difference>1000);assert.equal(JSON.stringify(d),before);assert.equal(S.backbone(P),d);
});
test('Canvas DPR、resize、reduce motion 和 dispose 生命周期',()=>{
  let dpr=2,width=720,draws=0,transformCalls=0,ro,io,clock=0;
  const events=new Set(),rafs=new Map(),timers=new Map(),media=[];
  const add=(type,fn)=>events.add(fn),remove=(type,fn)=>events.delete(fn);
  const gradient={addColorStop(){}};
  const ctx={setTransform(){transformCalls++;},clearRect(){},drawImage(){draws++;},beginPath(){},moveTo(){},lineTo(){},closePath(){},fill(){},stroke(){},fillRect(){},createLinearGradient:()=>gradient,createRadialGradient:()=>gradient};
  const win={get devicePixelRatio(){return dpr;},matchMedia(query){const m={matches:query.includes('prefers'),addEventListener:add,removeEventListener:remove};media.push(m);return m;},addEventListener:add,removeEventListener:remove,
    requestAnimationFrame(fn){rafs.set(++clock,fn);return clock;},cancelAnimationFrame(id){rafs.delete(id);},setTimeout(fn){timers.set(++clock,fn);return clock;},clearTimeout(id){timers.delete(id);},
    ResizeObserver:class{constructor(fn){ro=this;this.fn=fn;}observe(){}disconnect(){this.closed=true;}},IntersectionObserver:class{constructor(fn){io=this;this.fn=fn;}observe(){}disconnect(){this.closed=true;}}};
  const doc={defaultView:win,hidden:false,addEventListener:add,removeEventListener:remove,createElement:()=>({getContext:()=>ctx})};
  const canvas={ownerDocument:doc,getContext:()=>ctx,getBoundingClientRect:()=>({width,height:315}),dataset:{},isConnected:true};
  const stop=S.mount(canvas,P);assert.equal(canvas.width,1440);assert.equal(canvas.height,630);assert.equal(canvas.dataset.fibres,'220');assert.ok(draws>0);assert.ok(transformCalls>0);assert.equal(rafs.size,0,'reduced motion does not animate');
  width=390;dpr=1.5;ro.fn();for(const [id,fn] of [...timers]){timers.delete(id);fn();}
  assert.equal(canvas.width,585);assert.equal(canvas.height,473);
  assert.equal(canvas.dataset.fibres,'124');
  media[0].matches=false;for(const fn of [...events]){if(fn.name==='resume')fn();}assert.equal(rafs.size,1);
  stop();assert.equal(events.size,0);assert.equal(rafs.size,0);assert.equal(timers.size,0);assert.ok(ro.closed&&io.closed);
});
