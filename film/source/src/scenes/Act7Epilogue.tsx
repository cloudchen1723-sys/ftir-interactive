import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { DiatomicVibration } from '../components/molecules/DiatomicVibration';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';

export const Act7Epilogue: React.FC = () => {
  const frame = useCurrentFrame();

  // Local frame in Act 7: 0 to 600 (frames 6000 to 6480 in master timeline)
  const sceneOpacity = interpolate(frame, [0, 40, 560, 600], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // Molecule: starts clear in deep silence (0 - 220).
  // As end titles prepare to rise, molecule dims down deeply into a quiet, ghostly background (frame 220 - 300),
  // then fades out completely by frame 340 so it NEVER overlaps with the titles!
  const moleculeOpacity = interpolate(frame, [0, 40, 220, 280, 330], [0, 0.85, 0.85, 0.12, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  // End Title & Credits: Fades in cleanly only after molecule has dimmed out
  const creditsFadeIn = interpolate(frame, [300, 360], [0, 1], {
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
      {/* Return to two atoms, one quiet spring bond — Dims down deeply to avoid title clash */}
      {moleculeOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: moleculeOpacity,
            filter: interpolate(frame, [220, 330], [0, 4]) > 0 ? `blur(${interpolate(frame, [220, 330], [0, 4])}px)` : undefined,
          }}
        >
          <DiatomicVibration
            amplitude={8}
            frequency={0.09}
            showDipoleVector={false}
            showSpringMesh={true}
            showPhotonWave={false}
            moleculeOpacity={moleculeOpacity}
          />
        </div>
      )}

      {/* Final End Title & Credits */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: creditsFadeIn,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            fontFamily: TYPOGRAPHY.titleFont,
            fontSize: '64px',
            color: PALETTE.textPrimary,
            letterSpacing: '0.35em',
            textIndent: '0.35em',
            marginBottom: '16px',
            textShadow: '0 4px 30px rgba(0,0,0,0.95), 0 0 20px rgba(0,0,0,0.9)',
          }}
        >
          FTIR
        </div>

        <div
          style={{
            fontFamily: TYPOGRAPHY.chineseSerif,
            fontSize: '24px',
            color: PALETTE.laserCyan,
            letterSpacing: '0.15em',
            marginBottom: '12px',
            textShadow: '0 2px 20px rgba(0,0,0,0.95)',
          }}
        >
          傅里叶变换红外光谱
        </div>

        <div
          style={{
            fontFamily: TYPOGRAPHY.bodyFont,
            fontSize: '15px',
            color: PALETTE.textSecondary,
            letterSpacing: '0.1em',
            textTransform: 'uppercase',
            marginBottom: '40px',
            textShadow: '0 2px 16px rgba(0,0,0,0.95)',
          }}
        >
          Listening to the Vibrations of Matter
        </div>

        {/* Minimal Credits */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
            textAlign: 'center',
            fontFamily: TYPOGRAPHY.monoFont,
            fontSize: '13px',
            color: PALETTE.textMuted,
            letterSpacing: '0.06em',
            textShadow: '0 2px 14px rgba(0,0,0,0.95)',
          }}
        >
          <div>MATHEMATICAL MODEL & CODE-DRIVEN CINEMATOGRAPHY</div>
          <div>Albert Abraham Michelson (1881) · Jean-Baptiste Joseph Fourier (1822) · Peter Fellgett (1949)</div>
          <div style={{ marginTop: '16px', color: '#64748B' }}>Deterministic Remotion Timeline · 1920×1080 @ 30fps</div>
        </div>
      </div>
    </div>
  );
};
