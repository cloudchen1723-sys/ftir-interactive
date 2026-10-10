/* Persistent N3–N8 presentation. Existing FTIRPhysics/FTIROptics own units and data. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const C = {sum:'#1d5b94', amber:'#c47c2b', teal:'#17827a', indigo:'#596fb5', ink:'#173341', ghost:'#8b9aa1'};
  const MOTION = window.FTIRMotion = Object.freeze({reveal:.65, focus:1.2, physical:1.8, camera:1.5, transform:2, settle:.85, ease:'ftirScientific'});
  const titles = ['光在仪器里怎样走？','动镜怎样留下不同的节奏？','不同节奏怎样合成一条记录？','从一条起伏中，找回光的组成','怎样看出样品吸收了多少？','光谱里有哪些分子线索？'];
  const lines = window.FTIRStoryModel.lines;
  const clamp = (n,a=0,b=1)=>Math.max(a,Math.min(b,n));
  const lerp = (a,b,p)=>a+(b-a)*p;
  const ptPath = points=>points.map((p,i)=>`${i?'L':'M'}${p[0].toFixed(3)},${p[1].toFixed(3)}`).join(' ');
  let cached;
  function records(){
    if(cached) return cached;
    const P=window.FTIRPhysics, grid={n:4096,h:.00005};
    // A broadened version of the same three teaching bands, not a measured sample.
    const density=w=>lines.reduce((s,l)=>s+l.weight*Math.exp(-.5*((w-l.wn)/75)**2),0);
    const broad=P.densityRecord(density,{...grid,label:'三谱带宽带教学模型'});
    const discrete=[1,2,3].map(n=>P.lineRecord(lines.slice(0,n),grid));
    const spectrum=P.transform(broad);
    const bg=P.transform(P.measure('background')),sample=P.transform(P.measure('sample'));
    cached={broad,discrete,spectrum,bg,sample,ratio:P.ratio(sample,bg),maxI:Math.max(...broad.ys.map(Math.abs)),maxB:Math.max(...spectrum.values)};
    return cached;
  }
  function complex(record,wn){
    let re=0,im=0;
    for(let i=0;i<record.n;i++){const a=2*Math.PI*wn*record.xs[i];re+=record.ys[i]*Math.cos(a);im-=record.ys[i]*Math.sin(a);}
    return {re:2*record.h*re,im:2*record.h*im};
  }
  function mount(host,options={}){
    const data=records(), reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
    let scene=options.scene??2,beat=0,busy=false,dead=false,suspended=false,timeline=null,instrument=null,poseOverview,poseFocus,poseTop;
    let reference=null,refName='acetone',requestId=0,probe=2200,scan=0,mirror=0,handed=false;
    // The record passed from N4 is the only source for the N5 projection and transform.
    // Keep this identity separate from the drawing state so a visual transition cannot
    // accidentally replace the scientific input with a pre-drawn curve.
    let currentRecord=data.broad;
    const ac=new AbortController();
    const root=document.createElement('div');root.className='science-stage';
    root.innerHTML=`<div class="science-model"></div><div class="science-instrument-guide" aria-live="polite">
      <strong class="science-guide-title">先沿着光走一遍</strong>
      <span class="science-guide-copy">先找部件，再追踪光的去程与回程。</span>
      <div class="science-guide-route"><span>光源</span><i>→</i><span>分束器</span><i>→</i><span>两面镜</span><i>→</i><span>探测器</span></div>
      <div class="science-guide-roles"><b>固定镜</b><span>保持位置</span><b>动镜</b><span>改变光程差</span></div>
    </div><div class="science-path-key" aria-hidden="true"><span class="science-key-out">去程</span><span class="science-key-return">回程</span><span class="science-key-output">合束后</span></div><svg class="science-svg" viewBox="0 0 1440 640" role="img" aria-label="FTIR 连续科学舞台">
      <defs><clipPath id="ss-spectrum-clip"><rect x="140" y="100" width="0" height="440"/></clipPath><clipPath id="ss-main-clip"><rect x="90" y="80" width="0" height="460"/></clipPath><marker id="ss-vib-arrow" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${C.amber}"/></marker><marker id="ss-arrow-amber" markerUnits="userSpaceOnUse" viewBox="0 0 12 12" markerWidth="20" markerHeight="20" refX="10" refY="6" orient="auto"><path d="M0 0L12 6L0 12Z" fill="${C.amber}"/></marker><marker id="ss-arrow-blue" markerUnits="userSpaceOnUse" viewBox="0 0 12 12" markerWidth="20" markerHeight="20" refX="10" refY="6" orient="auto"><path d="M0 0L12 6L0 12Z" fill="${C.indigo}"/></marker><marker id="ss-arrow-teal" markerUnits="userSpaceOnUse" viewBox="0 0 12 12" markerWidth="20" markerHeight="20" refX="10" refY="6" orient="auto"><path d="M0 0L12 6L0 12Z" fill="${C.teal}"/></marker></defs>
      <g data-layer="optics"><g id="ss-optical-paths"></g><g id="ss-parts"></g><g id="ss-labels"></g>
       <path id="ss-extra-out" class="extra amber"/><path id="ss-extra-back" class="extra blue"/>
       <text id="ss-dx1" class="formula amber">+Δx</text><text id="ss-dx2" class="formula blue">+Δx</text>
       <text id="ss-opd-name" class="label" x="870" y="235">光程差 δ：两臂光程之差</text>
       <text id="ss-formula" class="formula" x="900" y="320">Δδ = 2Δx</text>
       <text id="ss-assumption" x="60" y="615" class="meta">正入射 · 空气近似 · 镜位移放大示意</text>
       <circle id="ss-pulse-a" r="9" fill="${C.amber}"/><circle id="ss-pulse-b" r="9" fill="${C.amber}"/>
      </g>
      <g data-layer="response"><text x="945" y="105" class="label">归一化探测功率</text>
       <path class="axis" d="M945 155V300H1380M945 365V510H1380"/>
       <text x="945" y="140" class="label amber">1000 cm⁻¹</text><text x="945" y="350" class="label indigo">3000 cm⁻¹</text>
       <text x="915" y="180">1</text><text x="915" y="300">0</text><text x="915" y="390">1</text><text x="915" y="510">0</text>
       <path id="ss-trace1" class="curve amber"/><path id="ss-trace3" class="curve indigo"/>
       <circle id="ss-dot1" r="7" fill="${C.amber}"/><circle id="ss-dot3" r="7" fill="${C.indigo}"/>
       <path id="ss-opd-cursor" class="cursor"/><text x="945" y="550">0</text><text x="1150" y="550">5</text><text x="1360" y="550">10</text>
       <text x="1070" y="590" class="label">光程差 δ / μm</text>
      </g>
      <g data-layer="components"><path id="ss-component-axis" class="axis" d="M80 510H1360"/><text id="ss-component-title" x="80" y="50" class="major">一条波数，先看一种节奏</text><text id="ss-component-quantity" x="80" y="88" class="label">交流信号 / 相对单位</text><g id="ss-component-curves"></g><g id="ss-markers"></g>
       <path id="ss-zpd" class="cursor amber" d="M720 100V520"/>
       <text id="ss-zpd-label" x="720" y="85" text-anchor="middle" class="label amber">ZPD · δ = 0</text>
       <text id="ss-component-label" x="1360" y="88" text-anchor="end" class="label"></text>
      </g>
       <g data-layer="projection" id="ss-projection-layer">
        <text id="ss-projection-title" x="140" y="70" class="label">同一条记录 · 在同一条 OPD 轴上寻找周期</text>
        <path id="ss-proj-axis" d="M140 120V500H1300" class="axis"/><path id="ss-proj-baseline" d="M140 315H1300" class="axis"/>
        <text id="ss-proj-overlay-label" x="140" y="108" class="meta">归一化干涉图 I(δ) 与候选周期</text><text id="ss-proj-product-label" x="140" y="545" class="meta">带符号乘积 p(δ) = I(δ) cos(2πν̃δ)</text>
        <path id="ss-proj-record" class="curve ghost"/><path id="ss-proj-template" class="curve amber"/>
        <path id="ss-proj-product" class="curve blue"/><path id="ss-proj-positive" class="curve teal"/><path id="ss-proj-negative" class="curve indigo"/>
        <path id="ss-proj-cursor" class="cursor"/><path id="ss-proj-sum" class="vector"/>
        <text id="ss-proj-candidate" x="980" y="70" class="major amber">候选 2200 cm⁻¹</text><text id="ss-proj-status" x="760" y="108" class="label">先比较周期，再逐点相乘</text>
        <g id="ss-proj-compare" opacity="0"><path d="M430 400H1030" class="axis"/><path id="ss-proj-mismatch-bar" class="cursor"/><path id="ss-proj-match-bar" class="vector"/><text id="ss-proj-mismatch-label" x="560" y="565" text-anchor="middle" class="label">失配</text><text id="ss-proj-match-label" x="900" y="565" text-anchor="middle" class="label">匹配</text><text id="ss-proj-mismatch-value" x="560" y="600" text-anchor="middle" class="major"></text><text id="ss-proj-match-value" x="900" y="600" text-anchor="middle" class="major"></text></g>
        <text id="ss-proj-cumulative" x="720" y="185" text-anchor="middle" class="major blue"></text>
       </g>
       <g data-layer="fourier"><g id="ss-rhythm-reminder"><text x="100" y="80" class="major">波数不同，起伏的快慢不同</text><path id="ss-reminder-slow" class="curve amber"/><text x="100" y="300" class="label amber">1000 cm⁻¹</text><path id="ss-reminder-fast" class="curve indigo"/><text x="100" y="480" class="label indigo">3000 cm⁻¹</text><text x="400" y="590" class="label">相同光程差范围：0 → 10 μm</text></g><g id="ss-winding-focus">
       <circle cx="665" cy="365" r="210" class="reference"/><path d="M435 365H895M665 135V595" class="axis"/>
       <text x="902" y="371">Re</text><text x="674" y="133">Im</text>
       <circle cx="665" cy="365" r="7" class="origin"/><text x="681" y="392">原点</text>
       <path id="ss-phase" class="phase"/><circle id="ss-wound-point" r="7" fill="${C.amber}"/>
       <path id="ss-vector" class="vector"/><circle id="ss-net" r="9" fill="${C.sum}"/>
       <text id="ss-net-label" x="430" y="622" class="meta">把整条 OPD 记录按不同节奏整理，得到各波数的响应</text>
      </g>
        <g id="ss-spectrum-panel"><text x="140" y="75" class="major">各波数的贡献</text><text x="140" y="112" class="label">单光束响应 / 相对单位</text>
       <path d="M140 125V515H1300" class="axis"/><path id="ss-spectrum" class="curve blue" clip-path="url(#ss-spectrum-clip)"/>
       <path id="ss-spec-cursor" class="cursor amber"/><path id="ss-match-bar" class="vector"/>
       <text x="140" y="548">4000</text><text x="1265" y="548">400</text><text x="650" y="580" class="label">波数 / cm⁻¹</text></g>
       <text id="ss-probe-label" x="60" y="245" class="major amber">2200 cm⁻¹</text>
       <text id="ss-response-label" x="60" y="280" class="label">候选波数</text>
       <path id="ss-sample-link" class="reference"/><circle id="ss-source-point" r="6" fill="${C.amber}"/>
      </g>
      <g data-layer="measurement"><text id="ss-y-label" x="90" y="70" class="label">单光束响应</text>
       <path d="M90 100V515H1360" class="axis"/>
       <g id="ss-y-ticks"></g><g id="ss-x-ticks"></g>
       <path id="ss-bg" class="curve ghost"/><path id="ss-measured" class="curve blue" clip-path="url(#ss-main-clip)"/>
       <path id="ss-measure-cursor" class="cursor amber"/>
        <g id="ss-measure-legend"><g id="ss-legend-bg"><line x1="865" y1="55" x2="920" y2="55" class="curve ghost"/><text x="932" y="62" class="meta">B背景 · 系统响应</text></g><g id="ss-legend-sample"><line x1="1110" y1="55" x2="1165" y2="55" class="curve blue"/><text x="1177" y="62" class="meta">B样品</text></g></g>
        <g id="ss-ratio-demo"><path id="ss-ratio-line" class="cursor"/><circle id="ss-ratio-bg-dot" r="8" fill="${C.ghost}"/><circle id="ss-ratio-sample-dot" r="8" fill="${C.sum}"/><text id="ss-ratio-bg-value" class="meta"></text><text id="ss-ratio-sample-value" class="meta"></text><text id="ss-ratio-caption" x="760" y="485" class="label">同一波数：样品响应 ÷ 背景响应</text></g>
        <text id="ss-measure-formula" x="825" y="105" class="formula"></text>
        <text id="ss-data-label" x="90" y="625" class="meta"></text>
      </g>
      <g data-layer="reference"><path id="ss-band-marker" class="cursor amber"/>
       <text id="ss-band-label" x="825" y="190" class="major"></text><text id="ss-band-assignment" x="825" y="229" class="label"></text>
        <text id="ss-mode-disclaimer" x="825" y="575" class="meta">主要贡献示意，不代表一峰对应一根键</text>
        <g id="ss-vibration" transform="translate(1090 350)">
          <g id="ss-vib-acetone" class="ss-vib-structure"><line x1="0" y1="-24" x2="0" y2="-88" class="bond"/><line x1="12" y1="-24" x2="12" y2="-88" class="bond"/><line x1="-18" y1="16" x2="-90" y2="65" class="bond"/><line x1="28" y1="16" x2="100" y2="65" class="bond"/><circle cx="6" cy="0" r="25" fill="${C.ink}"/><circle cx="6" cy="-110" r="25" fill="${C.amber}"/><text x="6" y="8" text-anchor="middle" fill="white">C</text><text x="6" y="-102" text-anchor="middle" fill="white">O</text><text x="-112" y="78" class="label">CH₃</text><text x="92" y="78" class="label">CH₃</text><path d="M-28 -48V-92M40 -92V-48" class="vib-arrow"/></g>
          <g id="ss-vib-ethanol" class="ss-vib-structure"><text x="-150" y="8" class="label">CH₃–CH₂</text><line x1="-42" y1="0" x2="12" y2="0" class="bond"/><circle cx="38" cy="0" r="25" fill="${C.amber}"/><text x="38" y="8" text-anchor="middle" fill="white">O</text><line x1="63" y1="0" x2="112" y2="0" class="bond"/><circle cx="137" cy="0" r="18" fill="#eef3f5" stroke="${C.ink}" stroke-width="3"/><text x="137" y="7" text-anchor="middle">H</text><path d="M80 -35H126M126 35H80" class="vib-arrow"/><path d="M160 0H220" class="hbond"/><text x="225" y="8" class="label">O</text><text x="175" y="40" class="meta">氢键</text></g>
          <g id="ss-vib-aromatic" class="ss-vib-structure"><path d="M0 -82L72 -41L72 41L0 82L-72 41L-72 -41Z" class="ring"/><path d="M-3 -62L49 -32M52 29L3 60M-52 29L-52 -29" class="ring-double"/><path d="M-92 -64L-125 -90M92 -64L125 -90M-92 64L-125 90M92 64L125 90" class="vib-arrow"/><text x="0" y="125" text-anchor="middle" class="meta">六元芳环 · 交替键</text></g>
        </g>
      </g>
       <g id="ss-equation" opacity="0"><text id="ss-eq-cos" x="90" y="610" class="formula">傅里叶变换：从 OPD 记录恢复各个波数</text></g>
    </svg><div class="science-record"><svg viewBox="0 0 1280 440">
      <path id="ss-record-axis" class="axis" d="M0 385H1280"/><path id="ss-record-dc" class="dc-line" d="M0 265H1280"/><text id="ss-dc-label" x="1280" y="255" text-anchor="end" class="label">恒定基线</text>
      <path id="ss-record" class="curve blue"/><path id="ss-record-cursor" class="cursor"/><circle id="ss-record-dot" r="7" fill="${C.teal}"/>
      <g id="ss-record-zpd"><path class="cursor amber" d="M640 100V385"/><text x="675" y="110" class="label amber">两臂等光程 · δ = 0</text><text x="675" y="150" class="major amber">中心突峰</text></g>
      <g id="ss-record-wings"><path d="M60 220H430M850 220H1220" class="wing"/></g>
      <text id="ss-record-title" x="0" y="30" class="major">从一个读数，到一条记录</text><text id="ss-record-quantity" x="0" y="75" class="label">探测功率 / 相对单位</text><text id="ss-record-y-label" x="0" y="370" class="label">0</text>
      <text x="0" y="420" class="record-lo">−80</text><text x="620" y="420">0</text><text x="1220" y="420" class="record-hi">80</text><text x="640" y="468" text-anchor="middle" class="label">光程差 δ / μm</text>
    </svg></div>
    <div class="science-controls" hidden><label for="ss-probe">候选波数 <output id="ss-probe-value">2200</output> cm⁻¹</label><input id="ss-probe" type="range" min="400" max="4000" step="1" value="2200" list="ss-snaps" aria-label="候选波数，400 至 4000 每厘米"><datalist id="ss-snaps"><option value="1000"><option value="1700"><option value="2200"><option value="3000"></datalist></div>
    <div class="reference-controls" hidden><label>换一个样品 <select id="ss-sample"><option value="acetone">丙酮（液体）</option><option value="ethanol">乙醇（液体）</option><option value="polystyrene">苯乙烯低聚物（液体）</option></select></label><button id="ss-band">探索主要吸收带</button><a href="./reference-data/manifest.json" target="_blank" rel="noopener">数据来源与处理</a></div>
    <button id="ss-open-lab" class="science-lab-entry" type="button" hidden>打开模拟实验室</button>`;
    host.replaceChildren(root);
    const $=s=>root.querySelector(s), $$=s=>[...root.querySelectorAll(s)], svg=$('.science-svg'), model=$('.science-model'), recordBox=$('.science-record'), recordPath=$('#ss-record');
    const layer=n=>$(`[data-layer="${n}"]`);
    const show=(el,v)=>{el.style.opacity=v;el.style.visibility=v?'visible':'hidden';};
    const attr=(el,obj)=>Object.entries(obj).forEach(([k,v])=>el.setAttribute(k,v));
    const text=(sel,t)=>$(sel).textContent=t;
    function el(tag,attrs,parent){const n=document.createElementNS(NS,tag);attr(n,attrs);parent?.append(n);return n;}
    function note(t){options.onNote?.(t);}
    function label(){options.onScene?.(scene,titles[scene-2]);root.dataset.scene=scene;root.dataset.beat=beat;}
    function stop(){timeline?.kill();timeline=null;busy=false;suspended=false;}
    function suspendMotion(){if(busy){suspended=true;timeline?.pause();}}
    function resumeMotion(){if(!suspended)return false;suspended=false;timeline?.resume();return true;}
    function animate(build,done){
      stop();busy=true;
      timeline=gsap.timeline({paused:true,defaults:{ease:MOTION.ease},onComplete(){busy=false;root.dataset.busy='false';done?.();label();}});
      build(timeline);root.dataset.busy='true';
      if(reduced())timeline.progress(1);else timeline.play();
    }
    function tweenState(obj,vars,render,duration=MOTION.physical,done){animate(t=>t.to(obj,{...vars,duration,onUpdate:render}),done);}
    const target={source:[110,310],splitter:[420,310],fixed:[420,90],moving:[640,310],sample:[420,450],detector:[420,545]};
    let geo=structuredClone(target);
    const pathNames=['input','fixed','moving','fixedReturn','movingReturn','output'];
    const paths={},pathMarkers={};pathNames.forEach(n=>{pathMarkers[n]=n==='fixedReturn'||n==='movingReturn'?'url(#ss-arrow-blue)':n==='output'?'url(#ss-arrow-teal)':'url(#ss-arrow-amber)';paths[n]=el('path',{class:`optical-ray optical-${n}`,id:`ss-ray-${n}`,'marker-end':pathMarkers[n]},$('#ss-optical-paths'));});
    const partNodes={},labelNodes={};
    Object.entries({source:'红外光源',splitter:'分束器',fixed:'固定镜',moving:'动镜',sample:'样品室',detector:'探测器'}).forEach(([id,name])=>{
      partNodes[id]=el(id==='source'?'circle':'path',{class:'optical-part'},$('#ss-parts'));
      labelNodes[id]=el('text',{class:'label','text-anchor':'middle'},$('#ss-labels'));labelNodes[id].textContent=name;
    });
    function drawGeometry(g=geo){
      const s=g.splitter,m=g.moving,f=g.fixed;
      attr(paths.input,{d:ptPath([g.source,s])});attr(paths.fixed,{d:ptPath([s,f])});attr(paths.moving,{d:ptPath([s,m])});
      attr(paths.fixedReturn,{d:ptPath([f,s])});attr(paths.movingReturn,{d:ptPath([m,s])});attr(paths.output,{d:ptPath([s,g.sample,g.detector])});
      for(const [id,p] of Object.entries(g)){
        if(id==='source')attr(partNodes[id],{cx:p[0],cy:p[1],r:17});
        else {const d=id==='splitter'?[[p[0]-25,p[1]+25],[p[0]+25,p[1]-25]]:id==='fixed'?[[p[0]-40,p[1]],[p[0]+40,p[1]]]:id==='moving'?[[p[0],p[1]-40],[p[0],p[1]+40]]:[[p[0]-23,p[1]-12],[p[0]+23,p[1]-12],[p[0]+23,p[1]+12],[p[0]-23,p[1]+12],[p[0]-23,p[1]-12]];attr(partNodes[id],{d:ptPath(d)});}
        attr(labelNodes[id],{x:p[0]+(id==='splitter'?-75:0),y:p[1]+(id==='fixed'?-32:id==='source'?-34:58)});
      }
    }
    function projected(){
      const anchors=instrument?.getOpticalAnchors?.(Object.keys(target));
      if(!anchors)return structuredClone(target);
      const w=root.clientWidth,h=root.clientHeight;
      return Object.fromEntries(Object.keys(target).map(id=>[id,anchors[id]?[(anchors[id].x+model.offsetLeft)/w*1440,(anchors[id].y+model.offsetTop)/h*640]:target[id]]));
    }
    function initInstrument(){
      if(instrument)return;
      try{instrument=window.FTIRInstrument(model,{onUnavailable(){note('三维不可用；保留完整二维光路。');}});}catch{instrument=null;}
      root.dataset.webgl=instrument?'true':'false';
      if(!instrument)return;
      const canvas=model.querySelector('canvas');if(canvas){canvas.tabIndex=-1;canvas.setAttribute('aria-label','Michelson 仪器模型：分束器把光送往固定镜与动镜，返回合束后经过样品，到达探测器。');}
      model.querySelectorAll('.model-hotspot').forEach(n=>{n.tabIndex=-1;n.setAttribute('aria-hidden','true');});
      instrument.setMode('inside');instrument.setHotspotLabels({source:{zh:'红外光源'},splitter:{zh:'分束器'},fixed:{zh:'固定镜'},moving:{zh:'动镜'},sample:{zh:'样品室'},detector:{zh:'探测器'}});
      instrument.setHotspotOffsets({source:[0,-18],splitter:[0,-28],fixed:[0,-22],moving:[0,-22],sample:[0,-18],detector:[0,-18]});
      instrument.view('overview');poseOverview=instrument.getCameraPose();
      // Keep both mirrors in the focused composition; a macro close-up hides their roles.
      poseFocus={...poseOverview,position:poseOverview.position.map((v,i)=>lerp(poseOverview.target[i],v,.84))};
      instrument.view('top');poseTop=instrument.getCameraPose();poseTop.position=poseTop.position.map((v,i)=>lerp(poseTop.target[i],v,.88));instrument.setCameraPose(poseOverview);
      instrument.setHotspotsVisible(['source','splitter','sample','detector']);instrument.trace(99);
    }
    function guide(title,copy,roles,route){
      const titleEl=$('.science-guide-title'),copyEl=$('.science-guide-copy'),rolesEl=$('.science-guide-roles'),routeEl=$('.science-guide-route');
      if(titleEl)titleEl.textContent=title;if(copyEl)copyEl.textContent=copy;
      if(rolesEl)rolesEl.innerHTML=roles.map(r=>r[1]?`<b>${r[0]}</b><span>${r[1]}</span>`:`<b>${r[0]}</b>`).join('');
      if(route&&routeEl)routeEl.innerHTML=route.map((v,i)=>i%2?`<i>${v}</i>`:`<span>${v}</span>`).join('');
      // A role diagram or a route is enough at one stop. Never stack both.
      if(routeEl)routeEl.hidden=roles.length>0;
    }
    function camera(pose,done){
      if(!instrument||!pose){done?.();return;}
      const from=instrument.getCameraPose(),v={p:0};
      tweenState(v,{p:1},()=>{const p=v.p;instrument.setCameraPose({position:from.position.map((x,i)=>lerp(x,pose.position[i],p)),target:from.target.map((x,i)=>lerp(x,pose.target[i],p)),up:from.up.map((x,i)=>lerp(x,pose.up[i],p))});},MOTION.camera,done);
    }
    function replayOptics(){
      note('跟着光的方向，看两路在哪里分开，又在哪里重新汇合。');
      guide('① 光先到分束器','',[],['光源','→','分束器']);
      geo=instrument?projected():structuredClone(target);drawGeometry();show(layer('optics'),1);show($('#ss-parts'),instrument?0:1);show($('#ss-labels'),instrument?0:1);
      show($('#ss-assumption'),0);show($('#ss-opd-name'),0);show($('#ss-formula'),0);show($('#ss-dx1'),0);show($('#ss-dx2'),0);
      const A=$('#ss-pulse-a'),B=$('#ss-pulse-b');gsap.set([A,B],{x:0,y:0,opacity:0});
      Object.entries(paths).forEach(([name,p])=>{p.style.stroke=name==='fixedReturn'||name==='movingReturn'?C.indigo:name==='output'?C.teal:C.amber;p.style.strokeDasharray=name==='fixedReturn'||name==='movingReturn'?'12 8':'none';p.setAttribute('marker-end','none');gsap.set(p,{drawSVG:'0%'});});
      const move=(tl,node,path,start,duration)=>tl.to(node,{motionPath:{path,align:path,alignOrigin:[.5,.5]},duration,ease:'none'},start);
      animate(t=>{
        t.set(A,{opacity:1},0);move(t,A,paths.input,0,.9);t.to(paths.input,{drawSVG:'100%',duration:.9,ease:'none'},0);
        t.set(paths.input,{attr:{'marker-end':pathMarkers.input}},.9);
        t.call(()=>guide('② 分成两路','分束器把入射光送往两面镜。',[['固定镜','反射上臂'],['动镜','反射侧臂']],['分束器','→','两面镜']),[],.9);
        t.set(B,{opacity:1},.9);move(t,A,paths.fixed,.9,1);move(t,B,paths.moving,.9,1);
        t.to([paths.fixed,paths.moving],{drawSVG:'100%',duration:1,ease:'none'},.9);
        ['fixed','moving'].forEach(n=>t.set(paths[n],{attr:{'marker-end':pathMarkers[n]}},1.9));
        t.call(()=>guide('③ 两路反射回来','虚线与箭头标出返回方向。',[['固定镜','返回分束器'],['动镜','返回分束器']],['两面镜','→','分束器']),[],1.9);
        t.set([A,B],{fill:C.indigo},1.9);move(t,A,paths.fixedReturn,1.9,1);move(t,B,paths.movingReturn,1.9,1);
        t.to([paths.fixedReturn,paths.movingReturn],{drawSVG:'100%',stroke:C.indigo,duration:1,ease:'none'},1.9);
        ['fixedReturn','movingReturn'].forEach(n=>t.set(paths[n],{attr:{'marker-end':pathMarkers[n]}},2.9));
        t.call(()=>guide('④ 合束，经过样品','两路在分束器汇合，随后到探测器。',[['样品','选择性吸收'],['探测器','记录总功率']],['合束','→','样品','→','探测器']),[],2.9);
        t.set(B,{opacity:0},2.9);move(t,A,paths.output,2.9,1.1);t.to(paths.output,{drawSVG:'100%',stroke:C.teal,duration:1.1,ease:'none'},2.9);
        t.set(paths.output,{attr:{'marker-end':pathMarkers.output}},4);
        t.to(A,{opacity:0,duration:.25},4);
      },()=>{['fixedReturn','movingReturn'].forEach(n=>{paths[n].style.strokeDasharray='12 8';paths[n].style.strokeDashoffset='0';});note('两路在分束器处汇合；探测器接收经过样品后的总功率。');});
    }
    function opticalHandoff(){
      const from=instrument?projected():Object.fromEntries(Object.entries(target).map(([id,p])=>[id,[p[0]+400,p[1]]])),v={p:0};layer('optics').removeAttribute('transform');geo=from;drawGeometry();
      show($('#ss-parts'),1);show($('#ss-labels'),1);show(layer('optics'),1);instrument?.setHotspotsVisible([]);
      Object.values(paths).forEach(p=>gsap.set(p,{drawSVG:'0%'}));
      animate(t=>{
        t.to(Object.values(paths),{drawSVG:'100%',duration:.7,ease:'none'},0);
        t.to(model,{opacity:.12,duration:1},.3);
        t.to(v,{p:1,duration:1.7,onUpdate(){geo=Object.fromEntries(Object.keys(target).map(id=>[id,from[id].map((x,i)=>lerp(x,target[id][i],v.p))]));drawGeometry();}},.55);
        t.to(model,{opacity:0,duration:.4},1.9);
      },()=>{handed=true;scene=3;beat=0;show(model,0);show($('#ss-assumption'),1);label();note('两臂等长；动镜尚未移动。');});
    }
    function renderMirror(x){
      mirror=x;geo=structuredClone(target);geo.moving[0]+=x*24;drawGeometry();
      attr($('#ss-extra-out'),{d:ptPath([[640,290],[geo.moving[0],290]])});attr($('#ss-extra-back'),{d:ptPath([[geo.moving[0],330],[640,330]])});
      attr($('#ss-dx1'),{x:640+x*12,y:268,'text-anchor':'middle'});attr($('#ss-dx2'),{x:640+x*12,y:372,'text-anchor':'middle'});
    }
    function renderResponse(opd,portion=1){
      const curve=(wn,base)=>ptPath(Array.from({length:241},(_,i)=>{const d=i/240*10*portion;return [945+d/10*435,base-125*window.FTIRStoryModel.power(wn,d*1e-4)];}));
      attr($('#ss-trace1'),{d:curve(1000,300)});attr($('#ss-trace3'),{d:curve(3000,510)});
      const x=945+opd/10*435;attr($('#ss-opd-cursor'),{d:`M${x} 150V515`});
      attr($('#ss-dot1'),{cx:x,cy:300-125*window.FTIRStoryModel.power(1000,opd*1e-4)});attr($('#ss-dot3'),{cx:x,cy:510-125*window.FTIRStoryModel.power(3000,opd*1e-4)});
    }
    function mirrorBeat(){
      if(beat===1){const v={x:mirror};tweenState(v,{x:5},()=>renderMirror(v.x));note('动镜向外移动，侧臂的光路随之变长。');}
      if(beat===2||beat===3){const p=beat===2?$('#ss-extra-out'):$('#ss-extra-back'),txt=beat===2?$('#ss-dx1'):$('#ss-dx2');show(p,1);show(txt,1);animate(t=>t.fromTo(p,{drawSVG:'0%'},{drawSVG:'100%',duration:1.3,ease:'none'}));note(beat===2?'去程多走一段 Δx。':'反射回来，回程再多走一段 Δx。');}
      if(beat===4){show($('#ss-opd-name'),1);show($('#ss-formula'),1);text('#ss-formula','Δδ = Δx + Δx');gsap.set($('#ss-formula'),{opacity:0});animate(t=>{t.to($('#ss-dx1'),{attr:{x:980,y:320},duration:1});t.to($('#ss-dx2'),{attr:{x:1150,y:320},duration:1},0);t.to([$('#ss-dx1'),$('#ss-dx2')],{opacity:0,duration:.25});t.to($('#ss-formula'),{opacity:1,duration:.5});t.call(()=>text('#ss-formula','Δδ = 2Δx'));t.to({}, {duration:.8});});note('去程和回程各贡献 Δx，所以光程差改变 2Δx。');}
      if(beat===5){show($('#ss-opd-name'),0);show(layer('response'),1);const v={d:0};renderMirror(0);renderResponse(0,0);animate(t=>{t.to($('#ss-formula'),{attr:{x:75,y:560},scale:.82,transformOrigin:'left center',duration:.8});t.to(v,{d:10,duration:4,ease:'none',onUpdate(){renderMirror(v.d/2);renderResponse(v.d,v.d/10);}},.8);});note('同一条 OPD 轴上，3000 cm⁻¹ 的起伏比 1000 cm⁻¹ 快三倍。');}
    }
    // Draw all samples in the visible OPD window; calculations always use the full record.
    function seriesPath(record,lo=-80,hi=80,amp=175,baseline=220,width=1280,portion=1){
      const max=record.kind==='density'?data.maxI:2,cut=lo+(hi-lo)*clamp(portion),pts=[];
      record.xs.forEach((x,i)=>{const u=x*1e4;if(u>=lo&&u<=cut)pts.push([(u-lo)/(hi-lo)*width,baseline-record.ys[i]/max*amp]);});return ptPath(pts);
    }
    function recordDisplayPath(rec,mix=1,portion=1){
      const max=rec.kind==='density'?data.maxI:rec.lines.reduce((n,l)=>n+l.weight,0),cut=-80+160*clamp(portion),pts=[];
      rec.xs.forEach((x,i)=>{const u=x*1e4;if(u<-80||u>cut)return;const normalized=rec.ys[i]/max;
        const rawY=265-normalized*120,acY=220-normalized*120;pts.push([(u+80)/160*1280,lerp(rawY,acY,mix)]);
      });return ptPath(pts);
    }
    function setRecordChrome(mode){
      const acMode=mode==='ac';root.dataset.signal=mode;
      attr($('#ss-record-axis'),{d:`M0 ${acMode?220:385}H1280`});
      show($('#ss-record-dc'),acMode?0:1);show($('#ss-dc-label'),acMode?0:1);show($('#ss-record-zpd'),0);show($('#ss-record-wings'),0);
      text('#ss-record-title',acMode?'只留下读数的起伏':'从一个读数，到一条记录');
      text('#ss-record-quantity',acMode?'交流信号 / 相对单位':'探测功率 / 相对单位（始终 ≥ 0）');
      attr($('#ss-record-y-label'),{y:acMode?245:382});
    }
    function recordShape(rec,mode='ac',portion=1){
      currentRecord=rec;setRecordChrome(mode);recordPath.setAttribute('d',recordDisplayPath(rec,mode==='ac'?1:0,portion));
      recordPath.dataset.recordId=rec.id;root.dataset.recordId=rec.id;
      const u=-80+160*clamp(portion),index=clamp(Math.round((u*1e-4-rec.xs[0])/rec.h),0,rec.n-1),normalized=rec.ys[index]/(rec.kind==='density'?data.maxI:rec.lines.reduce((n,l)=>n+l.weight,0));
      const y=(mode==='ac'?220-normalized*120:265-normalized*120),x=1280*clamp(portion);
      attr($('#ss-record-cursor'),{d:`M${x} 70V385`});attr($('#ss-record-dot'),{cx:x,cy:y});
      show($('#ss-record-cursor'),portion<1?1:0);show($('#ss-record-dot'),portion<1?1:0);
    }
    function components(count,p=1,activeIndex=count-1){
      const group=$('#ss-component-curves');group.replaceChildren();
      for(let j=0;j<count;j++){
        const {wn,weight}=lines[j],base=170+j*95,color=[C.amber,C.teal,C.indigo][j];
        const pts=Array.from({length:501},(_,i)=>{const d=-10+i*.04;return [300+i/500*1060,base-Math.cos(2*Math.PI*wn*d*1e-4)*weight*37*(j===count-1?p:1)];});
        el('path',{d:`M300 ${base}H1360`,class:'axis'},group);
        el('path',{d:ptPath(pts),class:`curve ss-component-${j}`,style:`stroke:${color};stroke-width:3.5`},group);
        const name=el('text',{x:80,y:base+7,class:'label'},group);name.textContent=`${wn} cm⁻¹`;
      }
      const after=data.discrete[count-1],before=count>1?data.discrete[count-2]:null;
      // Analytic samples of the exact same discrete-line model; zooming must not
      // turn a sinusoid into coarse line segments or change its weights.
      const pts=Array.from({length:1001},(_,i)=>{const d=(-10+i*.02)*1e-4,y=lines.slice(0,count).reduce((s,l,j)=>s+l.weight*Math.cos(2*Math.PI*l.wn*d)*(j===count-1?p:1),0);return [300+i/1000*1060,510-y*38];});
      el('path',{d:ptPath(pts),class:'curve',style:'stroke-width:5'},group);const sum=el('text',{x:80,y:517,class:'label blue'},group);sum.textContent='相加后的记录';
      const axis=el('text',{x:830,y:600,'text-anchor':'middle',class:'label'},group);axis.textContent='光程差 δ / μm';
      [-10,0,10].forEach((v,i)=>{const tick=el('text',{x:300+i*530,y:560,'text-anchor':'middle'},group);tick.textContent=v;});
      text('#ss-component-label',`${count} 个离散分量 · 相同纵轴比例`);
    }
    function sumProgress(count,p){
      const before=count===1?null:data.discrete[count-2],after=data.discrete[count-1];
      const rec={...after,ys:after.ys.map((y,i)=>(before?before.ys[i]:0)*(1-p)+y*p)};recordShape(rec);components(count,p,count-1);
    }
    function toInterferogram(){
      show(recordBox,1);recordBox.classList.remove('compact');recordPath.style.opacity=1;recordShape(data.discrete[0],'raw',0);
      const v={p:0};animate(t=>{
        t.to(layer('optics'),{opacity:.14,duration:.7},0);t.to(layer('response'),{opacity:0,duration:.7},0);
        t.to(v,{p:1,duration:3.8,ease:'none',onUpdate(){recordShape(data.discrete[0],'raw',v.p);}},.25);
      },()=>{show(layer('optics'),0);show(layer('response'),0);recordShape(data.discrete[0],'raw',1);scene=4;beat=0;label();note('先用单一波数看清记录过程：横轴是光程差，每个位置写下一个功率读数。');});
    }
    function interferogramBeat(){
       if(beat===1){
         const v={p:0};show($('#ss-record-cursor'),0);show($('#ss-record-dot'),0);
         animate(t=>t.to(v,{p:1,duration:1.8,onUpdate(){recordPath.setAttribute('d',recordDisplayPath(data.discrete[0],v.p));attr($('#ss-record-axis'),{d:`M0 ${lerp(385,220,v.p)}H1280`});attr($('#ss-record-y-label'),{y:lerp(382,245,v.p)});$('#ss-record-dc').style.opacity=1-v.p;$('#ss-dc-label').style.opacity=1-v.p;}}),()=>recordShape(data.discrete[0],'ac',1));
         note('减去恒定基线，留下交流起伏。负值表示低于基线，功率本身没有变成负数。');
       }
       if(beat===2){show(recordBox,0);show(layer('components'),1);components(1,1,0);text('#ss-component-title','先看一种节奏');note('放大到 −10 至 10 μm：上方是一个波数的贡献，下方是探测器留下的交流记录。');}
       if(beat===3||beat===4){const n=beat-1,v={p:0};text('#ss-component-title',n===2?'加上第二种节奏':'再加上第三种节奏');animate(t=>t.to(v,{p:1,duration:1.5,onUpdate(){components(n,v.p);}}));note(n===2?'先在同一光程差处相加；下方同时保留了两种节奏。':'三个贡献仍只写成一条记录；复杂起伏就这样一步步出现。');}
       if(beat===5){show(layer('components'),0);show(recordBox,1);recordShape(data.broad,'ac',0);text('#ss-record-title','现在换成连续的宽带光');const v={p:0};animate(t=>t.to(v,{p:1,duration:2.6,ease:'none',onUpdate(){recordShape(data.broad,'ac',v.p);text('#ss-record-title','现在换成连续的宽带光');}}));note('宽带光包含连续分布的许多波数；这次把观察范围扩大到 −80 至 80 μm。');}
       if(beat===6){recordShape(data.broad,'ac',1);text('#ss-record-title','宽带干涉图');show($('#ss-record-zpd'),1);gsap.set($('#ss-record-zpd'),{opacity:0});animate(t=>t.to($('#ss-record-zpd'),{opacity:1,duration:.8}));note('此时各个分量在零点取最大正贡献，叠加最强。');}
       if(beat===7){recordShape(data.broad,'ac',1);text('#ss-record-title','宽带干涉图');show($('#ss-record-zpd'),1);show($('#ss-record-wings'),1);gsap.set($('#ss-record-wings'),{opacity:0});animate(t=>t.to($('#ss-record-wings'),{opacity:1,duration:.9}));note('离开零光程差，不同节奏逐渐错开，正负贡献大多抵消，记录变弱。');}
    }
    function projectionPath(xs,ys,baseline,amp=90,lo=-80,hi=80){
      const points=[];for(let i=0;i<xs.length;i++){const d=xs[i]*1e4;if(d<lo||d>hi)continue;points.push([(d-lo)/(hi-lo)*1160+140,baseline-(ys[i]||0)*amp]);}return ptPath(points);
    }
    function projectionProductPath(values,positive,baseline,amp=90){
      const xs=currentRecord.xs;let d='',open=false;for(let i=0;i<values.length;i++){const delta=xs[i]*1e4;if(delta<-80||delta>80)continue;const value=values[i];if((positive&&value<0)||(!positive&&value>=0)){open=false;continue;}const x=(delta+80)/160*1160+140,y=baseline-value*amp;d+=`${open?'L':'M'}${x.toFixed(3)},${y.toFixed(3)} `;open=true;}return d.trim();
    }
    function renderProjection(wn=2200,showProduct=false){
      const r=window.FTIRPhysics.projection(currentRecord,wn),max=Math.max(...currentRecord.ys.map(Math.abs))||1;
      const normalized=currentRecord.ys.map(y=>y/max),template=currentRecord.xs.map(x=>Math.cos(2*Math.PI*wn*x));
      const product=r.product.map(y=>y/(max||1));
      attr($('#ss-proj-record'),{d:projectionPath(currentRecord.xs,normalized,235,72)});
      attr($('#ss-proj-template'),{d:projectionPath(currentRecord.xs,template,235,72)});
      attr($('#ss-proj-product'),{d:projectionPath(currentRecord.xs,product,405,105,-80,80)});
      attr($('#ss-proj-positive'),{d:projectionProductPath(product,true,405,105)});
      attr($('#ss-proj-negative'),{d:projectionProductPath(product,false,405,105)});
      attr($('#ss-proj-cursor'),{d:`M720 120V500`});
      attr($('#ss-proj-sum'),{d:`M720 490V${490-clamp(Math.abs(r.value)/(data.maxB||1),0,1)*250}`});
      text('#ss-proj-candidate',`候选 ${Math.round(wn)} cm⁻¹`);root.dataset.projectionRecordId=currentRecord.id;root.dataset.projectionCandidate=wn;root.dataset.projectionValue=r.value;
      $('#ss-proj-product').style.opacity=showProduct?1:0;$('#ss-proj-positive').style.opacity=0;$('#ss-proj-negative').style.opacity=0;$('#ss-proj-sum').style.opacity=showProduct?1:0;
      return r;
    }
    function setSpectrumPanel(mode='large'){
      const panel=$('#ss-spectrum-panel');
      if(mode==='final')panel.setAttribute('transform','translate(500 35) scale(.62)');
      else panel.removeAttribute('transform');
    }
    function enterFourier(animated=true){
      recordShape(currentRecord);resetN5Visuals('record');recordPath.style.opacity=1;
      const spectrum=window.FTIRPhysics.transform(currentRecord);data.spectrum=spectrum;
      $('#ss-spectrum').setAttribute('d',ptPath(spectrum.wn.map((w,i)=>[140+(4000-w)/3600*1160,515-spectrum.values[i]/data.maxB*330]).reverse()));
      attr($('#ss-spectrum-clip rect'),{x:140,y:100,width:0,height:440});setSpectrumPanel('large');
      [1000,3000].forEach((wn,j)=>attr($(j?'#ss-reminder-fast':'#ss-reminder-slow'),{d:ptPath(Array.from({length:241},(_,i)=>[400+i/240*900,(j?430:250)-65*Math.cos(2*Math.PI*wn*i/240*10*1e-4)]))}));
      const finish=()=>{scene=5;beat=0;root.dataset.fourierRecordId=currentRecord.id;label();note('记录保持不变；接下来把其中混合的节奏整理成波数谱。');};
      if(animated){animate(t=>t.to(recordBox,{opacity:1,duration:.2}),finish);}else finish();
    }
    let woundPath=null,sourceCopy=null;
    function resetN5Visuals(mode){
      if(woundPath){recordBox.querySelector('svg').append(recordPath);sourceCopy?.remove();woundPath=null;sourceCopy=null;recordPath.classList.remove('wound');}
      recordBox.classList.remove('compact');gsap.set(recordBox,{clearProps:'transform,opacity'});gsap.set(recordPath,{clearProps:'transform,opacity'});
      show(layer('components'),0);show(layer('projection'),mode==='projection'?1:0);show(layer('fourier'),mode==='spectrum'?1:0);show(recordBox,mode==='record'?1:0);show($('#ss-equation'),0);
      ['#ss-projection-title','#ss-proj-overlay-label','#ss-proj-product-label','#ss-proj-axis','#ss-proj-baseline','#ss-proj-record','#ss-proj-template','#ss-proj-product','#ss-proj-positive','#ss-proj-negative','#ss-proj-cursor','#ss-proj-sum','#ss-proj-candidate','#ss-proj-status','#ss-proj-compare','#ss-proj-cumulative'].forEach(s=>show($(s),0));
      $('#ss-proj-record').style.opacity='.72';$('#ss-proj-template').style.opacity='.8';$('#ss-proj-positive').style.opacity='1';$('#ss-proj-negative').style.opacity='1';$('#ss-proj-compare').style.opacity='1';
      ['#ss-rhythm-reminder','#ss-winding-focus','#ss-vector','#ss-net','#ss-phase','#ss-wound-point','#ss-probe-label','#ss-response-label','#ss-sample-link','#ss-source-point','#ss-spectrum-panel','#ss-spectrum','#ss-spec-cursor','#ss-match-bar'].forEach(s=>show($(s),0));
      setSpectrumPanel('large');
      if(mode==='spectrum'){show($('#ss-spectrum-panel'),1);show($('#ss-spectrum'),1);}
    }
    function ensureWinding(){
      if(woundPath)return;
      // Keep the very same SVG path that carried the N5 interferogram.
      sourceCopy=recordPath.cloneNode(true);sourceCopy.removeAttribute('id');recordPath.parentNode.insertBefore(sourceCopy,recordPath);
      svg.insertBefore(recordPath,layer('fourier'));woundPath=recordPath;woundPath.classList.add('wound');
    }
    function woundCoordinates(wn,morph=1){
      const pts=[];
      currentRecord.xs.forEach((delta,i)=>{if(Math.abs(delta*1e4)>80)return;const y=currentRecord.ys[i]/data.maxI,a=-2*Math.PI*wn*delta;
        const from=[30+(delta*1e4+80)/160*560,17+(220-y*175)/440*192.5],to=[665+y*Math.cos(a)*205,365-y*Math.sin(a)*205];pts.push([lerp(from[0],to[0],morph),lerp(from[1],to[1],morph)]);});return pts;
    }
    function renderFourier(cursor=scan,morph=1){
      const r=complex(currentRecord,probe);root.dataset.probe=probe.toFixed(2);root.dataset.netRe=r.re;root.dataset.netIm=r.im;
      if(woundPath)woundPath.setAttribute('d',ptPath(woundCoordinates(probe,morph)));
      const vx=665+r.re/data.maxB*180,vy=365-r.im/data.maxB*180;attr($('#ss-vector'),{d:`M665 365L${vx} ${vy}`});attr($('#ss-net'),{cx:vx,cy:vy});
      const d=lerp(-80,80,cursor)*1e-4,index=clamp(Math.round(d/currentRecord.h+currentRecord.n/2),0,currentRecord.n-1),y=currentRecord.ys[index]/data.maxI,phase=-2*Math.PI*probe*currentRecord.xs[index];
      const px=665+205*y*Math.cos(phase),py=365-205*y*Math.sin(phase);attr($('#ss-phase'),{d:`M665 365L${665+70*Math.cos(phase)} ${365-70*Math.sin(phase)}`});attr($('#ss-wound-point'),{cx:px,cy:py});
      const sx=30+cursor*560,sy=17+(220-y*175)/440*192.5;attr($('#ss-source-point'),{cx:sx,cy:sy});attr($('#ss-sample-link'),{d:`M${sx} ${sy}L${px} ${py}`});
      const specX=140+(4000-probe)/3600*1160;attr($('#ss-spec-cursor'),{d:`M${specX} 125V515`});attr($('#ss-match-bar'),{d:`M${specX} 515V${515-r.re/data.maxB*330}`});
      text('#ss-probe-label',`${Math.round(probe)} cm⁻¹`);text('#ss-response-label',`净响应 ${r.re.toFixed(3)}`);$('#ss-probe-value').value=Math.round(probe);$('#ss-probe').value=Math.round(probe);
    }
    function fourierBeat(){
       if(beat===1){
         resetN5Visuals('spectrum');show($('#ss-spectrum-panel'),0);show($('#ss-rhythm-reminder'),1);
         note('回想单波数实验：起伏的快慢由波数决定。反过来，快慢也就成了找回波数的线索。');
       }
       if(beat===2){
         resetN5Visuals('spectrum');show($('#ss-spectrum-panel'),1);show($('#ss-spectrum'),1);attr($('#ss-spectrum-clip rect'),{x:140,y:100,width:0,height:440});
         const v={p:0};animate(t=>t.to(v,{p:1,duration:2.8,ease:'none',onUpdate(){attr($('#ss-spectrum-clip rect'),{width:v.p*1160});}},0));note('对刚才的整条宽带记录计算，得到每个波数的贡献；横轴现在换成了波数。');
       }
       if(beat===3){
         resetN5Visuals('spectrum');attr($('#ss-spectrum-clip rect'),{x:140,y:100,width:1160,height:440});show($('#ss-spectrum-panel'),1);show($('#ss-spectrum'),1);show($('#ss-rhythm-reminder'),0);
         text('#ss-eq-cos','傅里叶变换');show($('#ss-equation'),1);
         note('原先混在一起的起伏，现在按波数展开，各自的强弱也能读出了。');
       }
       if(beat===4){
         resetN5Visuals('spectrum');attr($('#ss-spectrum-clip rect'),{x:140,y:100,width:1160,height:440});show($('#ss-spectrum-panel'),1);show($('#ss-spectrum'),1);show($('#ss-equation'),1);text('#ss-eq-cos','单光束谱');
         note('这还包含光源和仪器的响应。要知道样品吸收了多少，需要再测一次背景。');
       }
    }
    function axisY(max,label){text('#ss-y-label',label);$('#ss-y-ticks').replaceChildren();[0,.5,1].forEach(f=>{const n=el('text',{x:75,y:520-f*400,'text-anchor':'end'},$('#ss-y-ticks'));n.textContent=(max*f).toFixed(max<1?2:1);});}
    [4000,3000,2000,1000,400].forEach(w=>{const n=el('text',{x:90+(4000-w)/3600*1270,y:550,'text-anchor':'middle'},$('#ss-x-ticks'));n.textContent=w;});
    const xLabel=el('text',{x:680,y:585,'text-anchor':'middle',class:'label'},$('#ss-x-ticks'));xLabel.textContent='波数 ν̃ / cm⁻¹';
    function spectrumPath(xs,ys,max=1,lo=400,hi=4000,x0=90,width=1270){let d='',open=false;xs.forEach((w,i)=>{if(w<lo||w>hi)return;if(ys[i]==null){open=false;return;}d+=`${open?'L':'M'}${(x0+(hi-w)/(hi-lo)*width).toFixed(2)},${(515-ys[i]/max*400).toFixed(2)} `;open=true;});return d;}
    function scanSpectrum(duration=3,done){const p=$('#ss-measured'),v={p:0};show($('#ss-measure-cursor'),1);animate(t=>{t.fromTo(p,{drawSVG:'0%'},{drawSVG:'100%',duration,ease:'none'},0);t.to(v,{p:1,duration,ease:'none',onUpdate(){attr($('#ss-main-clip rect'),{width:v.p*1270});const x=90+1270*v.p;attr($('#ss-measure-cursor'),{d:`M${x} 100V515`});}},0);},done);}
    function measurementSeries(){return {xs:[...data.bg.wn].reverse(),bg:[...data.bg.values].reverse(),sample:[...data.sample.values].reverse(),t:[...data.ratio.t].reverse(),a:[...data.ratio.a].reverse()};}
    function ratioPoint(){
      const s=measurementSeries(),targetWn=1715;let index=0;
      for(let i=1;i<s.xs.length;i++)if(Math.abs(s.xs[i]-targetWn)<Math.abs(s.xs[index]-targetWn))index=i;
      const wn=s.xs[index],b=s.bg[index],sample=s.sample[index],ratio=s.t[index],x=90+(4000-wn)/3600*1270,yB=515-b*400,yS=515-sample*400;
      attr($('#ss-ratio-line'),{d:`M${x} ${yB}V${yS}`});attr($('#ss-ratio-bg-dot'),{cx:x,cy:yB});attr($('#ss-ratio-sample-dot'),{cx:x,cy:yS});
      attr($('#ss-ratio-bg-value'),{x:x+18,y:yB-10});attr($('#ss-ratio-sample-value'),{x:x+18,y:yS+24});text('#ss-ratio-bg-value',`B背景 = ${b.toFixed(3)}`);text('#ss-ratio-sample-value',`B样品 = ${sample.toFixed(3)}`);
      root.dataset.ratioWavenumber=Math.round(wn);root.dataset.ratioValue=ratio;return {wn,b,sample,ratio};
    }
    function measurement(mode=0){
      show(layer('measurement'),1);const s=measurementSeries(),ys=mode===0?s.bg:mode===1?s.sample:mode===2?s.t:s.a,max=1;
      axisY(max,mode<2?'单光束响应（同一绝对尺度）':mode===2?'透射率 T':'吸光度 A');show($('#ss-measure-legend'),mode<2?1:0);show($('#ss-legend-bg'),mode<2?1:0);show($('#ss-legend-sample'),mode===1?1:0);show($('#ss-ratio-demo'),0);
      $('#ss-bg').style.opacity=mode===1?1:0;$('#ss-measured').style.opacity=1;$('#ss-measured').style.stroke=mode===0?C.ghost:C.sum;$('#ss-bg').setAttribute('d',mode===1?spectrumPath(s.xs,s.bg,max):'');$('#ss-measured').setAttribute('d',spectrumPath(s.xs,ys,max));show($('#ss-measure-cursor'),mode<2?1:0);
      text('#ss-measure-formula',mode===2?'T = B样品 / B背景':mode===3?'A = −log₁₀ T':'');show($('#ss-measure-formula'),mode>=2?1:0);text('#ss-data-label','合成教学测量 · 同一采样与处理条件 · 低背景区留空');
      attr($('#ss-main-clip rect'),{x:90,width:1270});root.dataset.measurementMode=mode;return {xs:s.xs,ys};
    }
    function measurementBeat(){
      if(beat===1){measurement(1);scanSpectrum(2.6);note('插入样品；背景与样品单光束谱在同一坐标、同一绝对尺度上叠加。');}
      if(beat===2){
        const s=measurementSeries(),point=ratioPoint(),v={p:0};measurement(1);ratioPoint();show($('#ss-measure-cursor'),0);show($('#ss-ratio-demo'),1);show($('#ss-measure-formula'),0);gsap.set($('#ss-ratio-demo'),{opacity:0});
        animate(t=>{t.to($('#ss-ratio-demo'),{opacity:1,duration:.65});t.to({}, {duration:.7});t.to([$('#ss-ratio-demo'),$('#ss-measure-legend'),$('#ss-bg')],{opacity:0,duration:.55});t.call(()=>axisY(1,'透射率 T'));t.to(v,{p:1,duration:1.35,onUpdate(){const vals=s.sample.map((y,i)=>s.t[i]===null?null:lerp(y,s.t[i],v.p));$('#ss-measured').setAttribute('d',spectrumPath(s.xs,vals));}});t.call(()=>{text('#ss-measure-formula','T = B样品 / B背景');show($('#ss-measure-formula'),1);});t.fromTo($('#ss-measure-formula'),{opacity:0},{opacity:1,duration:.55});},()=>{measurement(2);text('#ss-measure-formula','T = B样品 / B背景');});
        note('在每个相同波数处，用样品响应除以背景响应，得到透射率 T。');
      }
      if(beat===3){
        const s=measurementSeries(),v={p:0};measurement(2);show($('#ss-measure-formula'),1);animate(t=>{t.call(()=>axisY(1,'吸光度 A'));t.to(v,{p:1,duration:2.2,onUpdate(){const vals=s.t.map((y,i)=>y===null?null:lerp(y,s.a[i],v.p));$('#ss-measured').setAttribute('d',spectrumPath(s.xs,vals));}});t.call(()=>text('#ss-measure-formula','A(ν̃) = −log₁₀ T(ν̃)'));},()=>measurement(3));note('把透射率换成吸光度：透过的光越少，吸光度越大。');
      }
    }
    async function loadReference(name){
      const id=++requestId;stop();busy=true;$('#ss-open-lab').hidden=true;note('正在读取本地完整参考数据…');
      try {const response=await fetch(`./reference-data/processed/${name}.json`);if(!response.ok)throw Error(response.status);const json=await response.json();if(dead||id!==requestId)return;reference=json;refName=name;beat=0;show(layer('reference'),0);show($('#ss-ratio-demo'),0);show($('#ss-measure-legend'),0);show($('#ss-measure-formula'),0);$('#ss-bg').setAttribute('d','');$('#ss-sample').value=name;
        const inRange=json.x.map((w,i)=>[w,json.y[i]]).filter(p=>p[0]>=400&&p[0]<=4000);const max=Math.max(...inRange.map(p=>p[1]))*1.12;
        // Preserve every original sample in the displayed range; no stride decimation or fabricated peaks.
        $('#ss-measured').style.stroke=C.sum;$('#ss-measured').setAttribute('d',spectrumPath(inRange.map(p=>p[0]),inRange.map(p=>p[1]),max));axisY(max,'虚部折射率 k（无量纲）');text('#ss-measure-formula','');
        text('#ss-data-label',`PNNL · ${name==='polystyrene'?'液态苯乙烯低聚物':name==='acetone'?'丙酮（液体）':'乙醇（液体）'} · 原始采样 · k（无量纲）`);
        root.dataset.reference=name;root.dataset.referencePoints=json.x.length;root.dataset.displayPoints=inRange.length;root.dataset.yQuantity='k';scanSpectrum(3,()=>{$('#ss-open-lab').hidden=false;root.dataset.referenceStable='true';note('真实参考数据已稳定；可进入模拟实验室继续探索。');});note('真实光谱包含许多吸收带。先挑出一处，看看它与哪种振动有关。');
      }catch(err){busy=false;text('#ss-data-label','参考数据读取失败，请重试样品选择。');note(`无法读取本地参考谱：${err.message}`);}
    }
    function setReferenceStructure(name){
      const ids={acetone:'#ss-vib-acetone',ethanol:'#ss-vib-ethanol',polystyrene:'#ss-vib-aromatic'};Object.values(ids).forEach(id=>show($(id),0));show($(ids[name]),1);
    }
    function exploreBand(){
      if(!reference||busy)return;beat=1;show(layer('reference'),1);const wn=refName==='acetone'?1715.427229:refName==='ethanol'?3338.26435:1601.639269;
      const lo=wn-(refName==='ethanol'?480:230),hi=wn+(refName==='ethanol'?480:230),max=Math.max(...reference.y)*1.12;
      const v={p:0},markerStart=90+(4000-wn)/3600*1270,markerEnd=90+(hi-wn)/(hi-lo)*630;text('#ss-band-label',`${Math.round(wn)} cm⁻¹`);text('#ss-band-assignment',refName==='acetone'?'C=O 伸缩为主要贡献':refName==='ethanol'?'氢键展宽的 O–H 伸缩为主要贡献':'芳环骨架振动为主要贡献');setReferenceStructure(refName);
      attr($('#ss-band-marker'),{d:`M${markerStart} 100V515`});show($('#ss-mode-disclaimer'),1);gsap.set($('#ss-vibration'),{opacity:0,scale:1,transformOrigin:'center'});
      $('#ss-open-lab').hidden=true;animate(t=>{t.to(v,{p:1,duration:1.3,onUpdate(){const width=lerp(1270,630,v.p),markerX=lerp(markerStart,markerEnd,v.p);$('#ss-measured').setAttribute('d',spectrumPath(reference.x,reference.y,max,lerp(400,lo,v.p),lerp(4000,hi,v.p),90,width));attr($('#ss-band-marker'),{d:`M${markerX} 100V515`});}});t.to($('#ss-vibration'),{opacity:1,duration:.7},.65);},()=>{text('#ss-data-label',`真实参考光谱 · REAL REFERENCE SPECTRUM · PNNL · 局部 ${Math.round(hi)} → ${Math.round(lo)} cm⁻¹ · y：k（无量纲）`);$('#ss-open-lab').hidden=false;});
      // Local axis replaces full-range tick labels; the measured samples are unchanged.
      $$('#ss-x-ticks text').forEach(n=>show(n,0));[hi,(hi+lo)/2,lo].forEach((w,i)=>{const n=el('text',{x:90+i*315,y:550,'text-anchor':'middle','data-local':'1'},$('#ss-x-ticks'));n.textContent=Math.round(w);});const localLabel=el('text',{x:405,y:585,'text-anchor':'middle',class:'label','data-local':'1'},$('#ss-x-ticks'));localLabel.textContent='波数 ν̃ / cm⁻¹';note('主要贡献示意，不代表一峰对应一根键。');
    }
    function clearLayers(){['optics','response','components','projection','fourier','measurement','reference'].forEach(n=>show(layer(n),0));show(model,0);show(recordBox,0);show($('#ss-equation'),0);$('.science-controls').hidden=true;$('.reference-controls').hidden=true;$('#ss-open-lab').hidden=true;root.dataset.referenceStable='false';}
    function init(s=scene){
      stop();scene=s;beat=0;clearLayers();layer('optics').removeAttribute('transform');svg.setAttribute('viewBox','0 0 1440 640');root.dataset.recordId='';currentRecord=data.broad;
      if(woundPath){recordBox.querySelector('svg').append(recordPath);sourceCopy?.remove();woundPath=null;sourceCopy=null;recordPath.classList.remove('wound');}
      gsap.set([recordBox,layer('components'),$('#ss-winding-focus')],{clearProps:'transform'});gsap.set(recordPath,{clearProps:'transform,opacity'});recordBox.classList.remove('compact');
      show($('#ss-parts'),1);show($('#ss-labels'),1);['#ss-extra-out','#ss-extra-back','#ss-dx1','#ss-dx2','#ss-opd-name','#ss-formula','#ss-pulse-a','#ss-pulse-b','#ss-zpd','#ss-zpd-label'].forEach(s=>show($(s),0));attr($('#ss-formula'),{x:900,y:320});gsap.set($('#ss-formula'),{clearProps:'transform'});
      $$('[data-local]').forEach(n=>n.remove());$$('#ss-x-ticks text').forEach(n=>show(n,1));Object.entries(paths).forEach(([n,p])=>p.setAttribute('marker-end',pathMarkers[n]));
      if(scene===2){initInstrument();show(model,instrument?1:0);instrument?.setCameraPose(poseOverview);instrument?.setHotspotsVisible(['source','splitter','sample','detector']);show(layer('optics'),instrument?0:1);geo=structuredClone(target);drawGeometry();if(!instrument)layer('optics').setAttribute('transform','translate(400 0)');guide('一束宽带光的旅程','',[],["光源","→","分束器","→","样品室","→","探测器"]);note('先认出四个位置：光源、分束器、样品室、探测器。');}
      if(scene===3){show(layer('optics'),1);renderMirror(0);show($('#ss-assumption'),1);Object.values(paths).forEach(p=>gsap.set(p,{drawSVG:'100%'}));note('两臂等长；动镜尚未移动。');}
      if(scene===4){show(recordBox,1);recordShape(data.discrete[0],'raw',0);const v={p:0};animate(t=>t.to(v,{p:1,duration:3.5,ease:'none',onUpdate(){recordShape(data.discrete[0],'raw',v.p);}}));note('先用 1000 cm⁻¹ 看清记录：横轴是光程差；每移动到一个位置，写下一个功率读数。');}
      if(scene===5){show(recordBox,1);enterFourier(false);guide('同一条记录，换一种读法','前面见过的快慢节奏，将在整条记录里逐一统计。',[],['记录','→','节奏','→','波数']);note('同一条宽带记录留在这里，下一步把其中的节奏分开。');}
      if(scene===6){measurement(0);scanSpectrum();note('先记录背景单光束谱。');}
      if(scene===7){show(layer('measurement'),1);axisY(1,'吸光度 A → 虚部折射率 k');$('.reference-controls').hidden=false;loadReference('acetone');}
      label();
    }
    function advance(){
      if(dead||document.hidden)return true;
      if(suspended){suspended=false;timeline?.resume();return true;}if(busy)return true;
      if(scene===2){beat++;label();if(beat===1){guide('分束器把光分成两路','上臂到固定镜，侧臂到动镜；两面镜的角色不同。',[['固定镜','不移动'],['动镜','改变光程差']],["分束器","↗","固定镜","↘","重合"]);replayOptics();}if(beat===2){show(layer('optics'),instrument?0:1);instrument?.setHotspotLabels({splitter:{zh:'分束器'},fixed:{zh:'固定镜'},moving:{zh:'动镜'}});instrument?.setHotspotsVisible(['splitter','fixed','moving']);camera(poseFocus);guide('干涉仪的三个核心部件','',[['分束器','把光分两路'],['固定镜','留在原位'],['动镜','改变路程']],["分束器","→","固定镜 + 动镜"]);note('两路返回后会再次相遇；接下来观察它们怎样重合。');}if(beat===3){camera(poseTop);guide('两条光臂，在这里相遇','',[],["去程","↗↘","回程","→","探测器"]);note('光从分束器出发，沿两个臂反射回来，最后重新汇合。');}if(beat===4){guide('现在让光走一遍','看颜色怎样标出方向：去程、回程、合束后。',[['去程','琥珀色'],['回程','蓝色'],['合束后','青绿色']],["光源","→","分束器","↗↘","两面镜","→","探测器"]);replayOptics();}if(beat===5)opticalHandoff();return true;}
      if(scene===3){if(beat<5){beat++;label();mirrorBeat();}else toInterferogram();return true;}
      if(scene===4){if(beat<7){beat++;label();interferogramBeat();}else enterFourier();return true;}
      if(scene===5){if(beat<4){beat++;label();fourierBeat();}else init(6);return true;}
      if(scene===6){if(beat<3){beat++;label();measurementBeat();}else{init(7);}return true;}
      if(scene===7)return false;
      return false;
    }
    function restoreMeasurement(b){
      init(6);stop();scene=6;beat=clamp(b,0,3);measurement(beat);attr($('#ss-measure-cursor'),{d:'M1360 100V515'});
      if(beat===2){const point=ratioPoint();text('#ss-measure-formula','T = B样品 / B背景');note('在每个相同波数处，用样品响应除以背景响应，得到透射率 T。');}
      else if(beat===3)note('把透射率换成吸光度：透过的光越少，吸光度越大。');
      else if(beat===1)note('背景与样品单光束谱在同一坐标、同一绝对尺度上叠加。');
      else note('先记录背景单光束谱。');
      label();
    }
    function restore(s,b){if(s===6){restoreMeasurement(b);return;}init(s);if(s===7)return;const saved=reduced(); // seek the same real timelines, not a second fake renderer
      if(timeline)timeline.progress(1);for(let i=0;i<b;i++){advance();if(timeline)timeline.progress(1);}
    }
    function prev(){if(busy||suspended)return true;if(beat>0){restore(scene,beat-1);return true;}if(scene>2){const previous=scene-1;restore(previous,({2:4,3:5,4:7,5:4,6:3})[previous]||0);return true;}return false;}
    document.addEventListener('visibilitychange',()=>{if(document.hidden)suspendMotion();}, {signal:ac.signal});
    $('#ss-probe').addEventListener('input',e=>{if(busy)return;probe=+e.target.value;ensureWinding();show($('#ss-vector'),1);show($('#ss-net'),1);renderFourier(.5);note('拖动候选波数，观察同一记录的净响应。');},{signal:ac.signal});
    $('#ss-probe').addEventListener('change',e=>{const near=[1000,1700,2200,3000].find(w=>Math.abs(w-probe)<20);if(near){probe=near;renderFourier(.5);}},{signal:ac.signal});
    $('#ss-sample').addEventListener('change',e=>{$$('[data-local]').forEach(n=>n.remove());$$('#ss-x-ticks text').forEach(n=>show(n,1));loadReference(e.target.value);},{signal:ac.signal});
    $('#ss-band').addEventListener('click',exploreBand,{signal:ac.signal});
    $('#ss-open-lab').addEventListener('click',e=>{e.stopPropagation();root.dispatchEvent(new CustomEvent('ftir:open-simulation-lab',{bubbles:true,detail:{source:'scientific-stage',scene:7,reference:refName}}));},{signal:ac.signal});
    init();
    return {mount(){},nextBeat:advance,prevBeat:prev,isBusy:()=>busy,suspendMotion,resumeMotion,cancelMotion:stop,jumpToEnd(){},reset(){init(scene);},getState:()=>({scene,beat,busy,suspended,probe,mirror,recordId:root.dataset.recordId,reference:refName}),
      seekProgress(p){timeline?.progress(p);},dispose(){dead=true;requestId++;stop();ac.abort();instrument?.dispose();root.remove();}};
  }
  window.FTIRScientificStage={mount,records,complex,MOTION};
})();
