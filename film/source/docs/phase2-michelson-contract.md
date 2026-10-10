# Phase 2 — Michelson teaching contract

Lead: GPT-6.1 Sol. Implementation: one GPT-6 Luna. Educational model, no instrument calibration, noise, dispersion or phase correction.

## Scope and interfaces

Allowed production edits: `src/scenes/Act4MichelsonCore.tsx`; new `src/math/michelsonTeaching.ts`; only Act 4 subtitle cue text/timing in `src/timeline/filmTimeline.ts`; new small `scripts/validate-michelson-teaching.ts`. No other Acts, App, production registration, palette, master timeline or dependencies. Lead owns review harness and documentation. Report necessary public-interface changes before editing them.

Export `evaluateMichelsonTeaching(mirrorDisplacementUm: number, wavenumber: number)` returning readonly fields `mirrorDisplacementUm`, `opdUm`, `opdCm`, `wavenumber`, `phaseRad`, `movingField: {x,y}`, `totalField: {x,y}`, `normalizedPower`. Export deterministic `getMichelsonTeachingState(localFrame: number)` returning current mirror position and evaluations at 1000 and 3000 cm^-1. Export constants for these two wavenumbers and the 2880-frame scene duration. Finite input checks. No random values, wall clock or playback history.

Equal returned field amplitudes, one constructive output port, phase referenced to ZPD:

`deltaUm = 2*xUm`, `deltaCm = deltaUm*1e-4`, `phi = 2*pi*wavenumber*deltaCm`.
`E1=(1,0)`, `E2=(cos(phi),sin(phi))`, `Etotal=(1+cos(phi),sin(phi))`.
`P=|Etotal|^2/4=(1+cos(phi))/2`, nonnegative 0..1. SVG positive phase uses y=-sin(phi), consistently counterclockwise. P is normalized detector power; phasor length is field amplitude, whose SQUARE determines power. Do not call a signed cosine total optical power. Draw the total-power trace 0..1, with marked baseline 0 and top 1.

## One continuous mirror position

Use linear clamped interpolation through knots `(frame,xUm)`:
`(0,0),(480,0),(620,5),(900,5),(980,0),(1480,5),(1720,5),(1940,7.5),(2020,7.5),(2240,10),(2400,10),(2850,30),(2880,30)`.

All phase/power, slider, moving mirror schematic and record cursor derive from that position; no independent phase rotation. The visible return 900..980 is a mirror reset toward ZPD, not artificial phase alignment. At delta=0 both phasors align naturally. Equal schematic arm lengths at x=0, splitter slash `/` orientation for east input to north fixed arm. Micron displacement deliberately exaggerated spatially and briefly labelled schematic.

## Storyboard within unchanged Act duration

0..450: reveal source, split, mirrors, explicit outbound/return paths and detector output. 450..900: moving mirror, two additional path segments x + x → delta=2x; tiny persistent x/delta readout begins.

900..1650: common displacement rail drives two phasor clocks (1000 and 3000), reset visibly to ZPD then sweep. Keep the readout, exact units, ZPD rail position, phasors at zero visibly aligned. Formula later in this beat; two clocks rotate at 1:3 speed, no fake alignment.

1650..2350: same 1000 phasor object translates into head-to-tail field addition; preserve instantaneous phase across transition. E1 fixed, moving E2, resultant, detector-power bar; hold destructive at x=7.5 for clear cancellation, then constructive x=10. Label square relation concisely. Avoid overlap at zero resultant (hide degenerate arrowhead/label as needed).

2350..2880: same power indicator/object becomes the live trace cursor; current x continues from 10 to 30. Trace samples are evaluated from the same pure function, include exact current endpoint. Phasor → squared resultant → power → trace relation must be visible; do not draw a misleading sinusoid projection from the wrong phasor coordinate. Trace x axis is OPD 20..60 um, P axis 0..1; no second independent clock. Keep captions concise and layout above subtitle region. No particles or gratuitous glow.

Subagent may improve SVG layout and transitions inside these beats. Maintain existing palette and duration. Provide data-* scene diagnostics (frame, x, delta, phase, power, cursor power) for read-only verification.

## User-directed visual revision

OPD doubling beat, local450..900: sole concept mirror moves x → outbound adds x → return adds x → 2x → delta=2x. Focus splitter/right arm/moving mirror; dim other equipment and remove its labels in this beat. Keep a faint old-position mirror and clearly separated outward/return paths. Highlight the added segment from original mirror plane to current mirror plane on both paths. Show two large +x tokens sequentially, merge those same objects, then leave only delta=2x. Remove all precision values, long explanatory box and displacement-exaggeration caption. Suggested beats mirror480..620, added paths620..700, merge700..790, final equation790..900. Camera/layout scaling may exaggerate visible displacement, but state remains shared. Check title does not collide with fixed mirror in the initial full-hardware beat.

Clock beat: consolidate the common OPD input centrally, enlarge clocks and typography, show amber/cyan live phase values next to their matching wavenumbers. Remove the redundant white x/delta/phi strip. One compact comparison, 1x versus3x. Formula remains late and readable. Keep shared model and continuity.

Field-to-power beat: the user's latest direction supersedes the earlier standalone squared-area lesson. Keep only TWO continuous teaching steps, within this beat. No change to accepted clock layout, mathematics, mirror knots or other Acts.

1. Local1600..1780: a minimal return-path recap establishes physical origin. The same split beam returns from the upper fixed arm (E1) and right moving arm (E2), then meets again at the splitter. No equations or precision values. E1/E2 are labels attached to the returning field markers, not unexplained vectors.
2. Local1780..1870: those persistent returning field markers travel into an enlarged head-to-tail phasor diagram; E1 stays fixed, E2 follows the same model phase. Local1870..2350: show resultant length changing and directly linked simplified detector signal strengthening/weakening. Retain the destructive hold1940..2020 and constructive recovery2240. This beat teaches relationship, not calculation.

Use large principal shapes and text. Remove x, delta, phase numeric readouts, coordinate expansion, percentages, P decimal values, 0/1 scale labels and small bottom variables from this beat. Only two formulas, shown sequentially: `E = E1 + E2`, then `P proportional to |E|^2`. Detector display is directly connected to the resultant, with simple fill or brightness driven by actual model power, never by field length alone. A silent geometric squaring cue may be used only if it introduces no extra labels, numbers or teaching stage. Avoid two disconnected charts. Optical recap arms stay amber; mathematical/record marker cyan denotes detector signal.

Carry the same detector record marker continuously into the final trace during2280..2380; keep compact live fields beside trace. Related Act4 subtitles may match the two steps, concisely. No other scenes or scope expansion.
