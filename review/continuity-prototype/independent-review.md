# Continuity prototype independent review

Date: 2026-10-01  
Verdict: **CHANGES REQUESTED**

Scope was read-only review of `continuity-prototype.html`, `continuity-prototype.css`, `continuity-prototype.js`, `continuity-prototype-model.js`, the additive `instrument.js` API, the continuity tests, and the implementation report. The standalone entry is not referenced by `index.html`, `story.js`, or `lesson.js`; the production N4–N7 route is therefore not changed by this prototype.

## Findings by acceptance item

- **S0:** Static implementation is present. `setHotspotsVisible()` keeps source, splitter, sample, and detector as the four main visible labels. Other instrument parts remain in the underlying model.
- **S1:** The preview is one state transition with a GSAP duration of 9 seconds (`continuity-prototype.js:22`). It progressively activates source → Michelson → sample → detector, then reveals the AC signal and spectrum, and stops. This meets the requested 8–12 second range in code.
- **Labels:** The four pipeline labels are Chinese-first with English secondary text: `红外光源 / IR source`, `Michelson 干涉仪 / interferometer`, `样品室 / sample`, `探测器 / detector`.
- **S2/S3:** The instrument switches to optical mode and overview/top view. The existing instrument API remains additive.
- **S4:** `getPartAnchors()` projects 3D part positions into the instrument host pixel space; the prototype uses matching 1452×592 SVG coordinates and interpolates those positions toward the abstract geometry. This is structurally correct, but not browser-verified because Three.js could not be loaded in the test environment.
- **S5:** The state machine sets the teaching mirror displacement to 5 μm and renders the dimension as 85 local SVG units. The model's OPD helper gives `2 × 5 = 10 μm`.
- **S6/S7:** **Blocking failure.** The abstract SVG has one undifferentiated `<path class="return-beam">` and no `#cpOut` or `#cpReturn` elements. The CSS explicitly targets `#cpReturn` at S6 and `#cpOut` at S7, but those IDs are never emitted (`continuity-prototype.js:14`, `continuity-prototype.css:3`). Consequently the requested separate outbound `+Δx` and return `+Δx` evidence is not represented as state-specific visual paths. The browser test fails here while waiting for `#cpReturn`.
- **S8:** The formula is generated from state, first as `Δδ = Δx + Δx` and then settles to `Δδ = 2Δx` when the state completes (`continuity-prototype.js:20-22`).
- **S9:** The model uses a common 0–10 μm OPD axis and reports 1 period at 1000 cm⁻¹ and 3 periods at 3000 cm⁻¹. The SVG labels both traces on the shared axis. The model test passes.
- **Back / Replay / Auto:** Space/Next, Left/Back, R/Replay, and A/Auto share the same state machine. Busy transitions ignore duplicate advancement; Replay kills active tweens; Auto pauses on visibility changes and resumes scheduling. These are statically coherent.
- **Reduced motion:** `matchMedia('(prefers-reduced-motion: reduce)')` skips the 9-second and handoff animations while rendering their final evidence. The model test passes. The browser test could not complete.
- **UI stacking:** The prototype uses one fixed 1600×900 stage with a single control row and no production navigation. Static CSS does not show a new card stack or production-flow overlay. 1280×720 / 1920×1080 screenshot checks remain unverified.

## Tests and dependency assessment

Passed:

- `node --check continuity-prototype.js`
- `node --check instrument.js`
- `node tests/continuity-prototype-model.test.cjs`

`node tests/continuity-prototype.test.cjs` did not pass. It timed out waiting for `#cpReturn` after 30 seconds; this selector is required by the test and absent from the generated SVG. This is a concrete S6/S7 implementation/test failure, not merely a CDN timeout.

The entry loads Three.js and OrbitControls from jsDelivr. There is no local Three.js copy in `vendor/` or elsewhere in the workspace; only GSAP is bundled. The implementation's explicit 2D fallback keeps the S0–S9 state machine reachable when the CDN is unavailable, so CDN unavailability alone does not block the fallback lesson. It does prevent acceptance of the required live 3D-to-SVG anchor handoff, which remains unverified until a browser with Three.js available is used.

## Required changes

Add separate outbound and return SVG paths with stable IDs (for example `#cpOut` and `#cpReturn`), set their state-specific opacity/visibility for S6 and S7, and ensure the formula/labels show one `+Δx` contribution at each stop. Update the browser test only if the intended IDs change; do not remove the assertion that the two paths are separately visible.

After that fix, rerun the browser test with reduced motion and once with Three.js available to verify real anchor coordinates, then perform the requested 1280×720 and 1920×1080 visual checks. The viewport screenshots and live 3D check are currently unverified visual/3D debt; the missing S6/S7 paths are the present delivery blocker.

## Second-round review (2026-10-01)

The S6/S7 implementation is now present: `abstract()` emits `#cpOut`, `#cpReturn`, `#cpOutDelta`, and `#cpReturnDelta`, with S6/S7-specific opacity and labels. `node tests/continuity-prototype.test.cjs` now passes, including S0–S9, S6/S7 opacity, S5 mirror position, shared axis, Back, Replay, Auto, and reduced-motion checks. The camera additions are also structurally coherent: `getCameraPose()`/`setCameraPose()` are additive APIs, and `animateCamera()` uses GSAP to interpolate between captured base, Michelson-detail, and top poses.

The supplied screenshots are all explicitly fallback captures (`1280x720-S0/S4/S9-fallback.png`, `1920x1080-S0/S4/S9-fallback.png`, and reduced-motion fallback captures). They are useful for layout inspection but are not evidence of the required 3D→SVG handoff. There is still no local Three.js copy; the CDN is unavailable in the test environment. Therefore the core 3D acceptance item remains unverified and the final verdict cannot be PASS.

Two concrete visual/science issues are visible in the fallback captures:

1. S4 draws anchor lines from `(0,0)` when `getPartAnchors()` is unavailable (`continuity-prototype.js:14`). The fallback screenshot shows a fan of dashed lines from the upper-left corner, which visually presents invented projection data. The fallback should omit live anchors or label the diagram as a static fallback; it must not imply real 3D coordinates.
2. S4 shows duplicate small anchor labels over the larger abstract labels, and S8 places `Δδ = 2Δx` directly across the splitter/beam area. This violates the no UI/scientific-graphic stacking requirement and reduces legibility. The S4 label layer needs deduplication, and the S8 formula needs a clear non-overlapping location.

Updated verdict: **CHANGES REQUESTED**. The minimum remaining blocker is real 3D verification plus removal of the fake fallback anchors; the S4/S8 overlaps are visual blockers for the requested no-stacking acceptance. S6/S7, camera interpolation code, Chinese-first controls, S1 instrument-driven trace calls, Back/Replay/Auto, and reduced-motion behavior now have passing fallback test evidence.
