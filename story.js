/* ==========================================================================
   FTIR Unified Presentation Theater Engine (1600 × 900 Fixed 16:9 Theater)
   Ivory Paper & Navy/Gold Scientific Visual-First Storytelling Style
   ========================================================================== */

(function(){
  'use strict';

  let state = {
    slide: 0,
    beat: 0
  };

  window.resetFTIRStory = () => {
    state.slide = 0;
    state.beat = 0;
  };

  window.mountFTIRStory = function(host, { chart, go }){
    let dead = false;
    let activeScene = null;
    let instrumentInstance = null;
    let isTransitioning = false;
    let suspended = false;

    // Master 16:9 theater shell - minimalist, visual-first, Chinese-dominant
    host.innerHTML = `
      <div class="theater-viewport">
        <main class="theater-stage" tabindex="-1">
          <header class="theater-header">
            <div class="theater-kicker">
              <div class="theater-kicker-left">
                <span id="thBadge">01 · 分子振动</span>
              </div>
              <button class="theater-exit-btn" id="thExit" title="返回主页">✕ 退出</button>
            </div>
            <h1 class="theater-title" id="thTitle">为什么有些分子振动能吸收红外？</h1>
          </header>

          <section class="theater-visual" id="thVisual"></section>

          <nav class="theater-footer" id="thFooter" aria-label="教学核心结论">
            <div class="theater-takeaway-wrap">
              <p class="theater-takeaway" id="thTakeaway" aria-live="polite"></p>
            </div>
            <div class="theater-aux-nav">
              <button id="thPrev" class="theater-btn-back" title="回退上一步">← 上一步</button>
              <div class="theater-hint-next" id="thNextPrompt" role="button" tabindex="0">点击画面继续 <span>→</span></div>
            </div>
          </nav>
        </main>
      </div>
    `;

    const stage = host.querySelector('.theater-stage');
    const badge = host.querySelector('#thBadge');
    const title = host.querySelector('#thTitle');
    const visual = host.querySelector('#thVisual');
    const takeaway = host.querySelector('#thTakeaway');
    const prevBtn = host.querySelector('#thPrev');
    const nextPrompt = host.querySelector('#thNextPrompt');
    const exitBtn = host.querySelector('#thExit');

    // Letterbox responsive containment (fixed 1600 × 900)
    function resize(){
      if(!stage || dead) return;
      const scale = Math.max(0.01, Math.min(window.innerWidth / 1600, window.innerHeight / 900));
      stage.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }
    window.addEventListener('resize', resize);
    resize();

    // =========================================================================
    // P0: SHARED MOTION GRAMMAR & ANIMATION DRIVER
    // =========================================================================
    const Motion = {
      tokens: { micro:.42, reveal:.7, physical:1.6, camera:1.35, transform:1.15, settle:.9, hero:2.0 },
      cameraEase: 'ftirScientific',
      drawPath(el, duration=1.6){
        if(!el) return null;
        if(window.gsap && window.DrawSVGPlugin) {
          return gsap.fromTo(el, {drawSVG:'0%'}, {drawSVG:'100%',duration,ease:'none'});
        }
        el.setAttribute('pathLength','1'); el.style.strokeDasharray='1'; el.style.strokeDashoffset='1';
        return window.gsap ? gsap.to(el,{strokeDashoffset:0,duration,ease:'none'}) : (el.style.strokeDashoffset='0',null);
      },
      reveal(el, vars = {}) {
        if(!el) return null;
        if(window.gsap) {
          return gsap.fromTo(el, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: Motion.tokens.reveal, ease: 'power2.out', ...vars });
        }
        el.style.opacity = '1';
        el.style.transform = 'none';
        return null;
      },
      focus(activeEl, dimmedEls, vars = {}) {
        if(window.gsap) {
          if(activeEl) gsap.to(activeEl, { opacity: 1, duration: 0.4, ease: 'power1.out', ...vars });
          if(dimmedEls && dimmedEls.length) {
            gsap.to(dimmedEls, { opacity: 0.28, duration: 0.4, ease: 'power1.out', ...vars });
          }
        }
      },
      killTweens(target = '*') {
        if(window.gsap) gsap.killTweensOf(target);
      }
    };

    // Slide Metadata (Topics & Short Questions)
    const SLIDES = [
      { num: '01', kicker: '01 · 分子振动', title: '为什么有些分子振动能吸收红外？' },
      { num: '02', kicker: '02 · 探测难题', title: '一个总读数够吗？' },
      { num: '03', kicker: '03 · 仪器与光路', title: 'FTIR 仪器怎样把光路送入干涉仪？' },
      { num: '04', kicker: '04 · 迈克尔逊编码', title: '动镜如何把波数编码为光程差？' },
      { num: '05', kicker: '05 · 干涉图合成', title: '为什么会形成中心突峰与衰减？' },
      { num: '06', kicker: '06 · 傅里叶变换', title: '怎样从复杂干涉图中找回各个波数？' },
      { num: '07', kicker: '07 · 背景参比', title: '为什么需要背景测量与比值计算？' },
      { num: '08', kicker: '08 · 真实光谱', title: '真实世界的红外光谱指纹' },
      { num: '09', kicker: '09 · 分子线索', title: '为什么光谱能提供分子线索？' }
    ];

    // =========================================================================
    // SCENE 01 · ONE CO2 MOLECULE, ONE CAUSAL THREAD
    // =========================================================================
    function createScene01(){
      let beat = 0;
      let timeline = null;
      let busy = false;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

      function renderVisual(){
        visual.innerHTML = `
          <div class="n1-continuous">
            <svg viewBox="0 0 1440 620" role="img" aria-label="同一个二氧化碳分子从对称伸缩切换到反对称伸缩，并与红外电场交换能量">
              <defs>
                <marker id="n1ArrowBlue" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#1d5b94"/></marker>
                <marker id="n1ArrowGold" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#c47c2b"/></marker>
              </defs>

              <g id="n1-field">
                <text x="90" y="105" class="n1-eyebrow">入射 IR 电场 E(t)</text>
                <path id="n1-wave" d="M90 250 C135 145 180 355 225 250 S315 145 360 250 S450 355 495 250" fill="none" stroke="#c47c2b" stroke-width="5" stroke-linecap="round"/>
                <path d="M100 292 H475" stroke="#d9d2c6" stroke-width="2" stroke-dasharray="7 8" marker-end="url(#n1ArrowGold)"/>
                <text x="285" y="326" class="n1-small" text-anchor="middle">电场随时间交替</text>
              </g>

              <g id="n1-molecule">
                <text id="n1-mode" x="900" y="105" class="n1-mode" text-anchor="middle">先观察同一个 CO₂ 分子</text>
                <line x1="610" y1="300" x2="1190" y2="300" stroke="#ddd6ca" stroke-width="2" stroke-dasharray="7 9"/>
                <line id="n1-bond-l" x1="900" y1="300" x2="720" y2="300" stroke="#738491" stroke-width="12" stroke-linecap="round"/>
                <line id="n1-bond-r" x1="900" y1="300" x2="1080" y2="300" stroke="#738491" stroke-width="12" stroke-linecap="round"/>
                <circle id="n1-o-l" cx="720" cy="300" r="43" fill="#bd4a3c"/>
                <circle id="n1-c" cx="900" cy="300" r="39" fill="#243746"/>
                <circle id="n1-o-r" cx="1080" cy="300" r="43" fill="#bd4a3c"/>
                <text id="n1-o-l-t" x="720" y="311" class="n1-atom">O</text>
                <text id="n1-c-t" x="900" y="311" class="n1-atom">C</text>
                <text id="n1-o-r-t" x="1080" y="311" class="n1-atom">O</text>

                <g id="n1-motion-arrows">
                  <line id="n1-move-l" x1="720" y1="390" x2="655" y2="390" class="n1-motion" marker-end="url(#n1ArrowBlue)"/>
                  <line id="n1-move-r" x1="1080" y1="390" x2="1145" y2="390" class="n1-motion" marker-end="url(#n1ArrowBlue)"/>
                  <text x="900" y="425" class="n1-small" text-anchor="middle">原子位移示意（方向与相位）</text>
                </g>
                <g id="n1-bond-dipoles">
                  <line x1="850" y1="225" x2="748" y2="225" class="n1-dipole" marker-end="url(#n1ArrowGold)"/>
                  <line x1="950" y1="225" x2="1052" y2="225" class="n1-dipole" marker-end="url(#n1ArrowGold)"/>
                  <text x="900" y="195" class="n1-small" text-anchor="middle">两侧键偶极变化</text>
                </g>
                <g id="n1-net-dipole">
                  <line id="n1-net-dipole-line" x1="900" y1="190" x2="900" y2="190" stroke="#1d5b94" stroke-width="6" marker-end="url(#n1ArrowBlue)"/>
                  <text x="900" y="158" class="n1-small n1-blue" text-anchor="middle">净偶极矩随时间变化</text>
                </g>
              </g>

              <g id="n1-energy-path">
                <path d="M505 300 C590 220 640 220 700 270" fill="none" stroke="#c47c2b" stroke-width="4" stroke-dasharray="8 10" marker-end="url(#n1ArrowGold)"/>
                <text x="603" y="205" class="n1-small n1-gold" text-anchor="middle">节奏匹配 · 能量转入振动</text>
              </g>

              <g id="n1-result">
                <text id="n1-dmu" x="900" y="492" class="n1-result" text-anchor="middle"></text>
                <text id="n1-status" x="900" y="535" class="n1-status" text-anchor="middle"></text>
              </g>
              <g id="n1-formula">
                <text x="285" y="500" class="n1-formula" text-anchor="middle">ΔE = hν</text>
              </g>
              <text id="n1-question" x="900" y="520" class="n1-question" text-anchor="middle">同一个 CO₂，两种振动方式</text>
            </svg>
          </div>`;
      }

      function setAttr(id, name, value){ visual.querySelector('#' + id)?.setAttribute(name, String(value)); }
      function show(id, visible){ const el = visual.querySelector('#' + id); if(el) el.style.opacity = visible ? '1' : '0'; }
      function setMoleculePhase(mode, phase){
        const q = Math.sin(phase);
        const symmetric = mode === 1;
        const antisymmetric = mode === 2;
        // Display scale is enlarged for teaching; the mass-weighted center of
        // mass remains fixed: mO=16, mC=12. Symmetric: C is still; antisymmetric
        // uses 16*dX(left)+12*dX(C)+16*dX(right)=0.
        const dO = 28 * q;
        const cX = antisymmetric ? 900 - (32 / 12) * (7 * q) : 900;
        const lX = symmetric ? 720 - dO : antisymmetric ? 720 + 7 * q : 720;
        const rX = symmetric ? 1080 + dO : antisymmetric ? 1080 + 7 * q : 1080;
        [['n1-c','cx',cX],['n1-c-t','x',cX],['n1-o-l','cx',lX],['n1-o-l-t','x',lX],['n1-o-r','cx',rX],['n1-o-r-t','x',rX],['n1-bond-l','x1',cX],['n1-bond-l','x2',lX],['n1-bond-r','x1',cX],['n1-bond-r','x2',rX]].forEach(v=>setAttr(...v));
        const arrowSign = Math.sign(q) || 1;
        const arrowLen = 62 * Math.abs(q);
        setAttr('n1-move-l','x1',lX); setAttr('n1-move-l','x2',lX + (symmetric ? -arrowSign : arrowSign) * arrowLen);
        setAttr('n1-move-r','x1',rX); setAttr('n1-move-r','x2',rX + (symmetric ? arrowSign : arrowSign) * arrowLen);
        const motionMarker = Math.abs(q) > 0.001 ? 'url(#n1ArrowBlue)' : 'none';
        setAttr('n1-move-l','marker-end',motionMarker); setAttr('n1-move-r','marker-end',motionMarker);
        const net = antisymmetric ? 90 * q : 0;
        const netLine = visual.querySelector('#n1-net-dipole-line');
        if(netLine) netLine.style.display = Math.abs(net) > 0.001 ? '' : 'none';
        setAttr('n1-net-dipole-line','x1',900);
        setAttr('n1-net-dipole-line','x2',900 + net);
      }

      function applyStable(targetBeat, animate){
        beat = Math.max(0, Math.min(3, targetBeat));
        timeline?.kill?.(); timeline = null; busy = false;
        setMoleculePhase(beat === 1 ? 1 : beat >= 2 ? 2 : 0, (beat >= 1) ? Math.PI / 2 : 0);
        const mode = visual.querySelector('#n1-mode');
        const dmu = visual.querySelector('#n1-dmu');
        const status = visual.querySelector('#n1-status');
        show('n1-bond-dipoles', beat === 1);
        show('n1-net-dipole', beat >= 2);
        show('n1-energy-path', beat === 3);
        show('n1-formula', beat === 3);
        show('n1-result', beat >= 1);
        show('n1-question', beat === 0);
        if(mode) mode.textContent = ['理想 CO₂ · 振动示意','对称伸缩','反对称伸缩','吸收：能量转入振动'][beat];
        if(dmu) dmu.textContent = beat === 1 ? 'Δμ = 0' : beat >= 2 ? 'Δμ ≠ 0' : '';
        if(status) status.textContent = beat === 1 ? '两侧变化相互抵消' : beat >= 2 ? '净偶极矩发生变化' : '';
        takeaway.innerHTML = [
          '分子中的原子可以相对振动。我们用 CO₂ 比较：哪些振动能与红外光交换能量？',
          '两端一起伸缩时，两侧键偶极的变化彼此抵消，这种振动不吸收红外。',
          '一边伸、一边缩时，净偶极矩不断变化，这种振动可以与红外光交换能量。',
          '<strong>还要让光子能量与振动能级差匹配；CO₂ 不需要永久偶极，也能吸收红外。</strong>'
        ][beat];

        if(animate && !reduced && window.gsap && (beat === 1 || beat === 2)){
          const focus = visual.querySelector('#n1-molecule');
          const reveal = beat === 3 ? visual.querySelector('#n1-formula') : visual.querySelector('#n1-result');
          busy = true;
          const phaseState = { value: Math.PI / 2 };
          timeline = gsap.timeline({onComplete(){ busy = false; timeline = null; }});
          timeline.fromTo(focus,{opacity:.36},{opacity:1,duration:.7,ease:'power2.out'});
          timeline.to(phaseState,{value:Math.PI * 2.5,duration:2.8,ease:'none',onUpdate:()=>setMoleculePhase(beat,phaseState.value)},0.15);
          timeline.fromTo(reveal,{opacity:0,y:8},{opacity:1,y:0,duration:.45},.4);
        } else if(animate && !reduced && window.gsap && beat === 3){
          busy = true;
          timeline = gsap.timeline({onComplete(){ busy = false; timeline = null; }});
          timeline.fromTo(visual.querySelector('#n1-energy-path'),{opacity:.36},{opacity:1,duration:.7,ease:'power2.out'});
          timeline.fromTo(visual.querySelector('#n1-energy-path path'),{drawSVG:'0%'},{drawSVG:'100%',duration:.65,ease:'none'},.15);
          timeline.fromTo(visual.querySelector('#n1-formula'),{opacity:0,y:10},{opacity:1,y:0,duration:.5},.72);
        }
      }

      return {
        mount(){ renderVisual(); applyStable(0, false); },
        isBusy(){ return busy; },
        cancelMotion(){timeline?.kill?.();timeline=null;busy=false;},
        getState(){ return {beat}; },
        jumpToEnd(){ applyStable(3, false); },
        nextBeat(){ if(beat < 3){ applyStable(beat + 1, true); return true; } return false; },
        prevBeat(){ if(beat > 0){ applyStable(beat - 1, false); return true; } return false; },
        dispose(){ timeline?.kill?.(); timeline = null; busy = false; if(window.gsap) gsap.killTweensOf(visual.querySelectorAll('*')); }
      };
    }

    // Retained only as an implementation reference; the story factory uses the
    // continuous scene above.
    function createScene01Legacy(){
      let beat = 0;
      let phase = 0;
      let animId = null;
      let lastTime = performance.now();

      function renderVisual(){
        visual.innerHTML = `
          <div class="mol-4col-grid">
            <!-- Mode 0: CO2 Symmetric Stretch -->
            <div class="mol-col" id="col0">
              <div class="mol-heading">
                <span class="mol-mol">CO₂</span>
                <strong class="mol-mode">对称伸缩</strong>
              </div>
              <svg class="mol-card-svg" id="svgM0" viewBox="0 0 320 280">
                <defs>
                  <marker id="mArrow0" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#1d5b94"/>
                  </marker>
                  <marker id="mArrowAmber0" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                    <polygon points="0 0, 6 3, 0 6" fill="#c47c2b"/>
                  </marker>
                </defs>

                <!-- Equilibrium Bond Axis (Guides perception of direction) -->
                <line x1="30" y1="140" x2="290" y2="140" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,4"/>

                <line id="m0Bond1" x1="160" y1="140" x2="70" y2="140" stroke="#718290" stroke-width="6" stroke-linecap="round"/>
                <line id="m0Bond2" x1="160" y1="140" x2="250" y2="140" stroke="#718290" stroke-width="6" stroke-linecap="round"/>
                <circle id="m0AtomC" cx="160" cy="140" r="22" fill="#2d3748"/>
                <text x="160" y="146" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">C</text>
                <circle id="m0AtomO1" cx="70" cy="140" r="24" fill="#e53e3e"/>
                <text id="m0TxtO1" x="70" y="147" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">O</text>
                <circle id="m0AtomO2" cx="250" cy="140" r="24" fill="#e53e3e"/>
                <text id="m0TxtO2" x="250" y="147" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">O</text>
                
                <!-- Bond dipoles (opposing, strictly cancel out) -->
                <line id="m0DipoleL" x1="140" y1="180" x2="90" y2="180" stroke="#889aa8" stroke-width="2.5" stroke-dasharray="4,3" marker-end="url(#mArrowAmber0)"/>
                <line id="m0DipoleR" x1="180" y1="180" x2="230" y2="180" stroke="#889aa8" stroke-width="2.5" stroke-dasharray="4,3" marker-end="url(#mArrowAmber0)"/>
                <text x="160" y="210" fill="#889aa8" font-size="13" font-family="monospace" text-anchor="middle">键偶极反向抵消</text>
              </svg>
              <div class="mol-verdict status-inactive">
                <span class="mol-dipole-val">Δμ = 0</span>
                <span class="mol-ir-status">红外不活跃</span>
              </div>
            </div>

            <!-- Mode 1: CO2 Antisymmetric Stretch -->
            <div class="mol-col" id="col1">
              <div class="mol-heading">
                <span class="mol-mol">CO₂</span>
                <strong class="mol-mode">反对称伸缩</strong>
              </div>
              <svg class="mol-card-svg" id="svgM1" viewBox="0 0 320 280">
                <!-- Equilibrium Bond Axis -->
                <line x1="30" y1="140" x2="290" y2="140" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,4"/>

                <line id="m1Bond1" x1="160" y1="140" x2="70" y2="140" stroke="#718290" stroke-width="6" stroke-linecap="round"/>
                <line id="m1Bond2" x1="160" y1="140" x2="250" y2="140" stroke="#718290" stroke-width="6" stroke-linecap="round"/>
                <circle id="m1AtomC" cx="160" cy="140" r="22" fill="#2d3748"/>
                <text id="m1TxtC" x="160" y="146" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">C</text>
                <circle id="m1AtomO1" cx="70" cy="140" r="24" fill="#e53e3e"/>
                <text id="m1TxtO1" x="70" y="147" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">O</text>
                <circle id="m1AtomO2" cx="250" cy="140" r="24" fill="#e53e3e"/>
                <text id="m1TxtO2" x="250" y="147" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">O</text>
                
                <!-- Dynamic Net Dipole Vector -->
                <line id="m1NetDipole" x1="160" y1="65" x2="160" y2="65" stroke="#1d5b94" stroke-width="3.5" marker-end="url(#mArrow0)"/>
                <text id="m1DipoleTxt" x="160" y="45" fill="#1d5b94" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">瞬时偶极交变振荡</text>
              </svg>
              <div class="mol-verdict status-active">
                <span class="mol-dipole-val">Δμ ≠ 0</span>
                <span class="mol-ir-status">红外活跃</span>
              </div>
            </div>

            <!-- Mode 2: CO2 Bending -->
            <div class="mol-col" id="col2">
              <div class="mol-heading">
                <span class="mol-mol">CO₂</span>
                <strong class="mol-mode">弯曲振动</strong>
              </div>
              <svg class="mol-card-svg" id="svgM2" viewBox="0 0 320 280">
                <!-- Equilibrium Bond Axis -->
                <line x1="30" y1="140" x2="290" y2="140" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,4"/>

                <line id="m2Bond1" x1="160" y1="140" x2="70" y2="140" stroke="#718290" stroke-width="6" stroke-linecap="round"/>
                <line id="m2Bond2" x1="160" y1="140" x2="250" y2="140" stroke="#718290" stroke-width="6" stroke-linecap="round"/>
                <circle id="m2AtomC" cx="160" cy="140" r="22" fill="#2d3748"/>
                <text id="m2TxtC" x="160" y="146" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">C</text>
                <circle id="m2AtomO1" cx="70" cy="140" r="24" fill="#e53e3e"/>
                <text id="m2TxtO1" x="70" y="147" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">O</text>
                <circle id="m2AtomO2" cx="250" cy="140" r="24" fill="#e53e3e"/>
                <text id="m2TxtO2" x="250" y="147" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">O</text>
                
                <!-- Dynamic Vertical Dipole Vector -->
                <line id="m2NetDipole" x1="160" y1="140" x2="160" y2="140" stroke="#1d5b94" stroke-width="3.5" marker-end="url(#mArrow0)"/>
                <text id="m2DipoleTxt" x="160" y="45" fill="#1d5b94" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">垂直偶极周期振荡</text>
              </svg>
              <div class="mol-verdict status-active">
                <span class="mol-dipole-val">Δμ ≠ 0</span>
                <span class="mol-ir-status">红外活跃</span>
              </div>
            </div>

            <!-- Mode 3: H2O Symmetric Stretch -->
            <div class="mol-col" id="col3">
              <div class="mol-heading">
                <span class="mol-mol">H₂O</span>
                <strong class="mol-mode">对称伸缩</strong>
              </div>
              <svg class="mol-card-svg" id="svgM3" viewBox="0 0 320 280">
                <!-- Angle Bisector Axis -->
                <line x1="160" y1="35" x2="160" y2="210" stroke="#cbd5e1" stroke-width="1.5" stroke-dasharray="4,4"/>
                <line x1="160" y1="115" x2="90" y2="190" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="3,3"/>
                <line x1="160" y1="115" x2="230" y2="190" stroke="#e2e8f0" stroke-width="1.2" stroke-dasharray="3,3"/>

                <line id="m3Bond1" x1="160" y1="115" x2="105" y2="175" stroke="#718290" stroke-width="5" stroke-linecap="round"/>
                <line id="m3Bond2" x1="160" y1="115" x2="215" y2="175" stroke="#718290" stroke-width="5" stroke-linecap="round"/>
                <circle id="m3AtomO" cx="160" cy="115" r="24" fill="#e53e3e"/>
                <text id="m3TxtO" x="160" y="122" fill="#fff" font-size="16" font-family="sans-serif" font-weight="bold" text-anchor="middle">O</text>
                <circle id="m3AtomH1" cx="105" cy="175" r="15" fill="#3182ce"/>
                <text id="m3TxtH1" x="105" y="180" fill="#fff" font-size="13" font-family="sans-serif" font-weight="bold" text-anchor="middle">H</text>
                <circle id="m3AtomH2" cx="215" cy="175" r="15" fill="#3182ce"/>
                <text id="m3TxtH2" x="215" y="180" fill="#fff" font-size="13" font-family="sans-serif" font-weight="bold" text-anchor="middle">H</text>
                
                <!-- Dynamic Bisector Net Dipole Vector -->
                <line id="m3NetDipole" x1="160" y1="115" x2="160" y2="50" stroke="#1d5b94" stroke-width="3.5" marker-end="url(#mArrow0)"/>
                <text id="m3DipoleTxt" x="160" y="38" fill="#1d5b94" font-size="14" font-family="sans-serif" font-weight="bold" text-anchor="middle">沿角平分线周期变化</text>
              </svg>
              <div class="mol-verdict status-active">
                <span class="mol-dipole-val">Δμ ≠ 0</span>
                <span class="mol-ir-status">红外活跃</span>
              </div>
            </div>
          </div>
        `;
      }

      function updateMolecules(){
        const sin = Math.sin(phase);

        // Column 0: CO2 Sym (O atoms move ±7px oppositely, C stationary)
        const amp0 = (beat === 1 || beat >= 5) ? 1.0 : 0.0;
        const dX0 = sin * 7 * amp0;
        const o1_0 = visual.querySelector('#m0AtomO1');
        const o2_0 = visual.querySelector('#m0AtomO2');
        const b1_0 = visual.querySelector('#m0Bond1');
        const b2_0 = visual.querySelector('#m0Bond2');
        const to1_0 = visual.querySelector('#m0TxtO1');
        const to2_0 = visual.querySelector('#m0TxtO2');
        if(o1_0){
          o1_0.setAttribute('cx', 70 - dX0);
          to1_0.setAttribute('x', 70 - dX0);
          b1_0.setAttribute('x2', 70 - dX0);
          o2_0.setAttribute('cx', 250 + dX0);
          to2_0.setAttribute('x', 250 + dX0);
          b2_0.setAttribute('x2', 250 + dX0);
        }

        // Column 1: CO2 Asym (Gentle harmonic: C shifts 7.5px, O shifts 5px opposite; zero clipping)
        const amp1 = (beat === 2 || beat >= 5) ? 1.0 : 0.0;
        const dXO1 = sin * 5 * amp1;
        const dXC1 = -sin * 7.5 * amp1;
        const c_1 = visual.querySelector('#m1AtomC');
        const tc_1 = visual.querySelector('#m1TxtC');
        const o1_1 = visual.querySelector('#m1AtomO1');
        const o2_1 = visual.querySelector('#m1AtomO2');
        const to1_1 = visual.querySelector('#m1TxtO1');
        const to2_1 = visual.querySelector('#m1TxtO2');
        const b1_1 = visual.querySelector('#m1Bond1');
        const b2_1 = visual.querySelector('#m1Bond2');
        const netD1 = visual.querySelector('#m1NetDipole');
        if(c_1){
          c_1.setAttribute('cx', 160 + dXC1);
          tc_1.setAttribute('x', 160 + dXC1);
          o1_1.setAttribute('cx', 70 + dXO1);
          to1_1.setAttribute('x', 70 + dXO1);
          o2_1.setAttribute('cx', 250 + dXO1);
          to2_1.setAttribute('x', 250 + dXO1);
          b1_1.setAttribute('x1', 160 + dXC1);
          b1_1.setAttribute('x2', 70 + dXO1);
          b2_1.setAttribute('x1', 160 + dXC1);
          b2_1.setAttribute('x2', 250 + dXO1);

          if(netD1){
            const arrowLen = sin * 28 * amp1;
            netD1.setAttribute('x1', 160 - arrowLen);
            netD1.setAttribute('x2', 160 + arrowLen);
            netD1.style.opacity = amp1 > 0 ? (Math.abs(sin) > 0.1 ? '1' : '0.3') : '0';
          }
        }

        // Column 2: CO2 Bend (Gentle harmonic: C moves 8px up, O moves 4px down)
        const amp2 = (beat === 3 || beat >= 5) ? 1.0 : 0.0;
        const dYC2 = -sin * 8 * amp2;
        const dYO2 = sin * 4 * amp2;
        const c_2 = visual.querySelector('#m2AtomC');
        const tc_2 = visual.querySelector('#m2TxtC');
        const o1_2 = visual.querySelector('#m2AtomO1');
        const o2_2 = visual.querySelector('#m2AtomO2');
        const to1_2 = visual.querySelector('#m2TxtO1');
        const to2_2 = visual.querySelector('#m2TxtO2');
        const b1_2 = visual.querySelector('#m2Bond1');
        const b2_2 = visual.querySelector('#m2Bond2');
        const netD2 = visual.querySelector('#m2NetDipole');
        if(c_2){
          c_2.setAttribute('cy', 140 + dYC2);
          tc_2.setAttribute('y', 146 + dYC2);
          o1_2.setAttribute('cy', 140 + dYO2);
          to1_2.setAttribute('y', 147 + dYO2);
          o2_2.setAttribute('cy', 140 + dYO2);
          to2_2.setAttribute('y', 147 + dYO2);
          b1_2.setAttribute('y1', 140 + dYC2);
          b1_2.setAttribute('y2', 140 + dYO2);
          b2_2.setAttribute('y1', 140 + dYC2);
          b2_2.setAttribute('y2', 140 + dYO2);

          if(netD2){
            const arrowY = 140 + dYC2 - (sin * 24 * amp2);
            netD2.setAttribute('y1', 140 + dYC2);
            netD2.setAttribute('y2', arrowY);
            netD2.style.opacity = amp2 > 0 ? '1' : '0';
          }
        }

        // Column 3: H2O Sym Stretch (Harmonic amplitude 6px along O-H bonds)
        const amp3 = (beat === 4 || beat >= 5) ? 1.0 : 0.0;
        const dist3 = sin * 6 * amp3;
        // Direction vector from O(160,115) to H1(105,175): dx=-55, dy=60 -> len=81.4, ux=-0.676, uy=0.737
        const h1_3 = visual.querySelector('#m3AtomH1');
        const th1_3 = visual.querySelector('#m3TxtH1');
        const b1_3 = visual.querySelector('#m3Bond1');
        const h2_3 = visual.querySelector('#m3AtomH2');
        const th2_3 = visual.querySelector('#m3TxtH2');
        const b2_3 = visual.querySelector('#m3Bond2');
        const netD3 = visual.querySelector('#m3NetDipole');
        if(h1_3){
          h1_3.setAttribute('cx', 105 - dist3 * 0.676);
          h1_3.setAttribute('cy', 175 + dist3 * 0.737);
          th1_3.setAttribute('x', 105 - dist3 * 0.676);
          th1_3.setAttribute('y', 180 + dist3 * 0.737);
          b1_3.setAttribute('x2', 105 - dist3 * 0.676);
          b1_3.setAttribute('y2', 175 + dist3 * 0.737);

          h2_3.setAttribute('cx', 215 + dist3 * 0.676);
          h2_3.setAttribute('cy', 175 + dist3 * 0.737);
          th2_3.setAttribute('x', 215 + dist3 * 0.676);
          th2_3.setAttribute('y', 180 + dist3 * 0.737);
          b2_3.setAttribute('x2', 215 + dist3 * 0.676);
          b2_3.setAttribute('y2', 175 + dist3 * 0.737);

          if(netD3){
            const topY = 50 - sin * 18 * amp3;
            netD3.setAttribute('y2', topY);
            netD3.style.opacity = amp3 > 0 ? '1' : '0.3';
          }
        }
      }

      function tick(now){
        const dt = (now - lastTime) / 1000;
        lastTime = now;
        // In full compare state, slow down to calm, elegant motion (2.2 rad/s vs 3.6 rad/s)
        const speed = beat >= 5 ? 2.2 : 3.6;
        phase += dt * speed;
        updateMolecules();
        animId = requestAnimationFrame(tick);
      }

      function applyBeat(){
        const cols = [visual.querySelector('#col0'), visual.querySelector('#col1'), visual.querySelector('#col2'), visual.querySelector('#col3')];
        cols.forEach((c, i) => {
          if(!c) return;
          if(beat === 0){
            c.classList.remove('dimmed', 'active');
          } else if(beat >= 1 && beat <= 4){
            if(i === beat - 1){
              c.classList.add('active');
              c.classList.remove('dimmed');
            } else {
              c.classList.add('dimmed');
              c.classList.remove('active');
            }
          } else {
            // Calm compare state
            c.classList.remove('dimmed');
            c.classList.add('active');
          }
        });

        if(beat === 0){
          takeaway.innerHTML = '在红外光照射下，分子内部的化学键像弹簧一样在持续振动。';
        } else if(beat === 1){
          takeaway.innerHTML = 'CO₂ 对称伸缩：两端氧原子同步伸缩，键偶极变化反向抵消，<strong>分子偶极矩保持为零（Δμ = 0 · 红外不活跃）</strong>。';
        } else if(beat === 2){
          takeaway.innerHTML = 'CO₂ 反对称伸缩：一伸一缩打破对称，沿轴向产生剧烈交变偶极矩（<strong>Δμ ≠ 0 · 强烈红外活跃</strong>）。';
        } else if(beat === 3){
          takeaway.innerHTML = 'CO₂ 弯曲振动：直线分子发生弯折，垂直于键轴方向产生交变偶极（<strong>Δμ ≠ 0 · 红外活跃</strong>）。';
        } else if(beat === 4){
          takeaway.innerHTML = 'H₂O 对称伸缩：水分子即便对称伸缩，合偶极矩依然显著改变（<strong>澄清：“对称”本身不是不吸收的理由</strong>）。';
        } else {
          takeaway.innerHTML = '<strong>判断红外活性的关键：振动是否引起偶极矩变化（Δμ ≠ 0）；同时光子能量需满足 ΔE = hν。</strong>';
        }
      }

      return {
        mount(){
          beat = 0;
          renderVisual();
          applyBeat();
          lastTime = performance.now();
          if(!animId) animId = requestAnimationFrame(tick);
        },
        isBusy(){ return false; },
        jumpToEnd(){
          beat = 5;
          applyBeat();
        },
        nextBeat(){
          if(beat < 5){ beat++; applyBeat(); return true; }
          return false;
        },
        prevBeat(){
          if(beat > 0){ beat--; applyBeat(); return true; }
          return false;
        },
        dispose(){
          if(animId){ cancelAnimationFrame(animId); animId = null; }
          Motion.killTweens();
        }
      };
    }

    // =========================================================================
    // SCENE 02 · SAME DETECTOR, TWO DIFFERENT SPECTRAL COMPOSITIONS
    // =========================================================================
    function createScene02(){
      let beat = 0;
      let busy = false;
      let tween = null;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const compositions = [[0.8, 0.4, 0.8], [0.2, 1.6, 0.2]];

      function renderVisual(){
        visual.innerHTML = `
          <div class="n2-continuous">
            <svg viewBox="0 0 1440 620" role="img" aria-label="三种代表波数进入同一个宽带探测器，不同组成给出相同总读数">
              <defs>
                <marker id="n2Arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#718491"/></marker>
                <filter id="n2DetectorGlow"><feGaussianBlur stdDeviation="8" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
              </defs>
              <text id="n2-composition-title" x="120" y="82" class="n2-title">组成 A</text>
              <text x="120" y="116" class="n2-subtitle">等响应教学模型 · 三个波数的贡献相加</text>

              ${[1000,1700,3000].map((wn,i)=>{
                const y=205+i*125;
                const color=['#c47c2b','#1d5b94','#637887'][i];
                return `<g class="n2-component" id="n2-component-${i}">
                  <text x="120" y="${y+7}" class="n2-wave-label">${wn} cm⁻¹</text>
                  <path d="M270 ${y} C310 ${y-35} 350 ${y+35} 390 ${y} S470 ${y-35} 510 ${y} S590 ${y+35} 630 ${y} S710 ${y-35} 750 ${y}" fill="none" stroke="${color}" stroke-width="${[7,4,7][i]}" stroke-linecap="round" id="n2-wave-${i}"/>
                  <rect x="785" y="${y-18}" width="${[144,72,144][i]}" height="36" rx="8" fill="${color}" opacity=".22" id="n2-bar-${i}"/>
                  <text x="950" y="${y+7}" class="n2-value" id="n2-value-${i}">${compositions[0][i].toFixed(1)}</text>
                </g>`;
              }).join('')}
              <path d="M985 205 C1040 205 1040 330 1080 330 M985 330 H1080 M985 455 C1040 455 1040 330 1080 330" fill="none" stroke="#a6b1b7" stroke-width="3" marker-end="url(#n2Arrow)" id="n2-combiner"/>

              <g id="n2-detector">
                <rect x="1090" y="208" width="265" height="250" rx="28" fill="#fffaf1" stroke="#c6b89f" stroke-width="3"/>
                <circle cx="1222" cy="288" r="48" fill="#edf4f8" stroke="#1d5b94" stroke-width="4"/>
                <path d="M1194 288 H1250 M1222 260 V316" stroke="#1d5b94" stroke-width="6" stroke-linecap="round"/>
                <text x="1222" y="373" class="n2-detector-label" text-anchor="middle">宽带探测器</text>
                <text x="1222" y="420" class="n2-total" text-anchor="middle">总读数  <tspan id="n2-total">2.00</tspan></text>
              </g>
              <g id="n2-question">
                <path d="M1075 490 C1005 520 950 535 880 535" fill="none" stroke="#c47c2b" stroke-width="3" stroke-dasharray="7 7"/>
                <text x="720" y="550" class="n2-question" text-anchor="middle">相同总读数 ≠ 相同光谱</text>
              </g>
            </svg>
          </div>`;
      }

      function paint(values){
        values.forEach((v,i)=>{
          const bar=visual.querySelector('#n2-bar-'+i);
          const label=visual.querySelector('#n2-value-'+i);
          const wave=visual.querySelector('#n2-wave-'+i);
          if(bar) bar.setAttribute('width', String(180*v));
          if(label) label.textContent=v.toFixed(1);
          if(wave) wave.setAttribute('stroke-width', String(3+6*v));
        });
      }

      function applyStable(targetBeat, animate){
        beat=Math.max(0,Math.min(2,targetBeat));
        tween?.kill?.(); tween=null; busy=false;
        const values=compositions[beat===0?0:1].slice();
        const titleEl=visual.querySelector('#n2-composition-title');
        const question=visual.querySelector('#n2-question');
        const detector=visual.querySelector('#n2-detector');
        const components=visual.querySelectorAll('.n2-component, #n2-combiner');
        if(titleEl) titleEl.textContent=beat===0?'组成 A':'组成 B';
        if(question) question.style.opacity=beat===2?'1':'0';
        components.forEach(el=>el.style.opacity=beat===2?'.7':'1');
        if(detector) detector.style.filter='none';
        paint(values);
        takeaway.innerHTML=[
          '一个宽带探测器把这些贡献加在一起，只给出一个读数。',
          '改变光的组成，总读数却没有变。只看这一次读数，分不清各波数有多少。',
          'FTIR 的办法：让不同波数留下不同快慢的起伏，再从起伏中找回组成。'
        ][beat];

        if(animate && !reduced && window.gsap){
          busy=true;
          if(beat===1){
            const proxy={a:.8,b:.4,c:.8};
            tween=gsap.to(proxy,{a:.2,b:1.6,c:.2,duration:1,ease:'power2.inOut',onUpdate(){paint([proxy.a,proxy.b,proxy.c]);},onComplete(){busy=false;tween=null;}});
          } else {
            tween=gsap.fromTo(detector,{scale:.96,transformOrigin:'center center'},{scale:1,duration:.55,ease:'power2.out',onComplete(){busy=false;tween=null;}});
          }
        }
      }

      return {
        mount(){renderVisual();applyStable(0,false);},
        isBusy(){return busy;},
        cancelMotion(){tween?.kill?.();tween=null;busy=false;},
        getState(){return {beat};},
        jumpToEnd(){applyStable(2,false);},
        nextBeat(){if(beat<2){applyStable(beat+1,true);return true;}return false;},
        prevBeat(){if(beat>0){applyStable(beat-1,false);return true;}return false;},
        dispose(){tween?.kill?.();tween=null;busy=false;if(window.gsap)gsap.killTweensOf(visual.querySelectorAll('*'));}
      };
    }

    // Legacy comparison scene kept out of the active story path.
    function createScene02Legacy(){
      let beat = 0;
      let vals = [0.8, 0.4, 0.8]; // sum = 2.0

      function renderVisual(){
        visual.innerHTML = `
          <div class="det-layout">
            <div class="det-chart-box">
              <div class="det-chart-head">
                <span class="det-chart-title">红外输入光束组成</span>
                <button class="det-switch-btn" id="btnToggleComp">切换另一组截然不同的组成 ⟳</button>
              </div>
              <svg viewBox="0 0 760 420" style="width:100%;height:100%;">
                <path d="M70 360H720M70 360V40" stroke="#b0c0c7" stroke-width="2"/>
                <text x="70" y="395" fill="#556770" font-size="16" font-family="monospace">波数 / cm⁻¹</text>
                <text x="15" y="55" fill="#556770" font-size="16" font-family="monospace">强度</text>
                ${[1000, 1700, 3000].map((w, i) => {
                  const h = vals[i] * 160;
                  const c = ['#c47c2b', '#1d5b94', '#607282'][i];
                  return `
                    <g>
                      <rect id="detBar${i}" x="${140 + i * 200}" y="${360 - h}" width="110" height="${h}" fill="${c}" rx="6"/>
                      <text id="detVal${i}" x="${195 + i * 200}" y="${340 - h}" fill="#0d1b2a" font-size="24" font-family="monospace" font-weight="bold" text-anchor="middle">${vals[i].toFixed(1)}</text>
                      <text x="${195 + i * 200}" y="390" fill="#556770" font-size="18" font-family="monospace" text-anchor="middle">${w}</text>
                    </g>
                  `;
                }).join('')}
              </svg>
            </div>

            <div class="det-meter-box">
              <span class="det-meter-label">宽带光电/热敏探测器总读数</span>
              <span class="det-meter-value" id="detTotal">2.00</span>
              <p class="det-meter-desc">
                普通探测器只能响应总光强（S = S₁ + S₂ + S₃）。
                各个波长混杂在一起时，探测器无法直接分辨是哪个波长被吸收了。
              </p>
            </div>
          </div>
        `;

        visual.querySelector('#btnToggleComp')?.addEventListener('click', e => {
          e.stopPropagation();
          toggleComposition();
        });
      }

      function updateBars(){
        vals.forEach((v, i) => {
          const h = v * 160;
          const bar = visual.querySelector('#detBar' + i);
          const txt = visual.querySelector('#detVal' + i);
          if(bar){
            bar.setAttribute('y', 360 - h);
            bar.setAttribute('height', h);
          }
          if(txt){
            txt.setAttribute('y', 340 - h);
            txt.textContent = v.toFixed(1);
          }
        });
      }

      function toggleComposition(){
        const target = (vals[0] > 0.5) ? [0.2, 1.6, 0.2] : [0.8, 0.4, 0.8];
        if(window.gsap){
          gsap.to(vals, {
            0: target[0],
            1: target[1],
            2: target[2],
            duration: 0.8,
            ease: 'power2.inOut',
            onUpdate: updateBars
          });
        } else {
          vals = target;
          updateBars();
        }
      }

      function applyBeat(){
        if(beat === 0){
          vals = [0.8, 0.4, 0.8];
          takeaway.innerHTML = '当 1000、1700、3000 cm⁻¹ 复合红外光同时照射时，探测器只输出总光功率读数 <strong>2.00</strong>。';
          renderVisual();
        } else {
          takeaway.innerHTML = '<strong>同一个总读数，可以来自截然不同的光谱组成。</strong>探测器无法直接分光，必须靠干涉仪进行光学编码。';
          toggleComposition();
        }
      }

      return {
        mount(){ beat = 0; applyBeat(); },
        isBusy(){ return false; },
        jumpToEnd(){ beat = 1; applyBeat(); },
        nextBeat(){
          if(beat < 1){ beat++; applyBeat(); return true; }
          return false;
        },
        prevBeat(){
          if(beat > 0){ beat--; applyBeat(); return true; }
          return false;
        },
        dispose(){ Motion.killTweens(); }
      };
    }

    // =========================================================================
    // P1: SCENE 03 & 04 · 3D INSTRUMENT & MICHELSON OPTICAL BRIDGE
    // =========================================================================
    function createScene03(){
      // The instrument bridge owns the continuous 3D → SVG handoff. Keeping
      // it as the scene owner lets camera poses and projected anchors survive
      // the transition instead of rebuilding a second instrument renderer.
      if (window.FTIROpticalSequence?.mount) {
        let sequence = null;
        let handedOff = false;
        return {
          mount(){
            sequence = window.FTIROpticalSequence.mount(visual, {onHandoff(){ title.textContent='动镜如何把波数编码为光程差？'; }});
          },
          isBusy(){ return !!sequence?.isBusy?.(); },
          jumpToEnd(){ sequence?.jumpToEnd?.(); },
          nextBeat(){
            if(handedOff) return false;
            const more=sequence?.nextBeat?.();
            handedOff=sequence?.getState?.().state==='done';
            return more;
          },
          prevBeat(){ if(handedOff) return false; return !!sequence?.prevBeat?.(); },
          dispose(){ sequence?.dispose?.(); sequence = null; }
        };
      }
      let beat = 0;
      let currentView = 'overview';

      function renderVisual(){
        visual.innerHTML = `
          <div class="theater-3d-host" id="th3dHost">
            <div class="th3d-camera-bar">
              <button class="th3d-cam-btn ${currentView==='top'?'active':''}" id="btnCamTop">🛰️ 正俯视角 (对齐 2D 光路)</button>
              <button class="th3d-cam-btn ${currentView==='overview'?'active':''}" id="btnCamOverview">🌐 3D 空间全景</button>
              <button class="th3d-cam-btn" id="btnReplayPath" style="margin-left:auto;background:#fcf4e8;border-color:#c47c2b;color:#c47c2b;font-weight:700;">↺ 重新演示光路流动</button>
            </div>
            <div class="theater-3d-overlay">
              <strong id="th3dOverlayTitle">迈克尔逊干涉仪核心光路</strong>
              <small id="th3dOverlayDesc">红外光源 → 准直 → 分束器 (50:50) → 固定镜与动镜反射 → 样品室 → 探测器</small>
            </div>
          </div>
        `;

        const hostEl = visual.querySelector('#th3dHost');
        if(typeof window.FTIRInstrument === 'function'){
          try {
            instrumentInstance = window.FTIRInstrument(hostEl, {
              onMode(mode){},
              onSelect(id){}
            });
            if(instrumentInstance){
              instrumentInstance.setMode('optical');
              instrumentInstance.setHotspotLabels({
                source: { zh: '光源' },
                splitter: { zh: '分束器' },
                moving: { zh: '动镜' },
                fixed: { zh: '定镜' },
                detector: { zh: '探测器' }
              });
              instrumentInstance.setHotspotsVisible(['source', 'splitter', 'moving', 'fixed', 'detector']);
              instrumentInstance.view(currentView);
              instrumentInstance.trace(-1);
            }
          } catch(err){
            console.error('3D mount error:', err);
          }
        }

        visual.querySelector('#btnCamTop')?.addEventListener('click', e => {
          e.stopPropagation();
          switchCameraView('top');
        });
        visual.querySelector('#btnCamOverview')?.addEventListener('click', e => {
          e.stopPropagation();
          switchCameraView('overview');
        });
        visual.querySelector('#btnReplayPath')?.addEventListener('click', e => {
          e.stopPropagation();
          triggerTopViewReplay();
        });
      }

      function switchCameraView(viewName){
        currentView = viewName;
        visual.querySelectorAll('.th3d-cam-btn').forEach(b => b.classList.remove('active'));
        if(viewName === 'top') visual.querySelector('#btnCamTop')?.classList.add('active');
        if(viewName === 'overview') visual.querySelector('#btnCamOverview')?.classList.add('active');

        if(!instrumentInstance) return;
        if(viewName === 'top'){
          instrumentInstance.setMode('optical');
          instrumentInstance.view('top');
        } else {
          instrumentInstance.setMode('inside');
          instrumentInstance.view('overview');
        }
      }

      function triggerTopViewReplay(){
        if(!instrumentInstance) return;
        switchCameraView('top');
        const descEl = visual.querySelector('#th3dOverlayDesc');
        const titleEl = visual.querySelector('#th3dOverlayTitle');
        if(titleEl) titleEl.textContent = '正俯视角光路回放 · 琥珀色光脉冲流动';

        instrumentInstance.replayOpticalPath((step, name) => {
          if(descEl) descEl.innerHTML = `<strong>${name}</strong>`;
        }, () => {
          if(descEl) descEl.textContent = '两臂分光与回程重合完成。下一幕将由二维迈克尔逊几何图精确接管光程差计算。';
        });
      }

      function applyBeat(){
        if(beat === 0){
          takeaway.innerHTML = '完整 FTIR 仪器：<strong>光源 → 分束器 → 动镜/定镜 → 样品仓 → 探测器</strong>。';
          switchCameraView('overview');
          if(instrumentInstance) instrumentInstance.stopReplay();
        } else if(beat === 1){
          takeaway.innerHTML = '<strong>正俯视角：3D 仪器旋转至正俯视，空间十字交叉与下一幕原理图严格对齐。</strong>';
          switchCameraView('top');
          if(instrumentInstance) instrumentInstance.stopReplay();
        } else {
          takeaway.innerHTML = '<strong>俯视光路流动演示：</strong>琥珀色光脉冲自光源出发，经分束器分流两臂、反射重合并射向探测器。';
          triggerTopViewReplay();
        }
      }

      return {
        mount(){
          beat = 0;
          renderVisual();
          applyBeat();
        },
        isBusy(){ return false; },
        jumpToEnd(){
          beat = 2;
          applyBeat();
        },
        nextBeat(){
          if(beat < 2){ beat++; applyBeat(); return true; }
          return false;
        },
        prevBeat(){
          if(beat > 0){ beat--; applyBeat(); return true; }
          return false;
        },
        dispose(){
          if(instrumentInstance){
            try { instrumentInstance.stopReplay(); instrumentInstance.dispose(); } catch(_){}
            instrumentInstance = null;
          }
          Motion.killTweens();
        }
      };
    }

    // SCENE 04: MICHELSON FORMULA DERIVATION (Δδ = 2Δx DIRECTOR BEATS)
    function createScene04(){
      if (window.FTIROpticalSequence?.mount) {
        let sequence=null;
        return {
          mount(){ sequence=window.FTIROpticalSequence.mount(visual,{mode:'n4'}); },
          isBusy(){ return !!sequence?.isBusy?.(); },
          jumpToEnd(){ sequence?.jumpToEnd?.(); },
          nextBeat(){ return !!sequence?.nextBeat?.(); },
          prevBeat(){ return !!sequence?.prevBeat?.(); },
          dispose(){ sequence?.dispose?.(); sequence=null; }
        };
      }
      let beat = 0;

      function renderVisual(){
        visual.innerHTML = `
          <div class="michelson-layout">
            <svg viewBox="0 0 1440 620" style="width:100%;height:100%;">
              <defs>
                <marker id="mArrAmber" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#c47c2b"/>
                </marker>
                <marker id="mArrBlue" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <polygon points="0 0, 6 3, 0 6" fill="#1d5b94"/>
                </marker>
              </defs>

              <!-- LEFT 60%: MINIMAL MICHELSON GEOMETRY (x: 0 to 860) -->
              <!-- Neutral Grid & Arm Guides -->
              <line x1="160" y1="280" x2="780" y2="280" stroke="rgba(13,27,42,0.08)" stroke-width="1.5" stroke-dasharray="4,4"/>
              <line x1="520" y1="80" x2="520" y2="520" stroke="rgba(13,27,42,0.08)" stroke-width="1.5" stroke-dasharray="4,4"/>

              <!-- Beam Splitter 50:50 at (520, 280) - delicate subtle blue glass -->
              <g transform="translate(520, 280) rotate(45)">
                <rect x="-8" y="-60" width="16" height="120" rx="2" fill="rgba(120, 217, 233, 0.35)" stroke="#1d5b94" stroke-width="1.5"/>
                <line x1="0" y1="-60" x2="0" y2="60" stroke="#c47c2b" stroke-width="1.5" stroke-dasharray="4,3"/>
              </g>
              <text x="520" y="375" fill="#0d1b2a" font-size="15" font-weight="bold" text-anchor="middle">分束器 (50:50)</text>

              <!-- Source at Right (760, 280) -->
              <rect x="740" y="255" width="80" height="50" rx="4" fill="#0d1b2a"/>
              <text x="780" y="285" fill="#fff" font-size="14" font-weight="bold" text-anchor="middle">光源</text>
              <line id="rayIncoming" x1="740" y1="280" x2="532" y2="280" stroke="#c47c2b" stroke-width="3" marker-end="url(#mArrAmber)"/>

              <!-- Fixed Mirror at Top (520, 90) -->
              <line id="rayFixed" x1="520" y1="268" x2="520" y2="95" stroke="#c47c2b" stroke-width="3"/>
              <rect x="460" y="80" width="120" height="16" rx="2" fill="#0d1b2a"/>
              <line x1="460" y1="96" x2="580" y2="96" stroke="#c3dce2" stroke-width="3"/>
              <text x="520" y="65" fill="#0d1b2a" font-size="15" font-weight="bold" text-anchor="middle">定镜 (Fixed Mirror)</text>
              <text x="545" y="185" fill="#889aa8" font-size="13" font-family="monospace">臂长 L₁</text>

              <!-- Moving Mirror Arm (Left of Splitter) -->
              <line x1="508" y1="280" x2="330" y2="280" stroke="#c47c2b" stroke-width="3"/>
              <line x1="330" y1="200" x2="330" y2="360" stroke="#889aa8" stroke-width="1.5" stroke-dasharray="4,4"/>
              <text x="330" y="380" fill="#889aa8" font-size="12" font-family="monospace" text-anchor="middle">ZPD 基准位 (L₂=L₁)</text>

              <!-- Outgoing Extra Path Ray (+Δx) -->
              <line id="movRayOut" x1="330" y1="275" x2="250" y2="275" stroke="#c47c2b" stroke-width="4" stroke-dasharray="5,3" opacity="0"/>
              <!-- Return Extra Path Ray (+Δx) -->
              <line id="movRayRet" x1="250" y1="285" x2="330" y2="285" stroke="#c47c2b" stroke-width="4" stroke-dasharray="5,3" opacity="0"/>

              <!-- Moving Mirror Assembly -->
              <g id="movingMirrorGroup" transform="translate(330, 0)">
                <rect x="-14" y="220" width="14" height="120" rx="2" fill="#0d1b2a"/>
                <line x1="0" y1="220" x2="0" y2="340" stroke="#6be3db" stroke-width="3"/>
                <text x="-7" y="205" fill="#1d5b94" font-size="15" font-weight="bold" text-anchor="middle">动镜</text>
              </g>

              <!-- Outgoing Dimension Bracket (+Δx) -->
              <g id="dimOut" opacity="0">
                <line x1="330" y1="255" x2="250" y2="255" stroke="#c47c2b" stroke-width="2"/>
                <line x1="330" y1="250" x2="330" y2="260" stroke="#c47c2b" stroke-width="2"/>
                <line x1="250" y1="250" x2="250" y2="260" stroke="#c47c2b" stroke-width="2"/>
                <text x="290" y="248" fill="#c47c2b" font-size="15" font-family="monospace" font-weight="bold" text-anchor="middle">去程 +Δx</text>
              </g>

              <!-- Return Dimension Bracket (+Δx) -->
              <g id="dimRet" opacity="0">
                <line x1="330" y1="305" x2="250" y2="305" stroke="#c47c2b" stroke-width="2"/>
                <line x1="330" y1="300" x2="330" y2="310" stroke="#c47c2b" stroke-width="2"/>
                <line x1="250" y1="300" x2="250" y2="310" stroke="#c47c2b" stroke-width="2"/>
                <text x="290" y="325" fill="#c47c2b" font-size="15" font-family="monospace" font-weight="bold" text-anchor="middle">回程 +Δx</text>
              </g>

              <!-- Organically Grown Formula Card -->
              <g id="formulaCard" transform="translate(180, 80)" opacity="0">
                <rect x="0" y="0" width="260" height="72" rx="6" fill="#ffffff" stroke="#c47c2b" stroke-width="1.5"/>
                <text x="130" y="28" fill="#556770" font-size="13" text-anchor="middle">往返几何总光程差</text>
                <text x="130" y="56" fill="#c47c2b" font-size="20" font-family="monospace" font-weight="bold" text-anchor="middle">Δδ = Δx + Δx = 2Δx</text>
              </g>

              <!-- Detector at Bottom (520, 500) -->
              <line id="rayDetector" x1="520" y1="292" x2="520" y2="500" stroke="#1d5b94" stroke-width="3" marker-end="url(#mArrBlue)"/>
              <rect x="460" y="500" width="120" height="42" rx="4" fill="#0d1b2a"/>
              <text x="520" y="526" fill="#fff" font-size="15" font-weight="bold" text-anchor="middle">探测器</text>

              <!-- RIGHT 40%: SHARED OPD WAVENUMBER COMPARISON (x: 880 to 1400) -->
              <g id="opdCompZone" transform="translate(880, 60)" opacity="0.25">
                <rect x="0" y="0" width="520" height="500" rx="8" fill="#ffffff" stroke="#e8e3d8" stroke-width="1.5"/>
                <text x="260" y="36" fill="#0d1b2a" font-size="17" font-weight="bold" text-anchor="middle">同一光程差轴 (OPD) 上的波数比较</text>

                <!-- Track 1: 1000 cm⁻¹ -->
                <g transform="translate(30, 70)">
                  <text x="0" y="20" fill="#c47c2b" font-size="15" font-weight="bold">1000 cm⁻¹ (低波数 · 振荡舒缓)</text>
                  <text x="460" y="20" fill="#889aa8" font-size="12" font-family="monospace" text-anchor="end">λ = 10 μm</text>
                  <path id="opdTrace1000" d="M 0 80 Q 57.5 20 115 80 T 230 80 T 345 80 T 460 80" fill="none" stroke="#c47c2b" stroke-width="3"/>
                  <circle id="opdDot1000" cx="0" cy="80" r="7" fill="#c47c2b"/>
                </g>

                <!-- Track 2: 3000 cm⁻¹ -->
                <g transform="translate(30, 220)">
                  <text x="0" y="20" fill="#1d5b94" font-size="15" font-weight="bold">3000 cm⁻¹ (高波数 · 振荡密集，3倍频率)</text>
                  <text x="460" y="20" fill="#889aa8" font-size="12" font-family="monospace" text-anchor="end">λ = 3.33 μm</text>
                  <path id="opdTrace3000" d="M 0 80 ${Array.from({length: 24}, (_, i) => {
                    const x = i * (460 / 24);
                    const y = 80 - Math.cos(i * Math.PI / 2) * 45;
                    return `L ${x.toFixed(1)} ${y.toFixed(1)}`;
                  }).join(' ')}" fill="none" stroke="#1d5b94" stroke-width="2.5"/>
                  <circle id="opdDot3000" cx="0" cy="80" r="7" fill="#1d5b94"/>
                </g>

                <!-- Shared Horizontal OPD Axis -->
                <g transform="translate(30, 390)">
                  <line x1="0" y1="0" x2="460" y2="0" stroke="#889aa8" stroke-width="2"/>
                  <line x1="0" y1="-6" x2="0" y2="6" stroke="#889aa8" stroke-width="2"/>
                  <line x1="230" y1="-6" x2="230" y2="6" stroke="#889aa8" stroke-width="2"/>
                  <line x1="460" y1="-6" x2="460" y2="6" stroke="#889aa8" stroke-width="2"/>
                  <text x="0" y="24" fill="#556770" font-size="13" font-family="monospace" text-anchor="middle">δ = 0 μm</text>
                  <text x="230" y="24" fill="#556770" font-size="13" font-family="monospace" text-anchor="middle">δ = 5 μm</text>
                  <text x="460" y="24" fill="#556770" font-size="13" font-family="monospace" text-anchor="middle">δ = 10 μm</text>
                  <text x="230" y="52" fill="#0d1b2a" font-size="14" font-weight="bold" text-anchor="middle">往返光程差 δ = 2Δx</text>
                </g>

                <line id="opdCursor" x1="145" y1="80" x2="145" y2="430" stroke="#c47c2b" stroke-width="2" stroke-dasharray="4,4" opacity="0"/>
              </g>
            </svg>
          </div>
        `;
      }

      function applyBeat(){
        const mirror = visual.querySelector('#movingMirrorGroup');
        const rayOut = visual.querySelector('#movRayOut');
        const rayRet = visual.querySelector('#movRayRet');
        const dimOut = visual.querySelector('#dimOut');
        const dimRet = visual.querySelector('#dimRet');
        const formula = visual.querySelector('#formulaCard');
        const opdComp = visual.querySelector('#opdCompZone');
        const cursor = visual.querySelector('#opdCursor');
        const moveMirror = x => { if(!mirror) return; if(window.gsap) gsap.to(mirror,{duration:Motion.tokens.physical,attr:{transform:`translate(${x}, 0)`},ease:Motion.cameraEase}); else mirror.setAttribute('transform',`translate(${x}, 0)`); };

        if(beat === 0){
          takeaway.innerHTML = '初始零光程差（ZPD）状态：动镜位于平衡基准位，两臂光程严格等长 (L₁ = L₂)。';
          moveMirror(330);
          if(rayOut) rayOut.setAttribute('opacity', '0');
          if(rayRet) rayRet.setAttribute('opacity', '0');
          if(dimOut) dimOut.setAttribute('opacity', '0');
          if(dimRet) dimRet.setAttribute('opacity', '0');
          if(formula) formula.setAttribute('opacity', '0');
          if(opdComp) opdComp.setAttribute('opacity', '0.25');
          if(cursor) cursor.setAttribute('opacity', '0');
        } else if(beat === 1){
          takeaway.innerHTML = '动镜向外滑动一段物理位移 <strong>Δx</strong>。';
          moveMirror(250);
          if(rayOut) rayOut.setAttribute('opacity', '0');
          if(rayRet) rayRet.setAttribute('opacity', '0');
          if(dimOut) dimOut.setAttribute('opacity', '0');
          if(dimRet) dimRet.setAttribute('opacity', '0');
          if(formula) formula.setAttribute('opacity', '0');
          if(opdComp) opdComp.setAttribute('opacity', '0.25');
        } else if(beat === 2){
          takeaway.innerHTML = '去程多走了一段几何路程：<strong>+Δx</strong>。';
          moveMirror(250);
          if(rayOut) rayOut.setAttribute('opacity', '1');
          if(dimOut) dimOut.setAttribute('opacity', '1');
          if(rayRet) rayRet.setAttribute('opacity', '0');
          if(dimRet) dimRet.setAttribute('opacity', '0');
          if(formula) formula.setAttribute('opacity', '0');
        } else if(beat === 3){
          takeaway.innerHTML = '光线在镜面完全反射，回程必须再多走一段：<strong>+Δx</strong>。';
          moveMirror(250);
          if(rayOut) rayOut.setAttribute('opacity', '1');
          if(dimOut) dimOut.setAttribute('opacity', '1');
          if(rayRet) rayRet.setAttribute('opacity', '1');
          if(dimRet) dimRet.setAttribute('opacity', '1');
          if(formula) formula.setAttribute('opacity', '0');
        } else if(beat === 4){
          takeaway.innerHTML = '两个 +Δx 汇合成长为往返总光程差：<strong>Δδ = Δx + Δx = 2Δx</strong>（正入射空气近似）。';
          moveMirror(250);
          if(rayOut) rayOut.setAttribute('opacity', '1');
          if(dimOut) dimOut.setAttribute('opacity', '1');
          if(rayRet) rayRet.setAttribute('opacity', '1');
          if(dimRet) dimRet.setAttribute('opacity', '1');
          if(formula) formula.setAttribute('opacity', '1');
          if(opdComp) opdComp.setAttribute('opacity', '0.35');
          if(cursor) cursor.setAttribute('opacity', '0');
        } else {
          takeaway.innerHTML = '<strong>动镜不逐个分光，而是将不同波数编码为光程差轴上不同快慢的起伏</strong>：3000 cm⁻¹ 振荡是 1000 cm⁻¹ 的 3 倍密。';
          moveMirror(250);
          if(rayOut) rayOut.setAttribute('opacity', '1');
          if(dimOut) dimOut.setAttribute('opacity', '1');
          if(rayRet) rayRet.setAttribute('opacity', '1');
          if(dimRet) dimRet.setAttribute('opacity', '1');
          if(formula) formula.setAttribute('opacity', '1');
          if(opdComp) opdComp.setAttribute('opacity', '1');
          if(cursor) cursor.setAttribute('opacity', '1');
          const d1=visual.querySelector('#opdDot1000'),d3=visual.querySelector('#opdDot3000');
          if(window.gsap && cursor && d1 && d3){
            gsap.killTweensOf([cursor,d1,d3]);
            const run={u:0};
            gsap.to(run,{u:1,duration:2.2,ease:'power1.inOut',onUpdate(){
              const x=145+315*run.u, delta=run.u*10;
              cursor.setAttribute('x1',x);cursor.setAttribute('x2',x);
              d1.setAttribute('cx',x);d1.setAttribute('cy',80-45*Math.cos(delta*0.55));
              d3.setAttribute('cx',x);d3.setAttribute('cy',80-45*Math.cos(delta*1.65));
            }});
          }
        }
      }

      return {
        mount(){ beat = 0; renderVisual(); applyBeat(); },
        isBusy(){ return false; },
        jumpToEnd(){ beat = 5; applyBeat(); },
        nextBeat(){
          if(beat < 5){ beat++; applyBeat(); return true; }
          return false;
        },
        prevBeat(){
          if(beat > 0){ beat--; applyBeat(); return true; }
          return false;
        },
        dispose(){ Motion.killTweens(); }
      };
    }

    // =========================================================================
    // P3: SCENE 05 · INTERFEROGRAM FORMATION (从相加被看见 · 6 BEATS)
    // =========================================================================
    function createScene05(){
      let beat = 0;

      function renderVisual(){
        visual.innerHTML = `
          <div class="ifg-layout">
            <svg viewBox="0 0 1440 600" style="width:100%;height:100%;">
              <defs>
                <filter id="zpdGlow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="4" result="blur"/>
                  <feComposite in="SourceGraphic" in2="blur" operator="over"/>
                </filter>
              </defs>

              <rect x="40" y="20" width="1360" height="560" rx="8" fill="#ffffff" stroke="#e8e3d8"/>

              <!-- Axis -->
              <line x1="100" y1="310" x2="1340" y2="310" stroke="#b0c0c7" stroke-width="1.5"/>
              <line id="zpdLine" x1="720" y1="50" x2="720" y2="530" stroke="#b87422" stroke-width="2" stroke-dasharray="6,4"/>
              <text x="720" y="42" fill="#b87422" font-size="16" font-family="monospace" font-weight="bold" text-anchor="middle">δ = 0 (ZPD 零光程差)</text>
              <text x="1330" y="340" fill="#556770" font-size="14" font-family="monospace">光程差 δ</text>
              <text x="100" y="70" fill="#556770" font-size="14" font-family="monospace">交流干涉强度 I(δ)</text>

              <!-- Components Layer (3 discrete components) -->
              <g id="ifgDiscreteWaves">
                <!-- 1000 cm⁻¹ (Amber Orange #c47c2b) -->
                <path id="wave1" d="M100 310 ${Array.from({length: 125}, (_, i) => {
                  const x = 100 + i * 10;
                  const delta = (x - 720) / 100;
                  const y = 310 - Math.cos(delta * 2.5) * 55;
                  return `L${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')}" fill="none" stroke="#c47c2b" stroke-width="2.5" opacity="1"/>

                <!-- 1700 cm⁻¹ (Cyan-blue #1f7a8c) -->
                <path id="wave2" d="M100 310 ${Array.from({length: 125}, (_, i) => {
                  const x = 100 + i * 10;
                  const delta = (x - 720) / 100;
                  const y = 310 - Math.cos(delta * 4.25) * 50;
                  return `L${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')}" fill="none" stroke="#1f7a8c" stroke-width="2.2" opacity="0"/>

                <!-- 3000 cm⁻¹ (Soft indigo #4c6fb3) -->
                <path id="wave3" d="M100 310 ${Array.from({length: 125}, (_, i) => {
                  const x = 100 + i * 10;
                  const delta = (x - 720) / 100;
                  const y = 310 - Math.cos(delta * 7.5) * 40;
                  return `L${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')}" fill="none" stroke="#4c6fb3" stroke-width="2" opacity="0"/>
              </g>

              <!-- Component Labels -->
              <g id="waveLabels">
                <text id="lblW1" x="120" y="240" fill="#c47c2b" font-size="13" font-weight="bold">1000 cm⁻¹ (低波数 · 起伏较慢)</text>
                <text id="lblW2" x="120" y="215" fill="#1f7a8c" font-size="13" font-weight="bold" opacity="0">1700 cm⁻¹ (中波数 · 周期适中)</text>
                <text id="lblW3" x="120" y="190" fill="#4c6fb3" font-size="13" font-weight="bold" opacity="0">3000 cm⁻¹ (高波数 · 振荡密集)</text>
              </g>

              <!-- Ghost Background Components -->
              <g id="ifgGhostLines" opacity="0">
                ${[
                  { f: 2.5, c: '#c47c2b' },
                  { f: 4.25, c: '#1f7a8c' },
                  { f: 7.5, c: '#4c6fb3' },
                  { f: 3.2, c: '#c47c2b' },
                  { f: 5.5, c: '#1f7a8c' },
                  { f: 6.8, c: '#4c6fb3' }
                ].map(item => `
                  <path d="M100 310 ${Array.from({length: 125}, (_, i) => {
                    const x = 100 + i * 10;
                    const delta = (x - 720) / 100;
                    const y = 310 - Math.cos(delta * item.f) * 26;
                    return `L${x.toFixed(1)} ${y.toFixed(1)}`;
                  }).join(' ')}" fill="none" stroke="${item.c}" stroke-width="1.2" opacity="0.18"/>
                `).join('')}
              </g>

              <!-- SUM Curve: Deep Sea Blue #1d5b94 -->
              <path id="ifgSumCurve" d="" fill="none" stroke="#1d5b94" stroke-width="3.5"/>

              <!-- ZPD Convergence Markers (Beat 4) -->
              <g id="zpdMarkers" opacity="0">
                <circle cx="720" cy="255" r="5" fill="#c47c2b"/>
                <circle cx="720" cy="260" r="5" fill="#1f7a8c"/>
                <circle cx="720" cy="270" r="5" fill="#4c6fb3"/>
                <line x1="720" y1="255" x2="720" y2="110" stroke="#b87422" stroke-width="2" stroke-dasharray="3,3"/>
              </g>

              <!-- ZPD Centerburst Highlight Callout -->
              <g id="zpdCallout" transform="translate(720, 110)" opacity="0">
                <circle cx="0" cy="0" r="9" fill="#b87422" filter="url(#zpdGlow)"/>
                <text x="0" y="-20" fill="#b87422" font-size="16" font-weight="bold" text-anchor="middle">中心突峰 Centerburst</text>
                <text x="0" y="32" fill="#556770" font-size="13" text-anchor="middle">所有波分量在此同时达到最大同向贡献 (+1)</text>
              </g>

              <!-- Destructive Cancellation Box (Beat 5) -->
              <g id="cancelCallout" transform="translate(1080, 230)" opacity="0">
                <rect x="-110" y="-30" width="220" height="60" rx="6" fill="#fcfbf8" stroke="#889aa8" stroke-width="1.2"/>
                <text x="0" y="-8" fill="#0d1b2a" font-size="13" font-weight="bold" text-anchor="middle">远离零光程差区域</text>
                <text x="0" y="16" fill="#556770" font-size="12" text-anchor="middle">周期不同导致正负抵消，总幅衰减</text>
              </g>
            </svg>
          </div>
        `;
      }

      function updateSumWave(mode){
        const sumPath = visual.querySelector('#ifgSumCurve');
        if(!sumPath) return;

        let points = [];
        for(let i = 0; i <= 124; i++){
          const x = 100 + i * 10;
          const delta = (x - 720) / 100;
          let val = 0;

          if(mode === 0){
            val = Math.cos(delta * 2.5);
          } else if(mode === 1){
            val = (Math.cos(delta * 2.5) + Math.cos(delta * 4.25)) / 2;
          } else if(mode === 2){
            val = (Math.cos(delta * 2.5) + Math.cos(delta * 4.25) + 0.8 * Math.cos(delta * 7.5)) / 2.8;
          } else {
            const decay = Math.exp(-Math.abs(delta) * 1.6);
            val = decay * (Math.cos(delta * 3.5) * 0.45 + Math.cos(delta * 6.5) * 0.35 + Math.cos(delta * 1.5) * 0.2);
          }

          const y = 310 - val * (mode >= 3 ? 190 : 80);
          points.push(`${i===0?'M':'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        sumPath.setAttribute('d', points.join(' '));
      }

      function applyBeat(){
        const w2 = visual.querySelector('#wave2');
        const w3 = visual.querySelector('#wave3');
        const l1 = visual.querySelector('#lblW1');
        const l2 = visual.querySelector('#lblW2');
        const l3 = visual.querySelector('#lblW3');
        const ghost = visual.querySelector('#ifgGhostLines');
        const zpd = visual.querySelector('#zpdCallout');
        const zpdMarkers = visual.querySelector('#zpdMarkers');
        const cancel = visual.querySelector('#cancelCallout');
        const discrete = visual.querySelector('#ifgDiscreteWaves');

        if(beat === 0){
          takeaway.innerHTML = '单色红外光（1000 cm⁻¹）：在光程差轴上表现为恒定周期的单一余弦调制。';
          if(w2) w2.setAttribute('opacity', '0');
          if(w3) w3.setAttribute('opacity', '0');
          if(l2) l2.setAttribute('opacity', '0');
          if(l3) l3.setAttribute('opacity', '0');
          if(ghost) ghost.setAttribute('opacity', '0');
          if(discrete) discrete.setAttribute('opacity', '1');
          if(zpd) zpd.setAttribute('opacity', '0');
          if(zpdMarkers) zpdMarkers.setAttribute('opacity', '0');
          if(cancel) cancel.setAttribute('opacity', '0');
          updateSumWave(0);
        } else if(beat === 1){
          takeaway.innerHTML = '加入 1700 cm⁻¹ 分量：两束波在同一光程差轴实时逐点相加，呈现<strong>多频复合波动</strong>。';
          if(w2) w2.setAttribute('opacity', '0.7');
          if(w3) w3.setAttribute('opacity', '0');
          if(l2) l2.setAttribute('opacity', '1');
          if(l3) l3.setAttribute('opacity', '0');
          if(zpd) zpd.setAttribute('opacity', '0');
          if(zpdMarkers) zpdMarkers.setAttribute('opacity', '0');
          if(cancel) cancel.setAttribute('opacity', '0');
          updateSumWave(1);
        } else if(beat === 2){
          takeaway.innerHTML = '加入 3000 cm⁻¹ 分量：多频率调制叠加，总干涉波形起伏更加丰富。';
          if(w2) w2.setAttribute('opacity', '0.5');
          if(w3) w3.setAttribute('opacity', '0.5');
          if(l3) l3.setAttribute('opacity', '1');
          if(ghost) ghost.setAttribute('opacity', '0');
          if(zpd) zpd.setAttribute('opacity', '0');
          if(zpdMarkers) zpdMarkers.setAttribute('opacity', '0');
          if(cancel) cancel.setAttribute('opacity', '0');
          updateSumWave(2);
        } else if(beat === 3){
          takeaway.innerHTML = '离散分量淡化为幽灵线：视线只留在<strong>深海蓝总干涉曲线</strong>上。';
          if(discrete) discrete.setAttribute('opacity', '0.15');
          if(l1) l1.setAttribute('opacity', '0.3');
          if(l2) l2.setAttribute('opacity', '0.3');
          if(l3) l3.setAttribute('opacity', '0.3');
          if(ghost) ghost.setAttribute('opacity', '0.4');
          if(zpd) zpd.setAttribute('opacity', '0');
          if(zpdMarkers) zpdMarkers.setAttribute('opacity', '0');
          if(cancel) cancel.setAttribute('opacity', '0');
          updateSumWave(3);
        } else if(beat === 4){
          takeaway.innerHTML = '<strong>聚焦 δ = 0 (ZPD)</strong>：所有分量在零光程差处同时达到最大正贡献，相长汇聚成中心突峰 (Centerburst)。';
          if(discrete) discrete.setAttribute('opacity', '0.2');
          if(ghost) ghost.setAttribute('opacity', '0.2');
          if(zpd) zpd.setAttribute('opacity', '1');
          if(zpdMarkers) zpdMarkers.setAttribute('opacity', '1');
          if(cancel) cancel.setAttribute('opacity', '0');
          updateSumWave(3);
        } else {
          takeaway.innerHTML = '<strong>远离 ZPD 区域：</strong>各分量周期不同而相互错开，正负贡献彼此抵消，总信号迅速衰减为小幅振荡。';
          if(discrete) discrete.setAttribute('opacity', '0');
          if(ghost) ghost.setAttribute('opacity', '0.15');
          if(zpd) zpd.setAttribute('opacity', '0.4');
          if(zpdMarkers) zpdMarkers.setAttribute('opacity', '0');
          if(cancel) cancel.setAttribute('opacity', '1');
          updateSumWave(3);
        }
      }

      return {
        mount(){ beat = 0; renderVisual(); applyBeat(); },
        isBusy(){ return false; },
        jumpToEnd(){ beat = 5; applyBeat(); },
        nextBeat(){
          if(beat < 5){ beat++; applyBeat(); return true; }
          return false;
        },
        prevBeat(){
          if(beat > 0){ beat--; applyBeat(); return true; }
          return false;
        },
        dispose(){ Motion.killTweens(); }
      };
    }

    // =========================================================================
    // P4: SCENE 06 · FOURIER TRANSFORM RECOVERY (探针投影机制)
    // =========================================================================
    // =========================================================================
    // P4: SCENE 06 · FOURIER TRANSFORM RECOVERY (3Blue1Brown 风格三段流)
    // =========================================================================
    function createScene06(){
      let beat = 0;
      let sweepAnim = null;

      function renderVisual(){
        visual.innerHTML = `
          <div class="fourier-3col-layout">
            <!-- COL 1: 46% - INTERFEROGRAM RECORD I(δ) -->
            <div class="fourier-col">
              <div class="fourier-col-header">
                <span class="fourier-col-title">① 测得的干涉图记录 I(δ)</span>
                <span class="fourier-col-tag tag-blue">实测数据</span>
              </div>
              <svg viewBox="0 0 660 380" style="width:100%;height:100%;">
                <line x1="30" y1="200" x2="630" y2="200" stroke="#b0c0c7" stroke-width="1.5"/>
                <line x1="330" y1="20" x2="330" y2="360" stroke="#c47c2b" stroke-width="1.5" stroke-dasharray="4,4"/>
                <text x="330" y="24" fill="#c47c2b" font-size="12" font-family="monospace" text-anchor="middle">ZPD 零光程差</text>
                <text x="620" y="225" fill="#556770" font-size="13" font-family="monospace">光程差 δ</text>
                
                <!-- Interferogram record -->
                <path d="M30 200 ${Array.from({length: 61}, (_, i) => {
                  const x = 30 + i * 10;
                  const delta = (x - 330) / 50;
                  const decay = Math.exp(-Math.abs(delta) * 1.3);
                  const y = 200 - (decay * (Math.cos(delta * 3.5) * 85 + Math.cos(delta * 6.5) * 55));
                  return `L${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')}" fill="none" stroke="#1d5b94" stroke-width="3"/>

                <!-- Active Test Probe Wave (dashed amber) -->
                <path id="fourierProbeLeft" d="" fill="none" stroke="#c47c2b" stroke-width="2.5" stroke-dasharray="5,3" opacity="0"/>

                <!-- Resonance Glow Halo -->
                <rect id="col1Glow" x="10" y="10" width="640" height="360" rx="6" fill="rgba(196, 124, 43, 0.06)" stroke="#c47c2b" stroke-width="2" opacity="0"/>
              </svg>
            </div>

            <!-- COL 2: 22% - COSINE PROBE & SIGNED ACCUMULATOR METER -->
            <div class="fourier-col">
              <div class="fourier-col-header">
                <span class="fourier-col-title">② 余弦探针与投影</span>
                <span class="fourier-col-tag tag-amber" id="probeWnTag">cos(2πν̃δ)</span>
              </div>

              <!-- Probe Wave Preview Card -->
              <div class="fourier-probe-card">
                <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                  <small style="color:#556770;font-weight:600;">当前探针齿距</small>
                  <strong id="probeWnText" style="color:#c47c2b;font-family:monospace;font-size:13px;">1700 cm⁻¹</strong>
                </div>
                <svg viewBox="0 0 240 70" style="width:100%;height:55px;">
                  <line x1="5" y1="35" x2="235" y2="35" stroke="#e0d9cc" stroke-width="1"/>
                  <path id="probeMiniWave" d="M5 35 Q30 5 60 35 T120 35 T180 35 T235 35" fill="none" stroke="#c47c2b" stroke-width="2.5"/>
                </svg>
              </div>

              <svg id="windingPlane" viewBox="0 0 360 260" style="width:100%;height:260px;overflow:visible" aria-label="候选波数将同一干涉图绕入复平面">
                <circle cx="180" cy="130" r="5" fill="#0d1b2a"/><circle cx="180" cy="130" r="92" fill="none" stroke="#d9d3c8" stroke-width="1" stroke-dasharray="3 6"/>
                <path id="windingTrace" d="" fill="none" stroke="#1d5b94" stroke-width="3"/>
                <line id="responseVector" x1="180" y1="130" x2="180" y2="130" stroke="#c47c2b" stroke-width="5" stroke-linecap="round"/>
                <text x="180" y="248" text-anchor="middle" fill="#4b5d6c" font-size="16">同一记录 · winding plane</text>
              </svg>

              <!-- Product Multiplier Hint -->
              <div style="font-size:12px;line-height:1.5;color:#556770;padding:6px 0;border-bottom:1px solid #e8e3d8;">
                <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#1d5b94;margin-right:4px;"></span>同号乘积为正 (+)
                <br>
                <span style="display:inline-block;width:8px;height:8px;border-radius:2px;background:#9aa8b5;margin-right:4px;"></span>异号乘积为负 (-)
              </div>

              <!-- Signed Accumulator Meter -->
              <div class="fourier-meter-box">
                <div class="fourier-meter-head">
                  <span>带符号积分累积值 ∫</span>
                  <span class="fourier-meter-val" id="meterValText">0.00</span>
                </div>
                <div class="fourier-meter-track">
                  <div class="fourier-meter-center"></div>
                  <div class="fourier-meter-bar" id="meterBar"></div>
                </div>
                <div style="display:flex;justify-content:space-between;font-size:11px;font-family:monospace;color:#889aa8;margin-top:2px;">
                  <span>-抵消</span>
                  <span>0</span>
                  <span>+累积</span>
                </div>
              </div>
            </div>

            <!-- COL 3: 32% - RECONSTRUCTED SPECTRUM B(ν̃) -->
            <div class="fourier-col">
              <div class="fourier-col-header">
                <span class="fourier-col-title">③ 单光束谱响应 B(ν̃)</span>
                <span class="fourier-col-tag tag-blue">反演光谱</span>
              </div>
              <svg viewBox="0 0 460 380" style="width:100%;height:100%;">
                <line x1="40" y1="320" x2="430" y2="320" stroke="#b0c0c7" stroke-width="1.5"/>
                <line x1="40" y1="320" x2="40" y2="40" stroke="#b0c0c7" stroke-width="1.5"/>
                <text x="40" y="348" fill="#556770" font-size="13" font-family="monospace">4000 cm⁻¹</text>
                <text x="390" y="348" fill="#556770" font-size="13" font-family="monospace">400 cm⁻¹</text>
                <text x="235" y="365" fill="#0d1b2a" font-size="13" font-weight="bold" font-family="monospace" text-anchor="middle">波数 ν̃</text>
                <text x="15" y="45" fill="#556770" font-size="13" font-family="monospace">单光束响应</text>

                <!-- Baseline flat line -->
                <line x1="40" y1="320" x2="430" y2="320" stroke="#cbd5e1" stroke-width="1" stroke-dasharray="2,2"/>

                <!-- Reconstructed Peak 1700 -->
                <path id="fourierPeak1700" d="M40 320 L230 320 Q255 320 265 140 Q275 320 300 320 L430 320" fill="none" stroke="#1d5b94" stroke-width="3" opacity="0"/>
                
                <!-- Full Broadband Spectrum Curve -->
                <path id="fourierFullSpec" d="M40 320 ${Array.from({length: 40}, (_, i) => {
                  const x = 40 + i * 10;
                  const wn = 4000 - i * 90;
                  const p1 = Math.exp(-Math.pow((wn - 1700)/140, 2)) * 180;
                  const p2 = Math.exp(-Math.pow((wn - 2900)/260, 2)) * 130;
                  const bg = Math.sin((x - 40)/390 * Math.PI) * 120;
                  const y = 320 - Math.max(0, bg - p1 - p2 * 0.5);
                  return `L${x.toFixed(1)} ${y.toFixed(1)}`;
                }).join(' ')}" fill="none" stroke="#1d5b94" stroke-width="3.5" opacity="0"/>

                <!-- Synchronized Scanning Cursor Line -->
                <line id="probeCursor" x1="265" y1="320" x2="265" y2="40" stroke="#c47c2b" stroke-width="2" stroke-dasharray="4,3" opacity="0"/>
              </svg>
            </div>
          </div>
        `;
      }

      function updateProbeLeft(freq, active){
        const probe = visual.querySelector('#fourierProbeLeft');
        if(!probe) return;
        if(!active){
          probe.setAttribute('opacity', '0');
          return;
        }
        probe.setAttribute('opacity', '0.75');
        let pts = [];
        for(let i = 0; i <= 60; i++){
          const x = 30 + i * 10;
          const delta = (x - 330) / 50;
          const y = 200 - Math.cos(delta * freq) * 65;
          pts.push(`${i===0?'M':'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
        }
        probe.setAttribute('d', pts.join(' '));
      }

      function setMeter(value, isResonance = false){
        const bar = visual.querySelector('#meterBar');
        const text = visual.querySelector('#meterValText');
        if(!bar || !text) return;
        text.textContent = (value >= 0 ? '+' : '') + value.toFixed(2);
        
        // value ranges from -1 to +1
        const pct = Math.min(100, Math.max(0, 50 + value * 45));
        if(value >= 0){
          bar.style.left = '50%';
          bar.style.width = (pct - 50) + '%';
        } else {
          bar.style.left = pct + '%';
          bar.style.width = (50 - pct) + '%';
        }
        bar.classList.toggle('match-resonance', isResonance);
      }

      function updateWinding(freq, matched){
        const trace=visual.querySelector('#windingTrace'), vec=visual.querySelector('#responseVector'); if(!trace||!vec)return;
        const turns=matched?3.2:5.7, pts=[];
        for(let i=0;i<=180;i++){const t=i/180*Math.PI*2*turns; const r=12+i*.43; const wobble=matched?1:0.58; pts.push(`${i?'L':'M'}${(180+Math.cos(t)*r*wobble).toFixed(1)} ${(130+Math.sin(t)*r*wobble).toFixed(1)}`);}
        trace.setAttribute('d',pts.join(' ')); trace.style.opacity=matched?'1':'.72';
        const len=matched?86:18; vec.setAttribute('x2',(180+len).toFixed(1)); vec.setAttribute('y2','130');
      }

      function applyBeat(){
        const peak = visual.querySelector('#fourierPeak1700');
        const full = visual.querySelector('#fourierFullSpec');
        const cursor = visual.querySelector('#probeCursor');
        const wnTag = visual.querySelector('#probeWnTag');
        const wnText = visual.querySelector('#probeWnText');
        const col1Glow = visual.querySelector('#col1Glow');
        const miniWave = visual.querySelector('#probeMiniWave');

        if(sweepAnim){ sweepAnim.kill(); sweepAnim = null; }

        if(beat === 0){
          takeaway.innerHTML = '傅里叶变换核心机制：<strong>拿候选周期的余弦探针，与整条干涉记录逐点相乘并累积积分。</strong>';
          updateProbeLeft(3.5, true);
          setMeter(0.12, false);
          if(wnTag) wnTag.textContent = '测试探针';
          if(wnText) wnText.textContent = '1000 cm⁻¹';
          if(miniWave) miniWave.setAttribute('d', 'M5 35 Q40 5 80 35 T160 35 T235 35');
          if(peak) peak.setAttribute('opacity', '0');
          if(full) full.setAttribute('opacity', '0');
          if(cursor) cursor.setAttribute('opacity', '0');
          if(col1Glow) col1Glow.setAttribute('opacity', '0');
          updateWinding(1000,false);
        } else if(beat === 1){
          takeaway.innerHTML = '<strong>Case A 失配探针（2200 cm⁻¹）：</strong>正负贡献交替抵消，积分累积趋近于 0，右侧完全不起响应峰。';
          updateProbeLeft(7.8, true);
          setMeter(0.03, false);
          if(wnTag) wnTag.textContent = '失配探针';
          if(wnText) wnText.textContent = '2200 cm⁻¹ (不存在)';
          if(miniWave) miniWave.setAttribute('d', 'M5 35 Q15 15 30 35 T60 35 T90 35 T120 35 T150 35 T180 35 T210 35 T235 35');
          if(peak) peak.setAttribute('opacity', '0');
          if(full) full.setAttribute('opacity', '0');
          if(col1Glow) col1Glow.setAttribute('opacity', '0');
          if(cursor){
            cursor.setAttribute('opacity', '1');
            cursor.setAttribute('x1', '200');
            cursor.setAttribute('x2', '200');
          }
          updateWinding(2200,false);
        } else if(beat === 2){
          takeaway.innerHTML = '<strong>Case B 匹配探针（1700 cm⁻¹）：</strong>探针与固有周期同相共振，大量正贡献同向积聚，累积计猛烈冲高，右侧对应峰拔地而起！';
          updateProbeLeft(3.5, true);
          setMeter(0.92, true);
          if(wnTag) wnTag.textContent = '★ 周期匹配';
          if(wnText) wnText.textContent = '1700 cm⁻¹ (共振检出)';
          if(miniWave) miniWave.setAttribute('d', 'M5 35 Q25 8 50 35 T100 35 T150 35 T200 35 T235 35');
          if(cursor){
            cursor.setAttribute('opacity', '1');
            cursor.setAttribute('x1', '265');
            cursor.setAttribute('x2', '265');
          }
          if(peak) peak.setAttribute('opacity', '1');
          if(full) full.setAttribute('opacity', '0');
          if(col1Glow) col1Glow.setAttribute('opacity', '1');
          updateWinding(1700,true);
        } else {
          takeaway.innerHTML = '<strong>连续扫描还原完整光谱：</strong>数学梳子连续扫过所有可能周期，一次性反演出完整单光束光谱 B(ν̃)（非吸收谱，后续需与背景取比）。';
          if(wnTag) wnTag.textContent = '连续扫描中';
          if(wnText) wnText.textContent = '4000 → 400 cm⁻¹';
          if(col1Glow) col1Glow.setAttribute('opacity', '0');
          if(peak) peak.setAttribute('opacity', '0');
          if(full) full.setAttribute('opacity', '1');
          setMeter(0.75, true);

          if(cursor){
            cursor.setAttribute('opacity', '1');
            sweepAnim = gsap.fromTo(cursor, 
              { attr: { x1: 40, x2: 40 } }, 
              { attr: { x1: 430, x2: 430 }, duration: 4, repeat: -1, ease: 'linear' }
            );
          }
          updateWinding(1700,true);
        }
      }

      return {
        mount(){ beat = 0; renderVisual(); applyBeat(); },
        isBusy(){ return false; },
        jumpToEnd(){ beat = 3; applyBeat(); },
        nextBeat(){
          if(beat < 3){ beat++; applyBeat(); return true; }
          return false;
        },
        prevBeat(){
          if(beat > 0){ beat--; applyBeat(); return true; }
          return false;
        },
        dispose(){ 
          if(sweepAnim) sweepAnim.kill();
          Motion.killTweens(); 
        }
      };
    }

    // =========================================================================
    // SCENE 07: RATIO & ABSORBANCE (连续变换，不割裂)
    // =========================================================================
    function createScene07(){
      let beat = 0;

      function renderVisual(){
        visual.innerHTML = `
          <div class="ratio-layout">
            <svg viewBox="0 0 1440 580" style="width:100%;height:100%;">
              <rect x="60" y="20" width="1320" height="540" rx="8" fill="#fff" stroke="#e8e3d8"/>

              <line x1="120" y1="460" x2="1300" y2="460" stroke="#b0c0c7" stroke-width="2"/>
              <line x1="120" y1="460" x2="120" y2="80" stroke="#b0c0c7" stroke-width="2"/>
              
              <text x="120" y="495" fill="#556770" font-size="16" font-family="monospace">4000 cm⁻¹</text>
              <text x="1250" y="495" fill="#556770" font-size="16" font-family="monospace">400 cm⁻¹</text>
              <text x="710" y="495" fill="#556770" font-size="16" font-family="monospace" text-anchor="middle">波数 ν̃</text>
              <text id="rYLabel" x="50" y="90" fill="#556770" font-size="16" font-family="monospace">单光束 B(ν̃)</text>

              <!-- Curve 1: Background Single-beam -->
              <path id="rCurveBg" d="M120 440 ${Array.from({length: 60}, (_, i) => {
                const x = 120 + i * 20;
                const y = 440 - Math.sin((x - 120)/1180 * Math.PI) * 320;
                return `L${x.toFixed(1)} ${y.toFixed(1)}`;
              }).join(' ')}" fill="none" stroke="#889aa8" stroke-width="3" stroke-dasharray="6,4"/>

              <!-- Curve 2: Sample Single-beam / Transmittance / Absorbance -->
              <path id="rCurveActive" d="" fill="none" stroke="#1d5b94" stroke-width="3.5"/>

              <!-- Floating Equation -->
              <g id="rFormulaGroup" transform="translate(620, 50)">
                <rect x="0" y="0" width="280" height="50" rx="4" fill="#fcfbf8" stroke="#dcd5c7"/>
                <text id="rFormulaTxt" x="140" y="32" fill="#1d5b94" font-size="18" font-family="monospace" font-weight="bold" text-anchor="middle">T = B_smp / B_bg</text>
              </g>
            </svg>
          </div>
        `;
      }

      function updateActiveCurve(mode){
        const path = visual.querySelector('#rCurveActive');
        const yLbl = visual.querySelector('#rYLabel');
        const fTxt = visual.querySelector('#rFormulaTxt');
        if(!path) return;

        let pts = [];
        for(let i = 0; i <= 59; i++){
          const x = 120 + i * 20;
          const wn = 4000 - i * 60;
          const bg = Math.sin((x - 120)/1180 * Math.PI) * 320;

          if(mode === 0){
            // Sample Single-beam (dips in bg)
            const dip = Math.exp(-Math.pow((wn - 1700)/160, 2)) * 180;
            const y = 440 - Math.max(10, bg - dip);
            pts.push(`${i===0?'M':'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
          } else if(mode === 1){
            // Transmittance T (flattened 100% baseline with downward absorption valleys)
            const dip = Math.exp(-Math.pow((wn - 1700)/160, 2)) * 260;
            const y = 140 + dip;
            pts.push(`${i===0?'M':'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
          } else {
            // Absorbance A (peaks flipped upward!)
            const peak = Math.exp(-Math.pow((wn - 1700)/160, 2)) * 300;
            const y = 440 - peak;
            pts.push(`${i===0?'M':'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
          }
        }
        path.setAttribute('d', pts.join(' '));

        if(mode === 0){
          if(yLbl) yLbl.textContent = '单光束 B(ν̃)';
          if(fTxt) fTxt.textContent = '样品放入：特征吸收';
        } else if(mode === 1){
          if(yLbl) yLbl.textContent = '透过率 T (%)';
          if(fTxt) fTxt.textContent = 'T = B_smp / B_bg';
        } else {
          if(yLbl) yLbl.textContent = '吸光度 A';
          if(fTxt) fTxt.textContent = 'A = -log₁₀(T)';
        }
      }

      function applyBeat(){
        const bgCurve = visual.querySelector('#rCurveBg');
        if(beat === 0){
          takeaway.innerHTML = '背景谱包含光源、光学系统和探测器共同的响应；放入样品后，特征波数处光强下陷。';
          if(bgCurve) bgCurve.setAttribute('opacity', '1');
          updateActiveCurve(0);
        } else if(beat === 1){
          takeaway.innerHTML = '背景参比消噪：<strong>共同的系统响应大部分被参比抵消</strong>，得到平直基线的透射谱 T。';
          if(bgCurve) bgCurve.setAttribute('opacity', '0.2');
          updateActiveCurve(1);
        } else {
          takeaway.innerHTML = '<strong>对数转换 A = -log₁₀(T)</strong>：吸收峰向上翻转，在合适实验条件下便于进行定量分析。';
          if(bgCurve) bgCurve.setAttribute('opacity', '0');
          updateActiveCurve(2);
        }
      }

      return {
        mount(){ beat = 0; renderVisual(); applyBeat(); },
        isBusy(){ return false; },
        jumpToEnd(){ beat = 2; applyBeat(); },
        nextBeat(){
          if(beat < 2){ beat++; applyBeat(); return true; }
          return false;
        },
        prevBeat(){
          if(beat > 0){ beat--; applyBeat(); return true; }
          return false;
        },
        dispose(){ Motion.killTweens(); }
      };
    }

    // =========================================================================
    // SCENE 08: REAL REFERENCE FINGERPRINT (丙酮标准谱与 C=O 振动闭环)
    // =========================================================================
    function createScene08(){
      let beat = 0;
      let reference = 'acetone';
      let realData = null;

      function renderVisual(){
        visual.innerHTML = `
          <div class="fingerprint-layout">
            <div style="background:#fff;border:1px solid #e8e3d8;border-radius:8px;padding:24px;height:520px;box-sizing:border-box;display:flex;flex-direction:column;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;">
                <span id="refTitle" style="font-size:24px;font-weight:700;color:#0d1b2a;">真实标准参考光谱 · 丙酮（液体）</span>
                <button id="refEthanol" style="font-size:16px;color:#1d5b94;background:transparent;border:0;border-bottom:1px solid currentColor;padding:4px 0;cursor:pointer">换一个样品：乙醇</button>
                <span style="font-size:13px;font-family:monospace;color:#c47c2b;background:#fcf4e8;padding:3px 8px;border-radius:4px;">纵轴：虚部折射率 k</span>
              </div>
              <svg viewBox="0 0 1000 400" style="width:100%;height:100%;">
                <line x1="60" y1="340" x2="940" y2="340" stroke="#b0c0c7" stroke-width="2"/>
                <line x1="60" y1="340" x2="60" y2="40" stroke="#b0c0c7" stroke-width="2"/>
                
                <text x="60" y="375" fill="#556770" font-size="14" font-family="monospace">4000 cm⁻¹</text>
                <text x="900" y="375" fill="#556770" font-size="14" font-family="monospace">400 cm⁻¹</text>
                <text x="500" y="375" fill="#556770" font-size="14" font-family="monospace" text-anchor="middle">波数 ν̃</text>
                <text x="15" y="55" fill="#556770" font-size="14" font-family="monospace">消光系数 k</text>

                <!-- Acetone k Spectrum Path -->
                <path id="realReferencePath" d="M60 340 
                  L260 338 Q290 330 300 290 Q310 338 340 338 
                  L480 338 Q500 335 520 60 Q540 335 560 338 
                  L660 338 Q680 300 700 240 Q720 338 740 338 
                  L820 338 Q850 270 870 200 Q890 338 940 338" 
                  fill="none" stroke="#1d5b94" stroke-width="3"/>

                <!-- C=O Highlight Pin -->
                <g id="pinCO" transform="translate(520, 60)">
                  <circle cx="0" cy="0" r="6" fill="#c47c2b"/>
                  <line x1="0" y1="0" x2="0" y2="-30" stroke="#c47c2b" stroke-width="2"/>
                  <text x="0" y="-38" fill="#c47c2b" font-size="16" font-family="monospace" font-weight="bold" text-anchor="middle">1715 cm⁻¹ · C=O 羰基强吸收</text>
                </g>
              </svg>
            </div>

            <!-- Micro Molecule Vibration Link -->
            <div style="background:#fff;border:1px solid #e8e3d8;border-radius:8px;padding:24px;height:520px;box-sizing:border-box;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;">
              <span style="font-size:14px;color:#556770;margin-bottom:12px;">微观官能团振动</span>
              <strong style="font-size:20px;color:#0d1b2a;margin-bottom:20px;">C=O 碳氧双键伸缩</strong>
              <svg viewBox="0 0 200 200" style="width:180px;height:180px;">
                <line x1="100" y1="130" x2="100" y2="60" stroke="#718290" stroke-width="8" stroke-linecap="round"/>
                <circle cx="100" cy="140" r="26" fill="#2d3748"/>
                <text x="100" y="147" fill="#fff" font-size="18" font-weight="bold" text-anchor="middle">C</text>
                <circle cx="100" cy="50" r="28" fill="#e53e3e"/>
                <text x="100" y="57" fill="#fff" font-size="18" font-weight="bold" text-anchor="middle">O</text>
              </svg>
              <p style="font-size:14px;line-height:1.6;color:#556770;margin:16px 0 0 0;">
                吸收带来源于正常振动模式；特征带与整体谱形共同提供官能团和结构判断线索。
              </p>
            </div>
          </div>
        `;
      }

      function drawReference(){
        const path = visual.querySelector('#realReferencePath');
        if(!path || !realData) return;
        const xs = realData.x, ys = realData.y;
        const lo=400, hi=4000, stride=Math.max(1,Math.floor(xs.length/900));
        const pts=[]; let max=0;
        for(let i=0;i<ys.length;i+=stride){ if(xs[i]>=lo&&xs[i]<=hi) max=Math.max(max,ys[i]); }
        for(let i=0;i<ys.length;i+=stride){ const wn=xs[i]; if(wn<lo||wn>hi) continue; const x=60+(hi-wn)/(hi-lo)*880; const y=340-(ys[i]/Math.max(max,1e-9))*280; pts.push(`${pts.length?'L':'M'}${x.toFixed(2)} ${y.toFixed(2)}`); }
        path.setAttribute('d',pts.join(' '));
        path.setAttribute('pathLength','1'); path.style.strokeDasharray='1'; path.style.strokeDashoffset='1';
        if(window.gsap) gsap.to(path,{strokeDashoffset:0,duration:1.8,ease:'none'}); else path.style.strokeDashoffset='0';
        const title=visual.querySelector('#refTitle'); if(title) title.textContent=`真实标准参考光谱 · ${reference==='acetone'?'丙酮':'乙醇'}（液体）`;
        const pin=visual.querySelector('#pinCO'); if(pin) pin.style.display=reference==='acetone'?'':'none';
      }

      async function loadReference(name){
        try { const res=await fetch(`./reference-data/processed/${name}.json`); realData=await res.json(); reference=name; drawReference(); }
        catch(err){ console.warn('reference data unavailable',err); }
      }

      function applyBeat(){
        takeaway.innerHTML = '<strong>真实世界的红外指纹：</strong>吸收带来源于正常振动模式；1715 cm⁻¹ 尖锐吸收峰与丙酮分子 C=O 振荡形成闭环。';
      }

      return {
        mount(){ beat = 0; renderVisual(); applyBeat(); visual.querySelector('#realReferencePath')?.setAttribute('id','realReferencePath'); visual.querySelector('#refEthanol')?.addEventListener('click',e=>{e.stopPropagation();loadReference(reference==='acetone'?'ethanol':'acetone');}); loadReference('acetone'); },
        isBusy(){ return false; },
        jumpToEnd(){},
        nextBeat(){ return false; },
        prevBeat(){ return false; },
        dispose(){ Motion.killTweens(); }
      };
    }

    // =========================================================================
    // SCENE 09 · RETURN TO THE REAL BAND, THEN CLOSE THE CAUSAL LOOP
    // =========================================================================
    function createScene09(){
      let beat = 0;
      let timeline = null;
      let busy = false;
      let deadScene = false;
      let spectrumData = null;
      let spectrumStatus = 'loading';
      let spectrumMax = null;
      const spectrumPlotTop = 120;
      const spectrumPlotBottom = 420;
      const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
      const aborter = new AbortController();

      function renderVisual(){
        visual.innerHTML = `
          <div class="n9-continuous">
            <svg viewBox="0 0 1440 620" role="img" aria-label="真实丙酮参考谱由羰基吸收带连接到分子振动，再收束为 FTIR 连续因果链">
              <defs>
                <marker id="n9Arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#1d5b94"/></marker>
                <marker id="n9ArrowGold" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0,0 L8,4 L0,8 Z" fill="#c47c2b"/></marker>
              </defs>

              <svg id="n9-spectrum" x="150" y="20" width="1140" height="540" viewBox="0 0 1000 500" preserveAspectRatio="none">
                <text x="20" y="34" class="n9-real-label">PNNL 真实参考谱 · 丙酮（液体）</text>
                <text x="20" y="72" class="n9-subtitle">纵轴 k：虚部折射率，与吸收有关</text>
                <path d="M70 420 H950 M70 420 V120" class="n9-axis"/>
                <path id="n9-spectrum-path" fill="none" stroke="#1d5b94" stroke-width="4" stroke-linejoin="round"/>
                <line id="n9-peak-line" x1="510" y1="115" x2="510" y2="420" stroke="#c47c2b" stroke-width="3" stroke-dasharray="7 7"/>
                <circle id="n9-peak-dot" cx="510" cy="115" r="8" fill="#c47c2b"/>
                <text id="n9-peak-label" x="510" y="96" class="n9-peak-label" text-anchor="middle">1715 cm⁻¹ 附近</text>
                <text x="510" y="474" class="n9-axis-label" text-anchor="middle">波数 / cm⁻¹</text>
                <text x="24" y="255" class="n9-axis-label" text-anchor="middle" transform="rotate(-90 24 255)">k（无量纲）</text>
                <text id="n9-k-max" x="55" y="124" class="n9-tick" text-anchor="end"></text>
                <text id="n9-k-zero" x="55" y="424" class="n9-tick" text-anchor="end">0</text>
                <text id="n9-load-status" x="510" y="285" class="n9-load-status" text-anchor="middle">正在读取本地真实谱数据…</text>
                <text x="70" y="448" class="n9-tick">1950</text><text x="510" y="448" class="n9-tick" text-anchor="middle">1715</text><text x="950" y="448" class="n9-tick" text-anchor="end">1480</text>
              </svg>

              <g id="n9-mode-link">
                <path d="M725 200 C835 130 900 130 985 205" fill="none" stroke="#c47c2b" stroke-width="4" marker-end="url(#n9ArrowGold)"/>
                <g transform="translate(1130 230)">
                  <text x="0" y="-115" class="n9-mode-title" text-anchor="middle">丙酮 C=O 伸缩</text>
                  <line x1="-75" y1="-9" x2="72" y2="-9" stroke="#667985" stroke-width="6"/>
                  <line x1="-75" y1="9" x2="72" y2="9" stroke="#667985" stroke-width="6"/>
                  <circle cx="-105" cy="0" r="33" fill="#243746"/><circle cx="105" cy="0" r="37" fill="#bd4a3c"/>
                  <text x="-105" y="10" class="n9-atom">C</text><text x="105" y="10" class="n9-atom">O</text>
                  <line x1="-58" y1="65" x2="-118" y2="65" class="n9-mode-arrow" marker-end="url(#n9Arrow)"/>
                  <line x1="58" y1="65" x2="118" y2="65" class="n9-mode-arrow" marker-end="url(#n9Arrow)"/>
                </g>
                <g transform="translate(925 392)">
                  <text x="0" y="0" class="n9-explain"><tspan font-weight="700">峰位</tspan><tspan> 对应振动能量尺度</tspan></text>
                  <text x="0" y="42" class="n9-explain"><tspan font-weight="700">强度</tspan><tspan> 还与样品和测量条件有关</tspan></text>
                </g>
              </g>

              <g id="n9-causal-chain">
                <path d="M95 310 C250 185 365 435 515 310 S780 185 930 310 S1190 435 1345 310" fill="none" stroke="#1d5b94" stroke-width="6" marker-end="url(#n9Arrow)"/>
                ${[
                  ['分子振动',130,205],['选择性吸收',320,415],['光程差编码',505,205],['干涉图',695,415],['傅里叶变换',875,205],['样品 ÷ 背景',1085,415],['分子线索',1310,205]
                ].map((item,i)=>`<g class="n9-chain-step" transform="translate(${item[1]} ${item[2]})">
                  <circle cx="0" cy="0" r="7" fill="${i===6?'#c47c2b':'#1d5b94'}"/>
                  <text x="0" y="${i%2===0?'-20':'32'}" class="n9-chain-label" text-anchor="middle">${item[0]}</text>
                </g>`).join('')}
              </g>
            </svg>
          </div>`;
      }

      function spectrumPoints(){
        if(Array.isArray(spectrumData?.x) && Array.isArray(spectrumData?.y) && spectrumData.x.length === spectrumData.y.length){
          const pairs=[];
          for(let i=0;i<spectrumData.x.length;i+=2){
            const x=spectrumData.x[i];
            const y=spectrumData.y[i];
            if(Number.isFinite(x) && Number.isFinite(y) && x<=1950 && x>=1480) pairs.push([x,y]);
          }
          if(pairs.length) return pairs;
        }
        return [];
      }

      function drawSpectrum(){
        const path=visual.querySelector('#n9-spectrum-path');
        if(!path) return;
        const pairs=spectrumPoints();
        const hasData = spectrumStatus === 'ready' && pairs.length > 0;
        path.setAttribute('d',hasData ? pairs.map((p,i)=>`${i?'L':'M'}${(70+(1950-p[0])/470*880).toFixed(2)} ${(spectrumPlotBottom-(p[1]/spectrumMax)*(spectrumPlotBottom-spectrumPlotTop)).toFixed(2)}`).join(' ') : '');
        ['n9-peak-line','n9-peak-dot','n9-peak-label'].forEach(id=>{const el=visual.querySelector('#'+id);if(el)el.style.display=hasData?'':'none';});
        const status=visual.querySelector('#n9-load-status'); if(status){
          status.innerHTML=spectrumStatus==='loading'?'正在读取本地真实谱数据…':spectrumStatus==='error'?'<tspan x="510" dy="0">真实谱数据读取失败</tspan><tspan x="510" dy="26">请通过本地服务重试</tspan>':'';
          status.style.display=hasData?'none':'';
        }
        const maxLabel=visual.querySelector('#n9-k-max'); if(maxLabel) maxLabel.textContent=hasData?spectrumMax.toPrecision(3):'';
        if(!hasData) return;
        let nearest=pairs[0]; pairs.forEach(p=>{if(Math.abs(p[0]-1715)<Math.abs(nearest[0]-1715))nearest=p;});
        const px=70+(1950-nearest[0])/470*880, py=spectrumPlotBottom-nearest[1]/spectrumMax*(spectrumPlotBottom-spectrumPlotTop);
        ['n9-peak-line','n9-peak-dot','n9-peak-label'].forEach(id=>{const el=visual.querySelector('#'+id);if(el)el.setAttribute('x1',px);});
        const line=visual.querySelector('#n9-peak-line'); if(line){line.setAttribute('x1',px);line.setAttribute('x2',px);line.setAttribute('y1',py);}
        const dot=visual.querySelector('#n9-peak-dot'); if(dot){dot.setAttribute('cx',px);dot.setAttribute('cy',py);}
        const label=visual.querySelector('#n9-peak-label'); if(label){label.setAttribute('x',px);label.setAttribute('y',Math.max(85,py-18));}
      }

      function show(id,on){const el=visual.querySelector('#'+id);if(el)el.style.opacity=on?'1':'0';}
      function updateTakeaway(){
        takeaway.innerHTML=[
          spectrumStatus === 'loading' ? '正在读取本地参考谱…' : spectrumStatus === 'error' ? '参考谱读取失败；按 R 重试。' : '这一吸收带提示 C=O 振动；先把光谱特征连回分子中的运动。',
          spectrumStatus === 'loading' ? '正在读取本地参考谱…' : spectrumStatus === 'error' ? '参考谱读取失败；按 R 重试。' : '<strong>一条峰只是线索；判断材料，还要结合整段谱形和测量条件。</strong>',
          '分子结构影响振动，也影响吸收。测量与计算把这些差异变成可比较的光谱线索。'
        ][beat];
      }
      function applyStable(targetBeat,animate){
        beat=Math.max(0,Math.min(2,targetBeat));
        timeline?.kill?.();timeline=null;busy=false;
        const spectrum=visual.querySelector('#n9-spectrum');
        if(spectrum){
          spectrum.setAttribute('x',beat===0?'150':'40');
          spectrum.setAttribute('width',beat===0?'1140':'800');
          spectrum.style.opacity=beat===2?'0':'1';
        }
        show('n9-mode-link',beat===1 && spectrumStatus==='ready');
        show('n9-causal-chain',beat===2);
        drawSpectrum();
        updateTakeaway();
        const canAnimate = beat === 2 || (beat === 1 && spectrumStatus === 'ready');
        if(animate&&!reduced&&window.gsap&&canAnimate){
          busy=true;
          const target=beat===2?visual.querySelector('#n9-causal-chain'):visual.querySelector(beat===1?'#n9-mode-link':'#n9-spectrum');
          timeline=gsap.timeline({onComplete(){busy=false;timeline=null;}});
          timeline.fromTo(target,{opacity:0},{opacity:1,duration:.65,ease:'power2.out'});
          if(beat===2) timeline.fromTo(visual.querySelectorAll('.n9-chain-step'),{opacity:0},{opacity:1,duration:.24,stagger:.12},.05);
        }
      }

      async function loadSpectrum(){
        try{
          const response=await fetch('./reference-data/processed/acetone.json',{signal:aborter.signal});
          if(!response.ok) throw new Error('reference spectrum unavailable');
          spectrumData=await response.json();
          const xs=spectrumData?.x, ys=spectrumData?.y;
          if(!Array.isArray(xs)||!Array.isArray(ys)||!xs.length||xs.length!==ys.length) throw new Error('invalid reference spectrum arrays');
          if(!xs.every((x,i)=>Number.isFinite(x)&&Number.isFinite(ys[i]))) throw new Error('reference spectrum contains non-finite data');
          if(!xs.every((x,i)=>i===0||x<xs[i-1])) throw new Error('reference spectrum x axis is not descending');
          if(spectrumData?.axes?.y?.symbol!=='k') throw new Error('reference spectrum y axis is not k');
          const intervalValues=[];
          for(let i=0;i<xs.length;i++){
            const x=xs[i], y=ys[i];
            if(Number.isFinite(x)&&Number.isFinite(y)&&x<=1950&&x>=1480) intervalValues.push(y);
          }
          if(!intervalValues.length) throw new Error('reference spectrum has no points in display range');
          const intervalMax=Math.max(...intervalValues);
          if(!(intervalMax>0)) throw new Error('empty reference spectrum');
          spectrumMax=Math.ceil(intervalMax*10)/10;
          spectrumStatus='ready';
          if(!deadScene){ drawSpectrum(); show('n9-mode-link',beat===1 && spectrumStatus==='ready'); updateTakeaway(); }
        }catch(err){
          if(err?.name!=='AbortError'){ spectrumData=null; spectrumMax=null; spectrumStatus='error'; if(!deadScene){ drawSpectrum(); show('n9-mode-link',false); updateTakeaway(); } console.warn('reference spectrum unavailable',err); }
        }
      }

      return {
        mount(){deadScene=false;renderVisual();applyStable(0,false);loadSpectrum();},
        isBusy(){return busy;},
        cancelMotion(){timeline?.kill?.();timeline=null;busy=false;},
        getState(){return {beat};},
        jumpToEnd(){applyStable(2,false);},
        nextBeat(){if(beat<2){applyStable(beat+1,true);return true;}return false;},
        prevBeat(){if(beat>0){applyStable(beat-1,false);return true;}return false;},
        dispose(){deadScene=true;aborter.abort();timeline?.kill?.();timeline=null;busy=false;if(window.gsap)gsap.killTweensOf(visual.querySelectorAll('*'));}
      };
    }

    // Legacy map kept outside the active story path.
    function createScene09Legacy(){
      let beat = 0;

      function renderVisual(){
        visual.innerHTML = `
          <div class="summary-flow-layout">
            <svg viewBox="0 0 1440 540" style="width:100%;height:100%;">
              <!-- Background Flow Rail -->
              <path d="M120 270 L1320 270" stroke="#e2ded5" stroke-width="4" stroke-dasharray="8,6"/>
              
              <!-- 6 Nodes on Single Continuous Rail -->
              ${[
                { num: '01', title: '分子振动', desc: '偶极交变 Δμ≠0' },
                { num: '02', title: '光程差编码', desc: '往返 Δδ=2Δx' },
                { num: '03', title: '干涉图叠加', desc: '同相 Centerburst' },
                { num: '04', title: '傅里叶反演', desc: '余弦探针找回波数' },
                { num: '05', title: '背景参比', desc: 'T = B_smp / B_bg' },
                { num: '06', title: '分子指纹', desc: '特征峰与定量分析' }
              ].map((node, i) => {
                const cx = 140 + i * 230;
                return `
                  <g class="flow-node" transform="translate(${cx}, 270)">
                    <circle cx="0" cy="0" r="38" fill="#fff" stroke="#1d5b94" stroke-width="3"/>
                    <text x="0" y="7" fill="#1d5b94" font-size="20" font-family="monospace" font-weight="bold" text-anchor="middle">${node.num}</text>
                    <text x="0" y="-55" fill="#0d1b2a" font-size="18" font-weight="bold" text-anchor="middle">${node.title}</text>
                    <text x="0" y="65" fill="#556770" font-size="14" font-family="monospace" text-anchor="middle">${node.desc}</text>
                  </g>
                `;
              }).join('')}

              <!-- 3 Camera Scales bracket at bottom -->
              <g transform="translate(0, 420)">
                <line x1="100" y1="20" x2="360" y2="20" stroke="#889aa8" stroke-width="2"/>
                <text x="230" y="45" fill="#889aa8" font-size="15" font-weight="bold" text-anchor="middle">分子尺度 (微观吸收)</text>

                <line x1="420" y1="20" x2="780" y2="20" stroke="#889aa8" stroke-width="2"/>
                <text x="600" y="45" fill="#889aa8" font-size="15" font-weight="bold" text-anchor="middle">仪器尺度 (空间编码)</text>

                <line x1="840" y1="20" x2="1340" y2="20" stroke="#889aa8" stroke-width="2"/>
                <text x="1090" y="45" fill="#889aa8" font-size="15" font-weight="bold" text-anchor="middle">信号尺度 (数学解码)</text>
              </g>
            </svg>
          </div>
        `;
      }

      function applyBeat(){
        takeaway.innerHTML = '<strong>从分子微观振动，到一张可解释的红外光谱：</strong>全流程物理与数学的严密闭环。';
      }

      return {
        mount(){ beat = 0; renderVisual(); applyBeat(); },
        isBusy(){ return false; },
        jumpToEnd(){},
        nextBeat(){ return false; },
        prevBeat(){ return false; },
        dispose(){ Motion.killTweens(); }
      };
    }

    // Scene Factory
    function getScene(idx){
      if(idx >= 2 && idx <= 7 && window.FTIRScientificStage){
        return window.FTIRScientificStage.mount(visual, {scene:idx,
          onScene(index, heading){state.slide=index;badge.textContent=SLIDES[index].kicker;title.textContent=heading;},
          onNote(message){takeaway.textContent=message;}
        });
      }
      switch(idx){
        case 0: return createScene01();
        case 1: return createScene02();
        case 2: return createScene03();
        case 3: return createScene04();
        case 4: return createScene05();
        case 5: return createScene06();
        case 6: return createScene07();
        case 7: return createScene08();
        case 8: return createScene09();
        default: return createScene01();
      }
    }

    function readActiveState(){
      try { return activeScene?.getState?.() || {}; }
      catch(_) { return {}; }
    }

    function refreshNav(){
      const sceneState = readActiveState();
      const sceneBeat = Number(sceneState.beat);
      state.beat = Number.isFinite(sceneBeat) ? sceneBeat : 0;
      if(prevBtn) prevBtn.style.visibility = (state.slide > 0 || state.beat > 0) ? 'visible' : 'hidden';
      if(nextPrompt){
        const opensLab = state.slide === SLIDES.length - 1 && state.beat >= 2;
        nextPrompt.dataset.action = opensLab && !suspended ? 'open-lab' : 'advance';
        nextPrompt.innerHTML = suspended ? '点击画面恢复 <span>→</span>' : opensLab ? '进入模拟实验室 <span>→</span>' : '点击画面继续 <span>→</span>';
      }
    }

    function openSimulationLab(){
      if(typeof window.FTIRSimulationLab?.open === 'function'){
        window.FTIRSimulationLab.open();
        return;
      }
      document.dispatchEvent(new CustomEvent('ftir:open-simulation-lab', {
        bubbles: true,
        detail: { source: 'story-closure', scene: 8 }
      }));
    }

    function waitingToResume(){return suspended || !!readActiveState().suspended;}
    function resumeOnAction(){
      if(document.hidden)return true;
      const waiting=waitingToResume();
      window.gsap?.globalTimeline.resume();
      if(!waiting)return false;
      suspended=false;
      activeScene?.resumeMotion?.();
      refreshNav();
      return true;
    }
    function cancelSuspension(){
      if(!waitingToResume())return;
      suspended=false;
      activeScene?.cancelMotion?.();
      window.gsap?.globalTimeline.resume();
    }
    function nextSceneBeat(){
      if(resumeOnAction())return true;
      if(isTransitioning || activeScene?.isBusy?.()) return false;
      const advanced = !!activeScene?.nextBeat?.();
      refreshNav();
      return advanced;
    }

    function previousSceneBeat(){
      cancelSuspension();
      if(isTransitioning || activeScene?.isBusy?.()) return false;
      const retreated = !!activeScene?.prevBeat?.();
      refreshNav();
      return retreated;
    }

    // Switch Scene
    function goToSlide(newIdx){
      if(newIdx < 0 || newIdx >= SLIDES.length) return;
      suspended=false;
      if(!document.hidden)window.gsap?.globalTimeline.resume();
      if(activeScene){
        activeScene.dispose();
        activeScene = null;
      }
      state.slide = newIdx;
      state.beat = 0;

      const s = SLIDES[newIdx];
      badge.innerHTML = s.kicker;
      title.textContent = s.title;

      activeScene = getScene(newIdx);
      activeScene.mount();
      refreshNav();
    }

    // Stage advance
    function advance(){
      if(isTransitioning) return;
      if(resumeOnAction()) return;
      if(activeScene?.isBusy?.()) return;
      if(nextPrompt?.dataset.action === 'open-lab'){
        openSimulationLab();
        return;
      }
      if(nextSceneBeat()) return;
      if(state.slide < SLIDES.length - 1){
        goToSlide(state.slide + 1);
      }
      refreshNav();
    }

    function retreat(){
      cancelSuspension();
      if(isTransitioning || activeScene?.isBusy?.()) return;
      if(previousSceneBeat()) return;
      if(state.slide > 0){
        goToSlide(state.slide - 1);
      }
      refreshNav();
    }

    // Event Bindings
    stage.addEventListener('click', e => {
      if(e.target.closest('button, a, input, select, .th3d-cam-btn, .det-switch-btn')) return;
      advance();
    });

    nextPrompt?.addEventListener('click', e => {
      e.stopPropagation();
      advance();
    });
    nextPrompt?.addEventListener('keydown', e => {
      if(e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      e.stopPropagation();
      if(!e.repeat) advance();
    });

    prevBtn?.addEventListener('click', e => {
      e.stopPropagation();
      retreat();
    });

    exitBtn?.addEventListener('click', e => {
      e.stopPropagation();
      go?.('home');
    });

    function onKeyDown(e){
      if(e.repeat || e.target.closest('input,select,textarea,button,a,[contenteditable=true]')) return;
      if(e.key === ' ' || e.key === 'ArrowRight' || e.key === 'PageDown'){
        e.preventDefault();
        advance();
      } else if(e.key === 'ArrowLeft' || e.key === 'PageUp'){
        e.preventDefault();
        retreat();
      } else if(e.key === 'r' || e.key === 'R'){
        goToSlide(state.slide);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    function onVisibility(){
      if(document.hidden){
        suspended = suspended || !!activeScene?.isBusy?.();
        activeScene?.suspendMotion?.();
        window.gsap?.globalTimeline.pause();
        refreshNav();
      }
    }
    document.addEventListener('visibilitychange',onVisibility);

    // Initial Mount
    goToSlide(state.slide);

    window.__ftirStory = {
      goToSlide,
      advance,
      retreat,
      nextBeat: nextSceneBeat,
      prevBeat: previousSceneBeat,
      getState: () => {
        const sceneState = readActiveState();
        const sceneBeat = Number(sceneState.beat);
        const beat = Number.isFinite(sceneBeat) ? sceneBeat : state.beat;
        return { ...sceneState, slide: state.slide, beat, suspended:waitingToResume(), busy: !!isTransitioning || !!activeScene?.isBusy?.() };
      },
      getActiveScene: () => activeScene,
      toggleSilentMode: (silent) => {
        const vp = host.querySelector('.theater-viewport');
        if(!vp) return;
        if(silent !== undefined) vp.classList.toggle('silent-mode', !!silent);
        else vp.classList.toggle('silent-mode');
      }
    };
    window.__ftirPresentation = window.__ftirStory;

    return {
      dispose(){
        dead = true;
        suspended=false;
        document.removeEventListener('visibilitychange',onVisibility);
        window.gsap?.globalTimeline.resume();
        const disposedController = window.__ftirStory;
        window.__ftirStory = null;
        if(window.__ftirPresentation === disposedController) window.__ftirPresentation = null;
        state.slide = 0;
        state.beat = 0;
        window.removeEventListener('resize', resize);
        window.removeEventListener('keydown', onKeyDown);
        if(activeScene){
          activeScene.dispose();
          activeScene = null;
        }
        if(instrumentInstance){
          try { instrumentInstance.dispose(); } catch(_){}
          instrumentInstance = null;
        }
        Motion.killTweens();
        host.innerHTML = '';
      }
    };
  };

})();
