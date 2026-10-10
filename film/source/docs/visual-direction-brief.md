# Visual direction round — Lead boundary

This round authorizes one GPT-6 Astra as a read-only visual/motion director. The earlier single-Luna implementation rule is superseded only for this visual proposal. No implementation agent is started in this round before the proposal and Lead review are complete.

The story remains problem → need → mechanism → measurement → decoding → answer. Early sample establishes the measurement purpose. Actual transmission optics remain source → Michelson → sample → detector. Visual grammar, framing, shot boundaries and camera choreography may be challenged; mathematical/data meaning may not.

Locked: TeachingComponent shape; identities1000/1750/3000; source weights0.55/1/0.35; transmission1/0.55/1; sample weights0.55/0.55/0.35; shared OPD and mirror displacement relation; same-frequency arm interference; different-frequency intensity contributions summed at one detector; immutable acquired512-point sample record; raw−baseline equals the exact Fourier AC record; signed projection and coefficient-to-point provenance.1750 stays synthetic. No fake broadband envelope. Known teaching input is not measured background.

Frozen code/model: `src/math/fourierTeaching.ts`, `src/math/michelsonTeaching.ts`, numerical contracts in `src/math/narrativeTeaching.ts`. Phase1 numerical core must not be redesigned. Existing Act7 input seam remains `teachingRecord` and `showAmplitudeDemo`; visual extensions require Lead review and preserve original default behavior.

Proposed implementation scope after visual approval: `src/scenes/NarrativeVerticalSlice.tsx`, new isolated `src/components/narrative/*` visual helpers, standalone review harness and documentation. Slice-only beat/duration metadata may be updated by Lead if an approved timing change needs it; spectral values/functions/record are unchanged. Any Act7 visual seam must be explicit and backwards compatible. Production Acts3–6, global timeline, App, FTIRFilm, palette, package/dependencies remain outside scope.

Color meaning remains optical amber / measured cyan / neutral math white / context gray. Stable line patterns remain available to distinguish components. Signal Thread tracks the same information through changing representations; it must not suggest physical separation into three detectors or light moving through the interferometer at mirror-scan speed.

Astra delivers direction and storyboard only: actual starting/ending objects, causal change, data driver, camera/match, novice inference, misleading-reading risk, and practical SVG/Remotion mechanism per shot. Lead accepts, modifies or rejects suggestions before preparing the implementation plan. Astra does not run builds, validations, mechanical cleanup, metadata migration or ordinary React coding.
