import React from 'react';
import { CinematicOpeningReconstruction } from '../scenes/CinematicOpeningReconstruction';
import { SubtitleOverlay } from '../components/cinematic/SubtitleOverlay';
/** Current production work is deliberately bounded to reconstructed Sections 01–05. */
export const FTIRFilm: React.FC = () => <><CinematicOpeningReconstruction /><SubtitleOverlay /></>;
