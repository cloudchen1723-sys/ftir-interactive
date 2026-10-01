const test = require('node:test');
const assert = require('node:assert/strict');

const N3 = require('../n3.js');

const { initialState, reduce, advance, derive, STEPS } = N3;
const close = (actual, expected, epsilon = 1e-9) =>
  assert.ok(Math.abs(actual - expected) <= epsilon, `${actual} != ${expected}`);
const stepOf = state => state.step;
const settle = state => advance(state, 100000);

test('actual renderer geometry has orthogonal equal baseline arms and correct reflection', () => {
  const g=N3.geometry(0), o=require('../optics.js');
  assert.equal(g.fixed[0],g.splitter[0]);
  assert.equal(g.moving[1],g.splitter[1]);
  close(g.splitter[1]-g.fixed[1],g.moving[0]-g.splitter[0]);
  const reflected=o.reflect([1,0],g.normal);
  close(reflected[0],0);close(reflected[1],-1);
  close(N3.geometry(5).moving[0]-g.moving[0],70);
  assert.deepEqual(N3.geometry(5).fixed,g.fixed);
});

test('round-trip explanation does not move the mirror again', () => {
  let s=settle(reduce(initialState(),{type:'NEXT'}));
  const x=derive(s).mirrorUm;
  s=reduce(s,{type:'NEXT'});
  close(derive(s).mirrorUm,x);
  close(derive(advance(s,1000)).mirrorUm,x);
});

test('normal Auto follows the 50 second budget and resume preserves hold time', () => {
  let s=reduce(initialState(),{type:'TOGGLE_AUTO'});
  s=advance(s,3000);
  const frozen=reduce(s,{type:'PAUSE'});
  assert.deepEqual(advance(frozen,10000),frozen);
  s=reduce(frozen,{type:'TOGGLE_AUTO'});
  s=advance(s,47000);
  assert.equal(s.step,5);assert.equal(s.paused,true);assert.equal(s.auto,false);
});

test('Auto final endpoint agrees with the manual 5 μm endpoint', () => {
  let auto = reduce(initialState({ reducedMotion: true }), { type: 'TOGGLE_AUTO' });
  auto = advance(auto, 100000);
  const manual = reduce(initialState({ reducedMotion: true }), { type: 'SET_MIRROR', value: 5 });
  assert.equal(auto.step, 5);
  const autoView = derive(auto), manualView = derive(manual);
  for (const key of ['mirrorUm', 'opdUm', 'power1000', 'power3000']) close(autoView[key], manualView[key]);
});

test('pausing Auto preserves its hold cursor before resuming', () => {
  let s = reduce(initialState(), { type: 'TOGGLE_AUTO' });
  s = advance(s, 2500); // 1800 ms action + 700 ms of step-0 hold
  assert.equal(s.step, 0);
  assert.equal(s.holdMs, 700);
  const paused = reduce(s, { type: 'PAUSE' });
  assert.equal(paused.holdMs, 700);
  s = reduce(paused, { type: 'TOGGLE_AUTO' });
  s = advance(s, 500);
  assert.equal(s.holdMs, 1200);
});

test('step 3 and step 4 each return the mirror to zero before scanning onward', () => {
  let s = initialState();
  s = reduce(s, { type: 'NEXT' });
  s = advance(s, STEPS[1].duration);
  s = reduce(s, { type: 'NEXT' });
  s = advance(s, STEPS[2].duration);
  s = reduce(s, { type: 'NEXT' });
  assert.equal(s.step, 3);
  close(derive(s).mirrorUm, 3.75);
  s = advance(s, STEPS[3].duration * 0.18);
  close(derive(s).mirrorUm, 0);
  s = advance(s, 1);
  assert.ok(derive(s).mirrorUm > 0);
  s = advance(s, STEPS[3].duration);
  s = reduce(s, { type: 'NEXT' });
  assert.equal(s.step, 4);
  close(derive(s).mirrorUm, 5);
  s = advance(s, STEPS[4].duration * 0.16);
  close(derive(s).mirrorUm, 0);
});

test('Replay remains deterministic across repeated use', () => {
  const fresh = initialState({ reducedMotion: true });
  let s = fresh;
  for (let i = 0; i < 5; i += 1) {
    s = reduce(s, { type: 'NEXT' });
    s = reduce(s, { type: 'REPLAY' });
    assert.deepEqual(s, fresh);
    assert.deepEqual(derive(s), derive(fresh));
  }
});

