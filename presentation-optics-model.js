/* Deterministic teaching model for the Presentation Michelson stage. */
(function (root, factory) {
  const api = typeof module === 'object' && module.exports
    ? factory(require('./n3.js'), require('./story-model.js'), require('./physics.js'))
    : factory(root.FTIRN3, root.FTIRStoryModel, root.FTIRPhysics);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FTIROpticsTeaching = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (n3, story, physics) {
  'use strict';

  const SQRT_HALF = Math.SQRT1_2;
  const clamp = (value, low = 0, high = 1) => Math.max(low, Math.min(high, Number(value) || 0));
  const lerp = (a, b, t) => a + (b - a) * t;

  function geometry(mirrorUm = 0) {
    const g = n3.geometry(clamp(mirrorUm, 0, 5));
    return Object.assign({}, g, {
      input: [g.source, g.splitter],
      fixedArm: [g.splitter, g.fixed, g.splitter],
      movingArm: [g.splitter, g.moving, g.splitter],
      output: [g.splitter, g.detector],
      vectors: {
        input: [1, 0], inputReflect: [0, -1], movingOutbound: [1, 0],
        movingReturn: [-1, 0], fixedOutbound: [0, -1], fixedReturn: [0, 1], transmitted: [0, 1]
      }
    });
  }

  function power(wn, opdUm) {
    return story.power(Number(wn), Number(opdUm) * 1e-4);
  }

  function opdFromMirror(mirrorUm) {
    return physics.mirrorToOPD(Number(mirrorUm) / 1000) * 1e4;
  }

  function scanProgress(beat, p) {
    if (beat === 4) return p < .35 ? 0 : clamp((p - .35) / .65);
    if (beat === 5) return p < .15 ? 0 : clamp((p - .15) / .85);
    return 0;
  }

  function sample(beat = 0, progress = 1) {
    const b = Math.round(clamp(beat, 0, 5));
    const p = clamp(progress);
    let mirrorUm = 0;
    if (b === 1) mirrorUm = 3.75 * p;
    else if (b === 2 || b === 3) mirrorUm = 3.75;
    else if (b === 4) mirrorUm = p < .20 ? 3.75 : p < .35 ? 3.75 * (1 - (p - .20) / .15) : 5 * ((p - .35) / .65);
    else if (b === 5) mirrorUm = p < .15 ? 5 * (1 - p / .15) : 5 * ((p - .15) / .85);
    mirrorUm = clamp(mirrorUm, 0, 5);
    const opdUm = opdFromMirror(mirrorUm);
    const record = scanProgress(b, p);
    const outbound = b >= 2 && b < 4 ? clamp(p / .45) : b >= 4 ? 0 : 0;
    const returning = b >= 2 && b < 4 ? clamp((p - .50) / .50) : b >= 4 ? 0 : 0;
    const layout = b < 4 ? 0 : b === 4 ? clamp(p / .20) : 1;
    const focus = b < 2 ? 0 : b === 2 ? clamp(p / .45) : b === 3 ? 1 : b === 4 ? 1 - layout : 0;
    return {
      beat: b, progress: p, mirrorUm, opdUm,
      power1000: power(1000, opdUm), power3000: power(3000, opdUm),
      trace1000: b === 5 ? 1 : b === 4 ? record : 0,
      trace3000: b === 5 ? record : 0,
      layout, focus, outbound, return: returning,
      formula: b === 3 ? p : 0,
      comparison: b === 5 ? record : 0
    };
  }

  return Object.freeze({ sample, geometry, power });
}));
