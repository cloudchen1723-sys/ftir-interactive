import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { DiatomicVibration } from '../components/molecules/DiatomicVibration';
import { TitleCard } from '../components/cinematic/TitleCard';
import { PALETTE } from '../styles/visualSystem';

export const Act1MatterMoves: React.FC = () => {
  const frame = useCurrentFrame();

  // Act 1: Frames 0 to 1050
  // 0 - 600: Molecule in dark space; thermal vibration; amber wave passes
  // 600 - 750: Resonant frequency match -> amplitude amplification!
  // 750 - 840: Molecule dims down completely to 0; Amber wave straightens into beam!
  // 850 - 1050: TitleCard appears in pristine negative space; amber beam travels to instrument

  const isResonant = frame > 580 && frame < 760;

  // Molecule Opacity: Dims down to 0 before TitleCard appears so they NEVER overlap!
  const moleculeOpacity = interpolate(frame, [40, 160, 720, 820], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const currentAmplitude = interpolate(
    frame,
    [0, 180, 420, 600, 700, 800],
    [0, 8, 14, 16, 44, 10],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    }
  );

  // The Signal Thread: Wave straightens from sinusoidal ripple into straight optical beam
  const waveStraighten = interpolate(frame, [740, 860], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const sceneOpacity = interpolate(frame, [0, 60, 1010, 1050], [0, 1, 1, 0], {
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
      }}
    >
      {/* 1. Diatomic Molecule & The Amber Wave (The Signal Thread) */}
      <DiatomicVibration
        amplitude={moleculeOpacity > 0 ? currentAmplitude : 0}
        frequency={isResonant ? 0.22 : 0.12}
        showPhotonWave={true}
        photonWavelength={isResonant ? 90 : 150}
        isResonant={isResonant}
        showDipoleVector={frame > 300 && moleculeOpacity > 0.4}
        waveStraightenProgress={waveStraighten}
        moleculeOpacity={moleculeOpacity}
      />

      {/* 2. Title Card: Appears only after molecule has faded out */}
      {frame >= 830 && <TitleCard />}
    </div>
  );
};
