import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { MichelsonInterferometer } from '../components/instrument/MichelsonInterferometer';
import { PALETTE } from '../styles/visualSystem';

export const Act3EnterInstrument: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame in Act 3: 0 to 1200 (frames 1950 to 3150 in master timeline)
  const sceneOpacity = interpolate(frame, [0, 40, 1160, 1200], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // =========================================================================
  // CAMERA LANGUAGE
  // 1. 0 - 180: Follow incoming beam toward beamsplitter
  // 2. 180 - 360: Settle into central apparatus
  // 3. 360 - 560: Push toward moving mirror to isolate displacement x and δ = 2x
  // 4. 560 - 740: Completely STILL during wave phase comparison
  // 5. 740 - 980: Steady framing for dual-wavenumber phase rate comparison
  // 6. 980 - 1200: Pull back slightly to let detector trace take over the frame
  // =========================================================================

  let camScale = 1.0;
  let camTranslateX = 0;
  let camTranslateY = 0;

  if (frame < 180) {
    camScale = interpolate(frame, [0, 180], [1.08, 1.0]);
    camTranslateX = interpolate(frame, [0, 180], [60, 0]);
  } else if (frame >= 360 && frame < 560) {
    camScale = interpolate(frame, [360, 420, 520, 560], [1.0, 1.14, 1.14, 1.06]);
    camTranslateX = interpolate(frame, [360, 420, 520, 560], [0, -110, -110, 0]);
  } else if (frame >= 560 && frame < 740) {
    camScale = 1.06;
    camTranslateX = 0;
  } else if (frame >= 980) {
    camScale = interpolate(frame, [980, 1080], [1.0, 0.96]);
    camTranslateY = interpolate(frame, [980, 1080], [0, -25]);
  }

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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `scale(${camScale}) translate(${camTranslateX}px, ${camTranslateY}px)`,
          transformOrigin: '50% 50%',
          transition: 'transform 0.1s ease-out',
        }}
      >
        <MichelsonInterferometer />
      </div>
    </div>
  );
};
