# Pass 2 v2 independent review — N3 reuse

**Result: CHANGES REQUESTED**

I reviewed the current presentation implementation and ran the real homepage flow in Chrome headless at 1280×720 and 1024×768. The route was `首页 → 开始探索 → Space through Scene 01/02 → N3`. Captures are saved in [`pass2-v2`](./pass2-v2/), with measured DOM evidence in [`evidence-review.json`](./pass2-v2/evidence-review.json).

## Blocking findings

1. **The renderer still does not reuse the tested N3 geometry/state.** `presentation-optics.js:18-20` reconstructs the optical paths with local constants (`M200 190…`, `x`, and local dimension paths) and only calls `po.geometry(d.mirrorUm)` for one x value. The model's `layout`, `focus`, `outbound`, and `return` are not applied to the optical paths or labels. The `data-extra1/2` overlays are separate horizontal strokes at `y=270/300`, outside the arm geometry, so they cannot evidence sequential outbound and return propagation. This fails the requested N3 reuse and makes the formula visual disconnected from the actual beams.

2. **The moving-mirror label is visibly detached from the mirror.** The renderer sets the group translation in `presentation-optics.js:18`, then sets the label to `x=0,y=-22`; the captured stable state shows “动镜” at the upper-left while the mirror is at the right arm. [`stable0-1280x720.png`](./pass2-v2/stable0-1280x720.png) and [`mid4-1280x720.png`](./pass2-v2/mid4-1280x720.png) show the defect. Keep the N3 label coordinates (`x=330,y=139`) inside the translated mirror group, or apply an equivalent group translation that preserves that anchor.

3. **Detector response and 3000-track rendering are inconsistent.** `presentation-optics.js:19` always writes `p1` to `data-power`, even after switching the response label to 3000 cm⁻¹. The renderer's `curve()` (`:12`) uses the same `y=460−power×330` coordinates for both paths, while the 3000 dot is placed on a different track (`:21`) and CSS applies a separate `translateY(110px)`. This creates a trace/dot mismatch and the detector number is still the 1000 response. The captured `stable5` state reports `power="1.00"` from p1 while the label reads 3000; inspect [`evidence-review.json`](./pass2-v2/evidence-review.json).

4. **The two-increment explanation is not observable.** Although `presentation-optics-model.js` exposes `outbound`, `return`, `focus`, and `layout`, the presentation model is sampled only as a generic beat tween. The capture records beat 2 and beat 3 at progress `1.0000`, with no persisted intermediate path phase; the local overlays jump to the final geometry. Implement and render sequential outbound then return states using the model fields, and capture an actual intermediate frame.

5. **The progressive-record evidence is incomplete for the stated two-track comparison.** The 1000 path grows during beat 4 (`t1=1860` at mid4, `4299` at stable4), and the 3000 path grows during beat 5 (`t3=2380` at mid5, `4217` at stable5), which is useful evidence. However, the second track is revealed as a separate transformed group and the 1000 path is already complete at beat 5. The implementation must preserve one shared OPD/cursor scale and route both tracks through the same model coordinates, with dots on the corresponding curves.

## Science/geometry checks

The current model itself passes the basic numerical checks: `Δδ=2Δx`, mirror 0–5 μm maps to OPD 0–10 μm, and `power(1000,10)=power(3000,10)=1` while both are 0 at OPD 5 μm. The model geometry uses splitter `[200,190]`, fixed `[200,60]`, moving `[330,190]→[400,190]`, source `[55,190]`, and detector `[200,315]`, with the expected reflection vectors. Those facts are not enough for a pass because the production renderer does not consume the model's continuous layout/focus/path state.

The stable 1280×720 capture remains inside the fixed 16:9 stage. The 1024×768 stable capture is also present at [`stable0-1024x768.png`](./pass2-v2/stable0-1024x768.png). Browser console output contained the known denied CDN requests and favicon 404; no page error occurred.

## Controls and lifecycle

The presentation surface has no persistent replay/auto/pause controls, so there is no control-bar regression in this entry. The busy guard in `presentation-optics.js:7,25-26` blocks all advances while a tween is active; visibility pause does not clear that `busy` flag, so a hidden-tab interruption can leave the stage unable to resume. Verify pause/resume after correcting the tween/state contract. Recheck reduced-motion, back, replay, and the final N3 exit after implementation.

## Required revision order

1. Route beam geometry, moving label, detector response, cursor, dots, and both traces through the shared N3 geometry/model coordinates.
2. Make outbound and return increments visible as sequential stable/intermediate states; keep the formula reveal after those states.
3. Correct the 3000 track coordinate system and response value, then verify dots lie on their curves.
4. Re-run the real homepage flow and save stable beats 0–5 plus mid-scan and shrink-viewport captures. Add browser assertions for model usage, label anchor, detector response selection, curve/dot alignment, and growing record paths.

