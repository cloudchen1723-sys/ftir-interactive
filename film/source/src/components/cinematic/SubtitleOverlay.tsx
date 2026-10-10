import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { SUBTITLE_CUES, SubtitleCue } from '../../timeline/filmTimeline';
import { PALETTE, TYPOGRAPHY } from '../../styles/visualSystem';

export const SubtitleOverlay: React.FC<{ cues?: SubtitleCue[]; englishSize?: number }> = ({ cues = SUBTITLE_CUES, englishSize = 21 }) => {
  const frame = useCurrentFrame();

  const activeCue: SubtitleCue | undefined = cues.find(
    (c) => frame >= c.startFrame && frame < c.endFrame
  );

  if (!activeCue) return null;

  // Gentle linear fade in / fade out
  const fadeInDuration = 12;
  const fadeOutDuration = 16;
  const startFadingOut = activeCue.endFrame - fadeOutDuration;

  let opacity = 1;
  if (frame < activeCue.startFrame + fadeInDuration) {
    opacity = interpolate(frame, [activeCue.startFrame, activeCue.startFrame + fadeInDuration], [0, 1], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  } else if (frame > startFadingOut) {
    opacity = interpolate(frame, [startFadingOut, activeCue.endFrame], [1, 0], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
    });
  }

  return (
    <div
      style={{
        position: 'absolute',
        bottom: '52px',
        left: '0',
        right: '0',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 80px',
        pointerEvents: 'none',
        zIndex: 60,
        opacity,
      }}
    >
      {/* 1. Chinese Narration Subtitle — Significantly enlarged to 35px for crystal-clear readability */}
      <div
        style={{
          fontFamily: TYPOGRAPHY.sans,
          fontSize: '35px',
          fontWeight: 500,
          color: PALETTE.textSubtitle,
          letterSpacing: '0.04em',
          lineHeight: 1.35,
          maxWidth: '1500px',
          marginBottom: activeCue.en ? '8px' : '0',
          textShadow: '0 2px 12px rgba(0,0,0,0.95), 0 1px 4px rgba(0,0,0,0.9)',
        }}
      >
        {activeCue.zh}
      </div>

      {/* 2. English Subtitle Line — Enlarged to 21px for effortless legibility */}
      {activeCue.en && (
        <div
          style={{
            fontFamily: TYPOGRAPHY.sans,
            fontSize: `${englishSize}px`,
            fontWeight: 400,
            color: '#94A3B8',
            letterSpacing: '0.015em',
            maxWidth: '1500px',
            lineHeight: 1.3,
            textShadow: '0 2px 10px rgba(0,0,0,0.95), 0 1px 3px rgba(0,0,0,0.9)',
          }}
        >
          {activeCue.en}
        </div>
      )}
    </div>
  );
};
