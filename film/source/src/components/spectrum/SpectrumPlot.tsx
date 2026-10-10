import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { TYPOGRAPHY } from '../../styles/visualSystem';

export const SpectrumTransmissionEngine: React.FC = () => {
  const frame = useCurrentFrame();

  // =========================================================================
  // THE SIGNAL THREAD IN ACT 6:
  // Stage 1 (0 - 360):   Background Correction: B(ν̃) & S(ν̃) -> T(ν̃) = S(ν̃) / B(ν̃)
  // Stage 2 (360 - 850): THE CYAN DOT (●) glides along the spectrum, finds 1715 cm⁻¹!
  //                      Dot descends from the notch into the C=O bond center!
  //                      The bond begins stretching vibration in exact resonance!
  // =========================================================================

  const width = 1600;
  const height = 700;
  const plotLeft = 140;
  const plotTop = 180;
  const plotWidth = width - 280;
  const plotHeight = height - 260;

  const minNu = 400;
  const maxNu = 4000;

  const nuToX = (nu: number) => {
    const t = (maxNu - nu) / (maxNu - minNu);
    return plotLeft + t * plotWidth;
  };

  const transToY = (tPercent: number) => {
    const norm = tPercent / 100;
    return plotTop + (1 - norm) * plotHeight;
  };

  // Stage 1 progression: 0 to 360
  const ratioMorph = interpolate(frame, [140, 260], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ratioEqOpacity = interpolate(frame, [60, 90, 280, 310], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Stage 2 progression: 360 to 850
  // Cyan Dot glides along spectrum from 380 to 520, arriving at 1715 cm⁻¹
  const dotTravelProgress = interpolate(frame, [380, 520], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Dot descends from 1715 cm⁻¹ dip down into molecule: 540 to 620
  const dotDescendProgress = interpolate(frame, [540, 620], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Background spectrum dimming after 1715 is found
  const otherBandsDim = interpolate(frame, [520, 580], [1, 0.12], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Vibration amplification once dot arrives at bond center
  const vibrationProgress = interpolate(frame, [600, 680], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // 1715 cm⁻¹ coordinates
  const coNu = 1715;
  const coX = nuToX(coNu);
  const coY = transToY(14);

  // Background, Sample, and Transmittance points
  const samples = 220;
  const bgPts: Array<{ x: number; y: number }> = [];
  const samplePts: Array<{ x: number; y: number }> = [];
  const transPts: Array<{ x: number; y: number; nu: number; trans: number }> = [];

  for (let i = 0; i <= samples; i++) {
    const t = i / samples;
    const nu = maxNu - t * (maxNu - minNu);
    const px = plotLeft + t * plotWidth;

    const normNu = (nu - 2100) / 1100;
    const globar = Math.exp(-0.5 * normNu * normNu);
    const co2Atm = nu > 2300 && nu < 2400 ? 0.35 : 1.0;
    const bgVal = globar * co2Atm;
    const bgY = plotTop + 140 - bgVal * 120;
    bgPts.push({ x: px, y: bgY });

    let trans = 0.95;
    if (Math.abs(nu - 1715) < 90) {
      trans = 0.14 + 0.81 * (1 - Math.exp(-Math.pow((nu - 1715) / 45, 2)));
    } else if (Math.abs(nu - 2960) < 100) {
      trans = 0.45 + 0.5 * (1 - Math.exp(-Math.pow((nu - 2960) / 60, 2)));
    }
    const sampleY = plotTop + 140 - bgVal * trans * 120;
    samplePts.push({ x: px, y: sampleY });

    const tY = transToY(trans * 100);
    transPts.push({ x: px, y: tY, nu, trans });
  }

  const activeCurveD = transPts
    .map((pt, idx) => {
      const startY = samplePts[idx].y;
      const targetY = pt.y;
      const py = startY * (1 - ratioMorph) + targetY * ratioMorph;
      return `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');

  const bgCurveD = bgPts
    .map((pt, idx) => `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`)
    .join(' ');

  // THE CYAN DOT traveling along the spectrum to 1715 cm⁻¹:
  // Starts at 3500 cm⁻¹ (idx ≈ 30), travels to 1715 cm⁻¹ (idx ≈ 140)
  const startDotIdx = 30;
  const targetDotIdx = Math.floor(samples * ((maxNu - 1715) / (maxNu - minNu)));
  const currentDotIdx = Math.floor(startDotIdx + dotTravelProgress * (targetDotIdx - startDotIdx));
  const activeDotPt = transPts[Math.min(transPts.length - 1, currentDotIdx)] || transPts[0];

  // Molecule position in center lower field
  const molCenterX = coX;
  const molCenterY = coY - 140;

  // Dot position: moves along spectrum, then descends into molCenterX, molCenterY!
  const dotX = dotDescendProgress < 0.05 ? activeDotPt.x : activeDotPt.x * (1 - dotDescendProgress) + molCenterX * dotDescendProgress;
  const dotY = dotDescendProgress < 0.05 ? activeDotPt.y : activeDotPt.y * (1 - dotDescendProgress) + molCenterY * dotDescendProgress;

  // Harmonic oscillation of C=O bond triggered by arrival of Cyan Dot!
  const bondOsc = Math.sin(frame * 0.28) * (20 * vibrationProgress);

  return (
    <div style={{ position: 'relative', width: `${width}px`, height: `${height}px`, pointerEvents: 'none' }}>
      <svg width={width} height={height} style={{ position: 'absolute', inset: 0 }}>
        {/* ================= 1. STAGE 1: BACKGROUND B(ν̃) & SAMPLE S(ν̃) ================= */}
        {ratioMorph < 0.98 && (
          <g opacity={1 - ratioMorph}>
            <path d={bgCurveD} fill="none" stroke="#FFA756" strokeWidth="2.5" opacity="0.8" />
            <text x={plotLeft + plotWidth - 120} y={plotTop + 50} fill="#FFA756" fontSize="22" fontFamily={TYPOGRAPHY.monoFont}>
              B(ν̃) 背景单光束
            </text>

            <text x={plotLeft + plotWidth - 120} y={plotTop + 140} fill="#00F5FF" fontSize="22" fontFamily={TYPOGRAPHY.monoFont}>
              S(ν̃) 样品单光束
            </text>
          </g>
        )}

        {/* 100% Baseline Line */}
        {ratioMorph > 0.4 && (
          <g opacity={ratioMorph * otherBandsDim}>
            <line x1={plotLeft} y1={transToY(100)} x2={plotLeft + plotWidth} y2={transToY(100)} stroke="#334155" strokeWidth="1.5" strokeDasharray="6 6" />
            <text x={plotLeft - 75} y={transToY(100) + 7} fill="#64748B" fontSize="20" fontFamily={TYPOGRAPHY.monoFont}>
              100% T
            </text>
            <text x={plotLeft - 60} y={transToY(0) + 7} fill="#64748B" fontSize="20" fontFamily={TYPOGRAPHY.monoFont}>
              0% T
            </text>
          </g>
        )}

        {/* Main Spectrum Curve */}
        <path
          d={activeCurveD}
          fill="none"
          stroke="#00F5FF"
          strokeWidth={ratioMorph > 0.8 ? 3.5 : 2.5}
          opacity={frame >= 520 ? otherBandsDim : 1}
        />

        {/* The 1715 cm⁻¹ isolated dip stays bright when other bands dim */}
        {frame >= 520 && (
          <circle cx={coX} cy={coY} r={7} fill="#00F5FF" />
        )}

        {/* ================= 2. THE SIGNAL THREAD: THE CYAN DOT (●) GLIDES & DESCENDS ================= */}
        {frame >= 360 && (
          <g transform={`translate(${dotX}, ${dotY})`}>
            <circle r={14} fill="#00F5FF" opacity={0.35} />
            <circle r={7.5} fill="#00F5FF" />
            <circle r={3} fill="#FFFFFF" />
          </g>
        )}

        {/* ================= 3. C=O MOLECULAR VIBRATION (EMERGES WHEN DOT ARRIVES) ================= */}
        {dotDescendProgress > 0.3 && (
          <g opacity={dotDescendProgress}>
            {/* C=O Double Bond lines */}
            <line
              x1={molCenterX - 65 - bondOsc * 0.4}
              y1={molCenterY - 6}
              x2={molCenterX + 65 + bondOsc * 0.6}
              y2={molCenterY - 6}
              stroke="#F43F5E"
              strokeWidth="4"
              strokeLinecap="round"
            />
            <line
              x1={molCenterX - 65 - bondOsc * 0.4}
              y1={molCenterY + 6}
              x2={molCenterX + 65 + bondOsc * 0.6}
              y2={molCenterY + 6}
              stroke="#F43F5E"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Carbon Atom */}
            <g transform={`translate(${molCenterX - 65 - bondOsc * 0.4}, ${molCenterY})`}>
              <circle r={32} fill="#1E293B" stroke="#94A3B8" strokeWidth="2.5" />
              <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
                C
              </text>
            </g>

            {/* Oxygen Atom */}
            <g transform={`translate(${molCenterX + 65 + bondOsc * 0.6}, ${molCenterY})`}>
              <circle r={34} fill="#881337" stroke="#FDA4AF" strokeWidth="2.5" />
              <text x="0" y="8" textAnchor="middle" fill="#FFFFFF" fontSize="22" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
                O
              </text>
            </g>
          </g>
        )}

        {/* Wavenumber Axis Scale */}
        <g opacity={otherBandsDim}>
          <text x={plotLeft} y={transToY(0) + 40} fill="#64748B" fontSize="22" fontFamily={TYPOGRAPHY.monoFont}>
            4000 cm⁻¹
          </text>
          <text x={plotLeft + plotWidth} y={transToY(0) + 40} textAnchor="end" fill="#64748B" fontSize="22" fontFamily={TYPOGRAPHY.monoFont}>
            400 cm⁻¹
          </text>
        </g>
      </svg>

      {/* Stage 1 Ratio Equation */}
      {ratioEqOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '30px',
            textAlign: 'center',
            opacity: ratioEqOpacity,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.monoFont,
              fontSize: '44px',
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '0.08em',
              textShadow: '0 0 30px rgba(0,0,0,0.95)',
            }}
          >
            T(ν̃) = S(ν̃) / B(ν̃)
          </div>
        </div>
      )}

      {/* Stage 2 Isolated Label: 1715 cm⁻¹ */}
      {dotTravelProgress > 0.8 && (
        <div
          style={{
            position: 'absolute',
            left: `${coX - 85}px`,
            top: `${coY + 30}px`,
            fontFamily: TYPOGRAPHY.monoFont,
            fontSize: '38px',
            fontWeight: 600,
            color: '#00F5FF',
            letterSpacing: '0.06em',
            textShadow: '0 0 25px rgba(0,245,255,0.8)',
            opacity: interpolate(dotTravelProgress, [0.8, 1], [0, 1]),
          }}
        >
          1715 cm⁻¹
        </div>
      )}

      {/* Stage 2 Isolated Label: C=O 伸缩振动 */}
      {vibrationProgress > 0.3 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${molCenterY - 110}px`,
            textAlign: 'center',
            fontFamily: TYPOGRAPHY.chineseSerif,
            fontSize: '42px',
            fontWeight: 400,
            color: '#FFFFFF',
            letterSpacing: '0.14em',
            textShadow: '0 0 35px rgba(0,0,0,0.95)',
            opacity: interpolate(vibrationProgress, [0.3, 0.7], [0, 1]),
          }}
        >
          C=O 伸缩振动
        </div>
      )}
    </div>
  );
};
