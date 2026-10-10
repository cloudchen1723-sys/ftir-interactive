/** Deterministic, finite teaching model for the Act 6 → Act 7 handoff. */
export interface TeachingComponent {
  readonly wavenumber: number;
  readonly amplitude: number;
}

export interface TeachingRecord {
  readonly id: string;
  readonly components: readonly TeachingComponent[];
  readonly opdCm: readonly number[];
  readonly signal: readonly number[];
  readonly sampleCount: number;
  readonly opdSpanCm: number;
  readonly provenance: 'synthetic teaching data';
}

export interface TeachingProjection {
  readonly probe: readonly number[];
  readonly signedProduct: readonly number[];
  /** cumulative[k] is the signed partial coefficient after k samples; cumulative[0] = 0. */
  readonly cumulative: readonly number[];
  readonly denominator: number;
  readonly coefficient: number;
}

export interface TeachingSpectrumPoint {
  readonly wavenumber: number;
  readonly coefficient: number;
}

export const DEFAULT_TEACHING_COMPONENTS: readonly TeachingComponent[] = Object.freeze([
  Object.freeze({ wavenumber: 1000, amplitude: 0.55 }),
  Object.freeze({ wavenumber: 1750, amplitude: 1 }),
  Object.freeze({ wavenumber: 3000, amplitude: 0.35 }),
]);

export const WRONG_PROBE_WAVENUMBER = 2250;
const DEFAULT_SAMPLE_COUNT = 512;
const DEFAULT_OPD_SPAN_CM = 0.004;

export function evaluateTeachingSignal(components: readonly TeachingComponent[], opdCm: number): number {
  return components.reduce(
    (sum, component) => sum + component.amplitude * Math.cos(2 * Math.PI * component.wavenumber * opdCm),
    0,
  );
}

export function evaluateTeachingProbe(wavenumber: number, opdCm: number): number {
  if (!Number.isFinite(wavenumber)) throw new RangeError('wavenumber must be finite');
  return Math.cos(2 * Math.PI * wavenumber * opdCm);
}

export function createTeachingRecord(
  components: readonly TeachingComponent[],
  options: { sampleCount?: number; opdSpanCm?: number } = {},
): TeachingRecord {
  const sampleCount = options.sampleCount ?? DEFAULT_SAMPLE_COUNT;
  const opdSpanCm = options.opdSpanCm ?? DEFAULT_OPD_SPAN_CM;
  if (!Number.isInteger(sampleCount) || sampleCount < 2) throw new RangeError('sampleCount must be an integer ≥ 2');
  if (!(opdSpanCm > 0) || !Number.isFinite(opdSpanCm)) throw new RangeError('opdSpanCm must be finite and positive');
  if (components.some((c) => !Number.isFinite(c.wavenumber) || c.wavenumber < 0 || !Number.isFinite(c.amplitude))) {
    throw new RangeError('components require finite nonnegative wavenumbers and finite amplitudes');
  }
  const frozenComponents = Object.freeze(components.map((c) => Object.freeze({ ...c })));
  const opdCm = Object.freeze(Array.from({ length: sampleCount }, (_, i) => -opdSpanCm / 2 + i * opdSpanCm / sampleCount));
  const signal = Object.freeze(opdCm.map((opd) => evaluateTeachingSignal(frozenComponents, opd)));
  const id = `synthetic-${sampleCount}-${opdSpanCm}-${frozenComponents.map((c) => `${c.wavenumber}:${c.amplitude}`).join(',')}`;
  return Object.freeze({ id, components: frozenComponents, opdCm, signal, sampleCount, opdSpanCm, provenance: 'synthetic teaching data' as const });
}

export const DEFAULT_TEACHING_RECORD = createTeachingRecord(DEFAULT_TEACHING_COMPONENTS);

export function projectTeachingRecord(record: TeachingRecord, wavenumber: number): TeachingProjection {
  if (!Number.isFinite(wavenumber)) throw new RangeError('wavenumber must be finite');
  const probe = record.opdCm.map((opd) => evaluateTeachingProbe(wavenumber, opd));
  const signedProduct = record.signal.map((signal, i) => signal * probe[i]);
  const denominator = probe.reduce((sum, value) => sum + value * value, 0);
  const cumulative = [0];
  for (const product of signedProduct) cumulative.push(cumulative[cumulative.length - 1] + product / denominator);
  return Object.freeze({ probe: Object.freeze(probe), signedProduct: Object.freeze(signedProduct), cumulative: Object.freeze(cumulative), denominator, coefficient: cumulative[record.sampleCount] });
}

export function recoverTeachingSpectrum(
  record: TeachingRecord,
  candidateWavenumbers: readonly number[],
): readonly TeachingSpectrumPoint[] {
  if (candidateWavenumbers.some((wavenumber) => !Number.isFinite(wavenumber))) throw new RangeError('candidate wavenumbers must be finite');
  return Object.freeze(candidateWavenumbers.map((wavenumber) => ({
    wavenumber,
    coefficient: projectTeachingRecord(record, wavenumber).coefficient,
  })));
}
