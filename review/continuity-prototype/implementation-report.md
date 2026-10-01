# N0–N3 Continuity Prototype implementation report

## Delivered

- continuity-prototype.html is a standalone URL for the N0–N3 prototype.
- continuity-prototype.js owns one deterministic state machine (S0–S9), shared by Next/Space, Back/ArrowLeft, Replay/R and Auto/A.
- continuity-prototype-model.js keeps the state definitions and scientific helpers independent from the DOM.
- continuity-prototype.css keeps a fixed 16:9 stage, Chinese-first labels and a small-screen fallback.
- instrument.js has additive getPartAnchors(), setHotspotsVisible(), setHotspotLabels(), getCameraPose() and setCameraPose() APIs. Existing FTIRInstrument callers retain their previous API.
- vendor/three.min.js and vendor/OrbitControls.js are the local Three.js r128 pair used only by this standalone prototype. Source URLs are https://cdn.jsdelivr.net/npm/three@0.128.0/build/three.min.js and https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js. SHA-256: three.min.js `9274BBCEC8D96168626C732B5D31C775AA8CFB7EAA0599BEC0C175908A2C1CE2`; OrbitControls.js `02BB4ADE710F3E607329E37A21F098BC3AC70EB6E33DAF8A65E79F4DB785E7B2`. The matching MIT text is in vendor/THREE-LICENSE.txt.

## State and science checks

- S0 keeps the complete instrument identity; the prototype filters the legacy hotspot layer to the four main labels.
- S1 sequences source → Michelson interferometer → sample → detector → short AC signal → spectrum, then stops.
- S2/S3 isolate the Michelson assembly and top view.
- S3→S4 is a 4.2 second finite trace: amber input, amber outbound fixed/moving arms, amber return arms, then blue output/detector response. The trace uses the existing instrument.trace() groups and disappears at the stable handoff.
- S4 projects source, splitter, fixed mirror, moving mirror and detector anchors in the same 1452×592 local SVG coordinate system before handing off to the abstract geometry. The abstract wireframe fades in with the handoff progress while the 3D canvas fades out; stable S4 clears the connector fan and keeps only the clean SVG geometry.
- S2/S3 interpolate camera position and target through the additive pose API; Back uses the same state transition path to restore the previous pose.
- S5–S8 show mirror displacement, outbound +Δx, return +Δx, then Δδ = Δx + Δx settling to Δδ = 2Δx. S6 keeps only the outbound path bright; S7 dims the retained outbound path and highlights the return path, with a second nearby +Δx label.
- The teaching geometry is a standard Michelson topology: source left → central splitter diamond; fixed mirror above; moving mirror right; both arms return to the splitter; the selected output goes downward to the detector. Detector is no longer drawn as an extension of the moving-mirror arm.
- S9 plots 1000 and 3000 cm⁻¹ on one 0–10 μm OPD axis; the model reports 1 and 3 periods respectively. The formula states that mirror motion changes OPD, not infrared wavelength.
- S1 calls the existing instrument trace, focus and sample APIs as the source → interferometer → sample → detector sequence progresses; the AC signal and spectrum appear at the end.

## Verification

- node --check continuity-prototype.js — passed.
- node --check instrument.js — passed.
- node tests/continuity-prototype-model.test.cjs — passed.
- node tests/continuity-prototype.test.cjs — passed with CDN requests aborted: S0–S9, S6/S7 path opacity and +Δx labels, S5 mirror transform, shared axis, Back, Replay, Auto and reduced motion.
- node tests/continuity-prototype-screenshots.cjs — passed; generated the fallback captures listed below.
- node tests/continuity-prototype-3d-screenshots.cjs — passed with local Three.js r128: 1280×720 S0/S1/S3/S4/S6/S8/S9, 1920×1080 S0/S4/S9, reduced S4/S8, plus mid-trace and mid-handoff S4 captures.
- The Playwright browser check completed with reduced motion and CDN requests aborted. The environment did not expose the Three.js CDN, so the tested runtime path is the explicit 2D fallback. 3D rendering, camera pose interpolation and live anchor projection remain unverified here.

## Screenshots and known limits

Screenshots are available in review/continuity-prototype/screenshots/:

- 3D 1280×720: S0, S1, S3, S4, S6, S8, S9, plus S4 mid-trace and mid-handoff.
- 3D 1920×1080: S0, S4, S9, plus S4 mid-trace and mid-handoff.
- 3D reduced-motion: S4/S8.
- Explicit fallback 1280×720 and 1920×1080 captures remain as *-fallback.png.

The 3D captures use the local pinned r128 pair and pass the canvas/handoff assertions. The fallback captures remain useful for the explicit no-WebGL path; when that path is active S4 shows “二维降级：未执行 3D 投影” and no fabricated anchor fan.
