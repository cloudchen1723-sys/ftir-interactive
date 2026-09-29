/* FTIR ideal teaching model. Units: OPD cm; wavenumber cm^-1.
 * No renderer or lesson state is allowed in this module. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.FTIRPhysics = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const DEFAULT_N = 2048, DEFAULT_H = 0.0001;
  let serial = 0;
  function checkGrid(n, h) {
    if (!Number.isInteger(n) || n < 16 || (n & (n - 1))) throw new Error('本实现的快速算法使用 2 的幂点数；这不是 DFT 的物理限制。');
    if (!(h > 0) || !Number.isFinite(h)) throw new Error('OPD 采样间距必须是正数。');
  }
  function grid(n = DEFAULT_N, h = DEFAULT_H) {
    checkGrid(n, h);
    return { n, h, dnu: 1 / (n * h), nyquist: 1 / (2 * h),
      xs: Array.from({ length: n }, (_, i) => (i - n / 2) * h) };
  }
  function fft(re, im, inverse = false) {
    const n = re.length;
    for (let i = 1, j = 0; i < n; i++) {
      let bit = n >> 1;
      for (; j & bit; bit >>= 1) j ^= bit;
      j ^= bit;
      if (i < j) { [re[i], re[j]] = [re[j], re[i]]; [im[i], im[j]] = [im[j], im[i]]; }
    }
    for (let len = 2; len <= n; len *= 2) {
      const a = (inverse ? 2 : -2) * Math.PI / len;
      for (let i = 0; i < n; i += len) {
        let wr = 1, wi = 0;
        const ar = Math.cos(a), ai = Math.sin(a);
        for (let j = 0; j < len / 2; j++) {
          const k = i + j, t = k + len / 2;
          const tr = re[t] * wr - im[t] * wi, ti = re[t] * wi + im[t] * wr;
          re[t] = re[k] - tr; im[t] = im[k] - ti; re[k] += tr; im[k] += ti;
          const next = wr * ar - wi * ai; wi = wr * ai + wi * ar; wr = next;
        }
      }
    }
    if (inverse) for (let i = 0; i < n; i++) { re[i] /= n; im[i] /= n; }
  }
  function windowAt(i, n, kind) {
    if (kind === 'boxcar') return 1;
    if (kind === 'hann') return 0.5 + 0.5 * Math.cos(2 * Math.PI * (i - n / 2) / n);
    throw new Error('未知窗函数');
  }
  function freezeRecord(fields) {
    return Object.freeze({ ...fields, xs: Object.freeze(fields.xs), ys: Object.freeze(fields.ys),
      id: `SIM-${String(++serial).padStart(3, '0')}`, provenance: '合成教学数据 · 理想零相位 · 交流信号' });
  }
  function lineRecord(lines, options = {}) {
    const g = grid(options.n, options.h);
    if (!lines.length || lines.some(l => !(l.wn > 0 && l.wn < g.nyquist) || !(l.weight >= 0) || !Number.isFinite(l.weight)))
      throw new Error('谱线必须处于采样带宽内，且权重非负。');
    const ys = g.xs.map(x => lines.reduce((s, l) => s + l.weight * Math.cos(2 * Math.PI * l.wn * x), 0));
    return freezeRecord({ ...g, ys, kind: 'lines', label: options.label || '离散分量实验',
      lines: Object.freeze(lines.map(l => Object.freeze({ ...l }))) });
  }
  function response(wn) {
    if (wn < 400 || wn > 4000) return 0;
    const edge = Math.min(1, (wn - 400) / 180, (4000 - wn) / 260);
    return (0.2 + 0.8 * Math.exp(-0.5 * ((wn - 2100) / 1050) ** 2)) * Math.max(0, edge) ** 2;
  }
  function transmission(wn, depth = 1) {
    // Fictional absorbance bands, not a claimed material identification.
    const a = depth * (0.7 * Math.exp(-0.5 * ((wn - 1715) / 42) ** 2)
      + 0.25 * Math.exp(-0.5 * ((wn - 2950) / 100) ** 2)
      + 0.18 * Math.exp(-0.5 * ((wn - 1150) / 55) ** 2));
    return 10 ** (-a);
  }
  function densityRecord(density, options = {}) {
    const g = grid(options.n, options.h), re = new Float64Array(g.n), im = new Float64Array(g.n);
    for (let k = 1; k < g.n / 2; k++) {
      const w = density(k * g.dnu);
      if (!Number.isFinite(w) || w < 0) throw new Error('谱密度必须有限且非负。');
      re[k] = re[g.n - k] = w * g.dnu * g.n / 2;
    }
    fft(re, im, true);
    const ys = g.xs.map((_, i) => re[(i + g.n / 2) % g.n]);
    return freezeRecord({ ...g, ys, kind: 'density', label: options.label || '宽带数值近似' });
  }
  function transform(record, kind = 'boxcar', zeroFill = 1) {
    if (![1, 2, 4].includes(zeroFill)) throw new Error('补零倍数无效');
    const m = record.n * zeroFill, re = new Float64Array(m), im = new Float64Array(m);
    for (let i = 0; i < record.n; i++) {
      const j = (i - record.n / 2 + m) % m;
      re[j] = record.ys[i] * windowAt(i, record.n, kind);
    }
    fft(re, im);
    const wn = [], values = [];
    for (let k = 1; k < m / 2; k++) {
      const nu = k / (m * record.h);
      if (nu >= 400 && nu <= 4000) { wn.push(nu); values.push(2 * record.h * re[k]); }
    }
    return { wn, values, recordId: record.id, window: kind, h: record.h, n: record.n,
      zeroFill, gridSpacing: 1 / (m * record.h), convention: '零相位实部 · 未独立归一化' };
  }
  function projection(record, wn) {
    if (!(wn > 0 && wn < record.nyquist)) throw new Error('候选波数超出采样范围');
    let sum = 0;
    const product = record.xs.map((x, i) => {
      const p = record.ys[i] * Math.cos(2 * Math.PI * wn * x); sum += p; return p;
    });
    return { value: 2 * record.h * sum, product };
  }
  function measure(kind, depth = 1) {
    if (!['background', 'sample'].includes(kind)) throw new Error('测量类型无效');
    if (!Number.isFinite(depth) || depth < 0) throw new Error('吸收强度无效');
    const r = densityRecord(wn => response(wn) * (kind === 'sample' ? transmission(wn, depth) : 1),
      { label: kind === 'background' ? '背景记录' : '样品记录' });
    return Object.freeze({ ...r, measurementKind: kind, depth: kind === 'sample' ? depth : 0 });
  }
  function ratio(sample, background, threshold = 0.035) {
    if (sample.window !== background.window || sample.n !== background.n || sample.h !== background.h
      || sample.wn.length !== background.wn.length || sample.wn.some((w, i) => Math.abs(w - background.wn[i]) > 1e-8))
      throw new Error('背景和样品必须使用相同采样及处理条件。');
    const t = [], a = [], valid = [];
    for (let i = 0; i < sample.wn.length; i++) {
      const b = background.values[i], s = sample.values[i];
      const ok = b >= threshold && Number.isFinite(s) && s > 0;
      valid.push(ok); t.push(ok ? s / b : null); a.push(ok ? -Math.log10(s / b) : null);
    }
    return { wn: [...sample.wn], t, a, valid, threshold, sampleId: sample.recordId, backgroundId: background.recordId };
  }
  function mirrorToOPD(mm) { return 2 * mm / 10; }
  return { grid, lineRecord, densityRecord, transform, projection, measure, ratio,
    response, transmission, mirrorToOPD, DEFAULT_N, DEFAULT_H };
});
