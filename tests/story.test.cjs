const assert=require('node:assert/strict'),M=require('../story-model.js'),P=require('../physics.js');
for(const asym of [true,false])for(const q of [-10,0,10]){const d=M.mode(asym,q);assert.ok(Math.abs(16*d[0]+12*d[1]+16*d[2])<1e-10);if(asym)assert.ok(Math.abs((d[1]-d[0])+(d[2]-d[1]))<1e-10);else assert.equal(d[1]-d[0],d[2]-d[1]);}
assert.equal(M.frequency(1,1),1700);assert.equal(M.frequency(4,1),3400);assert.equal(M.frequency(1,4),850);
for(let i=-100;i<=100;i++){const v=M.power(3000,i*.00001);assert.ok(v>=0&&v<=1);}
const r=P.lineRecord(M.lines),s=P.transform(r);for(const w of [1000,1700,3000])assert.ok(P.projection(r,w).value>P.projection(r,2400).value+.06);
const bg=P.measure('background'),sample=P.measure('sample'),ratio=P.ratio(P.transform(sample),P.transform(bg));for(let i=0;i<ratio.wn.length;i++)if(ratio.valid[i])assert.ok(Math.abs(ratio.t[i]-P.transmission(ratio.wn[i]))<1e-9);
console.log('PASS guided model: CO2 centre of mass/bond relations, frequency scaling, nonnegative detector power, projection and measurement continuity');
