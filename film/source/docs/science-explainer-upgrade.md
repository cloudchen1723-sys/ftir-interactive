# Science-explainer revision · 2026-10-03

User direction: upgrade the existing film toward the case's stated 3Blue1Brown science-explainer direction. Preserve the old cinematic assets, restore the OPD/component-to-interferogram transition, retain bilingual subtitles and continuous music. No independent quality-gate restart or PASS claim.

The linked awesome-ai-motion repository is a gallery, with no reusable SKILL.md found for the named case. Its label informs the direction; the referenced video itself was not successfully viewed. This revision uses the project's own teaching and cinematic rules.

## Changes

- Opening: larger molecular modes, restrained equilibrium/displacement guides, larger FTIR stroke morph. The existing mode identities and infrared coupling animation remain.
- Fixed-readout ambiguity: replace the crowded overlapping wave/beam treatment with a composition-weight illustration. One detector response remains unchanged.
- Instrument → record: remove the repeated amber wave overlay and curved connector lines. Retain the moving mirror and detector as context, with the current record as the visual focus.
- Sample: reuse the same three teaching components, change the selected contribution's amplitude, then freeze the sample state for acquisition.
- OPD → interferogram: restore the old scene's common-cursor/alignment/collapse idea. The new transition uses 1000/1750/3000 cm⁻¹ and amplitudes 0.55/0.55/0.35 throughout, rather than the older four illustrative waves. Curves represent component power contributions, not additional physical detector channels.
- Fourier: retain the verified signed products, cumulative projection and coefficient-to-spectrum-point inheritance. Remove the coefficient dashboard and redundant numbers; display positive and negative scanned contributions directly.
- Background/sample: sequentially reveal B and S on one axis and use their existing ratio. Carry the transmittance curve through A = −log10(T) into chemical interpretation, with the same 140-interval illustrative grid at that boundary.

## Restored OPD transition in the full movie

| Time | Motion / meaning |
| --- | --- |
| 03:08.77–03:11.27 | Sample/detector context recedes; component curves expand into one OPD coordinate system. |
| 03:11.27–03:15.00 | One cursor scans all three component powers. One detector endpoint writes the nonnegative total. |
| 03:15.00–03:16.27 | At δ = 0, all component contributions reach their maxima simultaneously. No fabricated broadband envelope. |
| 03:16.27–03:18.73 | Finish the same scan; collected history remains fixed. |
| 03:18.73–03:21.40 | Move each component toward its cumulative-sum boundary; the last boundary is exactly the total record. |
| 03:21.40–03:24.40 | Keep the same total curve and enlarge/recenter it. |
| 03:24.40–03:29.60 | Subtract the stable baseline 1.45. The signed curve is variation relative to that baseline. |
| 03:29.60–03:37.93 | Hold the identical cached record and hand it to the Fourier probe. |

Whole-film duration and all 84 bilingual subtitle cue timings remain unchanged. Music uses the existing continuous bed, with no picture-triggered silence. Original MP3 bytes and all three teaching math modules remain unchanged.

## Verification

- Type check, production build and opening/narrative/Fourier regressions passed.
- Actual 1080p30 OPD clip rendered: `review/style-upgrade/opd-transition-review.mp4` (full-film interval 03:06–03:36).
- The app browser tool failed to initialize. The project's installed Chrome runtime instead continuously played the rendered MP4 from 6–29.5 seconds, decoded 705 frames and reported zero dropped frames. Eleven video-decoder frames were captured; the alignment, cumulative merge, recenter, baseline and handoff states were inspected. Audit: `review/style-upgrade/playback-audit.json`.
- Individual render frames inspected for opening, title, simplified instrument, signed Fourier projection, B/S ratio and absorbance interpretation. This is lead visual QA, not independent scoring or a first-viewer comprehension study.
- No new auditory assessment or final mastering in this visual pass. The prior continuous-music decode/envelope audit still applies to the unchanged source bed.

## Artifact

Updated full MP4: `out/FTIR_full_6min_science_explainer.mp4` — exactly 360.000 seconds, 1920×1080, H.264 30 fps / 10,800 frames, AAC 48 kHz stereo / 360.000 seconds; 32,288,273 bytes. The previous exports are retained.

Review: `http://127.0.0.1:3001/review/video.html?version=science-explainer-upgrade&t=188.8`.

Full video/audio decoding completed without errors. Audio was decoded and checked in all ten former quiet windows (RMS −35.19 to −24.62 dBFS); none was silently muted. Decoded peak −11.91 dBFS. Technical and source-integrity audit: `science-explainer-export-audit.json`. The assembly generator also preserves the new picture-driven record anchors.

The final exported MP4 was continuously played at normal speed in six changed intervals: 2–29s, 34–47s, 144–166s, 239–275s, 299–317s and 327–341s. These checks decoded 3,901 frames with zero dropped frames. Twenty-four decoder captures were inspected alongside the OPD clip's eleven captures; contact sheet: `review/style-upgrade/verified-contact-sheet.jpg`. This is sampled playback QA, not a claim to have watched every second or listened to the music anew.

Remaining visual review points: the lowest-weight dotted component has relatively low contrast in a small viewport; B/S and the emerging ratio briefly coexist during the ratio transition. These are preserved for user review rather than starting another review/implementation loop.
