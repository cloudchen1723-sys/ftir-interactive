# Vendored GSAP Core

- Version: GSAP Core 3.13.0
- Source: https://cdn.jsdelivr.net/npm/gsap@3.13.0/dist/gsap.min.js
- Pinned on: 2026-09-30
- SHA-256: `96C01B81F44A3290E2B4532F55E2C9534B2ADC43273A19F3756B2CB41F0FD0B6`
- Scope: Core timeline and interpolation runtime for the presentation sequence.

Vendored companion plugins (all pinned to 3.13.0 from the same public npm
distribution) are loaded before the presentation entry point:

- `Flip.min.js` — N5→N6 layout handoff
- `MotionPathPlugin.min.js` — projected optical pulse handoff
- `CustomEase.min.js` — camera and scientific settle easing
- `DrawSVGPlugin.min.js` — optical path and OPD recording
- `MorphSVGPlugin.min.js` — sampled interferogram coordinate mapping

The file header identifies GreenSock copyright and links to the applicable
license terms: https://gsap.com/standard-license
