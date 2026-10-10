# Phase 1 — Fourier teaching pipeline

Approved scope: finite deterministic synthetic components, Act 7, minimal Act 6 closing-record handoff, directly related subtitles, small validation. No other scenes, palette, App, audio, dependencies, act timing or Film entry changes.

## Scientific contract (Lead-owned)

`TeachingComponent = { wavenumber: number; amplitude: number }`.

Units: wavenumber cm^-1, OPD cm internally; display OPD in micrometres. Components are synthetic examples, not identified sample/reference peaks.

Default components: 1000/.55, 1750/1, 3000/.35. Wrong probe: 2250. Record: N=512, delta_i=-.002+i*.004/N cm, i=0..N-1 (periodic sampling, endpoint excluded). Thus selected components and wrong probe lie on orthogonal bins. No hidden frequency/display rescaling.

g(delta)=sum amplitude*cos(2*pi*wavenumber*delta).
probe(delta)=cos(2*pi*probeWavenumber*delta).
product_i=g_i*probe_i (signed).
coefficient=sum(product)/sum(probe^2).
partial accumulator=sum(product up to cursor)/FULL sum(probe^2), so the terminal value is exactly coefficient. Drawing may use magnitude to size signed areas, but never absolute-value the accumulation. Do not clamp computed coefficients or independently normalize signals. Fixed visual scales belong to renderer only.

Required exports in `src/math/fourierTeaching.ts`:
- TeachingComponent; TeachingRecord (stable id, immutable components/opdCm/signal, sampleCount/opdSpanCm, synthetic provenance).
- DEFAULT_TEACHING_COMPONENTS, DEFAULT_TEACHING_RECORD, WRONG_PROBE_WAVENUMBER.
- createTeachingRecord(components, optional sampleCount/opdSpanCm).
- evaluateTeachingSignal(components, opdCm), evaluateTeachingProbe(wavenumber, opdCm).
- projectTeachingRecord(record, wavenumber): probe[], signedProduct[], cumulative[], denominator, coefficient. cumulative[k] means k samples accumulated, so length N+1, cumulative[0]=0.
- recoverTeachingSpectrum(record, candidateWavenumbers): points {wavenumber, coefficient}.

Pure frame/story evaluation may live in `src/scenes/fourierTeachingState.ts`. No timers, random values, mutable runtime serial ids or React state accumulating values across frames. Tests must evaluate repeated frames in differing order.

## Visual direction

Keep the existing palette/fonts, 1920x1080 and Act 7's 2580 frames. Content stays above global subtitle band. Synthetic line spectrum is drawn as stems/points, not Gaussian material bands or a fake smooth continuous spectrum.

Opening Act 7 starts from Act 6's closing record at the same graph position (960,520), span 720 and fixed scale 180/sum(default amplitudes), then moves/reframes it. Act 6 only replace the final collapsed record path's generator with this teaching signal over same OPD range; keep earlier sequences unchanged. A small closing label can identify synthetic teaching data.

Suggested local frame beats (implementation can refine within 2580 frames):
- 0-150 record/reframe; introduce source identity succinctly.
- 150-270 probe enters.
- 270-360 signed contribution enters.
- 360-660 wrong probe scan and brief completed-result hold.
- 660-780 continuous probe-frequency change to 1750; no pretend measurement during change.
- 780-1140 matching scan/result hold.
- 1140-1260 coefficient token travels to actual 1750 spectrum x and computed y.
- 1260-1560 recover/deposit 1000; 1560-1860 recover/deposit 3000.
- 1860-2160 accelerated candidate scan forming calculated teaching spectrum.
- 2160-2400 lower 1750 source amplitude 1 -> .55 and recover/update same spectrum point.
- 2400-2580 formula appears last.

Layer reveal is sequential. Positive and negative signed contributions remain visible and visibly feed a signed accumulator around zero. Fixed scales allow wrong vs matching comparisons. One persistent coefficient token travels from accumulator to spectrum; deposited marker for that candidate appears only after token arrives, or use the same marker throughout. No duplicate dot popping in during flight. Changing amplitude must update the interferogram and coefficient from the changed record, not animate an independent point height.

Allow SVG/layout/mask/transition improvements within scope if they improve explanation. No decorative particles, glow, unrelated UI. Short intrinsic labels should carry explanation with global subtitles absent.

## Ownership / allowed edits

Single GPT-6 Luna implementer owns:
- NEW src/math/fourierTeaching.ts
- NEW src/scenes/fourierTeachingState.ts (optional)
- src/scenes/Act7FourierTransform.tsx
- src/scenes/Act6InterferogramZPD.tsx (minimal final-record handoff only)
- src/timeline/filmTimeline.ts (only Act 6 final handoff subtitle and Act 7 subtitle cue/text adjustments; ACTS/FILM_CONFIG and unrelated cues untouched)
- NEW scripts/validate-fourier-teaching.ts

Lead owns this contract and any review artifacts. No other production files without reporting to Lead first.

## Acceptance

No abs(product) accumulation. Shared OPD/wavenumber definition. Wrong coefficient approximately zero; matching coefficient equals input amplitude to ordinary floating tolerance. Composite products have both signs. Partial accumulator ends at coefficient. Every spectrum point comes from projection. Amplitude change recovers corresponding amplitude. npm run lint and npm run build pass. Deterministic frame evaluation. Visual review covers wrong/matched scans, holds, token flight, repeat/sweep and amplitude update with subtitles hidden. No Phase 2 work.
