import {NARRATIVE_SAMPLE_COMPONENTS, NARRATIVE_SOURCE_COMPONENTS} from './narrativeTeaching';

// Two hypothetical samples under the SAME incident spectrum and measurement condition.
// Both only attenuate; neither is a background measurement or another detector channel.
export const AMBIGUITY_SOURCE = NARRATIVE_SOURCE_COMPONENTS;
export const AMBIGUITY_A = NARRATIVE_SAMPLE_COMPONENTS;
export const AMBIGUITY_B = Object.freeze([
  Object.freeze({wavenumber: 1000, amplitude: .35}),
  Object.freeze({wavenumber: 1750, amplitude: .75}),
  Object.freeze({wavenumber: 3000, amplitude: .35}),
]);
