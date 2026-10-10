import assert from 'node:assert/strict';
import {
  DEFAULT_TEACHING_COMPONENTS,
  DEFAULT_TEACHING_RECORD,
  createTeachingRecord,
  projectTeachingRecord,
  recoverTeachingSpectrum,
} from '../src/math/fourierTeaching.ts';

const wrong = projectTeachingRecord(DEFAULT_TEACHING_RECORD, 2250);
const matched = projectTeachingRecord(DEFAULT_TEACHING_RECORD, 1750);
const positiveProducts = matched.signedProduct.filter((value) => value > 0).length;
const negativeProducts = matched.signedProduct.filter((value) => value < 0).length;

assert.ok(Math.abs(wrong.coefficient) < 1e-12, `wrong-frequency coefficient should be zero, got ${wrong.coefficient}`);
assert.ok(Math.abs(matched.coefficient - 1) < 1e-12, `1750 cm⁻¹ coefficient should equal 1, got ${matched.coefficient}`);
assert.ok(positiveProducts > 0 && negativeProducts > 0, 'matching composite products should include both signs');
assert.equal(matched.cumulative.length, DEFAULT_TEACHING_RECORD.sampleCount + 1);
assert.equal(matched.cumulative[0], 0);
assert.equal(matched.cumulative.at(-1), matched.coefficient);

const recovered = recoverTeachingSpectrum(DEFAULT_TEACHING_RECORD, [1000, 1750, 3000]);
for (const component of DEFAULT_TEACHING_COMPONENTS) {
  const point = recovered.find((candidate) => candidate.wavenumber === component.wavenumber);
  assert.ok(point);
  assert.ok(Math.abs(point.coefficient - component.amplitude) < 1e-12);
}

const quieter = createTeachingRecord(DEFAULT_TEACHING_COMPONENTS.map((component) => ({
  ...component,
  amplitude: component.wavenumber === 1750 ? 0.55 : component.amplitude,
})), { sampleCount: DEFAULT_TEACHING_RECORD.sampleCount, opdSpanCm: DEFAULT_TEACHING_RECORD.opdSpanCm });
const quieter1750 = projectTeachingRecord(quieter, 1750).coefficient;
assert.ok(Math.abs(quieter1750 - 0.55) < 1e-12, `amplitude change should recover 0.55, got ${quieter1750}`);
for (const unchanged of [1000, 3000]) {
  assert.ok(Math.abs(projectTeachingRecord(quieter, unchanged).coefficient - projectTeachingRecord(DEFAULT_TEACHING_RECORD, unchanged).coefficient) < 1e-12,
    `changing 1750 must not change the ${unchanged} coefficient`);
}
assert.equal(createTeachingRecord(DEFAULT_TEACHING_COMPONENTS).id, DEFAULT_TEACHING_RECORD.id,
  'same source/grid must produce a stable record identity');
assert.ok(Math.abs(DEFAULT_TEACHING_RECORD.signal[256] - 1.9) < 1e-12,
  'the zero-OPD signal must retain the sum of source amplitudes');

const orderA = [2250, 1750, 1000, 3000].map((nu) => projectTeachingRecord(DEFAULT_TEACHING_RECORD, nu).coefficient);
const orderB = [3000, 1000, 1750, 2250].map((nu) => projectTeachingRecord(DEFAULT_TEACHING_RECORD, nu).coefficient).reverse();
assert.deepEqual(orderA, orderB, 'pure projections must be independent of evaluation order');

console.log(`wrong 2250 cm⁻¹: ${wrong.coefficient.toExponential(3)}`);
console.log(`matched 1750 cm⁻¹: ${matched.coefficient.toFixed(12)}`);
console.log(`matching product signs: ${positiveProducts} positive / ${negativeProducts} negative`);
console.log(`recovered spectrum: ${recovered.map((point) => `${point.wavenumber}=${point.coefficient.toFixed(2)}`).join(', ')}`);
console.log(`1750 cm⁻¹ after amplitude change: ${quieter1750.toFixed(12)}`);
