# Narrative vertical slice — review notes

Updated visual iteration: see [visual-implementation-review.md](visual-implementation-review.md) and [Astra direction / Lead decisions](astra-visual-direction.md). The original numerical contract and timing below remain unchanged; newer visual evidence uses `review/visual-*.png`.

This standalone rough animatic tests the measurement story before replacing any production Act. Lead: GPT-6.1 Sol; one implementation agent: GPT-6 Luna. Subtitles are off by default; there is no narration or audio.

Preview: http://127.0.0.1:3000/review/narrative.html

## Story and rough timing

| Time | Question / causal step |
| --- | --- |
| 0:00–0:12 | Which infrared components did the sample weaken? |
| 0:12–0:24 | Different compositions can produce the same total response. |
| 0:24–0:32 | One number loses composition information; seek distinguishable changes. |
| 0:32–0:43 | Reveal the physical source → Michelson → sample → detector path. |
| 0:43–0:51 | Moving the mirror changes both outward and return lengths. |
| 0:51–1:03 | Returning waves shift; their interference changes brightness. |
| 1:03–1:18 | One shared OPD sweep gives different modulation rates. |
| 1:18–1:28 | Sample attenuation reduces the same component's contribution, preserving its rate. |
| 1:28–1:44 | One detector point writes the complete sample record; zero OPD occurs naturally. |
| 1:44–1:54 | Remove the stable baseline, retain the varying part, and ask how much of each rhythm remains. |
| 1:54–3:20 | Reuse Phase 1 probe → signed product → accumulator → coefficient → spectrum point. |
| 3:20–3:34 | Follow the recovered points back to the sample question; introduce the need for a real reference. |

## Data and scientific boundary

Stable identities: `nu-1000` solid, `nu-1750` dashed, `nu-3000` dotted. All are synthetic teaching components; 1750 must not be interpreted as a real 1715 cm⁻¹ carbonyl reference.

Source contribution weights: `[0.55, 1, 0.35]`. Sample transmission: `[1, 0.55, 1]`. Sample output: `[0.55, 0.55, 0.35]`. These weights represent intensity/modulation contributions, not electric-field amplitudes.

For each component, raw contribution is `a * (1 + cos(2πνδ))`. The detector records their sum. Its stable baseline is `Σa = 1.45`; subtracting it yields exactly the frozen Fourier teaching signal `Σa*cos(2πνδ)`. Signed values describe deviations from the baseline, never negative light intensity.

The cached record has 512 samples on `[-0.002, 0.002)` cm. Its exact object is passed to Act 7 through optional `teachingRecord`; `showAmplitudeDemo=false` prevents changing the measured sample during decoding. Original Phase 1 defaults remain available.

The two-composition puzzle is hypothetical, not simultaneous background/sample measurement. Final hollow markers represent the known teaching input, not a measured background. Full B/S/T remains deferred.

## Asset decisions

Reuse: frozen Fourier numerical core, Act 7 signed contribution / accumulator / coefficient flights, existing visual palette and typography, elementary optical glyphs. Existing Acts 3–6 remain available in the original film.

Retire from this preview: independent phasor lesson, vector coordinate expansion, square-area power representation, normalized percentages, precision OPD/phase/power readouts, and the separate sample infographic. The sample and record now belong to the same measurement story.

## Human review focus

Lead verification: 49 key frames were sought forwards and then backwards; scene markup was identical on every revisit. The measured trace path at frame3419 is exactly present in Act7 frame0 at3420. At frame2880 the acquired index is256 and OPD is0. At frame3119 the complete512 samples are present. At frame3000 the detector transform is `(1320, 297.368421...)`, matching the rounded trace endpoint `(1320,297.37)`.

Numerical results: wrong2250 coefficient2.613e−16; matching1750 coefficient0.55 with395 positive and117 negative products; recovered1000/1750/3000 coefficients0.55/0.55/0.35. Native narrative validation, Phase1 regression, TypeScript and Vite build pass. Frozen Fourier and Michelson core hashes are unchanged. Existing Vite configuration and bundle-size warnings remain.

Changed source files: `src/math/narrativeTeaching.ts`, `src/scenes/NarrativeVerticalSlice.tsx`, `src/scenes/Act7FourierTransform.tsx`, `scripts/validate-narrative-teaching.ts`. New review harness: `review/narrative.html`, `review/narrative.tsx`, `review/narrative-remotion.tsx`. Documentation: `docs/narrative-slice-contract.md`, this file. Subtitle-free stills are saved under `review/narrative-*.png`.

Watch 0:00–0:32 for the measurement motivation; 0:43–1:28 for mirror → modulation → sample; 1:28–1:59 for detector record → baseline → Fourier; 3:20–3:34 for the closed-loop answer.

This is a reviewable rough animatic. Numerical consistency and rendering can be checked automatically; whether a first-time viewer understands the story still requires human review. No full-film replacement, polish, B/S/T, Presentation, reference spectrum or audio work is included.

Remaining narrative questions: the eight-second tool-need beat is still abstract and needs viewer feedback; the brief two-return-wave explanation should be checked for recognizable arm origins; the frozen Fourier scene uses denser labels than the new upstream story. A three-component record has repeated peaks rather than a realistic broadband envelope. The ZPD cue is deliberately brief and does not add an artificial envelope. These are review points, not claims that novice understanding has been demonstrated.
