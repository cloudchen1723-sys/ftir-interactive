# Narrative vertical slice / rough animatic contract

Lead: GPT-6.1 Sol. Single implementer: GPT-6 Luna. Purpose: verify problem → need → mechanism → measurement → decoding → answer without narration/subtitles. This is an isolated review artifact, not a full-film replacement. No production timeline changes or polish, dependencies, audio, B/S/T, reference spectra, authoring shell or Presentation.

## Files / ownership

Implementer owns new `src/math/narrativeTeaching.ts`, new `src/scenes/NarrativeVerticalSlice.tsx`, new `scripts/validate-narrative-teaching.ts`, minimal backwards-compatible presentation-input changes to `src/scenes/Act7FourierTransform.tsx` described below. Lead owns docs and `review/narrative.html`, `review/narrative.tsx`, `review/narrative-remotion.tsx`. Never change `src/math/fourierTeaching.ts`, `src/math/michelsonTeaching.ts`, existing Acts3–6, filmTimeline, App, FTIRFilm, palette or dependencies. No additional agents. Report necessary interface changes first.

## Frozen science / shared identity

Import TeachingComponent, TeachingRecord, DEFAULT_TEACHING_COMPONENTS, createTeachingRecord, evaluateTeachingProbe, projectTeachingRecord, recoverTeachingSpectrum from frozen fourierTeaching. Source amplitudes are .55,1,.35 at1000,1750,3000. Identity metadata is separate (do not change TeachingComponent type): ids `nu-1000`, `nu-1750`, `nu-3000`, solid / dashed / dotted stroke patterns. Same IDs and ordering persist through all stages; optical energy amber, data cyan, reference/geometry white/gray. No extra palette.

Sample transmission coefficients are1,.55,1. Apply once to spectral contribution amplitude, not twice. These amplitudes represent intensity/modulation weights, not electric-field amplitudes. Sample output components=.55,.55,.35. Cached `SLICE_SAMPLE_RECORD=createTeachingRecord(sampleComponents)` on frozen default512 OPD samples[-.002,.002)cm. `SLICE_SOURCE_RECORD` may reuse DEFAULT_TEACHING_RECORD. Both are synthetic.1750 is NOT1715/C=O.

At OPD deltaCm each component AC contribution=a*cos(2*pi*nu*deltaCm); raw nonnegative contribution=a*(1+cos(...)); raw total=sum, stable baseline=sum(a), AC=raw-baseline=sum(cos weights)=sample record signal. Equal-arm educational idealization, arbitrary relative intensity scale, no physical calibration. Mirror displacement microns=deltaCm*10000/2. If reused normalized Michelson power, raw contribution=2*a*normalizedPower. Do not sum fields of different wavenumbers.

Pure functions export `applySampleTransmission`, `evaluateNarrativeMeasurement(opdCm,components)` with per-component id/phase/ac/raw plus totalRaw/baseline/ac and mirrorDisplacementUm; immutable constants for identities/source/sample/record. Validate finite inputs and T0..1.

Puzzle alternative components=.35,.75,.35 have same total1.45 as sample output=.55,.55,.35, same three wavenumbers and all attenuated relative to source. These are two hypothetical compositions, not two simultaneously measured channels or actual B/S runs. Show equal total, differing composition; no long explanatory subtitles.

## Component / timing API

`NarrativeVerticalSlice: React.FC<{subtitles?:boolean}>` renders whole standalone slice,1920x1080,30fps,6420frames(3:34). Export metadata `NARRATIVE_SLICE_DURATION=6420`, `NARRATIVE_FOURIER_START=3420`, `NARRATIVE_ANSWER_START=6000`, and readonly beat ranges (frame,name) from narrativeTeaching.

