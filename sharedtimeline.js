/* Shared presentation clock & unified transition engine.
   GSAP owns interpolation; this adapter manages seamless transitions and zero-delay jumpToEnd. */
(function () {
  'use strict';

  let activeTransition = null;

  function create() {
    const gsap = window.gsap;
    const timeline = gsap ? gsap.timeline({ paused: true }) : null;
    return {
      to(target, vars) {
        if (!timeline) {
          vars.onUpdate?.();
          vars.onComplete?.();
          return null;
        }
        timeline.pause(0).clear();
        timeline.to(target, { ...vars });
        timeline.play(0);
        return timeline;
      },
      pause() { timeline?.pause(); },
      resume() { timeline?.resume(); },
      reset() { timeline?.pause(0).clear(); },
      kill() { timeline?.kill(); }
    };
  }

  function to(target, vars) {
    const clock = create();
    return clock ? clock.to(target, vars) : null;
  }

  /**
   * killTweensOf:
   * Immediately terminates active GSAP tweens on target (or all tweens if target is omitted),
   * and instantly settles any in-flight scene transition so the UI never blocks the user.
   */
  function killTweensOf(target) {
    const gsap = window.gsap;
    if (gsap) {
      if (target) {
        gsap.killTweensOf(target);
      } else {
        gsap.killTweensOf('*');
      }
    }

    // If an active scene transition is pending swap or in flight, settle it immediately!
    if (activeTransition) {
      const trans = activeTransition;
      activeTransition = null;
      if (trans.pendingSwap && typeof trans.swapFn === 'function') {
        trans.swapFn();
        trans.pendingSwap = false;
      }
      if (trans.target) {
        trans.target.style.opacity = '1';
        trans.target.style.transform = 'none';
      }
      trans.options?.onComplete?.();
    }
  }

  /**
   * transitionToNext:
   * Unified scene transition engine calling GSAP's `to` animation with cross-fade logic,
   * supporting instant snapping and immediate killTweensOf on user click/interaction.
   *
   * @param {HTMLElement} target - The container element to animate (e.g., visual area)
   * @param {Function} swapFn - Callback to mount/swap the next scene content
   * @param {Object} [options] - Options { duration, instant, ease, onComplete }
   */
  function transitionToNext(target, swapFn, options = {}) {
    const gsap = window.gsap;
    const duration = options.duration ?? 0.18;
    const instant = options.instant || !gsap || (window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches);

    // If a transition or tween is already in flight, settle it immediately before starting!
    killTweensOf(target);

    if (instant || !target) {
      swapFn?.();
      if (target) {
        target.style.opacity = '1';
        target.style.transform = 'none';
      }
      options.onComplete?.();
      return;
    }

    const half = Math.max(0.04, duration / 2);
    const transState = {
      target,
      swapFn,
      pendingSwap: true,
      options
    };
    activeTransition = transState;

    // Step 1: Smooth fade out using GSAP to
    gsap.to(target, {
      opacity: 0.15,
      y: -3,
      duration: half,
      ease: options.ease || 'power1.out',
      onComplete: () => {
        if (activeTransition !== transState) return; // Snapped or cancelled early

        // Swap the content at the lowest opacity point
        swapFn?.();
        transState.pendingSwap = false;

        // Step 2: Smooth fade in using GSAP to
        gsap.fromTo(target,
          { opacity: 0.2, y: 3 },
          {
            opacity: 1,
            y: 0,
            duration: half,
            ease: options.ease || 'power1.out',
            onComplete: () => {
              if (activeTransition === transState) {
                activeTransition = null;
              }
              options.onComplete?.();
            }
          }
        );
      }
    });
  }

  // Global registration on both window.FTIRTimeline and top-level window for universal access
  window.FTIRTimeline = {
    create,
    to,
    transitionToNext,
    killTweensOf
  };

  window.transitionToNext = transitionToNext;
  window.killTweensOf = killTweensOf;
})();
