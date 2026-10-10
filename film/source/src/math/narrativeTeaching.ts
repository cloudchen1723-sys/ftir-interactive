import {
  DEFAULT_TEACHING_COMPONENTS,
  DEFAULT_TEACHING_RECORD,
  createTeachingRecord,
  evaluateTeachingProbe,
  type TeachingComponent,
  type TeachingRecord,
} from './fourierTeaching.ts';

export const NARRATIVE_SLICE_DURATION = 6420;
export const NARRATIVE_FOURIER_START = 3420;
export const NARRATIVE_ANSWER_START = 6000;

export interface NarrativeIdentity {
  readonly id: 'nu-1000' | 'nu-1750' | 'nu-3000';
  readonly wavenumber: number;
  readonly strokeDasharray?: string;
}

export const NARRATIVE_IDENTITIES: readonly NarrativeIdentity[] = Object.freeze([
  Object.freeze({ id: 'nu-1000', wavenumber: 1000 }),
  Object.freeze({ id: 'nu-1750', wavenumber: 1750, strokeDasharray: '12 8' }),
  Object.freeze({ id: 'nu-3000', wavenumber: 3000, strokeDasharray: '2 8' }),
]);

export const NARRATIVE_SOURCE_COMPONENTS: readonly TeachingComponent[] = Object.freeze(
  DEFAULT_TEACHING_COMPONENTS.map((component) => Object.freeze({ ...component })),
);
export const NARRATIVE_SAMPLE_TRANSMISSION: readonly number[] = Object.freeze([1, 0.55, 1]);

export function applySampleTransmission(
  components: readonly TeachingComponent[],
  transmission: readonly number[] = NARRATIVE_SAMPLE_TRANSMISSION,
): readonly TeachingComponent[] {
  if (components.length !== transmission.length) throw new RangeError('one transmission coefficient is required per component');
  return Object.freeze(components.map((component, index) => {
    const coefficient = transmission[index];
    if (!Number.isFinite(component.wavenumber) || component.wavenumber < 0 || !Number.isFinite(component.amplitude) || component.amplitude < 0) {
      throw new RangeError('components require finite nonnegative wavenumbers and finite amplitudes');
    }
    if (!Number.isFinite(coefficient) || coefficient < 0 || coefficient > 1) {
      throw new RangeError('transmission coefficients must be finite and within 0..1');
    }
    return Object.freeze({ wavenumber: component.wavenumber, amplitude: component.amplitude * coefficient });
  }));
}

export const NARRATIVE_SAMPLE_COMPONENTS = applySampleTransmission(NARRATIVE_SOURCE_COMPONENTS);
export const SLICE_SOURCE_RECORD = DEFAULT_TEACHING_RECORD;
export const SLICE_SAMPLE_RECORD = createTeachingRecord(NARRATIVE_SAMPLE_COMPONENTS);
export const NARRATIVE_SAMPLE_RECORD = SLICE_SAMPLE_RECORD;

export interface NarrativeMeasurementTerm {
  readonly id: NarrativeIdentity['id'] | string;
  readonly wavenumber: number;
  readonly amplitude: number;
  readonly phase: number;
  readonly ac: number;
  readonly raw: number;
}

export interface NarrativeMeasurement {
  readonly opdCm: number;
  readonly mirrorDisplacementUm: number;
  readonly terms: readonly NarrativeMeasurementTerm[];
  readonly totalRaw: number;
  readonly baseline: number;
  readonly ac: number;
}

export function evaluateNarrativeMeasurement(
  opdCm: number,
  components: readonly TeachingComponent[],
): NarrativeMeasurement {
  if (!Number.isFinite(opdCm)) throw new RangeError('OPD must be finite');
  const terms = components.map((component) => {
    if (!Number.isFinite(component.wavenumber) || component.wavenumber < 0 || !Number.isFinite(component.amplitude) || component.amplitude < 0) {
      throw new RangeError('components require finite nonnegative wavenumbers and finite amplitudes');
    }
    const phase = 2 * Math.PI * component.wavenumber * opdCm;
    const cosine = evaluateTeachingProbe(component.wavenumber, opdCm);
    const ac = component.amplitude * cosine;
    return Object.freeze({
      id: NARRATIVE_IDENTITIES.find((identity) => identity.wavenumber === component.wavenumber)?.id ?? `nu-${component.wavenumber}`,
      wavenumber: component.wavenumber,
      amplitude: component.amplitude,
      phase,
      ac,
      raw: component.amplitude * (1 + cosine),
    });
  });
  const baseline = components.reduce((sum, component) => sum + component.amplitude, 0);
  const totalRaw = terms.reduce((sum, term) => sum + term.raw, 0);
  return Object.freeze({
    opdCm,
    mirrorDisplacementUm: opdCm * 10000 / 2,
    terms: Object.freeze(terms),
    totalRaw,
    baseline,
    ac: totalRaw - baseline,
  });
}

export interface NarrativeBeat {
  readonly start: number;
  readonly end: number;
  readonly name: string;
}

export const NARRATIVE_BEATS: readonly NarrativeBeat[] = Object.freeze([
  Object.freeze({ start: 0, end: 360, name: 'measurement-goal' }),
  Object.freeze({ start: 360, end: 720, name: 'equal-total-puzzle' }),
  Object.freeze({ start: 720, end: 960, name: 'need-changing-features' }),
  Object.freeze({ start: 960, end: 1290, name: 'instrument-path' }),
  Object.freeze({ start: 1290, end: 1530, name: 'mirror-round-trip' }),
  Object.freeze({ start: 1530, end: 1890, name: 'phase-to-detector' }),
  Object.freeze({ start: 1890, end: 2340, name: 'different-rates' }),
  Object.freeze({ start: 2340, end: 2640, name: 'sample-attenuation' }),
  Object.freeze({ start: 2640, end: 3120, name: 'measurement-scan' }),
  Object.freeze({ start: 3120, end: 3270, name: 'remove-baseline' }),
  Object.freeze({ start: 3270, end: 3420, name: 'fourier-question' }),
  Object.freeze({ start: 3420, end: 6000, name: 'fourier-decoding' }),
  Object.freeze({ start: 6000, end: 6420, name: 'answer-and-next-question' }),
]);

