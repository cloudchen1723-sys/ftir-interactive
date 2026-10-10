import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';

export const Act9SpectrumInterpretation: React.FC<{absorbance?:boolean}> = ({absorbance=false}) => {
  const frame = useCurrentFrame();

  // Local frame in Act 9: 0 to 660 (22 seconds @ 30fps)
  const centerX = 960;
  const expand=interpolate(frame,[0,180],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
  const plotLeft = absorbance?460-220*expand:240;
  const plotWidth = absorbance?1000+440*expand:1440;
  const baselineY = absorbance?650:400;

  // Nu to X mapping (4000 -> 400)
  const nuToX = (nu: number) => {
    const t = (4000 - nu) / 3600;
    return plotLeft + t * plotWidth;
  };

  const coNu = 1715;
  const coX = nuToX(coNu);
  const coDipY = absorbance?baselineY+Math.log10(.14)*270:baselineY+190;

  // Shot 33 dimming through contrast and isolation
  const otherBandsDim = interpolate(frame, [240, 290], [1, 0.15], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const highlight1715Opacity = interpolate(frame, [250, 280], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Shot 34 morph into C=O bond oscillation (480 - 660)
  const morphProgress = interpolate(frame, [480, 540], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bondVibrationAmp = interpolate(frame, [520, 580], [0, 20], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bondOsc = Math.sin((frame - 480) * 0.28) * bondVibrationAmp;

  const molX = coX;
  const molY = coDipY + 130;

  // Spectrum points calculation
  const n = absorbance ? 140 : 160;
  const pts: Array<{ x: number; y: number; nu: number }> = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = plotLeft + t * plotWidth;
    const nu = 4000 - t * 3600;
    let trans = 0.95;
    if (Math.abs(nu - 1715) < 90) {
      trans = (absorbance?.14:.12) + (absorbance?.81:.83) * (1 - Math.exp(-Math.pow((nu - 1715) / 45, 2)));
    } else if (Math.abs(nu - 2960) < (absorbance?100:110)) {
      trans = 0.45 + 0.5 * (1 - Math.exp(-Math.pow((nu - 2960) / (absorbance?60:65), 2)));
    }
    const py = absorbance?baselineY+Math.log10(trans)*270:baselineY+(1-trans)*220;
    pts.push({ x: px, y: py, nu });
  }

  const specD = pts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= 1. TRANSMITTANCE SPECTRUM (SHOT 32) ================= */}
        <g opacity={otherBandsDim}>
          {/* Baseline 100% */}
          <line x1={plotLeft} y1={baselineY} x2={plotLeft + plotWidth} y2={baselineY} stroke={PALETTE.grayInactive} strokeWidth="1" strokeDasharray="4 4" />
          <text x={plotLeft - 70} y={baselineY + 6} fill={PALETTE.white} fontSize="24" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
            {absorbance?'0 A':'100% T'}
          </text>

          {/* Wavenumber Axis */}
          <line x1={plotLeft} y1={absorbance?700:baselineY+250} x2={plotLeft + plotWidth} y2={absorbance?700:baselineY+250} stroke={PALETTE.grayInactive} strokeWidth="2" />
          <text x={plotLeft} y={absorbance?740:baselineY+285} fill={PALETTE.grayContext} fontSize="24" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
            4000 cm⁻¹
          </text>
          <text x={plotLeft + plotWidth} y={absorbance?740:baselineY+285} textAnchor="end" fill={PALETTE.grayContext} fontSize="24" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
            400 cm⁻¹
          </text>
          {!absorbance&&<text x={centerX} y={baselineY + 285} textAnchor="middle" fill={PALETTE.white} fontSize="24" fontFamily={TYPOGRAPHY.sans} fontWeight="500">
            波数 Wavenumber [cm⁻¹]
          </text>}

          {/* Full spectrum curve */}
          <path d={specD} fill="none" stroke={PALETTE.cyanSignal} strokeWidth="3" />
        </g>

        {/* ================= 2. SHOT 33: HIGHLIGHT 1715 CM⁻¹ BAND (RESTRAINED RED) ================= */}
        {frame >= 240 && (
          <g>
            <circle cx={coX} cy={coDipY} r={6} fill={PALETTE.redAbsorption} />
          </g>
        )}

        {/* ================= 3. SHOT 34: NOTCH MORPHS INTO C=O BOND VIBRATION ================= */}
        {morphProgress > 0 && (
          <g opacity={morphProgress}>
            <line x1={coX} y1={coDipY + 10} x2={molX} y2={molY - 45} stroke={PALETTE.redAbsorption} strokeWidth="1.5" strokeDasharray="4 4" opacity={0.6} />

            {/* C=O Double Bond lines */}
            <line
              x1={molX - 50 - bondOsc * 0.4}
              y1={molY - 5}
              x2={molX + 50 + bondOsc * 0.6}
              y2={molY - 5}
              stroke={PALETTE.redAbsorption}
              strokeWidth="3.5"
              strokeLinecap="round"
            />
            <line
              x1={molX - 50 - bondOsc * 0.4}
              y1={molY + 5}
              x2={molX + 50 + bondOsc * 0.6}
              y2={molY + 5}
              stroke={PALETTE.redAbsorption}
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {/* Carbon Atom */}
            <g transform={`translate(${molX - 50 - bondOsc * 0.4}, ${molY})`}>
              <circle r={26} fill="#141A24" stroke={PALETTE.grayContext} strokeWidth="2.5" />
              <text x="0" y="8" textAnchor="middle" fill={PALETTE.white} fontSize="22" fontFamily={TYPOGRAPHY.sans} fontWeight="bold">
                C
              </text>
            </g>

            {/* Oxygen Atom */}
            <g transform={`translate(${molX + 50 + bondOsc * 0.6}, ${molY})`}>
              <circle r={28} fill="#181216" stroke={PALETTE.redAbsorption} strokeWidth="2.5" />
              <text x="0" y="8" textAnchor="middle" fill={PALETTE.white} fontSize="22" fontFamily={TYPOGRAPHY.sans} fontWeight="bold">
                O
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* On-screen: 1715 cm⁻¹ — Enlarged to 38px */}
      {highlight1715Opacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: `${coX - 85}px`,
            top: `${coDipY + 20}px`,
            opacity: highlight1715Opacity,
            fontFamily: TYPOGRAPHY.mono,
            fontSize: '38px',
            fontWeight: 700,
            color: PALETTE.redAbsorption,
            letterSpacing: '0.04em',
          }}
        >
          1715 cm⁻¹
        </div>
      )}

      {/* On-screen: C=O 伸缩振动 — Enlarged to 44px */}
      {morphProgress > 0.5 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: `${molY + 60}px`,
            textAlign: 'center',
            opacity: interpolate(morphProgress, [0.5, 1], [0, 1]),
          }}
        >
          <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: '44px', fontWeight: 600, color: PALETTE.white, letterSpacing: '0.06em' }}>
            C=O 伸缩振动
          </div>
        </div>
      )}
    </div>
  );
};
