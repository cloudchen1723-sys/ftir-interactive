/**
 * Deterministic Interferogram Simulation
 * Represents polychromatic infrared continuum with realistic molecular absorption notches.
 * Uses exact cosine sum formulation: I(delta) = sum_k S(nu_k) * [1 + cos(2 * pi * nu_k * delta)]
 */

export interface SpectrumPeak {
  wavenumber: number; // cm^-1
  amplitude: number;  // Peak strength
  width: number;      // FWHM in cm^-1
  modeName: string;
  molecule: string;
}

// Characteristic molecular absorption bands in the Mid-IR (4000 - 400 cm^-1)
export const ABSORPTION_BANDS: SpectrumPeak[] = [
  { wavenumber: 3350, amplitude: 0.75, width: 220, modeName: 'O-H Intermolecular Stretch', molecule: 'R-OH / Water' },
  { wavenumber: 2960, amplitude: 0.65, width: 90,  modeName: 'C-H Aliphatic Stretch', molecule: 'Hydrocarbon backbone' },
  { wavenumber: 2349, amplitude: 0.90, width: 45,  modeName: 'CO2 Asymmetric Stretch', molecule: 'Atmospheric CO2' },
  { wavenumber: 1715, amplitude: 0.95, width: 55,  modeName: 'C=O Carbonyl Stretch', molecule: 'Ester / Ketone' },
  { wavenumber: 1460, amplitude: 0.40, width: 70,  modeName: 'CH2 / CH3 Scissoring', molecule: 'Alkyl bend' },
  { wavenumber: 667,  amplitude: 0.80, width: 60,  modeName: 'CO2 Degenerate Bend', molecule: 'Atmospheric CO2' },
];

/**
 * Broadband Source emission profile (Globar ceramic emitter ~1200 K, Planck-like distribution)
 */
export function sourceEmission(nu: number): number {
  if (nu < 400 || nu > 4200) return 0;
  // Peak emission near 2200 cm^-1
  const x = (nu - 2200) / 1200;
  return Math.exp(-0.5 * x * x);
}

/**
 * Sample Transmission spectrum T(nu) = 1 - Absorbance(nu)
 */
export function sampleTransmission(nu: number): number {
  let absorbance = 0;
  for (const band of ABSORPTION_BANDS) {
    const dNu = nu - band.wavenumber;
    // Lorentzian / Gaussian profile
    const profile = Math.exp(-4 * Math.LN2 * (dNu * dNu) / (band.width * band.width));
    absorbance += band.amplitude * profile;
  }
  // Clamp transmission between 0.05 and 1.0
  return Math.max(0.05, 1 - Math.min(0.95, absorbance));
}

/**
 * Evaluates the detected intensity at a given Optical Path Difference (delta in cm or arbitrary scale)
 * For film animation, delta is normalized to [-deltaMax, +deltaMax].
 * @param delta Optical path difference
 * @param hasSample Whether sample absorption is active
 * @param numComponents Number of discrete spectral frequency bands to sum
 */
export function calculateInterferogramPoint(
  delta: number,
  hasSample: boolean = true,
  numComponents: number = 64
): number {
  let acSignal = 0;
  let totalDc = 0;

  const minNu = 500;
  const maxNu = 3800;
  const step = (maxNu - minNu) / numComponents;

  for (let i = 0; i < numComponents; i++) {
    const nu = minNu + i * step;
    let spectralIntensity = sourceEmission(nu);
    
    if (hasSample) {
      spectralIntensity *= sampleTransmission(nu);
    }

    // Convert nu (cm^-1) to practical scale for visual OPD range [-0.04, 0.04] cm
    // Modulating phase: 2 * pi * nu * delta
    const phase = 2 * Math.PI * (nu / 1000) * (delta * 12);
    acSignal += spectralIntensity * Math.cos(phase);
    totalDc += spectralIntensity;
  }

  // Normalized: center burst is 1.0, DC background is 0.5
  return (acSignal / totalDc) * 0.8;
}

/**
 * Generates an array of OPD vs Intensity points for drawing the interferogram curve
 */
export function generateInterferogramCurve(
  deltaRange: number,
  samples: number = 300,
  hasSample: boolean = true,
  componentCount: number = 48
): Array<{ delta: number; intensity: number }> {
  const points: Array<{ delta: number; intensity: number }> = [];
  const step = (deltaRange * 2) / (samples - 1);

  for (let i = 0; i < samples; i++) {
    const delta = -deltaRange + i * step;
    const intensity = calculateInterferogramPoint(delta, hasSample, componentCount);
    points.push({ delta, intensity });
  }

  return points;
}
