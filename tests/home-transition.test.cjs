const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');

function setup(reduced=false){
  const styles=new Map(),handlers=new Map(),windowHandlers=new Map(),headerStyles=new Map(),motionHandlers=new Map();
  const fake=(extra={})=>({style:{setProperty:(k,v)=>styles.set(k,v)},dataset:{},setAttribute(k,v){this[k]=v;},removeAttribute(k){delete this[k];},addEventListener(k,fn){handlers.set(k,fn);},removeEventListener(k){handlers.delete(k);},...extra});
  const stage=fake({offsetHeight:800}),signal=fake(),enter=fake(),next=fake({disabled:true});
  const fallback=fake(),lab=fake(),core=fake();
  const elements={'.home-stage':stage,'.home-hero':fake(),'.signal-material':signal,'.home-lab':lab,'.home-lab-core':core,'.home-lab-fallback':fallback,'[data-transition-start]':enter,'.home-lab-next':next};
  const journey=fake({offsetHeight:2400,querySelector:s=>elements[s]});
  const header=fake({style:{setProperty:(k,v)=>headerStyles.set(k,v),removeProperty:k=>headerStyles.delete(k)},removeAttribute(k){if(k==='style')headerStyles.clear();}});
  const motion={matches:reduced,addEventListener(k,fn){motionHandlers.set(k,fn);},removeEventListener(k){motionHandlers.delete(k);}};
  let frame=null,lastScroll=null,paused=null;
  const win={scrollY:0,matchMedia:()=>motion,requestAnimationFrame:fn=>{frame=fn;return 1;},cancelAnimationFrame:()=>{frame=null;},addEventListener:(k,fn)=>windowHandlers.set(k,fn),removeEventListener:k=>windowHandlers.delete(k),scrollTo:arg=>{lastScroll=arg;win.scrollY=arg.top;windowHandlers.get('scroll')?.();const fn=frame;frame=null;fn?.();}};
  const doc={querySelector:()=>header};
  const context={window:win,document:doc};
  vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../home-transition.js'),'utf8'),context);
  const dispose=win.mountFTIRHomeTransition(journey,{setPaused:v=>{paused=v;}});
  return {win,journey,signal,enter,next,lab,styles,headerStyles,motion,dispose,scroll(p){win.scrollY=1600*p;windowHandlers.get('scroll')?.();const fn=frame;frame=null;fn?.();},start(){handlers.get('click')?.();},get lastScroll(){return lastScroll;},get paused(){return paused;}};
}

test('滚动与 CTA 共享同一进度，终点可继续课程',()=>{
  const t=setup();assert.equal(t.journey.dataset.transitionProgress,'0.000');
  t.scroll(.5);assert.equal(t.journey.dataset.transitionProgress,'0.500');assert.equal(t.next.disabled,true);
  t.scroll(1);assert.equal(t.journey.dataset.transitionProgress,'1.000');assert.equal(t.next.disabled,false);assert.equal(t.lab['aria-hidden'],'false');assert.equal(t.paused,true);
  t.scroll(0);assert.equal(t.paused,false);
  t.start();assert.equal(t.lastScroll.behavior,'smooth');assert.equal(t.journey.dataset.transitionProgress,'1.000');
  t.dispose();
});

test('减少动态效果时跳过 scrub，按钮直接进入稳定暗场',()=>{
  const t=setup(true);t.scroll(.1);
  assert.equal(t.journey.dataset.transitionProgress,'1.000');assert.equal(t.next.disabled,false);
  t.scroll(0);t.start();assert.equal(t.lastScroll.behavior,'instant');
  t.dispose();
});
