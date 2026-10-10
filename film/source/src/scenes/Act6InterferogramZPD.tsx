import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';
import { DEFAULT_TEACHING_RECORD, DEFAULT_TEACHING_COMPONENTS } from '../math/fourierTeaching';

export const Act6InterferogramZPD: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame in Act 6: 0 to 900 (30 seconds @ 30fps)
  const centerX = 960;
  const centerY = 520;
  const spanX = 720;

  // Shot 20 & 21: Early wave drawing by Cyan Dot
  const isEarly = frame < 510;
  const earlyDrawProgress = interpolate(frame, [0, 200], [0.08, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const singleToBeat = interpolate(frame, [250, 380], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // On-screen: 一个波数 (60 - 200)
  const oneWavenumberTextOpacity = interpolate(frame, [60, 90, 180, 210], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const samples = 200;
  const currentSampleIdx = Math.floor(samples * earlyDrawProgress);
  const earlyT = (currentSampleIdx / samples) * 2 - 1;
  const earlyDotX = centerX + earlyT * spanX;
  const earlyF1 = Math.cos(earlyT * 24);
  const earlyF2 = Math.cos(earlyT * 30);
  const earlyVal = earlyF1 * (1 - singleToBeat) + 0.5 * (earlyF1 + earlyF2) * singleToBeat;
  const earlyDotY = centerY - earlyVal * 90;

  // Shot 22: ZPD Stage (510 - 900)
  const isZpd = frame >= 480;
  const separateProgress = interpolate(frame, [510, 620], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zpdAlignProgress = interpolate(frame, [640, 750], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const collapseToBurst = interpolate(frame, [760, 860], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const cosEquationOpacity = interpolate(frame, [690, 720, 780, 810], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const zpdLabelOpacity = interpolate(frame, [820, 850, 885, 900], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const zpdComponents = [
    { freq: 0.6, yOffset: -180, color: PALETTE.grayContext, nu: '800 cm⁻¹' },
    { freq: 1.2, yOffset: -60, color: PALETTE.cyanSignal, nu: '1600 cm⁻¹' },
    { freq: 1.8, yOffset: 60, color: PALETTE.white, nu: '2400 cm⁻¹' },
    { freq: 2.4, yOffset: 180, color: PALETTE.grayContext, nu: '3200 cm⁻¹' },
  ];

  const broadbandSamples = DEFAULT_TEACHING_RECORD.sampleCount;
  const broadbandPts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i < broadbandSamples; i++) {
    const opd = DEFAULT_TEACHING_RECORD.opdCm[i];
    const px = centerX + (opd / (DEFAULT_TEACHING_RECORD.opdSpanCm / 2)) * spanX;
    const val = DEFAULT_TEACHING_RECORD.signal[i];
    const py = centerY - val * (180 / DEFAULT_TEACHING_COMPONENTS.reduce((sum, component) => sum + component.amplitude, 0));
    broadbandPts.push({ x: px, y: py });
  }
  const broadbandPathD = broadbandPts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* Central δ = 0 Reference Line */}
        {frame >= 860 && <text x={centerX + spanX} y={100} textAnchor="end" fill={PALETTE.grayContext} fontSize="16" fontFamily={TYPOGRAPHY.sans}>合成教学信号</text>}
        <line x1={centerX} y1={120} x2={centerX} y2={960} stroke={PALETTE.grayInactive} strokeWidth="1" strokeDasharray="3 3" />
        <text x={centerX} y={100} textAnchor="middle" fill={PALETTE.white} fontSize="24" fontFamily={TYPOGRAPHY.mono} fontWeight="bold">
          δ = 0
        </text>

        {/* ================= 1. SHOT 20 & 21: EARLY DRAWING BY CYAN DOT ================= */}
        {isEarly && (
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
              stroke={PALETTE.cyanSignal}
              strokeWidth="3.5"
            />

            <g transform={`translate(${earlyDotX}, ${earlyDotY})`}>
              <circle r={7} fill={PALETTE.cyanSignal} />
              <circle r={2.5} fill={PALETTE.white} />
            </g>
          </g>
        )}

        {/* ================= 2. SHOT 22: ZPD SEPARATION & COLLAPSE INTO BURST ================= */}
        {isZpd && (
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
                <g key={idx} opacity={1 - collapseToBurst * 0.95}>
                  <path d={dStr} fill="none" stroke={comp.color} strokeWidth="2.5" />
                  {zpdAlignProgress > 0.6 && collapseToBurst < 0.6 && (
                    <circle cx={centerX} cy={compBaseY - 40} r={5} fill={PALETTE.white} />
                  )}
                  {separateProgress > 0.6 && collapseToBurst < 0.4 && (
                    <text x={centerX - spanX + 15} y={compBaseY - 16} fill={comp.color} fontSize="22" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
                      ν̃ = {comp.nu}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Collapsed Broadband Center Burst */}
            {collapseToBurst > 0.05 && (
              <path
                d={broadbandPathD}
                fill="none"
                stroke={PALETTE.white}
                strokeWidth={3.5}
                opacity={collapseToBurst}
              />
            )}
          </g>
        )}
      </svg>

      {/* On-screen: 一个波数 — Enlarged to 44px */}
      {oneWavenumberTextOpacity > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '220px', textAlign: 'center', opacity: oneWavenumberTextOpacity }}>
          <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: '44px', fontWeight: 600, color: PALETTE.cyanSignal, letterSpacing: '0.06em' }}>
            一个波数
          </div>
        </div>
      )}

      {/* Shot 22 Equation: cos(2π ν̃ · 0) = 1 — Enlarged to 50px */}
      {cosEquationOpacity > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '170px', textAlign: 'center', opacity: cosEquationOpacity }}>
          <div style={{ fontFamily: TYPOGRAPHY.mono, fontSize: '50px', fontWeight: 600, color: PALETTE.white, letterSpacing: '0.04em' }}>
            cos(2π · ν̃ · 0) = 1
          </div>
        </div>
      )}

      {/* Shot 22 Label: ZPD 零光程差 — Enlarged to 46px */}
      {zpdLabelOpacity > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '170px', textAlign: 'center', opacity: zpdLabelOpacity }}>
          <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: '46px', fontWeight: 600, color: PALETTE.white, letterSpacing: '0.06em' }}>
            ZPD · 零光程差
          </div>
        </div>
      )}
    </div>
  );
};
