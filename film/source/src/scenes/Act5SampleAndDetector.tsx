import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';

export const Act5SampleAndDetector: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame in Act 5: 0 to 720 (24 seconds @ 30fps)
  const startX = 220;
  const sampleX = 960;
  const detX = 1460;
  const centerY = 520;

  // Beam entry
  const beamEntryProgress = interpolate(frame, [0, 160], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Opening beam into parallel strands (180 - 450)
  const openStrandsProgress = interpolate(frame, [180, 240, 420, 460], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const strands = [
    { label: 'ν̃₁ (3000 cm⁻¹)', yOffset: -90, isAttenuated: false },
    { label: 'ν̃₂ (2350 cm⁻¹)', yOffset: -30, isAttenuated: false },
    { label: 'ν̃₃ (1715 cm⁻¹)', yOffset: 30, isAttenuated: true },
    { label: 'ν̃₄ (1000 cm⁻¹)', yOffset: 90, isAttenuated: false },
  ];

  const attenuationProgress = interpolate(frame, [250, 340], [1, 0.25], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const beamToDetProgress = interpolate(frame, [460, 540], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const lightToSignalProgress = interpolate(frame, [540, 590], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const traceDraw = interpolate(frame, [580, 720], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const traceSpan = 300;
  const dotX = detX + 40 + traceDraw * traceSpan;
  const dotY = centerY - Math.cos(traceDraw * 6 * Math.PI) * 35;

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= 1. SAMPLE CELL ================= */}
        <g transform={`translate(${sampleX}, ${centerY})`}>
          <rect
            x={-14}
            y={-150}
            width={28}
            height={300}
            rx={2}
            fill="rgba(125, 136, 152, 0.08)"
            stroke={PALETTE.grayContext}
            strokeWidth="2"
          />
          <text x={0} y={185} textAnchor="middle" fill={PALETTE.white} fontSize="24" fontFamily={TYPOGRAPHY.sans} fontWeight="500" letterSpacing="0.04em">
            SAMPLE 样品
          </text>
        </g>

        {/* ================= 2. DETECTOR ================= */}
        <g transform={`translate(${detX}, ${centerY})`}>
          <rect x={-26} y={-48} width={52} height={96} rx={2} fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="2" />
          <rect
            x={-20}
            y={-34}
            width={7}
            height={68}
            fill={lightToSignalProgress > 0.5 ? PALETTE.cyanSignal : PALETTE.amberLight}
            opacity="0.9"
          />
          <text x={0} y={76} textAnchor="middle" fill={PALETTE.grayContext} fontSize="20" fontFamily={TYPOGRAPHY.mono} fontWeight="bold">
            DETECTOR
          </text>
        </g>

        {/* ================= 3. PHYSICAL AMBER OPTICAL BEAM ================= */}
        {openStrandsProgress < 0.98 && (
          <g opacity={1 - openStrandsProgress}>
            <line
              x1={startX}
              y1={centerY}
              x2={startX + (sampleX - 14 - startX) * beamEntryProgress}
              y2={centerY}
              stroke={PALETTE.amberLight}
              strokeWidth="3.5"
              strokeLinecap="round"
            />

            {beamToDetProgress > 0 && (
              <g opacity={1 - lightToSignalProgress}>
                <line
                  x1={sampleX + 14}
                  y1={centerY}
                  x2={sampleX + 14 + (detX - 26 - (sampleX + 14)) * beamToDetProgress}
                  y2={centerY}
                  stroke={PALETTE.amberLight}
                  strokeWidth="3.5"
                  strokeLinecap="round"
                />
              </g>
            )}
          </g>
        )}

        {/* ================= 4. PARALLEL SPECTRAL AMPLITUDE STRANDS ================= */}
        {openStrandsProgress > 0.02 && (
          <g opacity={openStrandsProgress}>
            {strands.map((strand, idx) => {
              const strandY = centerY + strand.yOffset * openStrandsProgress;
              const preWidth = 6;
              const postWidth = strand.isAttenuated ? 6 * attenuationProgress : 6;

              return (
                <g key={idx}>
                  {/* Strand label — Enlarged to 22px */}
                  <text
                    x={sampleX - 350}
                    y={strandY + 7}
                    textAnchor="end"
                    fill={PALETTE.grayContext}
                    fontSize="22"
                    fontFamily={TYPOGRAPHY.mono}
                  >
                    {strand.label}
                  </text>

                  {/* Left segment */}
                  <line
                    x1={sampleX - 330}
                    y1={strandY}
                    x2={sampleX - 14}
                    y2={strandY}
                    stroke={PALETTE.amberLight}
                    strokeWidth={preWidth}
                    strokeLinecap="round"
                  />

                  {/* Right segment */}
                  <line
                    x1={sampleX + 14}
                    y1={strandY}
                    x2={sampleX + 330}
                    y2={strandY}
                    stroke={PALETTE.amberLight}
                    strokeWidth={postWidth}
                    strokeLinecap="round"
                    opacity={strand.isAttenuated ? 0.75 : 1}
                  />

                  {/* Mark the weakened 1715 cm⁻¹ band — Enlarged to 22px */}
                  {strand.isAttenuated && attenuationProgress < 0.6 && (
                    <text
                      x={sampleX + 355}
                      y={strandY + 7}
                      fill={PALETTE.white}
                      fontSize="22"
                      fontFamily={TYPOGRAPHY.mono}
                      fontWeight="bold"
                    >
                      1715 cm⁻¹ (振幅选择性削弱)
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        )}

        {/* ================= 5. CYAN DETECTOR POINT & EMERGING TRACE ================= */}
        {frame >= 560 && (
          <g>
            {(() => {
              const pts: string[] = [];
              const n = 60;
              const maxI = Math.floor(n * traceDraw);
              for (let i = 0; i <= maxI; i++) {
                const px = detX + 40 + (i / n) * traceSpan;
                const d = (i / n) * 6 * Math.PI;
                const py = centerY - Math.cos(d) * 35;
                pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
              }
              if (pts.length === 0) return null;
              return <path d={pts.join(' ')} fill="none" stroke={PALETTE.cyanSignal} strokeWidth="3.5" strokeLinecap="round" />;
            })()}

            <g transform={`translate(${dotX}, ${dotY})`}>
              <circle r={7} fill={PALETTE.cyanSignal} />
              <circle r={2.5} fill={PALETTE.white} />
            </g>
          </g>
        )}
      </svg>
    </div>
  );
};
