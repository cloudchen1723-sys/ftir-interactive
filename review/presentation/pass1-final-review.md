# Pass 1 final independent review

Date: 2026-09-30  
Reviewer: independent Luna browser review  
Scope: Pass 1 Scene 01 / Scene 02, shared clock, saved 1280×720 and 1024×768 renders. N3/N4 and unrelated baseline items are out of scope.

## Verdict: PASS

No remaining real Pass 1 blocker was found in the current runtime or saved final renders.

## Evidence

- `node --test tests/presentation-pass1.test.cjs` passed. The focused browser test verified GSAP `3.13.0`, DOM identity across a beat transition, control keyboard isolation, ArrowLeft previous beat, constant-total Scene 02 morph, and reduced-motion progression.
- Saved final renders inspected: `review/presentation/pass1-v3/scene01-02-scene01-final-1280x720.png`, `scene01-02-scene01-final-1024x768.png`, `scene01-02-scene02-final-1280x720.png`, and `scene01-02-scene02-final-1024x768.png`.
- Scene 01 live DOM at the final beat: at 1280×720 `.p1-status` is y=622.71–651.51 and `.p1-takeaway` is y=669.53–697.60, leaving 18.01 px; at 1024×768 they are y=594.17–617.21 and y=631.62–654.08, leaving 14.41 px. The strings do not overlap.
- Scene 01 science state is coherent: initial beat showed symmetric O–C–O geometry with `IR inactive / 净偶极矩不变`; the next beat moved the atoms and showed `IR active / 净偶极矩随振动改变`; the final state retained the active status and displayed `能量匹配 → 吸收`. The measured atom positions changed between beats, so the motion was not lost.
- Scene 02 live DOM title is `一个总响应能区分波数组成吗？`, avoiding a broad detector-impossibility claim. The total-panel qualifier is a single `等响应假设` line at both viewports (1280: 26 px effective text; 1024: 20 px effective text), with no orphan character or wrap. The final values remain `0.2 / 1.6 / 0.2`, total `2.0`.
- The fixed stage remains contained at both tested viewports; the 1024×768 stage is 1024×576 with 96 px letterbox above and below. No graph clipping was observed.

## Non-blocking watch item

The redundant SVG helper `能量匹配 → 吸收` is 16 CSS px at the 1280 baseline and scales to 12.8 px in the 1024 capture, with black fill. It remains legible in the supplied renders and the larger takeaway already carries the same conclusion, so this is a polish consideration rather than a Pass 1 blocker. If projection testing later finds it too small, remove the redundant helper or raise its styling without changing the state logic.

## Runtime notes

The existing capture still reports denied CDN requests and a favicon/resource 404. They did not prevent the Pass 1 GSAP/SVG stage from loading and are unchanged baseline requests, so they are not counted as Pass 1 failures.
