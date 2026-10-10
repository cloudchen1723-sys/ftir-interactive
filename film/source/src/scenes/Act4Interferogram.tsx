import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { MichelsonInterferometer } from '../components/instrument/MichelsonInterferometer';
import { InterferogramPlot } from '../components/interferogram/InterferogramPlot';
import { PALETTE } from '../styles/visualSystem';

export const Act4Interferogram: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame: 0 to 1100 (Act 4: frames 3150 to 4250 in master timeline)
  // Continuous transition from Michelson apparatus to solitary mathematical trace
  const sceneOpacity = interpolate(frame, [0, 30, 1060, 1100], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Apparatus fades away as the trace occupies the frame
  const apparatusOpacity = interpolate(frame, [0, 60, 220, 280], [0.85, 0.85, 0.2, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Moving mirror sweep during apparatus fade-out
  const mirrorDisp = Math.sin(frame * 0.08) * 35;

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
      {/* 1. Fading Michelson Apparatus (Continuous connection with Act 3) */}
      {apparatusOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: apparatusOpacity,
            transform: 'scale(0.85) translate(-120px, -60px)',
            transformOrigin: '50% 50%',
            filter: 'blur(1px)',
          }}
        >
          <MichelsonInterferometer mirrorDisplacement={mirrorDisp} dimApparatus={true} />
        </div>
      )}

      {/* 2. The Dominant Continuous Interferogram */}
      <InterferogramPlot />
    </div>
  );
};
