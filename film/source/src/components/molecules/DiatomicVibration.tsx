import React from 'react';
import { useCurrentFrame } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../../styles/visualSystem';

interface DiatomicVibrationProps {
  amplitude?: number;
  frequency?: number;
  showSpringMesh?: boolean;
  showDipoleVector?: boolean;
  showPhotonWave?: boolean;
  photonWavelength?: number;
  isResonant?: boolean;
  waveStraightenProgress?: number; // 0 = sinusoidal wave, 1 = straight beam
  moleculeOpacity?: number; // Opacity of the molecule (atoms and spring)
}

export const DiatomicVibration: React.FC<DiatomicVibrationProps> = ({
  amplitude = 18,
  frequency = 0.12,
  showSpringMesh = true,
  showDipoleVector = false,
  showPhotonWave = true,
  photonWavelength = 140,
  isResonant = false,
  waveStraightenProgress = 0,
  moleculeOpacity = 1,
}) => {
  const frame = useCurrentFrame();

  const centerAtomX = 960;
  const centerAtomY = 540;
  const equilibriumDist = 200;

  // Harmonic oscillation
  const displacement = Math.sin(frame * frequency) * amplitude;

  const m1 = 12; // Carbon
  const m2 = 16; // Oxygen

  const disp1 = displacement * (m2 / (m1 + m2));
  const disp2 = -(displacement * (m1 / (m1 + m2)));

  const atom1X = centerAtomX - equilibriumDist / 2 - disp1;
  const atom2X = centerAtomX + equilibriumDist / 2 + disp2;

  // Spring coils
  const coils = 10;
  const springStart = atom1X + 32;
  const springEnd = atom2X - 34;
  const springLength = springEnd - springStart;

  const springPath = Array.from({ length: coils * 2 + 1 })
    .map((_, i) => {
      const t = i / (coils * 2);
      const x = springStart + t * springLength;
      const yOffset = i === 0 || i === coils * 2 ? 0 : i % 2 === 1 ? -16 : 16;
      return `${i === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${(centerAtomY + yOffset).toFixed(1)}`;
    })
    .join(' ');

  // THE SIGNAL THREAD (Amber = Physical Infrared Light)
  // Continuous morph: from sinusoidal wave (explaining vibration) to straight beam (explaining path)
  const wavePhase = frame * 0.22;
  const photonPathPoints: string[] = [];
  const waveStartX = 80;
  const waveEndX = 1840;
  const waveStep = 6;

  const currentWaveAmp = (isResonant ? 32 : 16) * (1 - waveStraightenProgress);

  for (let x = waveStartX; x <= waveEndX; x += waveStep) {
    const sinOffset = Math.sin(((x - waveStartX) / photonWavelength) * 2 * Math.PI - wavePhase) * currentWaveAmp;
    const waveY = centerAtomY - 140 + sinOffset;
    photonPathPoints.push(`${x === waveStartX ? 'M' : 'L'} ${x} ${waveY.toFixed(1)}`);
  }
  const photonPath = photonPathPoints.join(' ');

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= THE SIGNAL THREAD: AMBER INFRARED BEAM / WAVE ================= */}
        {showPhotonWave && (
          <g>
            {/* Outer Warm Amber Halo */}
            <path
              d={photonPath}
              fill="none"
              stroke="#FFA756"
              strokeWidth={waveStraightenProgress > 0.5 ? 10 : 6}
              opacity={0.3}
              strokeLinecap="round"
            />
            {/* Core Intense Amber Wave / Beam */}
            <path
              d={photonPath}
              fill="none"
              stroke={waveStraightenProgress > 0.5 ? '#FFF3E0' : '#FFA756'}
              strokeWidth={waveStraightenProgress > 0.5 ? 3.5 : 2.5}
              strokeLinecap="round"
              opacity={isResonant ? 1.0 : 0.65}
            />
          </g>
        )}

        {/* ================= THE MOLECULE (ATOMS, SPRING, DIPOLE) ================= */}
        {moleculeOpacity > 0.001 && (
          <g opacity={moleculeOpacity}>
            {/* 1. Spring Coil Model */}
            {showSpringMesh && (
              <path
                d={springPath}
                fill="none"
                stroke={isResonant ? PALETTE.laserCyan : '#64748B'}
                strokeWidth={isResonant ? 3 : 2}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.85}
              />
            )}

            {/* 2. Chemical C=O Double Bond Lines (Fallback if spring mesh off) */}
            {!showSpringMesh && (
              <g>
                <line
                  x1={atom1X + 32}
                  y1={centerAtomY - 5}
                  x2={atom2X - 34}
                  y2={centerAtomY - 5}
                  stroke="#64748B"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
                <line
                  x1={atom1X + 32}
                  y1={centerAtomY + 5}
                  x2={atom2X - 34}
                  y2={centerAtomY + 5}
                  stroke="#64748B"
                  strokeWidth="4"
                  strokeLinecap="round"
                />
              </g>
            )}

            {/* Left Atom (Carbon) */}
            <g transform={`translate(${atom1X}, ${centerAtomY})`}>
              <circle r={32} fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />
              <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
                C
              </text>
            </g>

            {/* Right Atom (Oxygen) */}
            <g transform={`translate(${atom2X}, ${centerAtomY})`}>
              <circle
                r={34}
                fill={isResonant ? '#0369A1' : '#1E293B'}
                stroke={isResonant ? '#38BDF8' : '#64748B'}
                strokeWidth="2.5"
              />
              <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
                O
              </text>
            </g>

            {/* Dynamic Dipole Vector during resonance */}
            {showDipoleVector && Math.abs(displacement) > 4 && (
              <g>
                <line
                  x1={centerAtomX}
                  y1={centerAtomY - 75}
                  x2={centerAtomX + displacement * 2.5}
                  y2={centerAtomY - 75}
                  stroke="#00F5FF"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
                <circle cx={centerAtomX + displacement * 2.5} cy={centerAtomY - 75} r={4.5} fill="#00F5FF" />
              </g>
            )}
          </g>
        )}
      </svg>
    </div>
  );
};
