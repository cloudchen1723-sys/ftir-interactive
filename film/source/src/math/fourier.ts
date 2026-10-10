/**
 * Fourier decomposition and spectral reconstruction
 * Real mathematical relationship between optical path difference (interferogram)
 * and wavenumber spectrum (frequency domain).
 */

import { ABSORPTION_BANDS, sourceEmission, sampleTransmission } from './interferogram';

export interface FourierComponent {
  wavenumber: number;      // cm^-1
  relativeFrequency: number;
  amplitude: number;
  spectralPower: number;   // Intensity in spectrum
  color: string;
  label: string;
}

/**
 * Key representative Fourier components extracted for the visual peeling climax in Act V
 */
export const REPRESENTATIVE_FOURIER_COMPONENTS: FourierComponent[] = [
  { wavenumber: 667,  relativeFrequency: 0.8, amplitude: 0.35, spectralPower: 0.18, color: '#38BDF8', label: '667 cm⁻¹ (CO₂ bend)' },
  { wavenumber: 1200, relativeFrequency: 1.4, amplitude: 0.55, spectralPower: 0.58, color: '#60A5FA', label: '1200 cm⁻¹ (C-O stretch)' },
  { wavenumber: 1715, relativeFrequency: 2.1, amplitude: 0.80, spectralPower: 0.15, color: '#F43F5E', label: '1715 cm⁻¹ (C=O carbonyl)' },
  { wavenumber: 2349, relativeFrequency: 2.9, amplitude: 0.70, spectralPower: 0.10, color: '#FB923C', label: '2349 cm⁻¹ (CO₂ asym stretch)' },
  { wavenumber: 2960, relativeFrequency: 3.7, amplitude: 0.60, spectralPower: 0.35, color: '#EAB308', label: '2960 cm⁻¹ (C-H stretch)' },
  { wavenumber: 3350, relativeFrequency: 4.4, amplitude: 0.50, spectralPower: 0.22, color: '#00F5FF', label: '3350 cm⁻¹ (O-H stretch)' },
];

/**
 * Discrete Fourier Transform (Cosine Transform) from simulated interferogram to recovered spectrum
 */
export function computeSpectrumFromInterferogram(
  interferogramPoints: Array<{ delta: number; intensity: number }>,
  targetWavenumbers: number[]
): Array<{ wavenumber: number; intensity: number }> {
  const result: Array<{ wavenumber: number; intensity: number }> = [];

  for (const nu of targetWavenumbers) {
    let sum = 0;
    for (const pt of interferogramPoints) {
      // B(nu) = integral I(delta) * cos(2 * pi * nu * delta) d(delta)
      const phase = 2 * Math.PI * (nu / 1000) * (pt.delta * 12);
      sum += pt.intensity * Math.cos(phase);
    }
    const normalizedIntensity = Math.max(0.02, Math.abs(sum) / interferogramPoints.length * 4);
    result.push({ wavenumber: nu, intensity: normalizedIntensity });
  }

  return result;
}

/**
 * Generates continuous spectrum curve (wavenumber vs % Transmittance or Absorbance)
 */
export function generateSpectrumCurve(
  minNu: number = 400,
  maxNu: number = 4000,
  samples: number = 240,
  mode: 'transmittance' | 'absorbance' | 'background' = 'transmittance'
): Array<{ wavenumber: number; value: number }> {
  const curve: Array<{ wavenumber: number; value: number }> = [];
  const step = (maxNu - minNu) / (samples - 1);

  for (let i = 0; i < samples; i++) {
    // Spectroscopy conventional display: Left to right is 4000 cm^-1 down to 400 cm^-1
    const nu = maxNu - i * step;
    const bg = sourceEmission(nu);
    const trans = sampleTransmission(nu);

    let val = 1.0;
    if (mode === 'background') {
      val = bg;
    } else if (mode === 'transmittance') {
      // 100% at baseline, dipping at absorption
      val = trans * 100;
    } else if (mode === 'absorbance') {
      // A = -log10(T)
      val = -Math.log10(Math.max(0.01, trans));
    }

    curve.push({ wavenumber: nu, value: val });
  }

  return curve;
}
