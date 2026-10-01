/* Pass 1 persistent SVG stage. GSAP Core is the sole motion owner. */
(function () {
  'use strict';
  const COLORS = ['#c8755d', '#355568', '#d29aa5'];
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  function mount(host, options) {
    const scene = options.scene, ac = new AbortController();
    const s = { beat: 0, asym: false, phase: 25, matching: 0, values: [.8, .4, .8], morph: 0 };
    let dead = false, hidden = document.visibilityState === 'hidden', busy = false, tween = null;
    const clock = window.FTIRTimeline?.create?.();
    host.innerHTML = `<div class="p1-viewport"><section class="p1-stage p1-scene-${scene + 1}" tabindex="-1" aria-label="FTIR presentation stage"><div class="p1-topline"><span>FTIR · 从信号到光谱</span><span class="p1-progress">${scene + 1} / 09</span></div><header class="p1-heading"><p>${scene === 0 ? 'MOLECULAR VIBRATION · CO₂' : 'DETECTOR DILEMMA'}</p><h1>${scene === 0 ? '为什么有些振动能吸收红外？' : '一个总响应能区分波数组成吗？'}</h1></header><div class="p1-canvas"></div><p class="p1-takeaway" aria-live="polite"></p><div class="p1-beat" aria-live="polite"></div></section></div>`;
    const stage = host.querySelector('.p1-stage'), canvas = host.querySelector('.p1-canvas'), take = host.querySelector('.p1-takeaway'), beat = host.querySelector('.p1-beat');
    function resize() { stage.style.transform = `translate(-50%, -50%) scale(${Math.max(.01, Math.min(innerWidth / 1600, innerHeight / 900))})`; }
    function kill() { tween?.pause?.(0); tween = null; busy = false; }
    function to(target, vars) {
      kill(); busy = true;
      if (reduced) { Object.keys(vars).forEach(k => { if (!['duration', 'onUpdate', 'onComplete'].includes(k)) target[k] = vars[k]; }); vars.onUpdate?.(); vars.onComplete?.(); return; }
      const v = { ...vars, duration: vars.duration };
      if (clock?.to) tween = clock.to(target, v);
      if (!tween) { Object.keys(target).forEach(k => { if (k in vars && !['duration', 'onUpdate', 'onComplete'].includes(k)) target[k] = vars[k]; }); vars.onUpdate?.(); vars.onComplete?.(); }
    }
    function molecule() { canvas.innerHTML = `<div class="p1-molecule-wrap"><svg class="p1-molecule" viewBox="0 0 1000 420" role="img" aria-label="CO₂ 分子振动示意"><path class="p1-guide" d="M150 210H850M500 60V360"/><path class="p1-bond" data-bond="left"/><path class="p1-bond" data-bond="right"/><circle class="p1-atom p1-oxygen" data-atom="left" cy="210" r="52"/><circle class="p1-atom p1-carbon" data-atom="center" cy="210" r="42"/><circle class="p1-atom p1-oxygen" data-atom="right" cy="210" r="52"/><text class="p1-element" data-label="left" y="222" text-anchor="middle">O</text><text class="p1-element" data-label="center" y="222" text-anchor="middle">C</text><text class="p1-element" data-label="right" y="222" text-anchor="middle">O</text><g class="p1-dipole" data-dipole><path data-dipole-line/><text data-dipole-text x="500" y="108">偶极矩变化</text></g><text class="p1-dipole-inactive" data-dipole-inactive x="500" y="340" text-anchor="middle">净偶极矩不变</text><text class="p1-match" data-match x="500" y="380" text-anchor="middle">能量匹配 → 吸收</text></svg><div class="p1-molecule-controls"><button data-mode="sym" aria-pressed="true">对称伸缩</button><button data-mode="asym" aria-pressed="false">不对称伸缩</button><label>相位 <input data-phase type="range" min="0" max="100" value="25"><output data-phase-value>90°</output></label></div><div class="p1-status"><strong data-status>IR inactive</strong><span data-status-detail>净偶极矩不变</span></div></div>`; }
    function detector() { canvas.innerHTML = `<div class="p1-detector-layout"><div class="p1-bars"><svg viewBox="0 0 940 480" role="img" aria-label="三个波数组成与总响应"><path class="p1-axis" d="M70 390H850M70 390V70"/><text x="70" y="430">波数</text><text x="10" y="78">响应</text>${[1000, 1700, 3000].map((w, i) => `<g><rect class="p1-bar" data-bar="${i}" x="${170 + i * 240}" width="92" fill="${COLORS[i]}"/><text class="p1-value" data-value="${i}" x="${216 + i * 240}" text-anchor="middle"></text><text class="p1-wave" x="${216 + i * 240}" y="440" text-anchor="middle">${w} cm⁻¹</text></g>`).join('')}</svg></div><div class="p1-total"><span>TOTAL</span><strong>2.0</strong><small>等响应假设</small></div></div>`; }
    function geometry() { const q = 34 * Math.sin(s.phase / 100 * Math.PI * 2), d = window.FTIRStoryModel?.mode?.(s.asym, q) || (s.asym ? [q, -8 * q / 3, q] : [-q, 0, q]); return [250 + d[0], 500 + d[1], 750 + d[2]]; }
    function updateMolecule() {
      const [l, c, r] = geometry(), atom = n => canvas.querySelector(`[data-atom="${n}"]`); if (!atom('left')) return;
      [['left', l], ['center', c], ['right', r]].forEach(([n, x]) => { atom(n).setAttribute('cx', x); canvas.querySelector(`[data-label="${n}"]`).setAttribute('x', x); });
      canvas.querySelector('[data-bond="left"]').setAttribute('d', `M${l + 52} 210H${c - 42}`); canvas.querySelector('[data-bond="right"]').setAttribute('d', `M${c + 42} 210H${r - 52}`);
      const q = 34 * Math.sin(s.phase / 100 * Math.PI * 2), direction = q >= 0 ? 1 : -1, amplitude = Math.abs(q) * 2, line = canvas.querySelector('[data-dipole-line]');
      line.setAttribute('d', amplitude < 0.01 ? '' : `M${c - direction * 8} 116H${c + direction * amplitude}M${c + direction * amplitude} 116l${-direction * 12} -8M${c + direction * amplitude} 116l${-direction * 12} 8`);
      const text = canvas.querySelector('[data-dipole-text]'); text.setAttribute('x', c + direction * Math.max(24, amplitude + 18)); text.setAttribute('y', 108); text.style.opacity = amplitude < 0.01 ? 0 : 1;
      canvas.querySelector('[data-dipole]').style.opacity = s.asym ? 1 : 0; canvas.querySelector('[data-dipole-inactive]').style.opacity = s.asym ? 0 : 1; canvas.querySelector('[data-match]').style.opacity = s.matching;
      canvas.querySelector('[data-status]').textContent = s.asym ? 'IR active' : 'IR inactive'; canvas.querySelector('[data-status-detail]').textContent = s.asym ? '净偶极矩随振动改变' : '净偶极矩不变'; canvas.querySelector('.p1-status').style.opacity = s.beat > 0 ? 1 : 0; canvas.querySelector('[data-phase-value]').textContent = `${Math.round(s.phase * 3.6)}°`; canvas.querySelector('[data-phase]').value = s.phase;
      canvas.querySelectorAll('[data-mode]').forEach(b => b.setAttribute('aria-pressed', String((b.dataset.mode === 'asym') === s.asym)));
    }
    function updateDetector() { s.values.forEach((v, i) => { const h = v * 120, b = canvas.querySelector(`[data-bar="${i}"]`), t = canvas.querySelector(`[data-value="${i}"]`); b.setAttribute('y', 390 - h); b.setAttribute('height', h); t.setAttribute('y', 374 - h); t.textContent = v.toFixed(1); }); }
    function settle() { kill(); s.morph = s.beat > 0 ? 1 : 0; if (scene === 0) { s.asym = s.beat > 0; s.phase = s.beat > 0 ? 55 : 25; s.matching = s.beat > 1 ? 1 : 0; updateMolecule(); } else { s.values = s.beat > 0 ? [.2, 1.6, .2] : [.8, .4, .8]; updateDetector(); } take.style.opacity = s.beat > 1 ? 1 : 0; take.textContent = scene === 0 ? '吸收取决于振动模式、偶极矩变化与能量匹配。' : '不同组成，可以具有相同总响应。'; beat.textContent = s.beat === 0 ? '观察' : s.beat === 1 ? '比较' : '结论'; stage.dataset.beat = s.beat; }
    function advance() { if (dead || hidden) return; if (busy) { tween?.resume?.(); return; } if (s.beat >= 2) return options.onNext?.(); const next = s.beat + 1; if (scene === 0) { s.asym = true; if (next === 1) to(s, { phase: 55, duration: .68, onUpdate: updateMolecule, onComplete: () => { s.beat = 1; settle(); } }); else to(s, { matching: 1, duration: .55, onUpdate: updateMolecule, onComplete: () => { s.beat = 2; settle(); } }); } else { const from = s.values.slice(), target = [.2, 1.6, .2]; if (next === 1) to(s, { morph: 1, duration: .72, onUpdate: () => { s.values = from.map((v, i) => v + (target[i] - v) * s.morph); updateDetector(); }, onComplete: () => { s.values = target; s.beat = 1; settle(); } }); else to(s, { duration: .42, onComplete: () => { s.beat = 2; settle(); } }); } }
    function previous() { if (busy) return; if (s.beat > 0) { s.beat--; settle(); } else options.onBack?.(); }
    function reset() { kill(); Object.assign(s, { beat: 0, asym: false, phase: 25, matching: 0, values: [.8, .4, .8], morph: 0 }); settle(); }
    function key(e) { if (dead || e.repeat || e.target.matches?.('input,textarea,button,a,select,[contenteditable=true]')) return; if (e.key === ' ' || e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); advance(); } else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); previous(); } else if (e.key.toLowerCase() === 'r') { e.preventDefault(); e.stopPropagation(); reset(); } }
    function visibility() { hidden = document.visibilityState === 'hidden'; if (hidden) clock?.pause?.(); }
    if (scene === 0) molecule(); else detector();
    canvas.addEventListener('click', e => e.stopPropagation(), { signal: ac.signal }); canvas.querySelectorAll('button,input,label').forEach(x => x.addEventListener('pointerdown', e => e.stopPropagation(), { signal: ac.signal }));
    canvas.querySelectorAll('[data-mode]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); s.asym = b.dataset.mode === 'asym'; updateMolecule(); }, { signal: ac.signal })); canvas.querySelector('[data-phase]')?.addEventListener('input', e => { e.stopPropagation(); s.phase = Number(e.target.value); updateMolecule(); }, { signal: ac.signal });
    stage.addEventListener('click', e => { if (!e.target.closest('button,input,label')) advance(); }, { signal: ac.signal }); document.addEventListener('keydown', key, { signal: ac.signal }); document.addEventListener('visibilitychange', visibility, { signal: ac.signal }); window.addEventListener('resize', resize, { signal: ac.signal });
    resize(); settle(); return { dispose() { dead = true; kill(); ac.abort(); host.innerHTML = ''; } };
  }
  window.FTIRPass1 = { mount };
}());
