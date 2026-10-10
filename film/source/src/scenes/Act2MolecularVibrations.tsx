import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { MolecularVibrationEngine } from '../components/molecules/PolyatomicModes';
import { PALETTE } from '../styles/visualSystem';

export const Act2MolecularVibrations: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame inside Act 2: 0 to 900 (30 seconds)
  const sceneOpacity = interpolate(frame, [0, 40, 860, 900], [0, 1, 1, 0], {
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
      <MolecularVibrationEngine />
    </div>
  );
};
