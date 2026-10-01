# Pass 1 v2 independent review

Date: 2026-09-30  
Reviewer: independent browser review  
Scope: Scene 01 / Scene 02, shared presentation clock, story/index integration. N3/N4 are outside this pass.

## Verdict: CHANGES REQUESTED

The Scene 01/02 data states and the constant-total morph are present, but the pass does not yet meet the shared timeline input contract or the classroom viewport requirement.

### Blocking findings

1. **Wheel input escapes Pass 1 and changes scenes.** `story.js:36` handles `wheel` while only checking `n3` and `wheelLock`; it does not check `pass1`. In the browser at 1280×720, with Scene 01 at beat 0, one downward wheel action immediately changed the stage progress from `1 / 09` to `2 / 09` and replaced the molecule with Scene 02. This violates the design rule that scrolling must not advance the presentation and can dispose an active beat mid-play. The touch handlers at `story.js:37-38` have the same missing Pass 1 guard.

2. **The fixed stage is vertically clipped at the required 1280×720 viewport.** `presentation-pass1.css:1` centers an unscaled 1600×900 stage, then `presentation-pass1.js:12` applies `scale(0.8)`. Browser measurements showed the viewport at 1280×720, `.p1-viewport` at 0..720, but the transformed `.p1-stage` at y=90..810. The visible screenshot consequently cuts off the lower 90 px: Scene 01's status/hint are below the viewport, and Scene 02's takeaway/hint are below the viewport. The main visual bars remain visible, but the required conclusion and navigation cue are not reliably visible in the classroom viewport.

### Significant findings

3. **The deployed browser did not load GSAP.** `index.html:57` requests `./vendor/gsap.min.js?v=3.12.5`, but the current checkout has no `vendor/gsap.min.js`; the localhost request returned 404. `sharedtimeline.js:4-11` therefore returns `null`, and `presentation-pass1.js:16-18` takes its immediate static fallback. The browser still reaches the stable states, but this pass does not verify the intended continuous GSAP interpolation until the vendor asset is present. This is recorded as an environment/dependency blocker rather than evaluated as a failure of the later N3/N4 work.

4. **Scene 01 status copy is scientifically imprecise.** `presentation-pass1.js:30` renders `偶极矩导数随振动改变` (“the dipole derivative changes with vibration”). The teaching condition is that the mode has a nonzero derivative `(∂μ/∂Q)₀` at equilibrium; the current wording can be read as saying the derivative itself varies during the motion. The surrounding conclusion is directionally correct, but the stable label should state the derivative criterion explicitly.

### Verified behavior

- `index.html:59-61` loads the shared timeline, Pass 1, and story integration in the expected order.
- Story navigation enters Pass 1 Scene 01 and Pass 1 `onNext` advances to Scene 02 (`story.js:48-50`).
- Scene 01 begins as symmetric / IR inactive, advances to asymmetric / IR active, and then reveals the energy-matching conclusion. The browser showed phase `25 → 55`, `IR inactive → IR active`, and beat labels `观察 → 比较 → 结论`.
- Scene 02 morphs bars `0.8 / 0.4 / 0.8` to `0.2 / 1.6 / 0.2` while the right-side total remains `2.0`; browser DOM snapshots confirmed both states and the `TOTAL 2.0` readout.
- Space advances and ArrowLeft returns through Pass 1 states; the dedicated Pass 1 contract test passes. The repository-wide npm test command was started, but no complete suite result was used as browser evidence.

### Browser evidence

Observed at `http://127.0.0.1:4173/`, 1280×720 viewport, using the existing in-app browser session:

- Scene 01 conclusion screenshot: molecule, dipole arrow, mode controls, and `IR active`; lower status/hint region is clipped.
- Scene 02 initial screenshot: three bars and `TOTAL 2.0`; lower takeaway/hint region is clipped.
- Scene 02 comparison screenshot: values `0.2 / 1.6 / 0.2`, total still `2.0`.
- Wheel reproduction: a single downward wheel from Scene 01 beat 0 changed progress to `2 / 09`.

Re-review after the wheel/touch guard, viewport positioning, and precise dipole-derivative copy are corrected. GSAP interpolation should then be rechecked once the vendor asset is available.
