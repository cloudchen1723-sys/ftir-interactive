const test=require('node:test'),assert=require('node:assert/strict'),O=require('../optics.js');
const close=(a,b)=>a.forEach((v,i)=>assert.ok(Math.abs(v-b[i])<1e-10));
test('BS sends +x to fixed +z and returning -x to output -z',()=>{close(O.reflect([1,0,0],O.bsNormal),[0,0,1]);close(O.reflect([-1,0,0],O.bsNormal),[0,0,-1]);});
test('both arms start and return to one BS at common optical height',()=>{for(const mm of [-.02,0,.02]){const p=O.paths(mm);for(const k of ['fixed','moving']){close(p[k][0],O.parts.splitter);close(p[k].at(-1),O.parts.splitter);}Object.values(p).flat().forEach(v=>assert.equal(v[1],O.Y));}});
test('moving optical endpoint follows carriage and display movement is clamped',()=>{close(O.paths(.02).moving[1],[3.58,O.Y,0]);assert.equal(O.mirrorX(2),O.mirrorX(.02));assert.equal(O.mirrorX(-2),O.mirrorX(-.02));});
test('sample, collector and detector lie on the observed output port',()=>{const p=O.paths().output;assert.ok(p.every(v=>v[0]===0));for(let i=1;i<p.length;i++)assert.ok(p[i][2]<p[i-1][2]);});
