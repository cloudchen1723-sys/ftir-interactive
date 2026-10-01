/* Cached N4 teaching records. Physics and units come from physics.js/story-model.js. */
(function (root, factory) {
  const api = typeof module === 'object' && module.exports
    ? factory(require('./physics.js'), require('./story-model.js'))
    : factory(root.FTIRPhysics, root.FTIRStoryModel);
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FTIRInterferogramTeaching = api;
}(typeof globalThis !== 'undefined' ? globalThis : this, function (physics, story) {
  'use strict';
  const N = 32768, H = 0.00000625;
  const cache = new Map();
  const componentCache = new Map();

  function getComponents(count) {
    const n = Math.max(1, Math.min(3, Math.round(Number(count) || 1)));
    return story.lines.slice(0, n);
  }

  function makeRecord(key) {
    if (key === 'broadband') return physics.densityRecord(w => physics.response(w), { n: N, h: H, label: '宽带数值近似' });
    const count = Number(key);
    return physics.lineRecord(getComponents(count), { n: N, h: H, label: `${count} 个离散分量` });
  }

  function getRecord(countOrBroadband = 1) {
    const key = typeof countOrBroadband === 'string' && /broad/i.test(countOrBroadband)
      || countOrBroadband === true ? 'broadband' : String(Math.max(1, Math.min(3, Math.round(Number(countOrBroadband) || 1))));
    if (!cache.has(key)) cache.set(key, makeRecord(key));
    return cache.get(key);
  }

  function getComponentRecord(index0to2) {
    const index = Math.max(0, Math.min(2, Math.round(Number(index0to2) || 0)));
    if (!componentCache.has(index)) componentCache.set(index,
      physics.lineRecord([story.lines[index]], { n: N, h: H, label: `分量 ${index + 1}` }));
    return componentCache.get(index);
  }

  function visibleSeries(record, minUm, maxUm, optionalNormalization) {
    const broadband = record.kind === 'density';
    const lo = Number.isFinite(minUm) ? minUm : (broadband ? -80 : -20);
    const hi = Number.isFinite(maxUm) ? maxUm : (broadband ? 80 : 20);
    const xs = [], ys = [];
    for (let i = 0; i < record.xs.length; i++) {
      const xUm = record.xs[i] * 1e4;
      if (xUm >= lo && xUm <= hi) { xs.push(xUm); ys.push(record.ys[i]); }
    }
    let scale = 1;
    if (typeof optionalNormalization === 'number' && Number.isFinite(optionalNormalization)) scale = optionalNormalization;
    else if (optionalNormalization === true || optionalNormalization === 'peak') {
      const peak = ys.reduce((m, y) => Math.max(m, Math.abs(y)), 0); scale = peak ? 1 / peak : 1;
    }
    return Object.freeze({ xs: Object.freeze(xs), ys: Object.freeze(ys.map(y => y * scale)), scale, recordId: record.id, kind: record.kind });
  }

  function componentSeries(index0to2, minUm = -20, maxUm = 20) {
    return visibleSeries(getComponentRecord(index0to2), minUm, maxUm);
  }

  function cumulativeSeries(count, minUm = -20, maxUm = 20) {
    const n = Math.max(1, Math.min(3, Math.round(Number(count) || 1)));
    const parts = Array.from({ length: n }, (_, i) => componentSeries(i, minUm, maxUm));
    const xs = parts[0].xs;
    const ys = xs.map((_, i) => parts.reduce((sum, part) => sum + part.ys[i], 0));
    return Object.freeze({ xs, ys: Object.freeze(ys), scale: 1, recordId: getRecord(n).id, kind: 'lines' });
  }

  function mixedSeries(fromCount = 0, toCount = 1, progress = 1) {
    const from = Math.max(0, Math.min(3, Math.round(Number(fromCount) || 0)));
    const to = Math.max(0, Math.min(3, Math.round(Number(toCount) || 0)));
    const p = Math.max(0, Math.min(1, Number(progress) || 0));
    // The endpoints are cumulative sums assembled from cached single-component
    // records. This keeps component identity and the OPD grid explicit instead
    // of treating a cumulative record as one line.
    const fromRecord = from ? getRecord(from) : null;
    const toRecord = to ? getRecord(to) : null;
    const fromView = fromRecord ? cumulativeSeries(from, -20, 20) : null;
    const toView = toRecord ? cumulativeSeries(to, -20, 20) : null;
    const xs = fromView ? fromView.xs : toView ? toView.xs : [];
    const ys = xs.map((_, i) => (fromView ? fromView.ys[i] : 0) + p * ((toView ? toView.ys[i] : 0) - (fromView ? fromView.ys[i] : 0)));
    return Object.freeze({ xs, ys: Object.freeze(ys), fromRecordId: fromRecord?.id || null, toRecordId: toRecord?.id || null, fromCount: from, toCount: to, progress: p });
  }

  return Object.freeze({ getRecord, getComponents, getComponentRecord, componentSeries, cumulativeSeries, mixedSeries, visibleSeries, sample: getRecord });
}));
