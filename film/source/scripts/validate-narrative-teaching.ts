import assert from 'node:assert/strict';
import {
  DEFAULT_TEACHING_RECORD,
  projectTeachingRecord,
  recoverTeachingSpectrum,
} from '../src/math/fourierTeaching.ts';
import {
  applySampleTransmission,
  evaluateNarrativeMeasurement,
  NARRATIVE_ANSWER_START,
  NARRATIVE_BEATS,
  NARRATIVE_FOURIER_START,
  NARRATIVE_IDENTITIES,
  NARRATIVE_SAMPLE_COMPONENTS,
  NARRATIVE_SAMPLE_RECORD,
  NARRATIVE_SAMPLE_TRANSMISSION,
  NARRATIVE_SLICE_DURATION,
  NARRATIVE_SOURCE_COMPONENTS,
  SLICE_SOURCE_RECORD,
} from '../src/math/narrativeTeaching.ts';

const near = (actual: number, expected: number, tolerance = 1e-12) =>
  assert.ok(Math.abs(actual - expected) <= tolerance, `${actual} differs from ${expected}`);

assert.equal(NARRATIVE_SLICE_DURATION, 6420);
assert.equal(NARRATIVE_FOURIER_START, 3420);
assert.equal(NARRATIVE_ANSWER_START, 6000);
assert.equal(SLICE_SOURCE_RECORD, DEFAULT_TEACHING_RECORD);
assert.equal(NARRATIVE_SAMPLE_RECORD.sampleCount, 512);
assert.equal(NARRATIVE_SAMPLE_RECORD.opdCm[0], -0.002);
assert.equal(NARRATIVE_SAMPLE_RECORD.opdCm[256], 0);
assert.equal(NARRATIVE_SAMPLE_RECORD.id, 'synthetic-512-0.004-1000:0.55,1750:0.55,3000:0.35');
assert.deepEqual(NARRATIVE_IDENTITIES.map(({ id }) => id), ['nu-1000', 'nu-1750', 'nu-3000']);
assert.deepEqual(NARRATIVE_SAMPLE_COMPONENTS.map(({ amplitude }) => amplitude), [0.55, 0.55, 0.35]);
assert.deepEqual(NARRATIVE_SAMPLE_TRANSMISSION, [1, 0.55, 1]);
assert.equal(NARRATIVE_BEATS.at(-1)?.end, NARRATIVE_SLICE_DURATION);

const reversed = evaluateNarrativeMeasurement(0.00037, [...NARRATIVE_SAMPLE_COMPONENTS].reverse());
assert.deepEqual(reversed.terms.map((term) => term.id), ['nu-3000', 'nu-1750', 'nu-1000']);
const puzzleAlternatives = [[0.55, 0.55, 0.35], [0.35, 0.75, 0.35]];
near(puzzleAlternatives[0].reduce((a, b) => a + b, 0), puzzleAlternatives[1].reduce((a, b) => a + b, 0));
assert.notDeepEqual(puzzleAlternatives[0], puzzleAlternatives[1]);

for (let index = 0; index < NARRATIVE_SAMPLE_RECORD.sampleCount; index += 1) {
  const measurement = evaluateNarrativeMeasurement(NARRATIVE_SAMPLE_RECORD.opdCm[index], NARRATIVE_SAMPLE_COMPONENTS);
  near(measurement.totalRaw - measurement.baseline, NARRATIVE_SAMPLE_RECORD.signal[index], 1e-12);
  assert.ok(measurement.totalRaw >= -1e-12, `negative detector intensity at sample ${index}`);
  if (index === 256) {
    near(measurement.totalRaw, 2.9);
    near(measurement.ac, 1.45);
    assert.ok(measurement.terms.every((term) => Math.abs(Math.cos(term.phase) - 1) < 1e-12));
  }
}

const rawValues = NARRATIVE_SAMPLE_RECORD.opdCm.map((opd) => evaluateNarrativeMeasurement(opd, NARRATIVE_SAMPLE_COMPONENTS).totalRaw);
near(Math.min(...rawValues), 0.11437159605929237, 1e-12);
near(Math.max(...rawValues), 2.9);
near(NARRATIVE_SAMPLE_COMPONENTS.reduce((sum, component) => sum + component.amplitude, 0), 1.45);
near(evaluateNarrativeMeasurement(0.0002, NARRATIVE_SAMPLE_COMPONENTS).mirrorDisplacementUm, 1);

const wrong = projectTeachingRecord(NARRATIVE_SAMPLE_RECORD, 2250).coefficient;
const matched = projectTeachingRecord(NARRATIVE_SAMPLE_RECORD, 1750);
near(wrong, 0, 1e-12);
near(matched.coefficient, 0.55);
const positive = matched.signedProduct.filter((value) => value > 0).length;
const negative = matched.signedProduct.filter((value) => value < 0).length;
assert.equal(positive, 395);
assert.equal(negative, 117);
const recovered = recoverTeachingSpectrum(NARRATIVE_SAMPLE_RECORD, [1000, 1750, 3000]);
assert.deepEqual(recovered.map(({ coefficient }) => Number(coefficient.toFixed(2))), [0.55, 0.55, 0.35]);

assert.throws(() => applySampleTransmission(NARRATIVE_SOURCE_COMPONENTS, [1, 1.01, 1]));
assert.throws(() => applySampleTransmission([{ wavenumber: 1000, amplitude: -0.1 }], [1]));
assert.throws(() => evaluateNarrativeMeasurement(Number.NaN, NARRATIVE_SAMPLE_COMPONENTS));

console.log(`narrative teaching validation passed: 512 samples, baseline 1.45, raw ${Math.min(...rawValues).toFixed(6)}..${Math.max(...rawValues).toFixed(2)}`);
console.log(`wrong 2250=${wrong.toExponential(3)}, matched 1750=${matched.coefficient.toFixed(2)}, recovered=${recovered.map((p) => p.coefficient.toFixed(2)).join('/')}`);
