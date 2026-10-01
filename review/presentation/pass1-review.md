# Presentation Pass 1 review

**Verdict: CHANGES REQUESTED**

Reviewed `presentation-pass1.js`, `presentation-pass1.css`, `index.html`, `story.js`, `AGENTS.md`, `DESIGN.md`, and the supplied presentation brief. This is an independent source and test review; production files were not modified.

## Blocking findings

1. **The claimed continuous Presentation System is only implemented for the first two scenes.** `story.js:48-57` mounts Pass 1 only for steps 0 and 1; steps 2–3 mount the separate N3 renderer, and step 4 uses the older `interferogramScene` renderer (`story.js:148-155`). The requested Michelson six beat sequence and Interferogram progressive construction therefore cannot be accepted from this pass. The implementation has only three beats per Pass 1 scene (`presentation-pass1.js:33-34`), and the final beat calls `onNext` at `presentation-pass1.js:34`, so it cannot provide the specified six-stop Michelson continuity.

2. **Each beat rebuilds the whole SVG stage, which directly violates the continuity requirement.** `render()` calls `molecularMarkup()` or `detectorMarkup()` (`presentation-pass1.js:33`), and `advance()` calls `render()` after every tween (`presentation-pass1.js:34`). This discards element identity and prevents shared visual objects from moving between beats. The implementation has no GSAP dependency or timeline despite the approved motion architecture (`index.html:49-64`; `presentation-pass1.js:17`).

3. **The molecular labels do not follow the moving atoms.** Atom circles and bonds are updated with dynamic coordinates (`presentation-pass1.js:25-27`), but the three element labels are created with fixed `x="250/500/750"` (`presentation-pass1.js:19`) and are never updated. During the asymmetrical motion the O/C/O labels visibly detach from their atoms. The dipole arrow is also hardcoded at x=500 (`presentation-pass1.js:19`), rather than being derived from the current molecular geometry/phase.

4. **The same atom property has two animation owners.** `updateMolecule()` writes `cx` during the JavaScript `requestAnimationFrame` tween (`presentation-pass1.js:17,22-28`) while `.p1-atom` also applies `transition:cx .35s ease` (`presentation-pass1.css:1`). This produces a CSS transition layered over the JS tween and makes the settled state timing unreliable. The bar geometry has the same double ownership: JS writes `y`/`height` in `updateDetector()` (`presentation-pass1.js:32`) while `.p1-bar` transitions both properties (`presentation-pass1.css:1`). One owner must be selected for critical motion.

5. **Back and reset semantics do not meet the presentation contract.** `ArrowLeft` calls `options.onBack` immediately (`presentation-pass1.js:36`), which exits to the previous scene instead of returning to the previous stable beat. `reset()` resets `beat` and mode but leaves `state.phase` unchanged (`presentation-pass1.js:35`), so changing the phase slider and pressing R does not restore the initial phase. The legacy story layer still exposes Replay/Auto/Next controls and scene-level navigation (`story.js:65-83`), so the formal interaction model is not consistently applied.

6. **No background pause or visibility guard exists.** The tween uses `requestAnimationFrame` but never listens to `visibilitychange` or pauses the timeline when the page is backgrounded (`presentation-pass1.js:17`). Returning to the tab therefore allows a beat to continue/settle without a deliberate presenter action, contrary to the required background pause behavior. There is also no explicit repeat/advance lock beyond the local `busy` flag; scene transitions and the parent `visit()` path are not coordinated with a shared playback lifecycle (`presentation-pass1.js:34-37`, `story.js:45-56`).

7. **The fixed-stage scaling has an unsafe minimum for narrow screens.** The stage is fixed at 1600×900 and clipped by the viewport (`presentation-pass1.css:1`), while `resize()` clamps scale to `.35` (`presentation-pass1.js:15`). At viewports below 560×315 CSS pixels this minimum scale is larger than the available viewport and necessarily crops the stage. This needs a bounded fallback or an explicit narrow-window reading mode; it cannot pass the required 1024×768 and narrow-screen checks by source claim alone.

## Scientific and presentation concerns

- The Pass 1 detector scene does preserve the displayed sum 2.0 while morphing `.8/.4/.8` to `.2/1.6/.2` (`presentation-pass1.js:31-34`), but it still labels the visual only as generic response and does not expose the required transition timing/settled conclusion as a continuous scene beyond the local two-state redraw.
- The Pass 1 molecular status is directionally correct for the idealized CO₂ comparison (`presentation-pass1.js:28`), but its initial phase is fixed to 25 and the displayed phase is not tied to a visible coordinate/readout (`presentation-pass1.js:8,19,23`). The presentation brief requires the mode and phase control to remain part of the visual evidence.
- `index.html:58-59` loads Pass 1 before `story.js`, but no GSAP Core/Flip library is loaded. This is acceptable only if the implementation explicitly chooses a different single-owner motion system and meets the same continuity contract; current source does not.

## Verification evidence

Static checks passed: `node --check presentation-pass1.js` and `node --check story.js`.

Existing test execution was mostly green, but `tests/home.test.cjs` has one failure (`首页使用同一合成记录的正反变换，不写入测量状态`, `TypeError: Cannot read properties of null (reading '1')`). The other listed tests completed successfully, including `n3.test.cjs`, `optics.test.cjs`, `physics.test.cjs`, and `story.test.cjs`. This failure is outside Pass 1’s direct files but prevents a clean regression claim.

Browser evidence is **unverified**. The server responds at `http://127.0.0.1:4173/`, but this review subagent could not obtain a usable browser surface: hidden IAB navigation returned `ERR_BLOCKED_BY_CLIENT`, visible IAB is unsupported in the subagent thread, and named Chrome is unavailable. Consequently 1280×720, 1024×768, intermediate beats, final beats, Space/click controls, reset phase, console output, and screenshots remain unchecked. A follow-up reviewer with browser access must capture those states before PASS.

## Bounded revision requested

Keep the production scope to the approved Pass 1 boundary, but first establish one shared beat/timeline owner. Preserve SVG nodes across beats; animate atoms, labels, bonds, mirror/path geometry, detector response, and chart identity from the same state; implement previous-beat and full-scene reset semantics; pause on page visibility loss; and remove or isolate the legacy Replay/Auto/Next controls from the presentation path. Then implement the six Michelson beats and progressive Interferogram beats on that same stage. Re-run the complete test suite and provide screenshots at 1280×720 and 1024×768 for entry, an intermediate beat, and the final beat, including Space, click, ArrowLeft, and R behavior.
