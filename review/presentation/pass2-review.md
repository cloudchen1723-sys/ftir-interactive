# Pass 2 independent review — CHANGES REQUESTED

Scope: current Pass 2 Michelson stage (`presentation-optics-model.js`, `presentation-optics.js`, `presentation-optics.css`, `story.js`, `index.html`) and the existing N3 implementation. I made no production edits. Browser evidence was regenerated against `http://127.0.0.1:4173/` with Chrome at 1280×720 and 1024×768; screenshots are in [`review/presentation/pass2`](./pass2/).

## Blocking findings

1. **The renderer does not use the implemented teaching model, so the claimed model/render separation is not real.** `presentation-optics.js:10-14` assigns `teaching` and `g` but never calls either; `presentation-optics.js:16-24` recomputes mirror position, OPD, power, and curves locally. The pure model does call `FTIRN3.geometry`, `FTIRStoryModel.power`, and `FTIRPhysics.mirrorToOPD` (`presentation-optics-model.js:15-35`), but that code is dead in the browser. This creates two independent state machines and allows their units, geometry, and beat timing to diverge. Wire every rendered value through `FTIROpticsTeaching.sample()`/`geometry()` (or remove the model and put the verified shared calculations in the actual renderer); the accepted implementation must visibly reuse the existing N3 geometry rather than maintain a second hard-coded SVG.

2. **The Michelson path is still physically incomplete/wrong at the stable states.** The renderer’s SVG at `presentation-optics.js:9` has a fixed outbound segment (`M380 274V120`) but no fixed-arm return segment to the beam splitter. Its return path is `M${x} 300H406V326H380V500` (`presentation-optics.js:18`), which turns below the splitter and reaches the detector without returning to the splitter/output port. The fresh `beat2` screenshot shows the blue return line stopping at the lower-left corner while the fixed arm has no return path: [`beat2-1280x720.png`](./pass2/beat2-1280x720.png). This cannot support the stated “both arms return and recombine” explanation. Reuse the tested N3/optics path topology and preserve the common beam-splitter/output anchor through the presentation beats.

3. **Beat 2 has no two-increment animation.** On entry to beat 2, `s.progress` is already `1` from beat 1, then `advance()` calls `tweenTo({progress: 1}, ...)` (`presentation-optics.js:28`). Consequently the “去程/回程” label and return claim jump directly to the final state; there is no observable outbound increment followed by a return increment. Beat 3 likewise starts with no state transition beyond a label/formula. The requirement calls for two sequential arm increments before naming `Δδ = 2Δx`; introduce a real phase/state for outbound and return, and preserve a moving intermediate frame for browser verification.

4. **The trace is precomputed in full before scanning begins.** `render()` always assigns complete 0–10 μm paths via `curve(1000)` and `curve(3000)` (`presentation-optics.js:14,22`), while beat 4 only changes opacity and the dot. In the fresh browser capture, `[data-trace1000]` already has a 6,371-character complete path at every captured beat, including entry, and the 3000 trace appears only at beat 5. The record therefore does not grow from the detector during the scan as required. Build the path from the current scan extent (`sample()`/record progress), leaving the unrecorded range absent until the moving cursor reaches it.

5. **The two-track comparison is not a shared progressive record.** At beat 5, the renderer reveals a second full curve and applies a fixed `translate(0 -160)` (`presentation-optics.js:22`); its opacity is 0 for beats 0–4 and 1 at beat 5. This produces an immediate final overlay rather than a continuous 1000-first then 3000 comparison with a common cursor/track scale. The fresh capture does confirm the final note says “1000 一周期 · 3000 三周期”, but that final text does not establish the required motion or data provenance.

6. **The model itself is not aligned with the renderer’s six-beat contract.** `presentation-optics-model.js:43-65` models outbound/return/layout/focus, but the renderer never consumes those fields. It also contains unused `SQRT_HALF` and `lerp` (`presentation-optics-model.js:11-13`), a sign that the geometry conversion was started but not integrated. Add behavior tests for intermediate samples and then make the browser use those samples; the existing model test passing cannot prove the actual page follows it.

## Browser and test evidence

The homepage route reached the presentation through the actual user flow: click `开始探索`, advance Scene 01 and Scene 02 with Space, then enter Scene 03. The page had no `pageerror`; the only console errors were the pre-existing denied CDN Three.js requests and a favicon/asset 404. At both viewports the six stage beats appeared and remained within the viewport. At 1024×768 the fixed stage measured 1024×576 at y=96, preserving the 16:9 classroom stage. These are useful layout checks, but they do not cure the scientific and continuity failures above.

The focused browser test and scientific tests pass:

```
node --test tests/physics.test.cjs tests/optics.test.cjs tests/presentation-optics-model.test.cjs tests/presentation-optics.test.cjs
13 scientific checks passed; presentation model and browser smoke tests passed
```

Those tests currently assert stable beat attributes and final text, and the browser smoke test marks a beam node to check identity. They do not assert that the renderer calls the model, that fixed and moving return paths meet the splitter, or that the curve path grows during an intermediate scan. Therefore this review is **CHANGES REQUESTED**, despite the green test result.

## Priority for revision

First replace the duplicate hard-coded optics with the tested N3 geometry and route all displayed OPD/power/trace state through the model. Then implement observable two-stage arm motion and progressive one-cycle/three-cycle recording, and add browser assertions for an intermediate beat and a mid-scan path length. Re-capture both viewports after those changes; final-state screenshots alone are insufficient.
