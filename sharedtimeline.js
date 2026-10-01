/* Shared presentation clock. GSAP owns interpolation; this adapter keeps the contract testable offline. */
(function () {
  'use strict';
  function create() {
    const gsap = window.gsap;
    const timeline = gsap.timeline({ paused: true });
    return {
      to(target, vars) {
        timeline.pause(0).clear();
        timeline.to(target, { ...vars });
        timeline.play(0);
        return timeline;
      },
      pause() { timeline.pause(); },
      resume() { timeline.resume(); },
      reset() { timeline.pause(0).clear(); },
      kill() { timeline.kill(); }
    };
  }
  function to(target, vars) { const clock = create(); return clock ? clock.to(target, vars) : null; }
  window.FTIRTimeline = { create, to };
}());
