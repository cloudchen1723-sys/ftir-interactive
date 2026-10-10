import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { FourierDecompositionEngine } from '../components/fourier/FourierDecomposition3D';
import { PALETTE } from '../styles/visualSystem';

export const Act5FourierMoment: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame in Act 5: 0 to 1800 (frames 4250 to 6050 in master timeline)
  const sceneOpacity = interpolate(frame, [0, 40, 1750, 1800], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        backgroundColor: PALETTE.bgVoid,
        opacity: sceneOpacity,
        overflow: 'hidden',
      }}
    >
      <FourierDecompositionEngine />
    </div>
  );
};
