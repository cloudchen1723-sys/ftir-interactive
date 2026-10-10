import React from 'react';
import { interpolate, spring, useCurrentFrame, useVideoConfig } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../../styles/visualSystem';

export const TitleCard: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Reveal between frame 880 and 1050
  if (frame < 870 || frame > 1060) return null;

  const localFrame = frame - 880;

  const titleSpring = spring({
    frame: localFrame,
    fps,
    config: { damping: 20, stiffness: 80 },
  });

  const opacity = interpolate(frame, [880, 920, 1010, 1050], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const scale = interpolate(titleSpring, [0, 1], [0.94, 1.0]);
  const letterSpacing = interpolate(localFrame, [0, 150], [0.35, 0.45]);

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 40,
        pointerEvents: 'none',
        opacity,
        transform: `scale(${scale})`,
      }}
    >
      {/* Subtle optical reticle line behind title */}
      <div
        style={{
          width: '600px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${PALETTE.laserCyan}88, transparent)`,
          marginBottom: '28px',
        }}
      />

      <div
        style={{
          fontFamily: TYPOGRAPHY.titleFont,
          fontSize: '92px',
          fontWeight: 600,
          color: PALETTE.textPrimary,
          letterSpacing: `${letterSpacing}em`,
          textAlign: 'center',
          textIndent: `${letterSpacing}em`,
          textShadow: '0 0 40px rgba(0, 245, 255, 0.25)',
          lineHeight: 1,
          marginBottom: '16px',
        }}
      >
        FTIR
      </div>

      <div
        style={{
          fontFamily: TYPOGRAPHY.chineseSerif,
          fontSize: '26px',
          fontWeight: 300,
          color: PALETTE.laserCyan,
          letterSpacing: '0.22em',
          marginBottom: '14px',
          textAlign: 'center',
        }}
      >
        傅里叶变换红外光谱
      </div>

      <div
        style={{
          fontFamily: TYPOGRAPHY.bodyFont,
          fontSize: '17px',
          fontWeight: 300,
          color: PALETTE.textSecondary,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          textAlign: 'center',
        }}
      >
        Listening to the Vibrations of Matter
      </div>

      <div
        style={{
          width: '600px',
          height: '1px',
          background: `linear-gradient(90deg, transparent, ${PALETTE.laserCyan}88, transparent)`,
          marginTop: '28px',
        }}
      />
    </div>
  );
};

export const FrameBorder: React.FC = () => {
  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 60,
      }}
    >
      {/* Subtle corner marks */}
      <svg
        width="100%"
        height="100%"
        style={{ position: 'absolute', inset: 0 }}
      >
        <path d="M 40 60 L 40 40 L 60 40" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
        <path d="M 1880 60 L 1880 40 L 1860 40" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
        <path d="M 40 1020 L 40 1040 L 60 1040" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
        <path d="M 1880 1020 L 1880 1040 L 1860 1040" stroke="rgba(255,255,255,0.15)" strokeWidth="1" fill="none" />
      </svg>
      {/* Vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(circle at 50% 50%, transparent 65%, rgba(0,0,0,0.7) 100%)',
        }}
      />
    </div>
  );
};
