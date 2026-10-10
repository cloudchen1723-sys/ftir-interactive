import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { TYPOGRAPHY } from '../../styles/visualSystem';
import { calculateInterferogramPoint } from '../../math/interferogram';

export const InterferogramPlot: React.FC = () => {
  const frame = useCurrentFrame();

  // =========================================================================
  // MASTER TIMELINE IN ACT 4 (1100 frames = 36.7s @ 30fps)
  // THE SIGNAL THREAD: The Cyan Dot (●) leads the entire construction of the Interferogram!
  //
  // Stage 1 (0 - 260): Monochromatic cosine -> Multi-frequency beating
  //                    The Cyan Dot draws the wave dynamically from left to right!
  // Stage 2 (260 - 700): Zero Path Difference (ZPD) convergence
  //                      Cyan Dot surges into the Center Burst at δ = 0!
  //                      cos(2π ν̃ · 0) ≡ 1
  //                      ZPD · 零光程差
  // Stage 3 (700 - 1100): Full broadband interferogram completes.
  //                       The Cyan Dot rests at the curve tip, ready to detach into Act 5!
  // =========================================================================

  const centerX = 960;
  const centerY = 520;
  const spanX = 720;

  // 1. Stage 1: Dynamic Drawing by Cyan Dot (0 - 260)
  const isEarlyStage = frame < 280;
  const earlyDrawProgress = interpolate(frame, [0, 160], [0.08, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const singleToBeat = interpolate(frame, [150, 240], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Active tip coordinates for Stage 1
  const samples = 200;
  const currentSampleIdx = Math.floor(samples * earlyDrawProgress);
  const earlyT = (currentSampleIdx / samples) * 2 - 1;
  const earlyDotX = centerX + earlyT * spanX;
  const earlyF1 = Math.cos(earlyT * 24);
  const earlyF2 = Math.cos(earlyT * 30);
  const earlyVal = earlyF1 * (1 - singleToBeat) + 0.5 * (earlyF1 + earlyF2) * singleToBeat;
  const earlyDotY = centerY - earlyVal * 90;

  // 2. Stage 2: ZPD Decomposition & Convergence (260 - 720)
  const isZpdStage = frame >= 260 && frame < 740;
  const separateProgress = interpolate(frame, [260, 360], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zpdAlignProgress = interpolate(frame, [380, 520], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const collapseToBurst = interpolate(frame, [540, 680], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const cosEquationOpacity = interpolate(frame, [430, 470, 580, 620], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const zpdLabelOpacity = interpolate(frame, [600, 640, 710, 750], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const zpdComponents = [
    { freq: 0.6, yOffset: -180, color: '#38BDF8', nu: '800 cm⁻¹' },
    { freq: 1.2, yOffset: -60, color: '#00F5FF', nu: '1600 cm⁻¹' },
    { freq: 1.8, yOffset: 60, color: '#818CF8', nu: '2400 cm⁻¹' },
    { freq: 2.4, yOffset: 180, color: '#F472B6', nu: '3200 cm⁻¹' },
  ];

  // 3. Stage 3: Full Broadband Curve (700 - 1100)
  const isFullBroadband = frame >= 680;
  const broadbandDraw = interpolate(frame, [680, 860], [0.35, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const broadbandSamples = 260;
  const broadbandPts: Array<{ x: number; y: number }> = [];
  const maxBroadbandIdx = Math.floor(broadbandSamples * broadbandDraw);

  for (let i = 0; i <= maxBroadbandIdx; i++) {
    const t = (i / broadbandSamples) * 2 - 1;
    const px = centerX + t * spanX;
    const val = calculateInterferogramPoint(t * 0.045, true, 48);
    const py = centerY - val * 180;
    broadbandPts.push({ x: px, y: py });
  }

  const broadbandPathD = broadbandPts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const broadbandDot = broadbandPts[broadbandPts.length - 1] || { x: centerX, y: centerY };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* Central δ = 0 Reference Line */}
        <line
          x1={centerX}
          y1={120}
          x2={centerX}
          y2={960}
          stroke="#FFA756"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          opacity={isEarlyStage ? 0.2 : 0.6}
        />
        <text
          x={centerX}
          y={105}
          textAnchor="middle"
          fill="#FFA756"
          fontSize="20"
          fontFamily={TYPOGRAPHY.monoFont}
          fontWeight="bold"
          opacity={isEarlyStage ? 0.3 : 0.8}
        >
          δ = 0
        </text>

        {/* ================= 1. EARLY STAGE: SINGLE FREQUENCY & BEAT (0 - 260) ================= */}
        {isEarlyStage && (
          <g>
            <path
              d={(() => {
                const pts: string[] = [];
                for (let i = 0; i <= currentSampleIdx; i++) {
                  const t = (i / samples) * 2 - 1;
                  const px = centerX + t * spanX;
                  const f1 = Math.cos(t * 24);
                  const f2 = Math.cos(t * 30);
                  const val = f1 * (1 - singleToBeat) + 0.5 * (f1 + f2) * singleToBeat;
                  const py = centerY - val * 90;
                  pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
                }
                return pts.join(' ');
              })()}
              fill="none"
              stroke="#00F5FF"
              strokeWidth="3.5"
            />

            {/* THE CYAN DOT (●) Drawing the wave! */}
            <g transform={`translate(${earlyDotX}, ${earlyDotY})`}>
              <circle r={14} fill="#00F5FF" opacity="0.3" />
              <circle r={7.5} fill="#00F5FF" />
              <circle r={3} fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ================= 2. ZPD STAGE: SEPARATED COMPONENTS & CONVERGENCE (260 - 720) ================= */}
        {isZpdStage && (
          <g>
            {zpdComponents.map((comp, idx) => {
              const currentYOffset = comp.yOffset * separateProgress * (1 - collapseToBurst);
              const compBaseY = centerY + currentYOffset;

              const pts: string[] = [];
              const numP = 180;
              for (let i = 0; i <= numP; i++) {
                const t = (i / numP) * 2 - 1;
                const px = centerX + t * spanX;
                const randomPhase = (1 - zpdAlignProgress) * (idx * 1.8);
                const py = compBaseY - Math.cos(t * comp.freq * 12 + randomPhase) * (40 * (1 - collapseToBurst * 0.7));
                pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
              }
              const dStr = pts.join(' ');

              return (
                <g key={idx} opacity={1 - collapseToBurst * 0.9}>
                  {separateProgress > 0.4 && collapseToBurst < 0.6 && (
                    <line
                      x1={centerX - spanX}
                      y1={compBaseY}
                      x2={centerX + spanX}
                      y2={compBaseY}
                      stroke="#334155"
                      strokeWidth="1"
                      strokeDasharray="3 3"
                      opacity="0.4"
                    />
                  )}

                  <path d={dStr} fill="none" stroke={comp.color} strokeWidth="2.5" />

                  {/* Peak Marker at delta = 0 */}
                  {zpdAlignProgress > 0.6 && collapseToBurst < 0.7 && (
                    <circle cx={centerX} cy={compBaseY - 40} r={5} fill="#FFFFFF" />
                  )}

                  {separateProgress > 0.6 && collapseToBurst < 0.5 && (
                    <text
                      x={centerX - spanX + 15}
                      y={compBaseY - 14}
                      fill={comp.color}
                      fontSize="18"
                      fontFamily={TYPOGRAPHY.monoFont}
                      opacity={0.85}
                    >
                      ν̃ = {comp.nu}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Collapsing into Center Burst */}
            {collapseToBurst > 0.05 && (
              <path
                d={broadbandPathD}
                fill="none"
                stroke="#FFFFFF"
                strokeWidth={3 + collapseToBurst * 1.5}
                opacity={collapseToBurst}
              />
            )}
          </g>
        )}

        {/* ================= 3. FULL BROADBAND STAGE (700 - 1100) ================= */}
        {isFullBroadband && (
          <g>
            <path
              d={broadbandPathD}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3.5"
            />

            {/* THE CYAN DOT (●) Resting at the Active Front / Tip */}
            <g transform={`translate(${broadbandDot.x}, ${broadbandDot.y})`}>
              <circle r={14} fill="#00F5FF" opacity="0.3" />
              <circle r={7.5} fill="#00F5FF" />
              <circle r={3} fill="#FFFFFF" />
            </g>
          </g>
        )}
      </svg>

      {/* Large Clean Equations */}
      {cosEquationOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '180px',
            textAlign: 'center',
            opacity: cosEquationOpacity,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.monoFont,
              fontSize: '46px',
              fontWeight: 600,
              color: '#FFFFFF',
              letterSpacing: '0.08em',
              textShadow: '0 0 35px rgba(0,0,0,0.95)',
            }}
          >
            cos(2π · ν̃ · 0) ≡ 1
          </div>
        </div>
      )}

      {zpdLabelOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '180px',
            textAlign: 'center',
            opacity: zpdLabelOpacity,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.monoFont,
              fontSize: '44px',
              fontWeight: 600,
              color: '#FFA756',
              letterSpacing: '0.08em',
              textShadow: '0 0 30px rgba(0,0,0,0.95)',
            }}
          >
            ZPD · 零光程差
          </div>
        </div>
      )}
    </div>
  );
};
