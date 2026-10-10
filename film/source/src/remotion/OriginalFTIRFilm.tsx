import React from 'react';
import { Sequence } from 'remotion';
import { FILM_CONFIG, ACTS, SUBTITLE_CUES } from '../timeline/legacyFilmTimeline';
import { SubtitleOverlay } from '../components/cinematic/SubtitleOverlay';
import { Act1MoleculesMove } from '../scenes/Act1MoleculesMove';
import { Act2VibrationalModes } from '../scenes/Act2VibrationalModes';
import { Act3WholeSystemOverview } from '../scenes/Act3WholeSystemOverview';
import { Act4MichelsonCore } from '../scenes/Act4MichelsonCore';
import { Act5SampleAndDetector } from '../scenes/Act5SampleAndDetector';
import { Act6InterferogramZPD } from '../scenes/Act6InterferogramZPD';
import { Act7FourierTransform } from '../scenes/Act7FourierTransform';
import { Act8BackgroundAndSample } from '../scenes/Act8BackgroundAndSample';
import { Act9SpectrumInterpretation } from '../scenes/Act9SpectrumInterpretation';
import { Act10Epilogue } from '../scenes/Act10Epilogue';
import { PALETTE } from '../styles/visualSystem';

export const OriginalFTIRFilm: React.FC = () => {
  return (
    <div
      style={{
        position: 'relative',
        width: `${FILM_CONFIG.width}px`,
        height: `${FILM_CONFIG.height}px`,
        backgroundColor: PALETTE.bgVoid,
        overflow: 'hidden',
      }}
    >
      {/* ACT 1: Molecules Move (00:00 - 00:15, 0 - 450) */}
      <Sequence from={ACTS[0].startFrame} durationInFrames={ACTS[0].durationFrames}>
        <Act1MoleculesMove />
      </Sequence>

      {/* ACT 2: Vibrational Modes (00:15 - 00:43, 450 - 1290) */}
      <Sequence from={ACTS[1].startFrame} durationInFrames={ACTS[1].durationFrames}>
        <Act2VibrationalModes />
      </Sequence>

      {/* ACT 3: Whole FTIR System (00:43 - 00:58, 1290 - 1740) */}
      <Sequence from={ACTS[2].startFrame} durationInFrames={ACTS[2].durationFrames}>
        <Act3WholeSystemOverview />
      </Sequence>

      {/* ACT 4: Michelson Interferometer Core (00:58 - 02:18, 1740 - 4140) */}
      <Sequence from={ACTS[3].startFrame} durationInFrames={ACTS[3].durationFrames}>
        <Act4MichelsonCore />
      </Sequence>

      {/* ACT 5: Sample and Detector (02:18 - 02:42, 4140 - 4860) */}
      <Sequence from={ACTS[4].startFrame} durationInFrames={ACTS[4].durationFrames}>
        <Act5SampleAndDetector />
      </Sequence>

      {/* ACT 6: Interferogram and ZPD (02:42 - 03:12, 4860 - 5760) */}
      <Sequence from={ACTS[5].startFrame} durationInFrames={ACTS[5].durationFrames}>
        <Act6InterferogramZPD />
      </Sequence>

      {/* ACT 7: Fourier Transform (03:12 - 04:30, 5760 - 8100) */}
      <Sequence from={ACTS[6].startFrame} durationInFrames={ACTS[6].durationFrames}>
        <Act7FourierTransform />
      </Sequence>

      {/* ACT 8: Background and Sample (04:30 - 04:50, 8100 - 8700) */}
      <Sequence from={ACTS[7].startFrame} durationInFrames={ACTS[7].durationFrames}>
        <Act8BackgroundAndSample />
      </Sequence>

      {/* ACT 9: Spectrum Interpretation (04:50 - 05:12, 8700 - 9360) */}
      <Sequence from={ACTS[8].startFrame} durationInFrames={ACTS[8].durationFrames}>
        <Act9SpectrumInterpretation />
      </Sequence>

      {/* ACT 10: Epilogue (05:12 - 05:25, 9360 - 9750) */}
      <Sequence from={ACTS[9].startFrame} durationInFrames={ACTS[9].durationFrames}>
        <Act10Epilogue />
      </Sequence>

      {/* Global Cinematic Subtitle Engine */}
      <SubtitleOverlay cues={SUBTITLE_CUES} />
    </div>
  );
};
