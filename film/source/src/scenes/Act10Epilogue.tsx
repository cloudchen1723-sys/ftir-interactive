import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';

export const Act10Epilogue: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame in Act 10: 0 to 360 (12 seconds @ 30fps)
  const centerX = 960;
  const centerY = 540;
  const bondRest = 140;

  // Gentle final vibration
  const finalOsc = Math.sin(frame * 0.12) * 10;

  // Molecule opacity
  const molOpacity = interpolate(frame, [0, 30, 160, 220], [0, 0.85, 0.85, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Title Card opacity
  const titleOpacity = interpolate(frame, [220, 260, 335, 355], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= 1. SIMPLE MOLECULAR GEOMETRY ================= */}
        {molOpacity > 0 && (
          <g opacity={molOpacity}>
            <line
              x1={centerX - bondRest / 2 - finalOsc / 2 + 24}
              y1={centerY}
              x2={centerX + bondRest / 2 + finalOsc / 2 - 24}
              y2={centerY}
              stroke={PALETTE.grayContext}
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Left Atom */}
            <circle cx={centerX - bondRest / 2 - finalOsc / 2} cy={centerY} r={24} fill="#141A24" stroke={PALETTE.grayContext} strokeWidth="2" />
            {/* Right Atom */}
            <circle cx={centerX + bondRest / 2 + finalOsc / 2} cy={centerY} r={24} fill="#141A24" stroke={PALETTE.grayContext} strokeWidth="2" />
          </g>
        )}
      </svg>

      {/* ================= 2. FINAL CLEAN EDITORIAL TITLE CARD ================= */}
      {titleOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            opacity: titleOpacity,
            pointerEvents: 'none',
          }}
        >
          {/* Main Title — Enlarged to 72px */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: '72px',
              fontWeight: 700,
              color: PALETTE.white,
              letterSpacing: '0.24em',
              textIndent: '0.24em',
              marginBottom: '16px',
            }}
          >
            FTIR
          </div>

          {/* Subtitle — Enlarged to 30px */}
          <div
            style={{
              fontFamily: TYPOGRAPHY.sans,
              fontSize: '30px',
              fontWeight: 500,
              color: PALETTE.cyanSignal,
              letterSpacing: '0.12em',
              marginBottom: '40px',
            }}
          >
            聆听物质的振动
          </div>

          {/* Minimal Editorial Credits — Enlarged to 16px */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
              textAlign: 'center',
              fontFamily: TYPOGRAPHY.sans,
              fontSize: '16px',
              color: PALETTE.grayContext,
              letterSpacing: '0.04em',
            }}
          >
            <div>MATHEMATICAL MODEL & CODE-DRIVEN CINEMATOGRAPHY</div>
            <div>Albert Abraham Michelson (1881) · Jean-Baptiste Joseph Fourier (1822) · Peter Fellgett (1949)</div>
            <div style={{ marginTop: '10px', color: '#64748B', fontSize: '15px' }}>Deterministic Remotion Timeline · 1920×1080 @ 30fps</div>
          </div>
        </div>
      )}
    </div>
  );
};
