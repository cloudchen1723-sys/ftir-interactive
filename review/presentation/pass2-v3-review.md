# Pass 2 v3 independent review — N3 current page

**Result: CHANGES REQUESTED**

I reviewed the current implementation in Chrome at 1280×720 and 1024×768 through the actual homepage entry (`首页 → 开始探索 → Space → N3`). Fresh captures and the runtime evidence are in [`pass2-v3-review`](./pass2-v3-review/). The known denied CDN requests and favicon 404 remain external baseline noise; there were no page exceptions.

## Blocking findings

1. **The stable comparison annotation obscures the 3000 curve.** In [`stable5-1280x720.png`](./pass2-v3-review/stable5-1280x720.png), “同一 OPD：1000 一周期 · 3000 三周期” is drawn across the gold track around the middle of the curve. Runtime bounds put the note at y=574.6–596.2 while the gold trace occupies y=538.6–642.2, so the note overlays active signal rather than sitting in unused chart space. Move it below/above the tracks or remove it; the takeaway already states the same comparison.

2. **OPD tick marks have no numeric tick labels.** The record axis renders only `M850 642v16M1165 642v16M1480 642v16`; the visible chart has no `0`, `5`, or `10` values. With the scan explicitly described as `OPD 0→10 μm`, the learner cannot read the shared numeric scale from the graph. Add the numeric values at the three existing ticks while preserving the axis label.

3. **The initial N3 stage is visibly left weighted instead of a large centered opening visual.** [`stable0-1280x720.png`](./pass2-v3-review/stable0-1280x720.png) and [`stable0-1024x768.png`](./pass2-v3-review/stable0-1024x768.png) show the instrument confined to the left third, with most of the stage blank on the right while the record is hidden. Center/enlarge the opening optical stage (or deliberately reserve and label that space) so the first stop reads as the main visual at both classroom viewports.

## Verified behavior

- The renderer now uses `FTIROpticsTeaching.sample()` and `.geometry()` for mirror position, OPD, power, layout/focus, and path progress. The moving label remains anchored in the translated moving-mirror group (`x="330"`), and the mirror stays connected to the horizontal arm.
- `outbound-only-1280x720.png` shows the first `+ Δx`; `mid-shrink-1280x720.png` shows the second increment and `Δδ = 2Δx` after the return phase. The fixed arm remains stationary.
- The stable comparison has distinct, bounded 1000 and 3000 tracks with shared x scale, visible y=0/1 labels, and dots on the corresponding curves. The stable endpoint shows `3000 cm⁻¹ 响应` and `1.00`, matching `power3000` at OPD 10 μm; model tests also verify non-endpoint cosine values and the 1-versus-3 period relationship.
- The detector-to-record link persists through the layout transition, and the scan captures show a growing record with the same OPD extent. Power remains nonnegative and the two traces are explicitly labeled monochromatic comparisons.
- Targeted scientific, renderer, replay/back/reset, and N3 model tests pass (`19` tests). The current browser capture script passes its runtime assertions. The captures include intermediate outbound, shrink, scan, stable beats 0–5, and the 1024×768 initial frame.

Re-review after the three layout/axis legibility fixes. No production files were changed in this review.
