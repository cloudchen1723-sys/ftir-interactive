import React from 'react';
import { Composition } from 'remotion';
import { FTIRFilm } from './FTIRFilm';
import { FILM_CONFIG } from '../timeline/filmTimeline';
import { OriginalFTIRFilm } from './OriginalFTIRFilm';
import { FILM_CONFIG as LEGACY_CONFIG } from '../timeline/legacyFilmTimeline';
import {FTIRFullPreview} from './FTIRFullPreview';
import {FULL_PREVIEW_CONFIG} from '../timeline/fullPreviewTimeline';

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition id="FTIRFullPreview" component={FTIRFullPreview} durationInFrames={FULL_PREVIEW_CONFIG.totalFrames} fps={30} width={1920} height={1080}/>
      <Composition id="FTIRFilmOriginal" component={OriginalFTIRFilm} durationInFrames={LEGACY_CONFIG.totalFrames} fps={30} width={1920} height={1080} />
      <Composition
        id="FTIRFilm"
        component={FTIRFilm}
        durationInFrames={FILM_CONFIG.totalFrames}
        fps={FILM_CONFIG.fps}
        width={FILM_CONFIG.width}
        height={FILM_CONFIG.height}
      />
    </>
  );
};
