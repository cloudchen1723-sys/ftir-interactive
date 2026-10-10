import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { SpectrumTransmissionEngine } from '../components/spectrum/SpectrumPlot';
import { PALETTE } from '../styles/visualSystem';

export const Act6SampleSignature: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame in Act 6: 0 to 850 (frames 6050 to 6900 in master timeline)
  const sceneOpacity = interpolate(frame, [0, 40, 800, 850], [0, 1, 1, 0], {
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
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <SpectrumTransmissionEngine />
    </div>
  );
};
