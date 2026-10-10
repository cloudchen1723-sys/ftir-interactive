import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PALETTE } from '../styles/visualSystem';

export const Act1MoleculesMove: React.FC = () => {
  const frame = useCurrentFrame();

  const centerX = 960;
  const centerY = 540;
  const bondRest = 140;

  // Single stretch and gentle thermal vibration
  const stretchAmp = interpolate(frame, [20, 70, 130, 240, 360], [0, 20, 4, 10, 14], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const osc = Math.sin(frame * 0.16) * stretchAmp;

  const atomLeftX = centerX - bondRest / 2 - osc / 2;
  const atomRightX = centerX + bondRest / 2 + osc / 2;

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* Subtle bond connecting line (2.5px) */}
        <line
          x1={atomLeftX + 22}
          y1={centerY}
          x2={atomRightX - 22}
          y2={centerY}
          stroke={PALETTE.grayContext}
          strokeWidth="2.5"
          strokeLinecap="round"
        />

        {/* Left Atom */}
        <g transform={`translate(${atomLeftX}, ${centerY})`}>
          <circle r={22} fill="#141A24" stroke={PALETTE.grayContext} strokeWidth="2" />
        </g>

        {/* Right Atom */}
        <g transform={`translate(${atomRightX}, ${centerY})`}>
          <circle r={22} fill="#141A24" stroke={PALETTE.grayContext} strokeWidth="2" />
        </g>
      </svg>
    </div>
  );
};
