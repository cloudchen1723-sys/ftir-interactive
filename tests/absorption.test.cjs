const assert=require('node:assert/strict');
const {photonEV,allowed}=require('../absorption.js');
assert.ok(Math.abs(photonEV(1700)-.210773)<.000001);
assert.equal(allowed(1700,true),true);
assert.equal(allowed(1700,false),false);
assert.equal(allowed(1000,true),false);
assert.equal(allowed(2400,true),false);
assert.ok(Math.abs(photonEV(2000)-2*photonEV(1000))<1e-12);
console.log('PASS photon energy, matching and IR-activity conditions (ideal zero-linewidth mode)');
