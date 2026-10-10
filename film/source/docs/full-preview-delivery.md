# Full six-minute preview delivery

## Science-explainer revision — 2026-10-03

Latest artifact: `out/FTIR_full_6min_science_explainer.mp4` — exactly 360.000 seconds, 1920×1080, H.264 30 fps (10,800 frames), AAC stereo 48 kHz; 32,288,273 bytes. Bilingual subtitles and continuous music are retained. The restored OPD/component-to-interferogram transition is at approximately 03:09–03:24. The original exports remain available below.

Simplifies the repeated instrument/wave overlays, restores shared-OPD component alignment and cumulative summation into the actual record, and continues the earlier opening/Fourier/background/absorbance visual revision. Teaching mathematics and original music hashes are unchanged. Type/build/math regressions and complete MP4 decode passed; actual normal-speed playback was sampled across changed intervals, including a separately rendered OPD clip. No independent quality-gate PASS is claimed. Detailed changes, timing, QA and remaining review points: `science-explainer-upgrade.md`; final technical/audio audit: `science-explainer-export-audit.json`.

## Continuous-music revision — 2026-10-03

Latest artifact: `out/FTIR_full_6min_continuous_music.mp4` (360.000 seconds, 1920×1080, H.264 30 fps; AAC stereo 48 kHz). Per user request, all picture-driven silence and near-silence automation is removed. Base gain remains 0.22; the four-second opening fade, five-second ending fade and natural five-second source crossfades remain.

The old silent windows previously paused the music source cursor. Continuous playback needs 26.3 seconds of extra texture: Part 2 now plays source 1.2–111.3s, crossfades back to 80s, then continues to 126.4s. This repeat uses a five-second overlap at picture 225.6–230.6s. Main source crossfades are now 119.5–124.5s and 266–271s. There is no pitch shift, time stretch or new sound effect. Audit: `full-preview-continuous-music-audit.json`.

The export copies the existing video stream without re-encoding. All 10,800 video packets, hashes and timestamps match the previous export exactly, preserving the visuals and burned-in bilingual subtitles. The decoded final audio contains music in every former quiet window (window RMS −35.18 to −24.60 dBFS); exported peak −13.02 dBFS. All three original music hashes remain unchanged. Historical export and audit below describe the earlier version and are retained for reference.

Delivered 2026-10-03 at the user's explicit request to stop review iterations and supply a complete six-minute file.

Artifact: `out/FTIR_full_6min_preview.mp4` — 360.000 seconds, 1920×1080, H.264, 30 fps; AAC stereo, 48 kHz, 360.000 seconds; 29,848,289 bytes. Bilingual subtitles are burned into the picture; editable sidecar: `full-preview-bilingual.srt` (84 cues).

## Assembly

- 00:00–00:30: revised opening shows three vibrational modes together, inherits the asymmetric mode, then restores old cinematic field-direction and energy-transfer cues with growing response. No E/μ/charge label wall. Existing restrained title reveal retained.
- 00:30–02:51: current Section 02–05 candidate, including decisive composition redistribution, one total-response aperture, moving-mirror carriage/common cursor and sequential A/B reset.
- 02:51–03:37.9: reuses the verified narrative sample/record/baseline pipeline, with presentation-only validation counters suppressed. No teaching mathematics changed.
- 03:37.9–04:56.3: reuses old cinematic Act7 Fourier implementation with the same sample record, retimed to the new narration. The redundant amplitude demo is disabled because sample attenuation has already occurred.
- 04:56.3–05:17.7: reuses old background/sample asset; a brief cue announces the switch to a continuous-spectrum illustration.
- 05:17.7–05:30.0: a necessary T→A bridge uses the same illustrative transmittance and computes A = −log10(T).
- 05:30.0–06:00: reuses old chemical-interpretation and epilogue assets.

The first 171 seconds retain their current edit timing. The provisional later narration is fitted into the remaining 189 seconds using existing-scene animation anchors. `narration_master.txt` is unchanged; `narration_draft.srt` remains provisional. Full-export timing is recorded separately in `fullPreviewTimeline.ts` and the delivered bilingual SRT. No spoken narration was synthesized in this pass.

## Music

Original files remain byte-identical. Real source durations: Part1 129.9069s, Part2 128.6269s, Part3 audio 96.1074s (container 96.1333s). Parts1/2 are MP3, 192 kb/s, 44.1 kHz stereo. Part3 is actually a video container with AAC audio and H.264 video despite its .mp3 extension; only its audio was decoded into a working copy.

Source ranges: Part1 3.0–127.5s; Part2 1.2–126.4s; Part3 0.5–94.5s. Five-second natural crossfades occur at picture 02:14.5–02:19.5 and 04:26.55–04:31.55. Playback pauses across intentional silent windows, with 0.8s fades into/out of silence. No pitch shift, time stretch, beat matching, synthesized effects, compression or per-segment normalization.

Base gain 0.22; near-silence relative gain 0.025. Four-second opening fade and five-second ending fade. Full-silence picture intervals: 39.5–44, 64.5–67, 84–88, 104–108, 160–167 and 235.44–240.28 seconds. Near-silence: 128–134, 152–156, 262.36–270.79 and 334–341 seconds. Detailed objective source/mix data: `full-preview-music-audit.json`.

## Checks and limits

Type check/build passed. Current scan regression passed; Fourier/Michelson/narrative mathematics remain unchanged. Actual exported keyframes inspected at 4,12,40,185,208,260,327,340,356s. ffprobe confirms complete video/audio duration. Decoded final audio peak −12.22 dBFS; sampled intended-silence interiors are exactly zero; musical sections and near-silence regions contain audio. No source decode failure found; two near-full-scale samples in Part3 are attenuated safely in the preview mix.

These audio checks are objective decode/envelope checks, not a human auditory assessment of melody, vocals or musical taste. This is a preview mix, not a final master.

The user stopped independent review before round2/new opening/full assembly were scored. Last completed independent visual verdict remains 8.88 FAIL. This export is a complete preview for human review, not a claim that all cinematic continuity/pacing requirements have passed. Later scenes retain existing layouts and transitions; those remain candidates for future reconstruction after the user reviews this file.
