const assert = require('node:assert/strict');
const model = require('../presentation-optics-model.js');
const optics = require('../optics.js');

const close = (actual, expected, epsilon = 1e-9) => assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} !== ${expected}`);

assert.deepEqual(model.geometry(0).splitter, [200, 190]);
assert.deepEqual(model.geometry(0).source, [55, 190]);
assert.deepEqual(model.geometry(0).fixed, [200, 60]);
assert.deepEqual(model.geometry(0).moving, [330, 190]);
assert.deepEqual(model.geometry(5).moving, [400, 190]);
close(model.geometry(0).normal[0], Math.SQRT1_2);
optics.reflect([1, 0], model.geometry(0).normal).forEach((v, i) => close(v, [0, -1][i]));
assert.deepEqual(optics.reflect([1, 0], [-1, 0]), [-1, 0]);
assert.deepEqual(optics.reflect([0, -1], [0, 1]), [0, 1]);
assert.deepEqual(model.geometry(0).vectors.inputReflect, [0, -1]);

const s0 = model.sample(0, 1);
assert.equal(s0.mirrorUm, 0); assert.equal(s0.opdUm, 0);
assert.equal(s0.power1000, 1); assert.equal(s0.power3000, 1);
assert.equal(s0.formula, 0); assert.equal(s0.trace1000, 0); assert.equal(s0.trace3000, 0);

const s1mid = model.sample(1, .5), s1end = model.sample(1, 1);
close(s1mid.mirrorUm, 1.875); close(s1mid.opdUm, 3.75);
close(s1end.mirrorUm, 3.75); close(s1end.opdUm, 7.5);
close(s1mid.power1000, model.power(1000, 3.75));
assert.equal(model.sample(1, 0).mirrorUm, 0);

const s2 = model.sample(2, .25), s2return = model.sample(2, .75);
assert.equal(s2.mirrorUm, 3.75); close(s2.outbound, .25 / .45); assert.equal(s2.return, 0);
assert.equal(s2return.outbound, 1); close(s2return.return, .5);
assert.equal(model.sample(2, 1).mirrorUm, 3.75);
assert.equal(model.sample(2, 1).outbound, 1); assert.equal(model.sample(2, 1).return, 1);
assert.equal(model.sample(3, 1).outbound, 1); assert.equal(model.sample(3, 1).return, 1);
assert.equal(model.sample(0, 1).focus, 0); assert.equal(model.sample(1, 1).focus, 0);
assert.equal(model.sample(2, .45).focus, 1); assert.equal(model.sample(3, 1).focus, 1);

assert.equal(model.sample(3, 0).formula, 0);
assert.equal(model.sample(3, .5).formula, .5);
assert.equal(model.sample(3, 1).formula, 1);
assert.equal(model.sample(4, 1).formula, 0);

const s4a = model.sample(4, .10), s4b = model.sample(4, .275), s4c = model.sample(4, .675), s4end = model.sample(4, 1);
close(s4a.layout, .5); close(s4a.mirrorUm, 3.75);
close(s4b.mirrorUm, 1.875); close(s4c.mirrorUm, 2.5); close(s4end.mirrorUm, 5);
assert.equal(s4a.trace1000, 0); close(s4c.trace1000, (0.675 - .35) / .65); assert.equal(s4end.trace1000, 1);

const s5a = model.sample(5, .075), s5mid = model.sample(5, .575), s5end = model.sample(5, 1);
close(s5a.mirrorUm, 2.5); close(s5mid.mirrorUm, 2.5); assert.equal(s5mid.trace1000, 1);
close(s5mid.trace3000, (.575 - .15) / .85); assert.equal(s5end.trace3000, 1);

close(model.power(1000, 10), 1); close(model.power(3000, 10), 1);
close(model.power(1000, 5), 0); close(model.power(3000, 5), 0);
console.log('PASS deterministic presentation optics model');
