import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';

export const Act3WholeSystemOverview: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame in Act 3: 0 to 420 (14 seconds @ 30fps)
  const beamProgress = interpolate(frame, [15, 340], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const stations = [
    { name: '宽带 IR 光源', reachProgress: 0.05, x: 220, y: 540 },
    { name: '迈克尔逊干涉仪', reachProgress: 0.28, x: 580, y: 540 },
    { name: '样品', reachProgress: 0.52, x: 960, y: 540 },
    { name: '探测器', reachProgress: 0.74, x: 1320, y: 540 },
    { name: '计算机 · 光谱', reachProgress: 0.95, x: 1680, y: 540 },
  ];

  const currentBeamX = 140 + beamProgress * (1720 - 140);

  // Label: 光谱编码 (frames 300 - 410)
  const encodingLabelOpacity = interpolate(frame, [300, 330, 385, 415], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= 1. THE SIGNAL THREAD: CRISP AMBER OPTICAL BEAM ================= */}
        {beamProgress > 0 && (
          <line
            x1={140}
            y1={540}
            x2={currentBeamX}
            y2={540}
            stroke={PALETTE.amberLight}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}

        {/* ================= 2. THE 5 PHYSICAL STATIONS ================= */}
        {stations.map((st, idx) => {
          const isReached = beamProgress >= st.reachProgress;
          const stationOpacity = interpolate(
            beamProgress,
            [st.reachProgress, st.reachProgress + 0.08],
            [0, 1],
            { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
          );

          if (!isReached) return null;

          return (
            <g key={idx} transform={`translate(${st.x}, ${st.y})`} opacity={stationOpacity}>
              {/* Station Icon / Geometry */}
              {idx === 0 && (
                <g>
                  <circle r={24} fill="#181410" stroke={PALETTE.amberLight} strokeWidth="2" />
                  <circle r={7} fill={PALETTE.amberLight} />
                </g>
              )}

              {idx === 1 && (
                <g>
                  <line x1={-24} y1={-24} x2={24} y2={24} stroke={PALETTE.white} strokeWidth="3" />
                  <rect x={-32} y={-48} width={64} height={7} fill="#141A24" stroke={PALETTE.grayInactive} strokeWidth="1.5" />
                  <rect x={40} y={-32} width={7} height={64} fill="#141A24" stroke={PALETTE.grayInactive} strokeWidth="1.5" />
                </g>
              )}

              {idx === 2 && (
                <g>
                  <rect x={-14} y={-48} width={28} height={96} rx={2} fill="rgba(125, 136, 152, 0.08)" stroke={PALETTE.grayContext} strokeWidth="2" />
                </g>
              )}

              {idx === 3 && (
                <g>
                  <rect x={-22} y={-34} width={44} height={68} rx={2} fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="2" />
                  <rect x={-12} y={-24} width={24} height={48} fill={PALETTE.cyanSignal} opacity="0.9" />
                </g>
              )}

              {idx === 4 && (
                <g>
                  <line x1={-34} y1={24} x2={34} y2={24} stroke={PALETTE.grayInactive} strokeWidth="2" />
                  <line x1={-34} y1={24} x2={-34} y2={-24} stroke={PALETTE.grayInactive} strokeWidth="2" />
                  <path d="M -30 16 Q -12 16 0 -12 T 30 16" fill="none" stroke={PALETTE.cyanSignal} strokeWidth="2.5" />
                </g>
              )}

              {/* Station Label — Enlarged to 24px */}
              <text
                x={0}
                y={80}
                textAnchor="middle"
                fill={PALETTE.white}
                fontSize="24"
                fontFamily={TYPOGRAPHY.sans}
                fontWeight="500"
                letterSpacing="0.04em"
              >
                {st.name}
              </text>
            </g>
          );
        })}
      </svg>

      {/* On-screen text: 光谱编码 — Enlarged to 46px */}
      {encodingLabelOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '210px',
            textAlign: 'center',
            opacity: encodingLabelOpacity,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: '46px',
              fontWeight: 600,
              color: PALETTE.cyanSignal,
              letterSpacing: '0.08em',
            }}
          >
            光谱编码
          </div>
        </div>
      )}
    </div>
  );
};
