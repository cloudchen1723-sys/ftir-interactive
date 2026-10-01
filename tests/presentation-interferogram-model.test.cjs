const assert = require('node:assert/strict');
const model = require('../presentation-interferogram-model.js');
const physics = require('../physics.js');
const story = require('../story-model.js');
const close = (a, b, e = 1e-10) => assert.ok(Math.abs(a - b) <= e, `${a} !== ${b}`);

assert.deepEqual(model.getComponents(3), story.lines);
assert.deepEqual(model.getComponents(2), story.lines.slice(0, 2));
assert.deepEqual(model.getComponents(1), story.lines.slice(0, 1));
const components = [0, 1, 2].map(i => model.getComponentRecord(i));
assert.strictEqual(components[0], model.getComponentRecord(0));
assert.deepEqual(components.map(record => record.ys[record.n / 2]), [1, .6, .4]);
components.forEach(record => { assert.equal(Object.isFrozen(record), true); assert.equal(record.n, 32768); assert.equal(record.h, .00000625); });
const componentViews = [0, 1, 2].map(i => model.componentSeries(i));
assert.deepEqual(componentViews[0].xs, componentViews[1].xs);
assert.deepEqual(componentViews[1].xs, componentViews[2].xs);
assert.equal(componentViews[0].ys[Math.floor(componentViews[0].ys.length / 2)], 1);
assert.equal(componentViews[1].ys[Math.floor(componentViews[1].ys.length / 2)], .6);
assert.equal(componentViews[2].ys[Math.floor(componentViews[2].ys.length / 2)], .4);

const one = model.getRecord(1), two = model.getRecord(2), three = model.getRecord(3);
const second = physics.lineRecord([story.lines[1]], { n: 32768, h: .00000625 });
const third = physics.lineRecord([story.lines[2]], { n: 32768, h: .00000625 });
assert.strictEqual(one, model.getRecord(1));
assert.strictEqual(three, model.getRecord(3));
assert.equal(one.n, 32768); assert.equal(one.h, .00000625);
assert.equal(one.xs[0], -0.1024); assert.equal(one.xs.at(-1), .10239375);
assert.equal(three.ys.length, three.n); assert.equal(three.kind, 'lines');
assert.equal(Object.isFrozen(one), true); assert.equal(Object.isFrozen(one.xs), true); assert.equal(Object.isFrozen(one.ys), true);

for (let i = 0; i < one.ys.length; i += 4096) close(one.ys[i] + second.ys[i] + third.ys[i], three.ys[i]);
close(three.ys[three.n / 2], 2);
close(one.ys[one.n / 2], 1); close(two.ys[two.n / 2], 1.6);
assert.equal(one.xs[100], one.xs[100] * 1e4 / 1e4);
assert.equal(one.xs[100] < 0, true);

const broad = model.getRecord('broadband');
assert.strictEqual(broad, model.getRecord(true));
assert.equal(broad.kind, 'density'); assert.notEqual(broad.id, three.id);
assert.equal(broad.n, 32768); assert.equal(broad.h, .00000625);
assert.notDeepEqual([...broad.ys.slice(0, 32)], [...three.ys.slice(0, 32)]);

const discreteView = model.visibleSeries(three);
assert.equal(discreteView.xs[0], -20); assert.equal(discreteView.xs.at(-1), 20);
assert.ok(discreteView.xs.length > 600); assert.equal(discreteView.recordId, three.id);
const broadView = model.visibleSeries(broad);
assert.equal(broadView.xs[0], -80); assert.ok(broadView.xs.at(-1) <= 80); assert.ok(broadView.xs.length > 2000);
const normalized = model.visibleSeries(three, -20, 20, true);
close(Math.max(...normalized.ys.map(Math.abs)), 1);
assert.equal(three.ys[three.n / 2], 2);

const addition = model.mixedSeries(1, 2, .5);
assert.equal(addition.fromRecordId, one.id); assert.equal(addition.toRecordId, two.id);
close(addition.ys[addition.ys.length / 2 | 0], 1.3);
const zeroStart = model.mixedSeries(0, 1, .5);
assert.equal(zeroStart.fromRecordId, null); assert.equal(zeroStart.toRecordId, one.id);
close(zeroStart.ys[zeroStart.ys.length / 2 | 0], .5);
const settled = model.mixedSeries(2, 3, 1);
close(settled.ys[settled.ys.length / 2 | 0], 2);

const direct = physics.lineRecord(story.lines, { n: 32768, h: .00000625 });
assert.equal(direct.ys.length, three.ys.length);
for (let i = 0; i < three.ys.length; i += 8192) close(direct.ys[i], three.ys[i]);
console.log('PASS cached N4 interferogram teaching records');
