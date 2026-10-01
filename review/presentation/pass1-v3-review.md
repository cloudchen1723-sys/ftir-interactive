# Pass 1 v3 independent review

Date: 2026-09-30  
Reviewer: independent Luna browser review  
Scope: Scene 01 / Scene 02, shared Pass 1 clock, story/index integration. N3/N4 were not reviewed as blockers.

## Verdict: CHANGES REQUESTED

The v3 runtime behavior and data states are substantially improved and the GSAP runtime is now present. The pass still has two visible layout blockers in the required classroom viewports, plus one wording issue that overstates the detector claim.

### Blocking findings

1. **Scene 01 final conclusion overlaps the status row.** At 1280×720, the final frame places `.p1-takeaway` at x=68.8–505.6, y=635.9–664.0 while `.p1-status` is x=128–1152, y=622.7–651.5. The strings visibly collide around “IR active / 净偶极矩随振动改变” and the conclusion. The 1024×768 final capture shows the same collision after fixed-stage scaling. Move the conclusion to its own reserved line or move the status/control group upward so the stable evidence and conclusion never share the same vertical band.

2. **Scene 02’s right-side qualifier wraps as an orphan character.** At 1280×720 and 1024×768, `等响应 · 相对量` renders as `等响应 · 相对` followed by a lone `量` line inside the TOTAL panel. This is avoidable label breakage in a primary scientific readout. Widen the panel or shorten/reflow the label intentionally (for example, `等响应 · 相对单位`) while preserving the stated equal-response assumption.

3. **Scene 02 title makes a broad detector impossibility claim.** The rendered title is `为什么探测器不能直接给出光谱？`. The design acceptance explicitly says not to generalize that all detectors cannot separate light; the teaching point is that this simplified equal-response detector readout is only a total and does not identify composition. Change the title to a scoped question such as `为什么一个总读数不够？` or otherwise state the model limitation on-screen.

### Verified behavior

- `node --test tests/presentation-pass1.test.cjs` passed. It verified GSAP runtime `3.13.0`, DOM identity through a beat transition, keyboard isolation, ArrowLeft previous beat, constant-total morph, and reduced-motion progression.
- `node review/presentation/capture-v3.cjs` completed at 1280×720 and 1024×768. Both ended at Scene 02 beat 2 with `0.2 / 1.6 / 0.2`, `TOTAL 2.0`, and GSAP `3.13.0`.
- A browser check showed a wheel event leaves Pass 1 at `1 / 09`; it does not advance or dispose the active stage. Pressing `R` after a completed Scene 01 returns to `观察` / beat `0`.
- Scene 01 scientific state is directionally correct: symmetric geometry starts with no net dipole change; the next state changes the dipole; the final state adds `能量匹配 → 吸收`. Scene 02 preserves the sum 2.0 while morphing the three contributions.
- The fixed 16:9 stage is contained: at 1280×720 it fills the viewport, and at 1024×768 it is 1024×576 with 96 px top/bottom letterbox. The main graphs are not clipped.
- Buttons and slider are native controls, their events are isolated from stage advance, and keyboard repeat is ignored by the Pass 1 key handler. `presentation-pass1.js` pauses the shared clock when the document is hidden and does not auto-resume or catch up on return, which matches the explicit-resume requirement; I did not claim a full OS background-tab timing proof from headless capture.

### Runtime / console notes

The capture logged network-denied requests for the existing CDN Three.js assets and a 404 (favicon/resource). These are baseline external/decorative requests and did not prevent the Pass 1 GSAP/SVG stage from loading; they are not counted as new Pass 1 runtime failures.

### Evidence

Screenshots and capture JSON are in [the review evidence directory](./pass1-v3-review/evidence/). The supplied capture script generated the 1280×720 and 1024×768 entry/middle/final frames used above.
