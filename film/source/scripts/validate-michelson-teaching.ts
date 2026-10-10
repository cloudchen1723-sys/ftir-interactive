import assert from 'node:assert/strict';
import {
  evaluateMichelsonTeaching,
  getMichelsonTeachingState,
  MICHELSON_HIGH_WAVENUMBER,
  MICHELSON_LOW_WAVENUMBER,
  MICHELSON_SCENE_DURATION,
} from '../src/math/michelsonTeaching.ts';

const near = (actual: number, expected: number, tolerance = 1e-10) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);

const expected = [
  { x: 0, lowPhase: 0, lowPower: 1, highPower: 1 },
  { x: 1.25, lowPhase: Math.PI / 2, lowPower: 0.5 },
  { x: 2.5, lowPhase: Math.PI, lowPower: 0 },
  { x: 5, lowPhase: 2 * Math.PI, lowPower: 1, highPhase: 6 * Math.PI, highPower: 1 },
];

for (const sample of expected) {
  const low = evaluateMichelsonTeaching(sample.x, MICHELSON_LOW_WAVENUMBER);
  near(low.opdUm, 2 * sample.x);
  near(low.phaseRad, sample.lowPhase);
  near(low.normalizedPower, sample.lowPower);
  near(low.normalizedPower, (low.totalField.x ** 2 + low.totalField.y ** 2) / 4);
  if (sample.highPower !== undefined) {
    const high = evaluateMichelsonTeaching(sample.x, MICHELSON_HIGH_WAVENUMBER);
    near(high.normalizedPower, sample.highPower);
    if (sample.highPhase !== undefined) near(high.phaseRad, sample.highPhase);
  }
}

for (let i = 0; i <= MICHELSON_SCENE_DURATION; i += 1) {
  const a = getMichelsonTeachingState(i);
  const b = getMichelsonTeachingState(i);
  assert.deepEqual(a, b, `state at frame ${i} is not deterministic`);
  assert.ok(a.low.normalizedPower >= 0 && a.low.normalizedPower <= 1);
  assert.ok(a.high.normalizedPower >= 0 && a.high.normalizedPower <= 1);
  near(a.high.phaseRad, 3 * a.low.phaseRad);
  near(a.low.normalizedPower, (a.low.totalField.x ** 2 + a.low.totalField.y ** 2) / 4);
}

for (const [frame, x] of [[480, 0], [620, 5], [900, 5], [980, 0], [1480, 5], [1720, 5], [1940, 7.5], [2020, 7.5], [2240, 10], [2400, 10], [2850, 30], [2880, 30]] as const) {
  near(getMichelsonTeachingState(frame).mirrorDisplacementUm, x);
}

assert.throws(() => evaluateMichelsonTeaching(Number.NaN, 1000), TypeError);
assert.throws(() => evaluateMichelsonTeaching(0, Number.POSITIVE_INFINITY), TypeError);
console.log(`Michelson teaching validation passed across ${MICHELSON_SCENE_DURATION + 1} frames; low=${MICHELSON_LOW_WAVENUMBER} cm⁻¹, high=${MICHELSON_HIGH_WAVENUMBER} cm⁻¹.`);