Pre-story beats localframes:
-0..360 (0:00–0:12): sample as measurement goal. Persistent three components, sample and detector. One short large question: 哪些红外成分被削弱了？ Don't open with Michelson or formulas.
-360..720 (0:12–0:24): two possible compositions, same total detector response. Match same total displayed level; component distribution genuinely differs. Simple question 总量相同，组成呢？ Teaching decomposition view, not real channels.
-720..960 (0:24–0:32): need distinguishable changing features. Static single readout grows into a potential recording track; show ambiguity motivates changes, terminology later.
-960..1290 (0:32–0:43): reveal actual source→Michelson→sample→detector layout. Same sample remains. Beam splitter / plate slash `/`; two arms contain same spectrum. One persistent camera follows returning routes.
-1290..1530 (0:43–0:51): moving mirror, old-position ghost, outward+x and return+x become2x then delta=2x. No numerical x readout. Mirror meaning continues to next beat.
-1530..1890 (0:51–1:03): magnified returning waves of ONE highlighted component, reference vs phase-shifted field; shift follows actual shared OPD. Alignment→stronger, opposition→weaker output (power from field-square relation, no formula necessary). No phasor or isolated meter.
-1890..2340 (1:03–1:18): same shared sweep, three different modulation rates immediately linked to detector response. Stable pattern IDs, same cursor / OPD drives all, show few cyan component traces as teaching inspection, not three detector channels. High component completes3 cycles vs low1 for delta0..10um. Waves may retract once rates are understood, not three simultaneous representations.
-2340..2640 (1:18–1:28): sample contribution of1750 decreases from1 to.55, same phase/rate/identity. Show selected stroke thins/trace height decreases; total response changes using same evaluator. No full acquired trace exists yet. This is mechanism preview, not altering historical measurements.
-2640..3120 (1:28–1:44): actual measurement scan, sample fixed. Reset scan cursor visibly to first frozen record OPD then acquire indices0..511 (include exact latest sample). One cyan detector measurement point writes one raw nonnegative total record. Component contribution traces fade into supporting context; actual trace is sum, not independent cosine. Natural zero OPD at index256 yields allcos1 and strongest central contribution; brief ZPD visual moment, no individual phase alignment. Three-line spectrum can have repeated peaks: do not fake broadband envelope/burst.
-3120..3270 (1:44–1:49): subtract stable baseline, retain varying part. Same curve, shift reference zero from raw zero to mean line; demonstrate that signed signal is variation, not negative light. One concise label 减去稳定底值 → 保留变化部分.
-3270..3420 (1:49–1:54): record and its question remain: 每一种节奏，还剩多少？ Reframe into exact Act7 opening coordinates xcenter960,y520,span720,scale180/1.9,stroke3.5. AC samples exactly SLICE_SAMPLE_RECORD.signal.

3420..6000 (1:54–3:20): existing Act7 local0..2579 using SLICE_SAMPLE_RECORD, amplitude demo disabled. Preserve timing, signed calculations, accumulator and actual coefficient-point flights. Default Phase1 behavior remains unchanged.

6000..6420 (3:20–3:34): match transition from actual recovered spectrum points (same nu positions, y745−110*coefficients), not newly spawned results. Move/zoom same points toward original component identities/sample. Compare middle recovered.55 with known teaching input1; other coefficients unchanged. Show 被样品削弱的成分，找回来了. Reference must be labelled 已知教学输入, not measured background. Final next question 实际测量中，怎样获得这份对照？ No B/S/T implementation.

Rough timing can adjust inside beats for comprehension, but exported boundaries/Lead harness must stay consistent; report duration changes first. Keep text concise and readable (~36–48px) except existing frozen Fourier presentation. No precision readout clutter, percentages, coordinate expansion, power squares, unnecessary particles/glow. No narration/audio. Optional subtitles are brief supportive cues, off by default. Main storyboard must work without them.

## Act7 minimal input seam

Add optional props `teachingRecord?:TeachingRecord`, `showAmplitudeDemo?:boolean` defaulting to current DEFAULT_TEACHING_RECORD and true. Use passed record/components for existing project/recover calculations. Default amplitude demo stays1750 initial1→.55; generic target=current component amplitude*.55. Slice supplies showAmplitudeDemo=false so record never changes during decoding. Hide default amplitude-change explanatory line when disabled and call diagnostic stage spectrum-hold instead. Preserve default Phase1 behavior/geometry/timing. Header values must reflect record; no hardcoded1.000 in slice. Add nu identity data attributes to recovered points if useful. Never edit Fourier math core.

## Acceptance

- Puzzle totals equal but weights differ.
- Shared OPD/phase and mirror2x consistent; sampled intensity nonnegative.
-1750 transmission scales amplitude/coefficient1→.55; frequency/zero-crossing locations unchanged; others.55/.35 unchanged.
- Every acquired sample raw−baseline equals the EXACT record fed to Act7; latest trace endpoint equals actual detector point. Sample state fixed through acquisition; no rewrite of past data.
- Natural ZPD from delta=0 only; all three terms yieldcos1.
- Fourier input id persists all2580 frames; wrong2250≈0, matched1750=.55, matching samples genuinely signed; recovered1000=.55,1750=.55,3000=.35.
- Handoff path geometry matches Act7 opening; closure uses real coefficients and consistent identities.
- Frame evaluation independent of seek order and playback history; expose data-frame/beat/record-id/sample index/OPD/raw/baseline/AC and Fourier metadata for read-only QA.
- Native Node type-strip validation, npm run lint/build pass; existing Phase1 numerical regression passes and its core file hash unchanged.
- Lead reviews subtitle-free frames/transitions and flags remaining narrative uncertainty. Completion is a reviewable animatic, not a claim of novice comprehension proven without human review. Stop here.
