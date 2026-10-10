import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { TYPOGRAPHY } from '../../styles/visualSystem';

export const MolecularVibrationEngine: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame: 0 to 900 (30 seconds @ 30fps)
  // Phase 1 (0 - 380): Symmetric Stretch -> Δμ = 0 -> 红外非活性
  // Phase 2 (380 - 720): Asymmetric Stretch -> Dynamic Vector -> Δμ ≠ 0 -> 红外活性
  // Phase 3 (720 - 900): Dipole oscillation transforms into propagating IR wave

  const isPhase1 = frame < 380;
  const isPhase2 = frame >= 380 && frame < 720;
  const isPhase3 = frame >= 720;

  const centerX = 960;
  const centerY = 520;
  const bondRestLength = 170;

  // Natural harmonic frequency
  const oscSym = Math.sin(frame * 0.14) * 32;
  const oscAsym = Math.sin(frame * 0.16) * 35;

  let cX = centerX;
  let cY = centerY;
  let o1X = centerX - bondRestLength;
  let o2X = centerX + bondRestLength;

  if (isPhase1) {
    // Symmetric stretch: both O move in/out synchronously, C stationary
    o1X = centerX - bondRestLength - oscSym;
    o2X = centerX + bondRestLength + oscSym;
  } else {
    // Asymmetric stretch: C shifts opposite to the expanding/contracting bonds
    o1X = centerX - bondRestLength + oscAsym;
    o2X = centerX + bondRestLength + oscAsym;
    cX = centerX - oscAsym * 0.55;
  }

  // Dynamic dipole displacement
  const dipoleVectorX = (cX - centerX) * 4.2;

  // Typography animations
  // Phase 1 text: Δμ = 0 (200 - 360)
  const deltaMuZeroOpacity = interpolate(frame, [180, 220, 340, 370], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const irInactiveOpacity = interpolate(frame, [250, 290, 340, 370], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 2 text: Δμ ≠ 0 (500 - 700)
  const deltaMuActiveOpacity = interpolate(frame, [480, 520, 680, 710], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const irActiveOpacity = interpolate(frame, [560, 600, 680, 710], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Phase 3: Transition to propagating infrared wave
  const waveEmergeProgress = interpolate(frame, [720, 800], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const moleculeFadeOut = interpolate(frame, [760, 840], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Wave phase for emitted infrared packet
  const wavePhase = (frame - 720) * 0.35;

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <filter id="vectorGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="6" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>

          <filter id="warmIrGlow" x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="8" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* 1. MOLECULE GEOMETRY (CLEAN FLAT VECTOR) */}
        <g opacity={moleculeFadeOut}>
          {/* C=O Double Bond Left */}
          <line x1={o1X} y1={centerY - 5} x2={cX} y2={centerY - 5} stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
          <line x1={o1X} y1={centerY + 5} x2={cX} y2={centerY + 5} stroke="#64748B" strokeWidth="4" strokeLinecap="round" />

          {/* C=O Double Bond Right */}
          <line x1={cX} y1={centerY - 5} x2={o2X} y2={centerY - 5} stroke="#64748B" strokeWidth="4" strokeLinecap="round" />
          <line x1={cX} y1={centerY + 5} x2={o2X} y2={centerY + 5} stroke="#64748B" strokeWidth="4" strokeLinecap="round" />

          {/* Left Oxygen Atom (Flat clean circle) */}
          <g transform={`translate(${o1X}, ${centerY})`}>
            <circle r={32} fill="#1E293B" stroke="#E2E8F0" strokeWidth="3" />
            <text x="0" y="9" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
              O
            </text>
          </g>

          {/* Central Carbon Atom */}
          <g transform={`translate(${cX}, ${centerY})`}>
            <circle r={28} fill="#0F172A" stroke="#94A3B8" strokeWidth="2.5" />
            <text x="0" y="8" textAnchor="middle" fill="#F8FAFC" fontSize="20" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
              C
            </text>
          </g>

          {/* Right Oxygen Atom */}
          <g transform={`translate(${o2X}, ${centerY})`}>
            <circle r={32} fill="#1E293B" stroke="#E2E8F0" strokeWidth="3" />
            <text x="0" y="9" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
              O
            </text>
          </g>

          {/* DYNAMIC DIPOLE MOMENT VECTOR (Appears only during asymmetric mode) */}
          {isPhase2 && frame >= 460 && (
            <g>
              {/* Baseline center marker */}
              <line x1={centerX} y1={centerY - 100} x2={centerX} y2={centerY - 70} stroke="#475569" strokeWidth="1.5" strokeDasharray="3 3" />
              {/* Dynamic dipole vector arrow */}
              <line
                x1={centerX}
                y1={centerY - 85}
                x2={centerX + dipoleVectorX}
                y2={centerY - 85}
                stroke="#00F5FF"
                strokeWidth="4"
                filter="url(#vectorGlow)"
              />
              <circle cx={centerX + dipoleVectorX} cy={centerY - 85} r={5} fill="#00F5FF" filter="url(#vectorGlow)" />
            </g>
          )}
        </g>

        {/* 2. PHASE 3: CONTINUOUS WAVE TRANSFORMATION */}
        {isPhase3 && waveEmergeProgress > 0 && (
          <g opacity={waveEmergeProgress}>
            {/* Propagating Infrared Electromagnetic Waveform */}
            <path
              d={(() => {
                const startX = centerX - 100 * (1 - waveEmergeProgress);
                const endX = centerX + 800 * waveEmergeProgress;
                const pts: string[] = [];
                for (let px = startX; px <= endX; px += 4) {
                  const py = centerY + Math.sin(((px - centerX) / 36) * 2 * Math.PI - wavePhase) * 45 * waveEmergeProgress;
                  pts.push(`${px === startX ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
                }
                return pts.join(' ');
              })()}
              fill="none"
              stroke="#FFA756"
              strokeWidth="4"
              filter="url(#warmIrGlow)"
            />
          </g>
        )}
      </svg>

      {/* ================= LARGE VIDEO TYPOGRAPHY (NO CARDS, NO BOXES) ================= */}

      {/* PHASE 1: Symmetric Stretch */}
      {deltaMuZeroOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${centerY - 130}px`,
            textAlign: 'center',
            opacity: deltaMuZeroOpacity,
            fontFamily: TYPOGRAPHY.monoFont,
            fontSize: '36px',
            fontWeight: 600,
            color: '#E2E8F0',
            letterSpacing: '0.06em',
            textShadow: '0 0 20px rgba(0,0,0,0.9)',
          }}
        >
          CO₂ 对称伸缩 · Δμ = 0
        </div>
      )}

      {irInactiveOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${centerY + 95}px`,
            textAlign: 'center',
            opacity: irInactiveOpacity,
            fontFamily: TYPOGRAPHY.chineseSerif,
            fontSize: '32px',
            fontWeight: 400,
            color: '#94A3B8',
            letterSpacing: '0.12em',
            textShadow: '0 0 20px rgba(0,0,0,0.9)',
          }}
        >
          偶极矩不变 · 红外非活性
        </div>
      )}

      {/* PHASE 2: Asymmetric Stretch */}
      {deltaMuActiveOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${centerY - 130}px`,
            textAlign: 'center',
            opacity: deltaMuActiveOpacity,
            fontFamily: TYPOGRAPHY.monoFont,
            fontSize: '36px',
            fontWeight: 600,
            color: '#00F5FF',
            letterSpacing: '0.06em',
            textShadow: '0 0 25px rgba(0, 245, 255, 0.7), 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          CO₂ 不对称伸缩 · Δμ ≠ 0
        </div>
      )}

      {irActiveOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${centerY + 95}px`,
            textAlign: 'center',
            opacity: irActiveOpacity,
            fontFamily: TYPOGRAPHY.chineseSerif,
            fontSize: '34px',
            fontWeight: 400,
            color: '#00F5FF',
            letterSpacing: '0.14em',
            textShadow: '0 0 30px rgba(0, 245, 255, 0.8), 0 0 10px rgba(0,0,0,0.9)',
          }}
        >
          偶极矩动态改变 · 红外活性
        </div>
      )}
    </div>
  );
};
