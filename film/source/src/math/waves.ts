/**
 * Wave physics and two-beam interference calculations
 */

export interface WaveComponent {
  wavenumber: number; // cm^-1
  amplitude: number;
  phase: number;      // radians
  color?: string;
  name?: string;
}

/**
 * Calculates monochromatic two-beam interference intensity
 * @param opd Optical path difference in cm (delta = 2 * mirror displacement)
 * @param wavenumber in cm^-1
 * @param intensity0 Base intensity
 */
export function calculateInterference(opd: number, wavenumber: number, intensity0: number = 1.0): {
  phaseDiff: number;
  intensity: number;
  isConstructive: boolean;
  isDestructive: boolean;
} {
  // delta_phi = 2 * pi * nu_bar * delta
  const phaseDiff = 2 * Math.PI * wavenumber * opd;
  const intensity = intensity0 * (1 + Math.cos(phaseDiff));
  const normalizedCos = Math.cos(phaseDiff);
  
  return {
    phaseDiff,
    intensity,
    isConstructive: normalizedCos > 0.85,
    isDestructive: normalizedCos < -0.85,
  };
}

/**
 * Generates spatial wave coordinates for visual beam rendering
 */
export function getWavePoints(
  startX: number,
  startY: number,
  endX: number,
  endY: number,
  wavelength: number,
  amplitude: number,
  phase: number,
  samples: number = 80
): Array<{ x: number; y: number }> {
  const dx = endX - startX;
  const dy = endY - startY;
  const length = Math.sqrt(dx * dx + dy * dy);
  const angle = Math.atan2(dy, dx);
  const normalAngle = angle + Math.PI / 2;

  const points: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const dist = t * length;
    const wave = Math.sin((dist / wavelength) * 2 * Math.PI - phase) * amplitude;
    
    const x = startX + Math.cos(angle) * dist + Math.cos(normalAngle) * wave;
    const y = startY + Math.sin(angle) * dist + Math.sin(normalAngle) * wave;
    points.push({ x, y });
  }

  return points;
}
