# Continuous visual argument — implementation review

This iteration follows `astra-visual-direction.md`. GPT-6 Astra supplied read-only visual direction; GPT-6.1 Sol reviewed the science, scope and implementation; one GPT-6 Luna owns the scene implementation. The independent 214-second preview remains at http://127.0.0.1:3000/review/narrative.html. Subtitles default to off.

## Frozen contracts

No changes to `fourierTeaching.ts`, `michelsonTeaching.ts`, `narrativeTeaching.ts` or `Act7FourierTransform.tsx` are allowed in this iteration. Source weights remain 0.55 / 1 / 0.35; transmission remains 1 / 0.55 / 1; sample weights remain 0.55 / 0.55 / 0.35. The same 512-sample record feeds the existing signed Fourier pipeline. Actual acquisition keeps the sample fixed. Synthetic 1750 is not the later real 1715 reference.

The total duration and Fourier boundaries remain 6420 / 3420 / 6000 frames at 30 fps. No production-film replacement, global palette changes, dependency changes, audio, B/S/T or Presentation work is included.

## Review priorities

- 0:00–0:32: one hypothetical composition changes at one readout; the unchanged total creates the need for distinguishable variation.
- 0:32–1:03: the same optical space reveals both returning arms, two added path lengths and phase-driven output response.
- 1:03–1:28: one OPD cursor drives different modulation rhythms; the real fixed sample reduces height without moving phase features.
- 1:26–1:54: the detector pixel carries attention into the first actual sample, writes a sampled prefix, and the complete record is recentered into the exact Fourier geometry.
- 3:20–3:34: the computed 1750 coefficient retains its identity and returns beside the sample with an explicitly known teaching-input reference.

## Deliberate limits

The fixed Phase 1 display retains its denser mathematical labels. The three-component record has repeated peaks rather than a realistic broadband envelope; no artificial ZPD burst is added. Numerical consistency, renderability and seek determinism can be checked automatically; first-time audience comprehension still requires human viewing.

## Implemented changes and Lead integration

The opening and hypothetical-composition puzzle retain the sample/detector crop. Only after the need beat does a continuous camera pullback and geometric mask reveal the upstream Michelson. The optical world stays fixed; neutral arm lengths are equal. The moving mirror remains safely to the right of the splitter throughout the full scan. Its displacement and the returned-field phase use the same OPD convention.

Two added route lengths appear sequentially as +x and +x, then the conclusion appears. The field inspection pulls back enough to include the detector response in the same frame. Component comparison uses a common OPD cursor and amber intersections, with the sole cyan pixel reserved for total measurement. The real sample is the recurring spatial anchor; an observation-position marker crosses it while the selected response changes height without moving its horizontal phase features. Formal acquisition uses the fixed cached sample record.

The detector pixel moves visibly to actual sample 0, then the actual record endpoint writes each prefix. Optical context recedes behind the data. DC subtraction translates the complete curve and endpoint uniformly. During the exact Act7 handoff, the endpoint gently retires while the curve becomes the existing white mathematical record. The real recovered1750 point starts at its original spectrum coordinate, moves beside the sample, and compares0.55 with known teaching input1 on one unchanged vertical scale.1000 and3000 retain their original spectrum positions.

Lead integration corrected arrow sizing, simultaneous+x labels, overlapping labels, field-camera cropping, premature upstream reveal, and callback reference geometry. Astra did no coding; no second implementation or validation agent was used.

## Verification

During the component inspection, the same detector pixel's response is driven by the actual fixed-sample total at the shared OPD. The earlier single-frequency field demonstration separately uses its explicitly selected normalized1750 response.

- Native teaching validations passed:512 samples; raw range0.114372…2.90; baseline1.45; wrong2250 coefficient2.613e−16; matched1750 coefficient0.55; recovered0.55/0.55/0.35. Original Phase1 regression also passed.
-52 key frames were sought forwards and backwards. The final scene markup was identical on every revisit. The endpoint's final handoff opacity is a direct frame function.
- The measured path at3419 exactly matches an Act7 path at3420. At2880, index256 gives OPD0. At3119, all512 samples are present. At3000, the live endpoint is(1320,297.368421…), matching the rounded path endpoint(1320,297.37). The endpoint also stays attached during DC recentering.
- TypeScript(`npm run lint`) and Vite production build passed. Existing Vite configuration and bundle-size warnings remain.
- SHA256 hashes for all four frozen files match the pre-implementation values.
- Native1920×1080 subtitle-free evidence is under `review/visual-*.png`; original `review/narrative-*.png` images remain for comparison.

Changed implementation file: `src/scenes/NarrativeVerticalSlice.tsx`. New documents: `docs/visual-direction-brief.md`, `docs/astra-visual-direction.md`, this file. No new mathematical interface or dependency was introduced. Preview harness, original film and frozen Phase1 code are unchanged.

This is the completed reviewable iteration, not proof of novice comprehension or final cinematic polish. The hypothetical-total puzzle and source/post-sample inspection still warrant viewer feedback; the frozen Fourier display remains visually denser. Stop here for human review; do not begin B/S/T or full-film integration.
