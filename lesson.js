(function () {
  'use strict';
  const P = window.FTIRPhysics, $ = s => document.querySelector(s);
  const C = { green:'#73ddc8', amber:'#efbd76', blue:'#82a9ef', rose:'#e69b8b', gray:'#7d919c' };
  const initial = () => ({ view:'story', depth:1, bg:null, sample:null, result:null, resultMode:'percent', probe:1715,
    mirror:0, wn:1000, playing:false, signalMode:'pair', showComponents:true, signalZoom:.004,
    practice:null, analysis:null, candidate:1000, analysisZoom:.004, qualityN:2048, qualityWindow:'boxcar', zeroFill:1 });
  let state = {...initial(),view:'home'}, instrument = null, paint = null, signalDraft = null, disposeStory=null;
  let lastFrame=0, lastPaint=0, resizeTimer;
  const announce = s => { $('#announcement').textContent=s; };
  const fmt = (n,d=2) => Number.isFinite(n) ? n.toFixed(d) : '—';
  const header = (tag,title,body) => `<section class="intro"><div class="eyebrow">${tag}</div><h1>${title}</h1><p>${body}</p></section>`;
  const empty = (title,body) => `<div class="empty"><div><strong>${title}</strong>${body}</div></div>`;
  const legend = entries => `<div class="legend">${entries.map(([label,color])=>`<span><i style="border-color:${color}"></i>${label}</span>`).join('')}</div>`;
  function on(id,event,fn) { const el=$('#'+id); if(el)el.addEventListener(event,fn); }
  function clampInput(el,min,max,fallback) { const v=Number(el.value);return el.value!==''&&Number.isFinite(v)?Math.max(min,Math.min(max,v)):fallback; }
  function buttonSet(name,items,current) { return `<div class="controls" aria-label="${name}">${items.map(([value,label])=>`<button data-choice="${name}" data-value="${value}" class="${current===value?'active':''}" aria-pressed="${current===value}">${label}</button>`).join('')}</div>`; }
  function bindChoice(name,fn) { document.querySelectorAll(`[data-choice="${name}"]`).forEach(b=>b.addEventListener('click',()=>fn(b.dataset.value))); }
  function points(xs,ys,x0,x1,y0,y1,w,h) {
    let d='',open=false;
    for(let i=0;i<xs.length;i++) {
      if(xs[i]<Math.min(x0,x1)||xs[i]>Math.max(x0,x1)||ys[i]===null||!Number.isFinite(ys[i])) {open=false;continue;}
      const x=54+(xs[i]-x0)/(x1-x0)*(w-70), y=38+(y1-ys[i])/(y1-y0)*(h-84);
      d+=`${open?'L':'M'}${x.toFixed(2)},${y.toFixed(2)}`;open=true;
    }
    return d;
  }
  function chart(id,series,options={}) {
    const host=$('#'+id); if(!host)return;
    const w=Math.max(270,host.clientWidth), h=options.height||260;
    const x0=options.x0??series[0]?.xs[0]??0,x1=options.x1??series[0]?.xs.at(-1)??1;
    const visible=series.flatMap(s=>s.ys.filter((y,i)=>y!==null&&Number.isFinite(y)&&s.xs[i]>=Math.min(x0,x1)&&s.xs[i]<=Math.max(x0,x1)));
    let min=options.y0??Math.min(0,...visible),max=options.y1??Math.max(1e-8,...visible);
    if(max-min<1e-9)max=min+1;
    if(options.y1===undefined)max+=(max-min)*.09;
    if(options.y0===undefined&&min<0)min-=(max-min)*.04;
    const tx=v=>54+(v-x0)/(x1-x0)*(w-70),ty=v=>38+(max-v)/(max-min)*(h-84);
    const compact = v => {const a=Math.abs(v);return a>0&&a<.01?v.toExponential(1):Math.abs(v)>=100?String(Math.round(v)):Number(v.toPrecision(3)).toString();};
    let svg=`<svg class="chart" viewBox="0 0 ${w} ${h}" role="img" aria-label="${options.title||'教学数据图'}"><title>${options.title||'教学数据图'}</title><text x="5" y="16">${options.ylabel||'相对信号'}</text>`;
    const ticks=w<460?3:5;
    for(let i=0;i<=4;i++){const v=min+(max-min)*i/4,y=ty(v);svg+=`<line class="grid" x1="54" x2="${w-16}" y1="${y}" y2="${y}"/><text x="47" y="${y+4}" text-anchor="end">${compact(v)}</text>`;}
    for(let i=0;i<=ticks;i++){const v=x0+(x1-x0)*i/ticks,x=tx(v);svg+=`<text x="${x}" y="${h-28}" text-anchor="middle">${options.xformat?options.xformat(v):compact(v)}</text>`;}
    svg+=`<path class="axis" fill="none" d="M54,38 V${h-46} H${w-16}"/>`;
    if(options.zpd&&x0<=0&&x1>=0)svg+=`<line x1="${tx(0)}" x2="${tx(0)}" y1="38" y2="${h-46}" stroke="#9ca89f" stroke-dasharray="4 4"/><text x="${tx(0)+5}" y="32">ZPD</text>`;
    svg+=`<defs><clipPath id="clip-${id}"><rect x="54" y="38" width="${w-70}" height="${h-84}"/></clipPath></defs><g clip-path="url(#clip-${id})">`;
    for(const s of series)svg+=`<path class="data" stroke="${s.color||C.green}" ${s.dash?'stroke-dasharray="5 4"':''} d="${points(s.xs,s.ys,x0,x1,min,max,w,h)}"/>`;
    if(options.marker){const {x,y}=options.marker;if(x>=Math.min(x0,x1)&&x<=Math.max(x0,x1)&&Number.isFinite(y))svg+=`<circle cx="${tx(x)}" cy="${ty(y)}" r="5" fill="${C.rose}" stroke="white" stroke-width="2"/>`;}
    svg+=`</g><text x="${w-16}" y="${h-5}" text-anchor="end">${options.xlabel||'光程差 δ / cm'}</text></svg>`;
    host.innerHTML=svg;
  }
  function modeDiagram(asym) {
    return `<svg viewBox="0 0 260 90" role="img" aria-label="${asym?'不对称伸缩：两个氧同向，碳反向，两个键一长一短':'对称伸缩：两个氧反向，两个键同时伸长或缩短'}"><path d="M55 45H205" stroke="#76968c" stroke-width="5"/><circle cx="55" cy="45" r="17" fill="#a95749"/><circle cx="130" cy="45" r="15" fill="#355756"/><circle cx="205" cy="45" r="17" fill="#a95749"/><g fill="white" font-size="12" text-anchor="middle"><text x="55" y="49">O</text><text x="130" y="49">C</text><text x="205" y="49">O</text></g><g fill="#176657" font-size="25" text-anchor="middle"><text x="55" y="21">${asym?'→':'←'}</text><text x="130" y="21">${asym?'←':''}</text><text x="205" y="21">→</text></g></svg>`;
  }
  function molecularDetails() {
    return `<details><summary>为什么分子会选择性吸收红外？</summary><p>能量匹配 ΔE = hν 还不够：在常规电偶极基频模型中，振动还必须引起偶极矩变化。下图用 CO₂ 作模式对照，箭头只表示某一时刻的位移方向，不代表真实速度或精确位移比例。</p><div class="modes"><div class="mode"><h3>对称伸缩</h3>${modeDiagram(false)}<p>两个键同伸同缩，偶极矩不发生相应变化：该基频在常规红外中不活跃，不等于分子没有这种振动。</p></div><div class="mode"><h3>不对称伸缩</h3>${modeDiagram(true)}<p>两个键一伸一缩，偶极矩发生变化：具有红外活性；CO₂ 约 2350 cm⁻¹ 的强带与此模式有关。</p></div></div><p>工作台使用的是虚构带形，不是 CO₂ 实测谱，也不能凭其中一个峰鉴定样品。</p></details>`;
  }
  function renderMeasurement() {
    const bg=state.bg,sample=state.sample;
    $('#content').innerHTML=header('测量工作台 / 从问题出发','样品吸收了哪些红外分量？','探测器并不直接给出吸光度。先建立背景，再测样品；让两次干涉记录走过相同处理，观察系统响应怎样在比值中被消除。')+
      `<div class="row spread"><span class="tag">理想透射 · 零相位 · 无噪声</span><button class="text-button" data-go="instrument">先理解仪器怎样记录信号 →</button></div>
      <div class="cards"><section class="card"><div class="step">01 / 建立参比</div><h3>记录背景</h3><p>不放入模拟样品，保留非平坦的光源与系统响应。</p><button id="acquireBg" class="primary">${bg?'重新模拟背景':'模拟采集背景'}</button><div class="record">${bg?bg.id+' · 2048 点':'等待背景记录'}</div></section>
      <section class="card"><div class="step">02 / 样品相互作用</div><h3>记录样品</h3><label class="field" for="depth"><span>模拟吸收强度 ×${fmt(state.depth,1)}</span><input id="depth" type="range" min="0" max="2" step="0.1" value="${state.depth}"></label><button id="acquireSample" ${!bg?'disabled':''}>${sample?'重新模拟样品':'模拟采集样品'}</button><div class="record">${sample?sample.id+' · 2048 点':bg?'背景已就绪':'请先建立背景'}</div></section>
      <section class="card"><div class="step">03 / 得到相对响应</div><h3>计算样品／背景</h3><p>分别变换为单光束谱，再作比值；不独立归一化。</p><button id="calculateRatio" ${!sample?'disabled':''}>${state.result?'重新计算比值':'计算透射率'}</button><div class="record">${state.result?state.result.sampleId+' / '+state.result.backgroundId:'等待可比较的两次记录'}</div></section></div>
      <div class="stack"><section class="panel"><div class="panel-head"><h2>两次测量，先看单光束谱</h2><span class="tag">系统响应 ≠ 样品吸收</span></div>${legend([['背景',C.amber],['样品',C.green]])}<div id="singleBeamChart"></div><p class="chart-caption">${bg?'由保存的干涉记录计算，使用相同 OPD 网格和矩形窗。横轴遵循红外谱常用的高波数在左。':'点击“模拟采集背景”，观察系统本身为什么不是一条水平线。'}</p><div class="row">${bg?'<button id="inspectBg" class="text-button">分析背景干涉图 →</button>':''}${sample?'<button id="inspectSample" class="text-button">分析样品干涉图 →</button>':''}</div></section>
      <section class="panel"><div class="panel-head"><h2>样品的相对响应</h2><span class="tag">同一对记录 · 三种表示</span></div>${buttonSet('result',[['percent','百分透射率 %T'],['fraction','透射率 T'],['absorbance','吸光度 A']],state.resultMode)}<div id="resultChart"></div><div id="resultReadout"></div></section></div>
      <div class="notice">“模拟采集”生成一条完整的数值记录，不连接真实仪器。2048 点、OPD 间距 1 μm；两次测量使用同一采样条件。改变样品强度后须重新采集；重测背景会清除旧样品与比值。</div>
      ${molecularDetails()}<details><summary>模型假设与结果边界</summary><p>背景谱 H(ν̃) 包含系统响应；样品谱为 H(ν̃)T(ν̃)。当前使用带限谱密度的离散近似和兼容的正反变换，忽略噪声、相位误差、漂移与散射。谱带为合成教学数据，无物质鉴定含义。</p><div class="formula">T = B样品 / B背景<br>A = −log₁₀(T)</div><p>背景过弱区域不显示可信比值。现实测量中，背景不能自动纠正所有环境变化和样品效应。</p></details>`;
    on('acquireBg','click',()=>{state.bg=P.measure('background');state.sample=null;state.result=null;render();announce('背景记录已生成。请模拟采集样品。');});
    on('depth','change',e=>{state.depth=Number(e.target.value);state.sample=null;state.result=null;render();$('#depth').focus();announce('样品条件已改变，请重新采集样品。');});
    on('acquireSample','click',()=>{state.sample=P.measure('sample',state.depth);state.result=null;render();announce('样品记录已生成，可以计算透射率。');});
    on('calculateRatio','click',()=>{state.result=P.ratio(P.transform(state.sample),P.transform(state.bg));render();announce('已由两条单光束谱得到透射率。低背景区已标为无效。');});
    on('inspectBg','click',()=>{state.analysis=state.bg;go('fourier');});
    on('inspectSample','click',()=>{state.analysis=state.sample;go('fourier');});
    bindChoice('result',v=>{state.resultMode=v;render();});
    paint=()=>{
      if(!bg)$('#singleBeamChart').innerHTML=empty('先测背景','记录系统本身的响应');
      else {const b=P.transform(bg),series=[{xs:b.wn,ys:b.values,color:C.amber}];if(sample){const s=P.transform(sample);series.push({xs:s.wn,ys:s.values,color:C.green});}chart('singleBeamChart',series,{x0:4000,x1:400,xlabel:'波数 / cm⁻¹',ylabel:'单光束响应 / 相对谱密度',title:'背景与样品单光束谱'});}
      drawResult();
    };paint();
  }
  function drawResult() {
    const r=state.result;
    if(!r){$('#resultChart').innerHTML=empty('比值尚未计算','背景与样品分别记录后，计算透射率');$('#resultReadout').innerHTML='';return;}
    const abs=state.resultMode==='absorbance',pct=state.resultMode==='percent';
    const ys=abs?r.a:r.t.map(v=>v===null?null:v*(pct?100:1));
    chart('resultChart',[{xs:r.wn,ys,color:C.green}],{x0:4000,x1:400,y0:0,y1:abs?Math.max(.8,state.depth*.76):(pct?105:1.05),xlabel:'波数 / cm⁻¹',ylabel:abs?'吸光度 A（无量纲）':pct?'百分透射率 / %':'透射率 T（无量纲）',title:'由同一对记录计算的样品相对响应'});
    $('#resultReadout').innerHTML=`<label class="field" for="probe"><span>选择波数，核对计算</span><input id="probe" type="range" min="400" max="4000" step="1" value="${state.probe}"></label><div id="probeValue" class="probe"></div><p class="chart-caption">曲线空缺处为背景低于 ${r.threshold} 相对单位的区域，不输出可信比值。吸收在 T 图中向下，在 A 图中向上。</p>`;
    const update=()=>{let idx=0;r.wn.forEach((w,i)=>{if(Math.abs(w-state.probe)<Math.abs(r.wn[idx]-state.probe))idx=i;});const b=P.transform(state.bg),s=P.transform(state.sample);$('#probeValue').textContent=`采样波数 ${fmt(r.wn[idx])} cm⁻¹ ｜ 背景 ${fmt(b.values[idx],3)}，样品 ${fmt(s.values[idx],3)} ｜ ${r.valid[idx]?`T = ${fmt(r.t[idx],3)}，%T = ${fmt(r.t[idx]*100,1)}，A = ${fmt(r.a[idx],3)}`:'背景过弱：此处结果无效'}`;};
    on('probe','input',e=>{state.probe=Number(e.target.value);update();});update();
  }
  function opticSVG() {
    const mx=390+state.mirror/.02*30;
    return `<svg class="optic-svg" viewBox="0 0 520 330" role="img" aria-label="二维 Michelson 光路：光源从左入射，固定臂向上，移动臂向右，观察输出向下"><path class="beam-a" d="M60 135H250V40V135V287"/><path class="beam-b" d="M250 140H${mx}H255V287"/><rect class="part" x="32" y="118" width="52" height="35" rx="5"/><text x="28" y="174">宽带光源</text><path d="M230 154L270 114" stroke="#458f8b" stroke-width="7"/><text x="187" y="115">分束器</text><rect class="part" x="226" y="32" width="49" height="10"/><text x="289" y="42">固定镜</text><rect id="movingMirror2d" class="part" x="${mx}" y="110" width="10" height="52"/><text x="397" y="99">移动镜</text><text x="285" y="181">往返各增加 Δx</text><rect class="part" x="233" y="215" width="39" height="12"/><text x="283" y="228">样品区</text><rect class="part" x="224" y="274" width="60" height="30" rx="5"/><text x="295" y="294">探测器</text></svg>`;
  }
  const partInfo={source:['宽带光源','一次提供多个波数分量。原理实验的“单波数”是虚拟分量，不表示实际热源正在逐个扫描波长。'],splitter:['分束器','将入射场分到两臂，返程后重新叠加。它不是按颜色分光的滤色器。理想图中用固定的分束关系，忽略色散与偏振。'],fixed:['固定镜','提供一条返回路径，与移动臂比较往返光程。固定不表示所有真实仪器中它完全没有对准机构。'],moving:['移动镜','改变一臂的往返光程。空气近似、沿轴正入射时 Δδ = 2Δx。沿导轨拖动镜架，去程与回程各改变一次。位移为放大示意。'],sample:['样品区','入／出射窗把样品空间与内部光学区域隔开；可取出的样品架位于光束中。这里采用透射模式，不是 ATR 附件。'],detector:['探测器','把辐射响应变成电信号。这里绘制的是去直流的交流信号 g(δ)，负值不代表负光功率。'],laser:['参考激光（功能说明）','相当于稳定的光学长度标尺，帮助确定采样 OPD 和波数尺度，不是照射样品的宽带红外源。具体共路方式未指定，因此没有伪造一条工程激光光路。']};
  Object.assign(partInfo,{
    collimator:['准直组件','位于光源与干涉仪之间，把辐射送入可比较的两臂。实际仪器常采用反射镜组。这里以开口接口表达功能，未展开内部折叠光路，不是透射式透镜。'],
    collector:['收集光学','把经过样品的辐射送至探测区域。实际常使用聚焦反射镜组；此处保留等效接口，未展开曲面镜及折叠路径。'],
    electronics:['信号采集','接收探测器的电信号，形成按光程差排列的记录，再交给计算处理。板卡与连线仅示意功能连接，不代表真实电路。']
  });
  let mount3d=null;
  function renderInstrument() {
    $('#content').innerHTML=`<h1 class="sr-only">傅里叶变换红外光谱仪：构造与原理</h1>
      <section class="instrument-stage" aria-label="仪器结构与原理探索">
        <div class="model-toolbar"><div class="model-modes" aria-label="结构显示"><button data-model-mode="inside" aria-pressed="true">内部结构</button><button data-model-mode="optical" aria-pressed="false">光学核心</button><button data-model-mode="exterior" aria-pressed="false">整机外壳</button></div><div class="model-tools"><button id="topView" title="从上方看清光路">俯视</button><button id="resetCamera">复位</button><details class="parts-menu"><summary>部件</summary><div>${Object.entries(partInfo).map(([k,[name]])=>`<button data-part="${k}">${name}</button>`).join('')}</div></details></div></div>
        <div id="instrumentHost" class="instrument-host"><div class="model-loading">正在准备三维视图…<small>下方二维光路与数值实验始终可用</small></div></div>
        <div class="model-corner"><span class="status-dot"></span> 通用教学模型 <small>结构示意 · 非型号复刻</small></div>
        
        <aside id="partCard" class="part-card" hidden aria-label="所选部件"><div class="row spread"><span class="eyebrow">结构与功能</span><button id="closePart" aria-label="关闭部件说明">×</button></div><h2 id="partTitle"></h2><p id="partInfo"></p><div class="row"><button id="focusPart" class="text-button">局部放大 ↗</button><button id="partAction" class="text-button">进入测量 →</button><button id="toggleSample" class="text-button" hidden>取出示意样品</button></div><small id="sampleNotice" hidden>仅改变结构演示，不改写已保存测量。</small></aside>
        <div id="mirrorDock" class="mirror-dock" hidden><div class="row spread"><label for="mirror">移动镜 <span class="hint">位移已放大</span></label><div><span id="mirrorCompact">x = 0.00 μm</span><b id="opdCompact">δ = 0.00 μm</b></div></div><input id="mirror" type="range" min="-0.02" max="0.02" step="0.00005" value="${state.mirror}"><div class="row spread"><small>−20 μm</small><button id="mirrorZero" class="text-button">回到零光程差</button><small>+20 μm</small></div></div>
      </section>
      <div class="model-underbar"><button id="tracePath" class="text-button">追踪光路 →</button><p id="traceText" aria-live="polite"></p><button class="text-button" data-go="measurement">模拟测量 ↗</button></div>
      <details class="instrument-detail" id="mirrorDetails"><summary>查看镜位移怎样改变探测信号</summary><div class="two-col"><div><p class="hint">选择一个虚拟单波数分量，观察相同 OPD 下的不同周期。这不是对真实宽带光源逐波数调谐。</p><div class="controls"><label for="singleWn">虚拟波数</label><select id="singleWn"><option value="1000">1000 cm⁻¹</option><option value="2000">2000 cm⁻¹</option><option value="3000">3000 cm⁻¹</option></select><button id="mirrorMinus">−0.25 μm</button><button id="mirrorPlus">+0.25 μm</button><button id="playMirror">自动演示</button></div><div id="mirrorReadouts" class="readouts"></div><div class="formula">Δδ = 2Δx<br>φ = 2πν̃δ</div></div><div id="mirrorChart"></div></div><p class="hint">自动演示改变观察位置，不生成测量记录。空气近似、正入射时，镜子移动 5 μm 对应 OPD 增加 10 μm。</p><button class="text-button" data-go="signals">继续观察多个谱分量的叠加 →</button></details>
      <details class="instrument-detail" id="schematicDetails"><summary>二维光路与模型边界</summary><div class="two-col"><div id="opticDiagram">${opticSVG()}</div><div><h3>先保证路径，再解释结构</h3><p>分束器、固定镜与移动镜建立两臂；返回后形成观察输出。二维图与三维模型使用同一拓扑。另一输出端口未完整绘出，暗信号不表示能量凭空消失。</p><p>准直、收集光学、镜架、导轨、外壳和板卡为通用功能示意。参考激光表示长度标尺功能，不虚构未确认的共路工程细节。材料、尺寸与机械比例不是实物规格。</p><p>光束颜色仅作路径区分，位移为显示放大。依据：<a href="https://www.ssi.shimadzu.com/service-support/technical-support/analysis-basics/tips-ftir/apodization.html" target="_blank" rel="noreferrer">Shimadzu 原理资料</a>。</p></div></div></details>`;
    let selected='',trace=-1,visualSample=true;
    function selectPart(id){
      selected=id;$('#partCard').hidden=!id;$('#mirrorDock').hidden=id!=='moving';
      if(!id)return;
      $('#partTitle').textContent=partInfo[id]?.[0]||id;$('#partInfo').textContent=partInfo[id]?.[1]||'';
      $('#toggleSample').hidden=id!=='sample';$('#sampleNotice').hidden=id!=='sample';
      $('#partAction').hidden=!['sample','detector','electronics'].includes(id);
      $('#mirrorDock').classList.toggle('emphasized',id==='moving');
    }
    function modeChanged(mode){
      document.querySelectorAll('[data-model-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.modelMode===mode)));
      if(mode==='exterior'){stopPlayback();$('#partCard').hidden=true;}
      $('#mirror').disabled=mode==='exterior';$('#tracePath').disabled=mode==='exterior';
      $('#mirrorDock').hidden=mode==='exterior'||selected!=='moving';
      for(const id of ['mirrorMinus','mirrorPlus','playMirror'])$('#'+id).disabled=mode==='exterior';
    }
    const setMirror=v=>{state.mirror=Math.max(-.02,Math.min(.02,v));$('#mirror').value=state.mirror;drawMirror();};
    mount3d=()=>{
      if(instrument||!$('#instrumentHost'))return;
      instrument=window.FTIRInstrument($('#instrumentHost'),{onSelect:selectPart,onInspect:stopPlayback,onMirror:v=>{stopPlayback();state.mirror=v;$('#mirror').value=v;drawMirror(false);},onMode:modeChanged,onUnavailable:()=>{$('#schematicDetails').open=true;}});
      $('#instrumentHost').classList.toggle('unavailable',!instrument);
      if(instrument){$('#instrumentHost').querySelector('.model-loading')?.remove();instrument.setMirror(state.mirror);}
    };mount3d();
    on('resetCamera','click',()=>instrument?.reset());on('topView','click',()=>instrument?.view('top'));
    on('closePart','click',()=>{selectPart('');instrument?.reset();});
    $('#focusPart').textContent='单独拆解 ↗';
    on('focusPart','click',()=>instrument?.inspect(selected));
    on('partAction','click',()=>go('measurement'));
    on('toggleSample','click',()=>{visualSample=!visualSample;instrument?.setSample(visualSample);$('#toggleSample').textContent=visualSample?'取出示意样品':'放回示意样品';});
    document.querySelectorAll('[data-model-mode]').forEach(b=>b.addEventListener('click',()=>{instrument?.setMode(b.dataset.modelMode);modeChanged(b.dataset.modelMode);}));
    document.querySelectorAll('.parts-menu [data-part]').forEach(b=>b.addEventListener('click',()=>{selectPart(b.dataset.part);$('.parts-menu').open=false;instrument?.inspect(b.dataset.part);}));
    on('tracePath','click',()=>{trace=trace===2?-1:trace+1;instrument?.trace(trace);$('#traceText').textContent=['全部光路：宽带输入 → 两臂编码 → 样品 → 探测器','① 光源经准直组件输入，不逐波数扫描。','② 两臂分别返回，在分束器处重新叠加。','③ 输出经过样品，由收集光学送入探测器。'][trace+1];$('#tracePath').textContent=trace===2?'恢复完整光路 ↺':'追踪光路 →';});
    on('mirror','input',e=>{stopPlayback();setMirror(Number(e.target.value));});
    on('mirrorMinus','click',()=>{stopPlayback();setMirror(state.mirror-.00025);});
    on('mirrorPlus','click',()=>{stopPlayback();setMirror(state.mirror+.00025);});
    on('mirrorZero','click',()=>{stopPlayback();setMirror(0);});
    on('playMirror','click',()=>{state.playing=!state.playing;$('#playMirror').textContent=state.playing?'暂停演示':'自动演示';});
    $('#singleWn').value=state.wn;on('singleWn','change',e=>{state.wn=Number(e.target.value);drawMirror();});
    on('mirrorDetails','toggle',()=>{if($('#mirrorDetails').open){instrument?.focus('moving');}drawMirror();});paint=drawMirror;paint();
  }
  function stopPlayback(){state.playing=false;if($('#playMirror'))$('#playMirror').textContent='自动演示';}
  function drawMirror(updateModel=true){
    const delta=P.mirrorToOPD(state.mirror),phase=2*Math.PI*state.wn*delta;
    $('#mirrorReadouts').innerHTML=`<div class="readout"><small>镜位移 x</small><strong>${fmt(state.mirror*1000,2)} <em>μm</em></strong></div><div class="readout"><small>光程差 δ</small><strong>${fmt(delta*10000,2)} <em>μm</em></strong></div><div class="readout"><small>相位（模 2π）</small><strong>${fmt((phase%(2*Math.PI)+2*Math.PI)%(2*Math.PI))} <em>rad</em></strong></div>`;
    const xs=Array.from({length:1001},(_,i)=>-.004+i*.008/1000),ys=xs.map(x=>Math.cos(2*Math.PI*state.wn*x));
    chart('mirrorChart',[{xs,ys}],{x0:-.004,x1:.004,y0:-1.2,y1:1.2,zpd:true,ylabel:'交流信号 g / 相对单位',marker:{x:delta,y:Math.cos(phase)},title:'单波数干涉信号与当前镜位移'});
    $('#opticDiagram').innerHTML=opticSVG();
    $('#mirrorCompact').textContent='x = '+fmt(state.mirror*1000,2)+' μm';$('#opdCompact').textContent='δ = '+fmt(delta*10000,2)+' μm';
    if(updateModel)instrument?.setMirror(state.mirror);
  }
  function makePractice(){
    if(state.signalMode==='broad')return P.densityRecord(P.response,{label:'宽带数值近似'});
    const lines=[{wn:1000,weight:1}];if(state.signalMode!=='single')lines.push({wn:3000,weight:.6});if(state.signalMode==='triple')lines.push({wn:1700,weight:.4});
    return P.lineRecord(lines,{label:{single:'单分量实验',pair:'双分量实验',triple:'三分量实验'}[state.signalMode]});
  }
  function renderSignals(){
    signalDraft=makePractice();
    $('#content').innerHTML=header('原理实验 / 正向合成','许多简单周期，怎样成为一条干涉图？','每个波数分量先在两臂之间自干涉，探测器记录各分量调制贡献的总和。比较曲线时保留共同尺度，不把不同频率电场的碰撞当成测量过程。')+
      `<section class="panel">${buttonSet('signals',[['single','单分量'],['pair','两个分量'],['triple','三个分量'],['broad','连续宽带近似']],state.signalMode)}<div class="row spread"><h2 id="signalTitle">${signalDraft.label}</h2><label class="hint"><input id="showComponents" type="checkbox" ${state.showComponents?'checked':''} ${state.signalMode==='broad'?'disabled':''}> 显示各分量贡献</label></div><div id="signalLegend"></div><div id="signalChart"></div><div class="controls"><label for="signalZoom">观察范围</label><select id="signalZoom"><option value="0.004">局部 ±0.004 cm</option><option value="0.02">中心附近 ±0.02 cm</option><option value="0.1024">全部采样范围</option></select><span class="hint">仅改变显示范围，不改变采样</span></div><div id="signalExplanation" class="notice"></div><button id="recordSignal" class="primary">保存这组信号，进入傅里叶分析 →</button><p class="chart-caption">原理实验与工作台的背景／样品是独立记录。保存后保留同一条信号，不会在切换视图时偷偷换成另一组分量。</p></section><details><summary>为什么 ZPD 附近增强，而单分量没有孤立中心突峰？</summary><p>理想零相位模型中，δ=0 时各余弦项同时为 1。连续宽谱离开这里后，不同周期的正负贡献更多抵消；单分量仍持续周期起伏。有限条离散谱线会重复增强，不等价于真正连续宽带。</p><div class="formula">g(δ) = Σ wⱼ cos(2πν̃ⱼδ)</div><p>连续宽带使用谱密度积分的离散近似，包括波数间隔权重。图中单位与离散谱线模型不作直接幅度比较。</p></details>`;
    bindChoice('signals',v=>{state.signalMode=v;render();});
    on('showComponents','change',e=>{state.showComponents=e.target.checked;drawSignals();});
    $('#signalZoom').value=state.signalZoom;on('signalZoom','change',e=>{state.signalZoom=Number(e.target.value);drawSignals();});
    on('recordSignal','click',()=>{state.practice=signalDraft;state.analysis=signalDraft;go('fourier');announce('原理信号已保存，正在分析同一条记录。');});
    paint=drawSignals;paint();
  }
  function drawSignals(){
    const r=signalDraft,colors=[C.amber,C.blue,C.rose],series=[],labels=[];
    if(r.lines&&state.showComponents)r.lines.forEach((l,i)=>{series.push({xs:r.xs,ys:r.xs.map(x=>l.weight*Math.cos(2*Math.PI*l.wn*x)),color:colors[i],dash:true});labels.push([`${l.wn} cm⁻¹ × ${l.weight}`,colors[i]]);});
    series.push({xs:r.xs,ys:r.ys,color:C.green});labels.push(['探测器交流总信号',C.green]);$('#signalLegend').innerHTML=legend(labels);
    chart('signalChart',series,{x0:-state.signalZoom,x1:Math.min(state.signalZoom,r.xs.at(-1)),zpd:true,height:310,ylabel:'交流信号 / 相对单位',title:'谱分量贡献与干涉图总和'});
    $('#signalExplanation').textContent=r.lines?`${r.lines.length} 个离散分量。虚线是各自贡献，实线是逐点相加结果。关闭“显示各分量”只隐藏参考，不会从总信号中删除该成分。`:'用带限连续谱的离散近似生成干涉图。中心突峰附近各贡献增强，离开零点后逐渐抵消；全范围仍保留有限网格效应。';
  }
  function renderFourier(){
    if(!state.analysis){state.analysis=P.lineRecord([{wn:1000,weight:1},{wn:1700,weight:.6},{wn:3000,weight:.4}],{label:'默认三分量练习'});}
    const r=state.analysis;
    $('#content').innerHTML=header('原理实验 / 反向分析','寻找一个与信号相匹配的周期。','改变候选波数，比较它与记录的干涉信号。相乘后，匹配的正负贡献会形成更显著的累积结果；把许多候选波数的响应排列起来，就得到谱表示。')+
      `<div class="notice"><strong>${r.label} · ${r.id}</strong> ｜ ${r.n} 点，OPD 间距 ${fmt(r.h*10000,1)} μm。<br>${r.provenance}。下面始终分析这条保存记录。${r.kind==='density'?'这是宽带单光束谱，不是样品吸光度。':''}</div>
      <div class="controls"><button data-go="signals">换一组原理信号</button><button data-go="measurement">返回测量工作台</button></div>
      <section class="panel"><div class="panel-head"><h2>候选周期与原始信号</h2><span class="tag">局部图用于观察 · 全记录参与计算</span></div><div class="controls"><label for="candidateNumber">候选波数 / cm⁻¹</label><input id="candidateNumber" type="number" min="400" max="4000" step="1" value="${state.candidate}"><button data-candidate="1000">试 1000</button><button data-candidate="1700">试 1700</button><button data-candidate="2400">试 2400</button><button data-candidate="3000">试 3000</button></div><input id="candidate" aria-label="候选波数" type="range" min="400" max="4000" step="1" value="${state.candidate}">${legend([['干涉信号（仅显示缩放）',C.green],['单位余弦模板',C.amber]])}<div id="templateChart"></div><div class="two-col"><div><h3>相乘后的正负贡献</h3><div id="productChart"></div></div><div><h3>沿 OPD 累积</h3><div id="sumChart"></div></div></div><div id="projectionReadout" class="probe"></div></section>
      <section class="panel" style="margin-top:18px"><div class="panel-head"><h2>同一记录的完整恢复谱</h2><span class="tag">无独立最大值归一化</span></div><div id="recoveredChart"></div><p class="chart-caption">实线来自快速傅里叶计算的实部；标点是当前候选波数的直接余弦投影，任意候选不必恰好落在变换格点上。两者采用同一比例约定。有限窗口可产生负旁瓣，不做绝对值美化。</p></section>
      <details><summary>数学与工程边界</summary><div class="formula">B(ν̃) ≈ 2h Σ g(δᵢ) cos(2πν̃δᵢ)</div><p>这里假设实信号、零相位和理想对称关系，用实部／余弦投影解释。FFT 是计算方法，不是另一种物理过程；当前快速算法选用二次幂点数，但 DFT 本身不要求如此。真实仪器还可能需要相位校正等处理。</p><p>上方比较图对记录除以同一个显示系数，便于与单位模板比较；恢复谱和下面报告的投影仍使用原始幅度。</p></details>`;
    function candidate(v){state.candidate=v;$('#candidate').value=v;$('#candidateNumber').value=v;drawFourier();}
    on('candidate','input',e=>candidate(Number(e.target.value)));
    on('candidateNumber','change',e=>candidate(clampInput(e.target,400,4000,state.candidate)));
    document.querySelectorAll('[data-candidate]').forEach(b=>b.addEventListener('click',()=>candidate(Number(b.dataset.candidate))));
    paint=drawFourier;paint();
  }
  function drawFourier(){
    const r=state.analysis,p=P.projection(r,state.candidate),scale=Math.max(...r.ys.map(Math.abs),1e-9);
    const signal=r.ys.map(v=>v/scale),template=r.xs.map(x=>Math.cos(2*Math.PI*state.candidate*x));
    chart('templateChart',[{xs:r.xs,ys:signal,color:C.green},{xs:r.xs,ys:template,color:C.amber,dash:true}],{x0:-.004,x1:.004,y0:-1.15,y1:1.15,zpd:true,ylabel:'显示缩放后的幅度',title:'干涉信号与候选余弦模板'});
    chart('productChart',[{xs:r.xs,ys:p.product.map(v=>v/scale),color:C.blue}],{x0:-.004,x1:.004,y0:-1.15,y1:1.15,ylabel:'乘积 / 显示单位',height:220,title:'候选模板与信号的逐点乘积'});
    let sum=0;const accum=p.product.map(v=>{sum+=2*r.h*v;return sum;});
    chart('sumChart',[{xs:r.xs,ys:accum,color:C.green}],{x0:r.xs[0],x1:r.xs.at(-1),y0:-r.n*r.h*scale*.2,y1:r.n*r.h*scale,ylabel:'累积投影 / 相对单位',height:220,title:'沿完整 OPD 记录的投影累积'});
    const s=P.transform(r);chart('recoveredChart',[{xs:s.wn,ys:s.values,color:C.green}],{x0:4000,x1:400,xlabel:'波数 / cm⁻¹',ylabel:r.kind==='density'?'恢复单光束响应 / 相对谱密度':'余弦投影 / 相对单位',marker:{x:state.candidate,y:p.value},title:'完整记录的傅里叶恢复谱'});
    $('#projectionReadout').textContent=`候选 ${state.candidate} cm⁻¹ ｜ 全 ${r.n} 点投影 = ${fmt(p.value,5)} ｜ 显示缩放系数 = ${fmt(scale,3)}。试比较已知分量与 2400 cm⁻¹ 的结果；宽带谱则可能在许多候选波数都有响应。`;
  }
  let qualityRecord=null;
  function renderQuality(){
    $('#content').innerHTML=header('深入实验 / 质量与边界','曲线更密，就能分得更清楚吗？','固定 OPD 采样间距，用相距 6 cm⁻¹ 的两条理想谱线作对照。分别改变扫描长度、窗函数和补零，观察它们影响的是实际信息还是显示网格。')+
      `<section class="panel"><div class="controls"><label for="qualityN">有效扫描</label><select id="qualityN"><option value="1024">短 · 最大 |OPD| 0.0512 cm</option><option value="2048">中 · 最大 |OPD| 0.1024 cm</option><option value="4096">长 · 最大 |OPD| 0.2048 cm</option></select><label for="qualityWindow">窗函数</label><select id="qualityWindow"><option value="boxcar">矩形窗</option><option value="hann">Hann 窗</option></select><label for="zeroFill">补零</label><select id="zeroFill"><option value="1">不补零</option><option value="4">4 倍格点</option></select></div>${legend([['当前扫描与处理',C.green],['短扫描基准（矩形窗）',C.gray]])}<div id="qualityChart"></div><div id="qualityStats"></div><div class="notice">两条输入谱线为 1400 与 1406 cm⁻¹，强度相同。延长扫描改变仪器线形；补零仅细化格点。Hann 窗降低旁瓣，但会展宽主瓣，且未补偿窗造成的幅度变化。</div></section>
      <details><summary>为什么这里不只显示一个“分辨率”数字？</summary><p>分辨率必须说明有效 OPD、窗函数与采用的判据。最大绝对 OPD、总扫描跨度、镜行程和 DFT 格点间距不是同一个量。当前只展示可直接验证的采样参数和线形，不把格点间距冒充标称分辨率。</p><p>OPD 采样间距固定为 0.0001 cm，对应基带奈奎斯特波数 5000 cm⁻¹；这与扫描变长是不同的限制。本例是纯谱线与有限窗口的实验，不代表真实样品谱带的全部展宽来源。</p></details><button class="text-button" data-go="measurement">回到一次完整测量 →</button>`;
    for(const id of ['qualityN','qualityWindow','zeroFill']){$('#'+id).value=state[id];on(id,'change',e=>{state[id]=id==='qualityWindow'?e.target.value:Number(e.target.value);qualityRecord=null;drawQuality();});}
    qualityRecord=null;paint=drawQuality;paint();
  }
  function drawQuality(){
    if(!qualityRecord)qualityRecord=P.lineRecord([{wn:1400,weight:1},{wn:1406,weight:1}],{n:state.qualityN,label:'双谱线分辨实验'});
    const s=P.transform(qualityRecord,state.qualityWindow,state.zeroFill),b=P.transform(P.lineRecord([{wn:1400,weight:1},{wn:1406,weight:1}],{n:1024}),'boxcar',4);
    // Divide by the common scan normalization for each length, not an arbitrary peak maximum.
    const scale=qualityRecord.n*qualityRecord.h,bs=1024*qualityRecord.h;
    chart('qualityChart',[{xs:b.wn,ys:b.values.map(v=>v/bs),color:C.gray,dash:true},{xs:s.wn,ys:s.values.map(v=>v/scale),color:C.green}],{x0:1350,x1:1460,y0:-.4,y1:2.15,xlabel:'波数 / cm⁻¹（局部升序比较）',ylabel:'线形 / 按 Nh 尺度显示',height:310,title:'有限扫描、窗函数及补零的线形比较'});
    $('#qualityStats').innerHTML=`<table class="quality-table"><caption class="sr-only">当前采样与处理参数</caption><tr><th>实际采样点</th><th>OPD 间距</th><th>最大 |OPD|</th><th>输出格点间隔</th></tr><tr><td>${qualityRecord.n}</td><td>1 μm</td><td>${fmt(qualityRecord.n*qualityRecord.h/2,4)} cm</td><td>${fmt(s.gridSpacing,3)} cm⁻¹</td></tr></table><p class="chart-caption">谱线强度相同；显示值除以各自 Nh，以比较线形而非扫描长度的比例因子。不是各自峰高归一化，原始记录未修改。补零不会增加上表的实际采样点。</p>`;
  }
  function render(){
    disposeStory?.();disposeStory=null;
    window.disposeFTIRHome?.();window.disposeFTIRHome=null;
    const focused=document.activeElement;
    const focusId=focused?.id, focusChoice=focused?.dataset?.choice, focusValue=focused?.dataset?.value;
    if(instrument){instrument.dispose();instrument=null;}paint=null;mount3d=null;
    document.body.dataset.view=state.view;
    document.querySelectorAll('button[data-view]').forEach(b=>{if(b.dataset.view===state.view)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    ({home:()=>{window.disposeFTIRHome=window.mountFTIRHome($('#content'));},story:()=>{disposeStory=window.mountFTIRStory($('#content'),{chart,go});},absorption:()=>window.mountAbsorption($('#content')),measurement:renderMeasurement,instrument:renderInstrument,signals:renderSignals,fourier:renderFourier,quality:renderQuality})[state.view]();
    document.querySelectorAll('[data-go]').forEach(b=>b.addEventListener('click',()=>go(b.dataset.go)));
    const restore=focusId?document.getElementById(focusId):focusChoice?document.querySelector(`[data-choice="${focusChoice}"][data-value="${focusValue}"]`):null;
    if(restore&&!restore.disabled)restore.focus({preventScroll:true});
  }
  function go(view){stopPlayback();state.view=view;render();$('#content').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});}
  document.querySelectorAll('button[data-view]').forEach(b=>b.addEventListener('click',()=>{go(b.dataset.view);document.querySelector('.lab-menu')?.removeAttribute('open');}));
  $('#resetAll').addEventListener('click',()=>{window.resetFTIRStory?.();state=initial();signalDraft=null;render();announce('所有模拟测量与原理实验已重置。');});
  window.addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>paint?.(),100);});
  document.addEventListener('visibilitychange',()=>{if(document.hidden)stopPlayback();});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');reduced.addEventListener('change',()=>{if(reduced.matches)stopPlayback();});
  function frame(time){const dt=Math.min((time-lastFrame)/1000,.05);lastFrame=time;if(state.playing&&state.view==='instrument'&&!document.hidden){state.mirror+=dt*.001;if(state.mirror>.02)state.mirror=-.02;if(time-lastPaint>40){$('#mirror').value=state.mirror;drawMirror();lastPaint=time;}}requestAnimationFrame(frame);}
  window.addEventListener('ftir-3d-ready',()=>mount3d?.());
  render();requestAnimationFrame(frame);
})();
