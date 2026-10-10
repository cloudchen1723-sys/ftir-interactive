(function () {
  'use strict';
  const CAUTION = '学习标注独立于实测；k ≠ A。范围/归属供参考，单峰不能唯一鉴定。';
  const boundsCache = new WeakMap();

  // Sample identity and teaching ranges come from the data catalog. The plotted
  // spectrum and interval maximum always come from the selected measured record.
  let catalog = null;
  let root = null;
  let instrument = null;
  let aborter = null;
  let resizeObserver = null;
  let currentRecord = null;
  let currentSample = '';
  let currentFeature = '';
  let zoomed = false;
  let requestId = 0;
  let pending = false;
  let retryCatalog = false;
  let drawFrame = 0;
  let previousFocus = null;
  let previousOverflow = '';
  let disposed = false;

  function markup() {
    return `<section class="simulation-lab" role="dialog" aria-modal="true" aria-labelledby="simulation-lab-title" hidden>
      <header class="simulation-lab__header">
        <div>
          <p class="simulation-lab__eyebrow">SIMULATION LAB</p>
          <h1 id="simulation-lab-title">模拟实验室</h1>
        </div>
        <button class="simulation-lab__close" type="button" data-lab-close aria-label="关闭模拟实验室，返回教学">关闭 · 返回教学</button>
      </header>
      <nav class="simulation-lab__modes" aria-label="实验模式">
        <button type="button" data-lab-mode="instrument" aria-pressed="true"><span>01</span> 3D 仪器结构</button>
        <button type="button" data-lab-mode="spectrum" aria-pressed="false"><span>02</span> 样品库 · 读谱学习</button>
      </nav>
      <main class="simulation-lab__main">
        <section class="simulation-lab__panel is-active" data-lab-panel="instrument" aria-labelledby="simulation-instrument-title">
          <div class="simulation-lab__panel-head">
            <div><p class="simulation-lab__kicker">STRUCTURE / 3D</p><h2 id="simulation-instrument-title">从光源到探测器</h2></div>
            <div class="simulation-lab__view-controls" aria-label="仪器视角">
              <button type="button" data-lab-view="overview" aria-pressed="true">全景</button>
              <button type="button" data-lab-view="top" aria-pressed="false">俯视</button>
            </div>
          </div>
          <div class="simulation-lab__instrument" data-lab-instrument>
            <div class="simulation-lab__fallback" data-lab-fallback hidden>
              <strong>此设备无法显示 WebGL 三维模型</strong>
              <p>仍可查看结构顺序：红外光源 → 干涉仪 → 样品室 → 探测器。</p>
            </div>
          </div>
          <ol class="simulation-lab__modules" aria-label="FTIR 四大模块">
            <li><b>01</b><span>红外光源</span></li><li><b>02</b><span>干涉仪</span></li>
            <li><b>03</b><span>样品室</span></li><li><b>04</b><span>探测器</span></li>
          </ol>
          <p class="simulation-lab__hint">拖动模型旋转；滚轮缩放。标记指向四个功能模块。</p>
        </section>
        <section class="simulation-lab__panel" data-lab-panel="spectrum" aria-labelledby="simulation-spectrum-title" hidden>
          <div class="simulation-lab__panel-head">
            <div><p class="simulation-lab__library-summary" data-lab-library-summary>实测参考 · 样品目录</p><h2 id="simulation-spectrum-title">真实光谱样品库</h2><p class="simulation-lab__conditions" data-lab-conditions hidden></p></div>
            <label class="simulation-lab__sample">样品
              <select data-lab-sample disabled aria-label="选择真实参考谱样品"><option value="">正在读取样品目录…</option></select>
            </label>
          </div>
          <div class="simulation-lab__feature-controls">
            <label class="simulation-lab__feature">学习特征带 <select data-lab-feature disabled><option value="">全谱 · 先观察整体</option></select></label>
            <button type="button" data-lab-zoom disabled>局部放大</button>
            <button type="button" data-lab-next-feature disabled>开始读谱</button>
          </div>
          <div class="simulation-lab__spectrum-wrap" data-lab-spectrum-wrap>
            <canvas data-lab-chart role="img" aria-label="真实参考光谱图，横轴波数从 4000 到 400 每厘米，纵轴为虚部折射率 k"></canvas>
            <div class="simulation-lab__loading" data-lab-loading role="status"><span data-lab-status>正在读取本地参考数据…</span><button type="button" data-lab-retry hidden>重试读取</button></div>
          </div>
          <div class="simulation-lab__feature-note" aria-live="polite">
            <p data-lab-feature-summary>选择一个特征带，在实测光谱上观察。</p>
            <p class="simulation-lab__caution" data-lab-caution>${CAUTION}</p>
          </div>
          <details class="simulation-lab__provenance"><summary>来源与处理详情</summary>
          <dl class="simulation-lab__metadata">
            <div><dt>身份</dt><dd>REAL REFERENCE SPECTRUM</dd></div>
            <div><dt>样品</dt><dd data-lab-meta="sample">—</dd></div>
            <div><dt>来源</dt><dd><a data-lab-source target="_blank" rel="noopener">—</a></dd></div>
            <div><dt>坐标</dt><dd data-lab-meta="axes">—</dd></div>
          </dl>
          <p data-lab-meta="processing">—</p></details>
        </section>
      </main>
    </section>`;
  }

  function ensureRoot() {
    if (root) return root;
    const shell = document.createElement('div');
    shell.innerHTML = markup();
    root = shell.firstElementChild;
    document.body.appendChild(root);
    root.querySelector('[data-lab-close]').addEventListener('click', close);
    root.querySelectorAll('[data-lab-mode]').forEach((button) => {
      button.addEventListener('click', () => setMode(button.dataset.labMode));
    });
    root.querySelectorAll('[data-lab-view]').forEach((button) => {
      button.addEventListener('click', () => setView(button.dataset.labView));
    });
    root.querySelector('[data-lab-sample]').addEventListener('change', (event) => loadSpectrum(event.target.value));
    root.querySelector('[data-lab-feature]').addEventListener('change', (event) => chooseFeature(event.target.value));
    root.querySelector('[data-lab-next-feature]').addEventListener('click', () => {
      const order = readingOrder();
      const index = order.indexOf(currentFeature);
      chooseFeature(index < order.length - 1 ? order[index + 1] : '');
    });
    root.querySelector('[data-lab-zoom]').addEventListener('click', () => {
      zoomed = !zoomed;
      updateFeature();
      drawSpectrum();
    });
    root.querySelector('[data-lab-retry]').addEventListener('click', () => retryCatalog ? loadCatalog() : loadSpectrum(currentSample));
    return root;
  }

  function mountInstrument() {
    if (instrument) return;
    const host = root.querySelector('[data-lab-instrument]');
    const fallback = root.querySelector('[data-lab-fallback]');
    fallback.hidden = true;
    host.classList.remove('is-unavailable');
    if (typeof window.FTIRInstrument !== 'function') {
      fallback.hidden = false;
      host.classList.add('is-unavailable');
      return;
    }
    instrument = window.FTIRInstrument(host, {
      onUnavailable: () => {
        fallback.hidden = false;
        host.classList.add('is-unavailable');
      }
    });
    if (!instrument) {
      fallback.hidden = false;
      host.classList.add('is-unavailable');
      return;
    }
    instrument.setHotspotLabels({
      source: { zh: '红外光源', en: 'SOURCE' },
      splitter: { zh: '干涉仪', en: 'INTERFEROMETER' },
      sample: { zh: '样品室', en: 'SAMPLE' },
      detector: { zh: '探测器', en: 'DETECTOR' }
    });
    instrument.setHotspotsVisible(['source', 'splitter', 'sample', 'detector']);
    instrument.view('overview');
  }

  function setView(view) {
    root.querySelectorAll('[data-lab-view]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.labView === view));
    });
    instrument?.view(view);
  }

  function setMode(mode) {
    const selected = mode === 'spectrum' ? 'spectrum' : 'instrument';
    root.querySelectorAll('[data-lab-mode]').forEach((button) => {
      button.setAttribute('aria-pressed', String(button.dataset.labMode === selected));
    });
    root.querySelectorAll('[data-lab-panel]').forEach((panel) => {
      const active = panel.dataset.labPanel === selected;
      panel.hidden = !active;
      panel.classList.toggle('is-active', active);
    });
    if (selected === 'instrument') mountInstrument();
    if (selected === 'spectrum') {
      if (!catalog && !pending) loadCatalog();
      else if (!currentRecord && !pending) loadSpectrum(currentSample || catalog.samples[0].id);
      else { cancelAnimationFrame(drawFrame); drawFrame = requestAnimationFrame(drawSpectrum); }
    }
  }

  function setMeta(name, value) {
    const element = root.querySelector(`[data-lab-meta="${name}"]`);
    if (element) element.textContent = value;
  }

  const selectedSample = () => catalog?.samples.find((sample) => sample.id === currentSample);
  const selectedFeature = () => selectedSample()?.features.find((feature) => feature.id === currentFeature);
  function phaseAndTemperature(record) {
    const phases = { liquid: '液体', solid: '固体', gas: '气体' };
    const phase = record.sample.phaseDetail === 'amorphous ice' ? '非晶固态' : phases[record.sample.phase] || record.sample.phase;
    const measurement = record.measurement || {};
    const kelvin = measurement.sampleTemperatureK ?? measurement.temperatureK;
    const celsius = measurement.sampleTemperatureC ?? measurement.temperatureC;
    const temperature = Number.isFinite(kelvin) ? `${kelvin} K` : Number.isFinite(celsius) ? `${celsius} °C` : '';
    return `${temperature ? `${temperature} ` : ''}${phase}`;
  }
  function measurementConditions(record) {
    const measurement = record.measurement || {};
    const kelvin = measurement.sampleTemperatureK ?? measurement.temperatureK;
    const raw = measurement.conditionsZh || '';
    const comparison = record.sample.phase === 'solid' && Number.isFinite(kelvin) && !raw.includes('不能定量比强度') ? '与室温液体不能定量比强度。' : '';
    const bounds = sourceBounds(record);
    const uncovered = bounds.low > 400 + bounds.spacing || bounds.high < 4000 - bounds.spacing;
    const coverage = uncovered ? `本记录约 ${Math.round(bounds.low)}–${Math.round(bounds.high)} cm⁻¹；未覆盖区域留空。` : '';
    return [raw, comparison, coverage].filter(Boolean).join(' ');
  }
  function sourceBounds(record) {
    if (boundsCache.has(record)) return boundsCache.get(record);
    const bounds = record.x.reduce((value, wave) => ({ low: Math.min(value.low, wave), high: Math.max(value.high, wave), spacing: value.spacing }), { low: Infinity, high: -Infinity, spacing: Math.max(Math.abs(record.x[1] - record.x[0]) || 0, .001) });
    boundsCache.set(record, bounds);
    return bounds;
  }
  function intervalHasPoints(feature) {
    if (!currentRecord || !feature) return false;
    return currentRecord.x.some(wave => wave >= feature.rangeCm1[0] && wave <= feature.rangeCm1[1]);
  }
  function readingOrder() {
    const sample = selectedSample();
    if (!sample) return [];
    const ids = sample.features.map(feature => feature.id);
    const preferred = Array.isArray(sample.readingOrder) ? sample.readingOrder.filter(id => ids.includes(id)) : [];
    return [...new Set([...preferred, ...ids])];
  }
  function chooseFeature(id) {
    currentFeature = id;
    zoomed = false;
    root.querySelector('[data-lab-feature]').value = id;
    updateFeature();
    drawSpectrum();
  }
  const safeUrl = (value) => {
    try { const url = new URL(value); return /^https?:$/.test(url.protocol) ? url.href : ''; } catch (_) { return ''; }
  };

  function setStatus(text, failed = false) {
    root.querySelector('[data-lab-loading]').hidden = !text;
    root.querySelector('[data-lab-status]').textContent = text;
    root.querySelector('[data-lab-retry]').hidden = !failed;
  }

  function clearRecord() {
    currentRecord = null;
    currentFeature = '';
    zoomed = false;
    ['sample', 'axes', 'processing'].forEach((name) => setMeta(name, '—'));
    const source = root.querySelector('[data-lab-source]');
    source.removeAttribute('href'); source.textContent = '—';
    const feature = root.querySelector('[data-lab-feature]');
    feature.replaceChildren(new Option('全谱 · 先观察整体', ''));
    feature.disabled = true;
    root.querySelector('[data-lab-zoom]').disabled = true;
    root.querySelector('[data-lab-zoom]').textContent = '局部放大';
    root.querySelector('[data-lab-next-feature]').disabled = true;
    root.querySelector('[data-lab-next-feature]').textContent = '开始读谱';
    root.querySelector('[data-lab-feature-summary]').textContent = '选择一个特征带，在实测光谱上观察。';
    root.querySelector('[data-lab-caution]').textContent = CAUTION;
    root.querySelector('[data-lab-conditions]').textContent = '';
    root.querySelector('[data-lab-conditions]').hidden = true;
    const canvas = root.querySelector('[data-lab-chart]');
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    canvas.setAttribute('aria-label', '尚未读取真实参考谱');
    delete canvas.dataset.featureId;
    delete canvas.dataset.observedCm1;
    delete canvas.dataset.markMaximum;
    ['yMin', 'yMax', 'yBottom', 'yTop'].forEach(key => delete canvas.dataset[key]);
  }

  function startRequest(isCatalog) {
    aborter?.abort();
    aborter = new AbortController();
    requestId += 1;
    pending = true;
    retryCatalog = isCatalog;
    clearRecord();
    setStatus(isCatalog ? '正在读取样品目录…' : '正在读取本地真实参考数据…');
    return { id: requestId, signal: aborter.signal };
  }

  async function readJson(file, signal) {
    const response = await fetch(`./reference-data/${file}`, { signal });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return response.json();
  }

  async function loadCatalog() {
    const request = startRequest(true);
    const select = root.querySelector('[data-lab-sample]');
    select.disabled = true;
    try {
      const data = await readJson('lab-catalog.json', request.signal);
      if (!data.schemaVersion || !Array.isArray(data.samples) || !data.samples.length) throw new Error('样品目录格式不完整');
      const ids = new Set();
      data.samples.forEach((sample) => {
        if (!sample.id || ids.has(sample.id) || !sample.labelZh || !/^processed\/[a-z0-9_-]+\.json$/i.test(sample.file) || !Array.isArray(sample.features)) throw new Error('样品目录记录不完整');
        ids.add(sample.id);
        const features = new Set();
        sample.features.forEach((feature) => {
          const range = feature.rangeCm1;
          if (!feature.id || features.has(feature.id) || !feature.labelZh || !feature.explanationZh || !Array.isArray(range) || range.length !== 2 || !range.every(Number.isFinite) || range[0] >= range[1]) throw new Error('特征带目录格式不完整');
          features.add(feature.id);
        });
      });
      if (request.id !== requestId || request.signal.aborted || root.hidden) return;
      catalog = data;
      const families = new Map();
      data.samples.forEach((sample) => {
        const family = sample.familyZh || '其他样品';
        if (!families.has(family)) {
          const group = document.createElement('optgroup');
          group.label = family;
          families.set(family, group);
        }
        families.get(family).appendChild(new Option(sample.labelZh, sample.id));
      });
      select.replaceChildren(...families.values());
      select.disabled = false;
      pending = false;
      await loadSpectrum(ids.has(currentSample) ? currentSample : data.samples[0].id);
    } catch (error) {
      if (request.id !== requestId || request.signal.aborted || root.hidden) return;
      pending = false;
      select.replaceChildren(new Option('样品目录读取失败', ''));
      root.querySelector('[data-lab-library-summary]').textContent = '样品目录暂不可用';
      setStatus(`样品目录读取失败（${error.message}）。请重试。`, true);
    }
  }

  async function loadSpectrum(sampleId) {
    const sample = catalog?.samples.find((entry) => entry.id === sampleId);
    if (!sample) return;
    currentSample = sampleId;
    root.querySelector('[data-lab-sample]').value = sampleId;
    root.querySelector('[data-lab-library-summary]').textContent = `真实参考谱 · ${catalog.samples.length} 个样品 · ${sample.familyZh || '其他样品'} · y = k`;
    const request = startRequest(false);
    try {
      const record = await readJson(sample.file, request.signal);
      if (!Array.isArray(record.x) || !Array.isArray(record.y) || !record.x.length || record.x.length !== record.y.length || !record.x.every(Number.isFinite) || !record.y.every(Number.isFinite)) throw new Error('实测数据格式不完整');
      if (record.axes?.y?.symbol !== 'k' || !record.source?.citation || !record.sample?.phase) throw new Error('参考谱纵轴或来源、相态信息不完整');
      if (!record.x.some((wave) => wave >= 400 && wave <= 4000)) throw new Error('没有 400–4000 cm⁻¹ 的数据点');
      if (request.id !== requestId || request.signal.aborted || root.hidden) return;
      currentRecord = record;
      pending = false;
      const conditions = measurementConditions(record);
      root.querySelector('[data-lab-library-summary]').textContent = `真实参考谱 · ${catalog.samples.length} 个样品 · ${sample.familyZh || '其他样品'} · ${phaseAndTemperature(record)} · y = k（无量纲）`;
      root.querySelector('[data-lab-conditions]').textContent = conditions;
      root.querySelector('[data-lab-conditions]').hidden = !conditions;
      setMeta('sample', `${sample.labelZh} · 相态与温度：${phaseAndTemperature(record)}${conditions ? ` · ${conditions}` : ''} · ${record.x.length.toLocaleString('zh-CN')} 点`);
      const source = root.querySelector('[data-lab-source]');
      source.textContent = '查看原始数据集';
      const url = safeUrl(record.source.url); if (url) source.href = url;
      const order = record.axes.x.order === 'descending' ? '递减' : record.axes.x.order;
      const bounds = sourceBounds(record);
      setMeta('axes', `x = 波数 / cm⁻¹，显示窗 4000 → 400；记录范围 ${bounds.low.toFixed(3)}–${bounds.high.toFixed(3)} cm⁻¹，未覆盖区域留空；y = 虚部折射率 k（无量纲）`);
      const p = record.processing || {};
      root.querySelector('[data-lab-caution]').textContent = `${CAUTION}${p.negativeKCount > 0 ? ' 源文件含负基线/处理值，按原样保留，不代表物理负吸收。' : ''}`;
      setMeta('processing', `${record.source.citation}。文件：${sample.file}；${record.source.originalFile || '原始文件见数据记录'}。${p.operation || ''}${p.noteZh ? ` ${p.noteZh}` : ''}${p.note ? ` ${p.note}` : ''} 文件波数顺序：${order}。本图直接绘制记录采样点，不平滑、不归一化、不转换为吸光度 A。来源许可：${record.source.license || '见数据记录'}。` +
        `${p.downsampling === false ? ' 处理记录未降采样。' : ''}${p.interpolation === false ? ' 未插值。' : ''}`);
      const feature = root.querySelector('[data-lab-feature]');
      feature.replaceChildren(new Option('全谱 · 先观察整体', ''), ...sample.features.map((entry) => new Option(entry.labelZh, entry.id)));
      feature.disabled = sample.features.length === 0;
      setStatus('');
      updateFeature();
      drawSpectrum();
    } catch (error) {
      if (request.id !== requestId || request.signal.aborted || root.hidden) return;
      pending = false;
      clearRecord();
      setStatus(`参考数据读取失败（${error.message}）。请重试或选择另一样品。`, true);
    }
  }

  function intervalMaximum(feature) {
    if (!currentRecord || !feature || feature.markMaximum === false) return null;
    const [low, high] = feature.rangeCm1;
    let peak = null;
    currentRecord.x.forEach((wave, index) => {
      const value = currentRecord.y[index];
      if (wave >= low && wave <= high && (!peak || value > peak.value)) peak = { wave, value };
    });
    return peak;
  }

  function updateFeature() {
    const feature = selectedFeature();
    const peak = intervalMaximum(feature);
    const hasPoints = intervalHasPoints(feature);
    const button = root.querySelector('[data-lab-zoom]');
    button.disabled = !feature || !hasPoints;
    button.textContent = zoomed ? '返回全谱' : '局部放大';
    const order = readingOrder(), step = order.indexOf(currentFeature);
    const next = root.querySelector('[data-lab-next-feature]');
    next.disabled = !currentRecord || !order.length;
    next.textContent = step < 0 ? '开始读谱' : step === order.length - 1 ? `完成读谱 · ${step + 1}/${order.length}` : `下一处特征 · ${step + 1}/${order.length}`;
    const note = root.querySelector('[data-lab-feature-summary]');
    const canvas = root.querySelector('[data-lab-chart]');
    canvas.dataset.featureId = feature?.id || '';
    canvas.dataset.observedCm1 = peak ? String(peak.wave) : '';
    canvas.dataset.markMaximum = String(Boolean(feature && feature.markMaximum !== false));
    if (!feature) {
      note.textContent = `选样品 → 看全谱 → 学特征带 → 局部核对。${selectedSample()?.readingIntroZh || '先看高波数区，再看羰基区，最后看指纹区。'} k 是光学常数，不是吸光度 A；峰形受相态、温度等条件影响。`;
      return;
    }
    note.textContent = `${hasPoints ? '' : '本记录没有此区间的采样点。'}${feature.explanationZh}${feature.broad ? ' 宽带不能用单尖峰定性。' : ''}`;
    const assignmentUrl = safeUrl(feature.assignmentUrl);
    if (assignmentUrl) {
      const link = document.createElement('a');
      link.href = assignmentUrl; link.target = '_blank'; link.rel = 'noopener'; link.textContent = ' 归属参考';
      note.appendChild(link);
    }
  }

  function drawSpectrum() {
    if (!root || root.hidden || !currentRecord) return;
    const canvas = root.querySelector('[data-lab-chart]');
    const box = canvas.getBoundingClientRect();
    if (!box.width || !box.height) return;
    const ratio = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(box.width * ratio);
    canvas.height = Math.round(box.height * ratio);
    const ctx = canvas.getContext('2d');
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
    const width = box.width, height = box.height;
    const margin = { left: 68, right: 22, top: 24, bottom: 54 };
    const plotW = width - margin.left - margin.right;
    const plotH = height - margin.top - margin.bottom;
    const feature = selectedFeature();
    const peak = intervalMaximum(feature);
    const pad = feature ? Math.max(30, (feature.rangeCm1[1] - feature.rangeCm1[0]) * .2) : 0;
    const low = zoomed && feature ? Math.max(400, feature.rangeCm1[0] - pad) : 400;
    const high = zoomed && feature ? Math.min(4000, feature.rangeCm1[1] + pad) : 4000;
    const toX = (wave) => margin.left + ((high - wave) / (high - low)) * plotW;
    const points = [];
    for (let i = 0; i < currentRecord.x.length; i += 1) {
      const x = currentRecord.x[i], y = currentRecord.y[i];
      if (x >= low && x <= high && Number.isFinite(y)) points.push([x, y]);
    }
    if (!points.length) return;
    const maxY = points.reduce((maximum, point) => Math.max(maximum, point[1]), -Infinity);
    const minY = points.reduce((minimum, point) => Math.min(minimum, point[1]), Infinity);
    const spanY = Math.max(0, maxY) - Math.min(0, minY);
    const marginY = spanY > 0 ? spanY * .08 : Math.max(Math.abs(maxY) * .08, .001);
    const yTop = Math.max(0, maxY) + marginY;
    const yBottom = minY < 0 ? minY - marginY : 0;
    const toY = (value) => margin.top + plotH * (1 - (value - yBottom) / (yTop - yBottom));
    canvas.dataset.yMin = String(minY);
    canvas.dataset.yMax = String(maxY);
    canvas.dataset.yBottom = String(yBottom);
    canvas.dataset.yTop = String(yTop);
    ctx.clearRect(0, 0, width, height);
    ctx.font = '14px system-ui, sans-serif';
    if (feature) {
      const left = toX(Math.min(high, feature.rangeCm1[1]));
      const right = toX(Math.max(low, feature.rangeCm1[0]));
      ctx.fillStyle = 'rgba(183, 101, 42, .14)';
      ctx.fillRect(left, margin.top, right - left, plotH);
      ctx.strokeStyle = '#a25522';
      ctx.setLineDash([5, 4]);
      [left, right].forEach((x) => { ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke(); });
      ctx.setLineDash([]);
    }
    ctx.fillStyle = '#4a5a62';
    ctx.strokeStyle = 'rgba(28, 55, 67, .16)';
    ctx.lineWidth = 1;
    [0, 0.5, 1].forEach((fraction) => {
      const y = margin.top + plotH * (1 - fraction);
      ctx.beginPath(); ctx.moveTo(margin.left, y); ctx.lineTo(width - margin.right, y); ctx.stroke();
      ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
      ctx.fillText((yBottom + (yTop - yBottom) * fraction).toPrecision(3), margin.left - 10, y);
    });
    const ticks = zoomed ? Array.from({ length: 5 }, (_, index) => high - (high - low) * index / 4) : [4000, 3000, 2000, 1000, 400];
    ticks.forEach((wave) => {
      const x = toX(wave);
      ctx.beginPath(); ctx.moveTo(x, margin.top); ctx.lineTo(x, margin.top + plotH); ctx.stroke();
      ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(Math.round(wave)), x, margin.top + plotH + 10);
    });
    ctx.strokeStyle = '#075b73';
    ctx.lineWidth = 1.65;
    ctx.lineJoin = 'round';
    ctx.beginPath();
    points.forEach(([wave, value], index) => {
      const x = toX(wave);
      const y = toY(value);
      if (index === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    if (peak && peak.wave >= low && peak.wave <= high) {
      const x = toX(peak.wave), y = toY(peak.value);
      ctx.strokeStyle = '#a25522'; ctx.fillStyle = '#a25522';
      ctx.beginPath(); ctx.arc(x, y, 4.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.moveTo(x, y + 7); ctx.lineTo(x, margin.top + plotH); ctx.setLineDash([3, 5]); ctx.stroke(); ctx.setLineDash([]);
      ctx.textAlign = x > width / 2 ? 'right' : 'left'; ctx.textBaseline = 'bottom';
      ctx.fillText(`${peak.wave.toFixed(1)} cm⁻¹${feature.broad ? ' · 宽带最大值' : ''}`, x > width / 2 ? x - 9 : x + 9, Math.max(margin.top + 16, y - 7));
    }
    ctx.fillStyle = '#233941';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    ctx.fillText('波数 / cm⁻¹（从左到右递减）', margin.left + plotW / 2, height - 2);
    ctx.save(); ctx.translate(14, margin.top + plotH / 2); ctx.rotate(-Math.PI / 2);
    ctx.fillText('虚部折射率 k（无量纲）', 0, 0); ctx.restore();
    canvas.setAttribute('aria-label', `${selectedSample().labelZh}真实参考谱，${phaseAndTemperature(currentRecord)}${measurementConditions(currentRecord) ? `，${measurementConditions(currentRecord)}` : ''}。波数 ${high.toFixed(0)} 至 ${low.toFixed(0)} cm⁻¹，从左到右递减；纵轴虚部折射率 k，无量纲。${feature ? `高亮${feature.labelZh}的 ${feature.rangeCm1.join(' 至 ')} cm⁻¹ 区间。${peak ? `区间最大值位置 ${peak.wave.toFixed(1)} cm⁻¹。` : feature.markMaximum === false ? '仅高亮参考区间，不标峰点。' : ''}` : ''}`);
    canvas.dataset.view = zoomed ? 'zoom' : 'full';
  }

  function handleKeydown(event) {
    if (!root || root.hidden) return;
    // The teaching page also listens on window. Keyboard actions within this
    // modal belong to the lab, including Space on the provenance disclosure.
    event.stopPropagation();
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (event.key !== 'Tab') return;
    const focusable = [...root.querySelectorAll('button:not([hidden]), select:not([hidden]), a[href], summary, [tabindex]:not([tabindex="-1"])')]
      .filter((element) => {
        const closedDetails = element.closest('details:not([open])');
        return !element.disabled && (!closedDetails || element === closedDetails.querySelector('summary')) && element.getClientRects().length > 0 && getComputedStyle(element).visibility !== 'hidden';
      });
    if (!focusable.length) return;
    const first = focusable[0], last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
    else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
  }

  function open(mode = 'instrument') {
    if (disposed) return;
    ensureRoot();
    if (!root.hidden) { setMode(mode); return; }
    previousFocus = document.activeElement;
    previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    root.hidden = false;
    root.dataset.open = 'true';
    setMode(mode);
    root.querySelector('[data-lab-close]').focus();
    document.addEventListener('keydown', handleKeydown);
    resizeObserver = new ResizeObserver(() => drawSpectrum());
    resizeObserver.observe(root.querySelector('[data-lab-spectrum-wrap]'));
  }

  function close() {
    if (!root || root.hidden) return;
    aborter?.abort();
    aborter = null;
    requestId += 1;
    pending = false;
    cancelAnimationFrame(drawFrame);
    drawFrame = 0;
    clearRecord();
    instrument?.dispose();
    instrument = null;
    resizeObserver?.disconnect();
    resizeObserver = null;
    document.removeEventListener('keydown', handleKeydown);
    root.hidden = true;
    delete root.dataset.open;
    document.body.style.overflow = previousOverflow;
    if (previousFocus && typeof previousFocus.focus === 'function') previousFocus.focus();
  }

  function dispose() {
    if (disposed) return;
    close();
    instrument?.dispose();
    instrument = null;
    root?.remove();
    root = null;
    document.removeEventListener('ftir:open-simulation-lab', onOpenEvent);
    disposed = true;
  }

  function onOpenEvent(event) {
    open(event.detail?.mode || 'instrument');
  }

  document.addEventListener('ftir:open-simulation-lab', onOpenEvent);
  window.FTIRSimulationLab = Object.freeze({ open, close, dispose });
}());
