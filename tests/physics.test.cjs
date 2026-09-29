const assert = require('node:assert/strict');
const P = require('../physics.js');
let count = 0;
function test(name, fn) { fn(); count++; console.log(`PASS ${name}`); }
function close(a,b,e=1e-9) { assert.ok(Math.abs(a-b)<e, `${a} != ${b}`); }
test('镜位移 5 μm → OPD 10 μm → 1000 cm⁻¹ 一周期',()=> {
  close(P.mirrorToOPD(.005),.001); close(Math.cos(2*Math.PI*1000*.001),1);
});
test('默认网格覆盖教学波段，ZPD 有真实采样点',()=> {
  const g=P.grid(); assert.equal(g.nyquist,5000); assert.equal(g.xs[g.n/2],0);
  close(g.xs[1]-g.xs[0],g.h);
});
test('超奈奎斯特输入被拒绝',()=>assert.throws(()=>P.lineRecord([{wn:5000,weight:1}])));
test('格点单线峰位和绝对系数正确',()=> {
  const g=P.grid(), wn=g.dnu*300, r=P.lineRecord([{wn,weight:.7}]), s=P.transform(r);
  const i=s.values.indexOf(Math.max(...s.values)); close(s.wn[i],wn); close(s.values[i],.7*g.n*g.h);
});
test('FFT 实部与直接余弦投影一致（含非格点输入）',()=> {
  const r=P.lineRecord([{wn:1000,weight:1},{wn:1700,weight:.6}]), s=P.transform(r);
  for(const i of [10,122,267,600]) close(s.values[i],P.projection(r,s.wn[i]).value);
});
test('宽带正反向幅度恢复，不独立归一化',()=> {
  const r=P.measure('background'), s=P.transform(r);
  s.wn.forEach((w,i)=>close(s.values[i],P.response(w)));
});
test('同样品同背景 T=1 A=0；无效背景被遮蔽',()=> {
  const s=P.transform(P.measure('background')), r=P.ratio(s,s);
  r.valid.forEach((ok,i)=>{if(ok){close(r.t[i],1);close(r.a[i],0);}else assert.equal(r.a[i],null);});
  assert.ok(r.valid.includes(false));
});
test('比例 .1/.5 给出 A=1/.30103',()=> {
  const b=P.transform(P.measure('background'));
  for(const t of [.1,.5]) {
    const s=P.transform(P.densityRecord(w=>P.response(w)*t)), r=P.ratio(s,b);
    r.valid.forEach((ok,i)=>{if(ok)close(r.a[i],-Math.log10(t));});
  }
});
test('样品谱由独立干涉记录恢复，符合设定透射率',()=> {
  const b=P.measure('background'), s=P.measure('sample',1.3);
  assert.notEqual(b.id,s.id); const r=P.ratio(P.transform(s),P.transform(b));
  r.valid.forEach((ok,i)=>{if(ok)close(r.t[i],P.transmission(r.wn[i],1.3));});
});
test('补零不改记录或原格点结果，网格变密',()=> {
  const r=P.lineRecord([{wn:1410,weight:1}]), a=P.transform(r), b=P.transform(r,'boxcar',4);
  close(a.gridSpacing/b.gridSpacing,4); assert.equal(b.n,r.n);
  a.wn.forEach((w,i)=> {const j=b.wn.findIndex(v=>Math.abs(v-w)<1e-8);close(a.values[i],b.values[j]);});
});
test('测量记录不可被视图修改',()=> {
  const r=P.measure('background'); assert.ok(Object.isFrozen(r)); assert.ok(Object.isFrozen(r.ys));
});
test('处理条件不兼容时不作比',()=> {
  const r=P.measure('background'); assert.throws(()=>P.ratio(P.transform(r,'hann'),P.transform(r)));
});
test('固定采样间距延长扫描，线形第一零点更近',()=> {
  for(const n of [1024,2048]) {
    const h=.0001, wn=1500, r=P.lineRecord([{wn,weight:1}],{n,h});
    const center=Math.abs(P.projection(r,wn).value), first=Math.abs(P.projection(r,wn+1/(n*h)).value);
    assert.ok(first/center<.02);
  }
});
console.log(`${count} scientific checks passed.`);