test('derive and transitions do not mutate their state input', () => {
  const s = initialState();
  const before = { ...s };
  derive(s);
  advance(s, 100);
  reduce(s, { type: 'SET_MIRROR', value: 2 });
  assert.deepEqual(s, before);
});

test('N3 exposes six teaching stops and starts at zero OPD', () => {
  assert.equal(STEPS.length, 6);
  const state = initialState();
  assert.equal(stepOf(state), 0);
  const view = derive(state);
  close(view.mirrorUm, 0);
  close(view.opdUm, 0);
});

test('5 μm mirror displacement produces 10 μm OPD', () => {
  const state = reduce(initialState(), { type: 'SET_MIRROR', value: 5 });
  const view = derive(state);
  close(view.mirrorUm, 5);
  close(view.opdUm, 10);
});

test('ideal single-wave powers have the expected one-versus-three periods', () => {
  const state = initialState({ reducedMotion: true });
  const samples = [0, 5 / 6, 5 / 3, 5 / 2, 5];
  // mirror μm -> OPD μm; 1000 cm⁻¹ has a 10 μm OPD period and
  // 3000 cm⁻¹ has a 10/3 μm OPD period.
  for (const mirrorUm of samples) {
    const view = derive(reduce(state, { type: 'SET_MIRROR', value: mirrorUm }));
    const opdUm = 2 * mirrorUm;
    const expected1000 = (1 + Math.cos(2 * Math.PI * opdUm / 10)) / 2;
    const expected3000 = (1 + Math.cos(2 * Math.PI * 3 * opdUm / 10)) / 2;
    close(view.power1000, expected1000, 1e-8);
    close(view.power3000, expected3000, 1e-8);
  }
  const zero = derive(reduce(state, { type: 'SET_MIRROR', value: 0 }));
  const half1000 = derive(reduce(state, { type: 'SET_MIRROR', value: 2.5 }));
  const one1000 = derive(reduce(state, { type: 'SET_MIRROR', value: 5 }));
  close(zero.power1000, 1);
  close(half1000.power1000, 0);
  close(one1000.power1000, 1);
});

test('pause freezes an in-flight transition', () => {
  let state = initialState();
  state = reduce(state, { type: 'NEXT' });
  state = advance(state, 250);
  const paused = reduce(state, { type: 'PAUSE' });
  const before = derive(paused);
  const after = advance(paused, 100000);
  assert.deepEqual(derive(after), before);
  assert.deepEqual(after, paused);
});

test('NEXT settles an in-flight stop before advancing again', () => {
  let state = reduce(initialState(), { type: 'NEXT' });
  state = advance(state, 250);
  const settled = reduce(state, { type: 'NEXT' });
  assert.equal(stepOf(settled), 1);
  const settledAgain = reduce(settled, { type: 'NEXT' });
  assert.equal(stepOf(settledAgain), 2);
  assert.equal(stepOf(settle(settledAgain)), 2);
});

test('PREV and REPLAY are deterministic', () => {
  let state = initialState({ reducedMotion: true });
  state = reduce(state, { type: 'NEXT' });
  state = reduce(state, { type: 'NEXT' });
  assert.equal(stepOf(state), 2);
  assert.equal(stepOf(reduce(state, { type: 'PREV' })), 1);

  const replayed = reduce(state, { type: 'REPLAY' });
  const fresh = initialState({ reducedMotion: true });
  assert.deepEqual(replayed, fresh);
  assert.deepEqual(derive(replayed), derive(fresh));
});

test('Auto visits all six stops and stops at the final one', () => {
  let state = reduce(initialState({ reducedMotion: true }), { type: 'TOGGLE_AUTO' });
  for (let i = 0; i < 20; i += 1) state = advance(state, 10000);
  assert.equal(stepOf(state), 5);
  const stopped = advance(state, 100000);
  assert.deepEqual(stopped, state);
});

test('reduced motion makes each stop immediate', () => {
  let state = initialState({ reducedMotion: true });
  state = reduce(state, { type: 'NEXT' });
  assert.equal(stepOf(state), 1);
  assert.deepEqual(derive(state), derive(settle(state)));
});

test('manual mirror position is clamped to the 0–5 μm teaching range', () => {
  const base = initialState({ reducedMotion: true });
  const low = derive(reduce(base, { type: 'SET_MIRROR', value: -100 }));
  const high = derive(reduce(base, { type: 'SET_MIRROR', value: 100 }));
  close(low.mirrorUm, 0);
  close(low.opdUm, 0);
  close(high.mirrorUm, 5);
  close(high.opdUm, 10);
});
