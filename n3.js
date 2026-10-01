/* N3 scientific stage. Physical values, teaching progress and rendering stay separate. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FTIRN3=api;
})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const STEPS=Object.freeze([
    {title:'光如何分成两路，再重合？',note:'两臂往返，在同一输出端重合。',duration:1800,hold:6200},
    {title:'移动镜子，探测器读数如何变化？',note:'只改变动镜位置，固定臂保持不变。',duration:2600,hold:4400},
    {title:'为什么光程变化是位移的两倍？',note:'去程与回程，各增加一段相同的路程。',duration:3200,hold:5800},
    {title:'如何把探测响应记录下来？',note:'同一镜位，对应同一个光程差和探测响应。',duration:5000,hold:5000},
    {title:'不同波数，留下怎样的周期？',note:'两次单波数教学比较，共用同一光程差范围。',duration:4500,hold:5500},
    {title:'波数越高，编码周期越短',note:'相同 10 μm 光程差范围：一个周期，对三个周期。',duration:0,hold:6000}
  ]);
  const clamp=(v,a,b)=>Math.max(a,Math.min(b,Number(v)||0));
  function mirrorAt(step,p){
    if(step===1)return 3.75*p;
    if(step===2)return 3.75;
    if(step===3){if(p<.18)return 3.75*(1-p/.18);return 5*clamp((p-.18)/.82,0,1);}
    if(step===4){if(p<.16)return 5*(1-p/.16);return 5*clamp((p-.16)/.84,0,1);}
    return step===5?5:0;
  }
  function initialState(o={}){
    const step=Math.round(clamp(o.initialStep||0,0,5));
    return {step,progress:1,mirrorUm:mirrorAt(step,1),auto:false,paused:true,holdMs:0,reducedMotion:!!o.reducedMotion,exploring:false,exit:0};
  }
  function enter(s,step,auto=false){
    const p=s.reducedMotion||!STEPS[step].duration?1:0;
    return {...s,step,progress:p,mirrorUm:mirrorAt(step,p),paused:!auto&&p===1,auto,holdMs:0,exit:0,exploring:false};
  }
  function reduce(s,a={}){
    switch(a.type){
      case 'NEXT':
        if(s.progress<1)return {...s,progress:1,mirrorUm:mirrorAt(s.step,1),auto:false,paused:true,holdMs:0};
        return s.step===5?{...s,auto:false,paused:true,exit:1}:enter(s,s.step+1);
      case 'PREV':
        return s.step===0?{...s,auto:false,paused:true,exit:-1}:initialState({initialStep:s.step-1,reducedMotion:s.reducedMotion});
      case 'REPLAY':return initialState({reducedMotion:s.reducedMotion});
      case 'TOGGLE_AUTO':
        if(s.auto&&!s.paused)return {...s,paused:true};
        // The sixth stop is terminal for Auto; only the explicit final Next exits N3.
        if(s.step===5&&s.progress===1)return {...s,auto:false,paused:true,holdMs:0,exit:0};
        if(s.step===0&&s.progress===1&&s.holdMs===0&&!s.reducedMotion)return {...s,progress:0,auto:true,paused:false,exit:0};
        return {...s,auto:true,paused:false,exit:0};
      case 'PAUSE':return {...s,paused:true};
      case 'TOGGLE_PAUSE':
        if(s.progress===1&&!s.auto)return s;
        return {...s,paused:!s.paused};
      case 'SET_MIRROR':return {...s,mirrorUm:clamp(a.value,0,5),paused:true,auto:false};
      case 'EXPLORE':return {...s,exploring:!s.exploring,mirrorUm:5,auto:false,paused:true};
      case 'REDUCED':return {...s,reducedMotion:!!a.value,paused:true,auto:false,progress:1,mirrorUm:mirrorAt(s.step,1)};
      default:return s;
    }
  }
  function advance(state,dtMs){
    let s={...state},dt=Math.max(0,Number(dtMs)||0);
    if(s.paused)return s;
    // Consume elapsed time across action and hold boundaries; no independent Auto storyline.
    while(dt>0&&!s.paused){
      if(s.progress<1){
        const duration=STEPS[s.step].duration,remaining=(1-s.progress)*duration,used=Math.min(dt,remaining);
        s.progress=clamp(s.progress+used/duration,0,1);s.mirrorUm=mirrorAt(s.step,s.progress);dt-=used;
        if(s.progress===1&&!s.auto)s.paused=true;
      }else if(s.auto){
        const used=Math.min(dt,STEPS[s.step].hold-s.holdMs);s.holdMs+=used;dt-=used;
        if(s.holdMs>=STEPS[s.step].hold){
          if(s.step===5)s={...s,paused:true,auto:false,holdMs:0};
          else s=enter(s,s.step+1,true);
        }
      }else s.paused=true;
    }
    return s;
  }
  function derive(s){
    const mirrorUm=clamp(s.mirrorUm,0,5),opdUm=2*mirrorUm;
    const power=w=>(1+Math.cos(2*Math.PI*w*opdUm*1e-4))/2;
    return {mirrorUm,opdUm,power1000:power(1000),power3000:power(3000),step:s.step,progress:s.progress};
  }
  // Equal one-way display lengths at x=0. Screen y reverses optics.js's +z.
  function geometry(x){
    const mirrorX=330+clamp(x,0,5)*14;
    return {splitter:[200,190],fixed:[200,60],moving:[mirrorX,190],source:[55,190],detector:[200,315],
      normal:[Math.SQRT1_2,Math.SQRT1_2],mirrorX};
  }
  function curve(w,upto=10){
    const out=[];for(let i=0;i<=360;i++){const d=10*i/360;if(d>upto+1e-9)break;
      out.push((i?'L':'M')+(56+d*44).toFixed(2)+' '+(112-64*(1+Math.cos(2*Math.PI*w*d*1e-4))/2).toFixed(2));}
    return out.join(' ');
  }
  function mount(host,options={}){
    const media=window.matchMedia('(prefers-reduced-motion: reduce)'),events=new AbortController();
    let s=initialState({initialStep:options.initialStep,reducedMotion:media.matches}),raf=0,last=0,dead=false;
    host.innerHTML=`<section class="n3-shell" aria-labelledby="n3-title" tabindex="-1">
      <header class="n3-heading"><div class="n3-eyebrow"><span>MICHELSON · 波数编码</span><span class="n3-position" aria-live="polite"></span></div><h1 id="n3-title"></h1></header>
      <div class="n3-stage">
        <div class="n3-instrument">
          <svg class="n3-optical-svg" viewBox="0 0 500 410" role="img" aria-labelledby="n3-diagram-title">
            <title id="n3-diagram-title">Michelson：光源在左，固定镜在上，动镜在右，输出探测器在下</title>
            <defs><marker id="n3-direction" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M1 1L9 5L1 9" fill="none" stroke="currentColor" stroke-width="1.8"/></marker></defs>
            <path class="n3-reference" d="M200 60V315M55 190H330"/>
            <path data-part="input" class="n3-beam" d="M68 190H200"/>
            <path data-part="fixed" class="n3-beam" d="M200 190V60"/>
            <path data-part="moving" class="n3-beam" d="M200 190H330"/>
            <path data-part="output" class="n3-beam" d="M200 190V307"/>
            <g data-part="directions" class="n3-directions"><path d="M114 190h26"/><path d="M194 149v-25"/><path d="M206 103v25"/><path d="M244 184h25"/><path d="M304 196h-25"/><path d="M200 252v25"/></g>
            <circle cx="55" cy="190" r="13" class="n3-source"/><text x="55" y="231">光源</text>
            <path d="M174 216L226 164" class="n3-splitter"/><text x="113" y="144">分束器</text><path d="M146 149L180 174" class="n3-leader"/>
            <path d="M175 60H225M178 53H222" class="n3-mirror"/><text x="200" y="32">固定镜</text>
            <path d="M330 163V217" class="n3-original"/>
            <g data-part="mirror"><path d="M330 163V217M337 167V213" class="n3-mirror"/><text x="330" y="139">动镜</text></g>
            <g data-part="displacement"><path class="n3-dimension" data-part="dimension"/><text data-part="dx-label" y="254"></text></g>
            <rect x="179" y="307" width="42" height="25" rx="3" class="n3-detector"/><text x="200" y="364">探测器</text>
            <g data-part="response"><text data-part="response-label" x="260" y="312" class="n3-small" text-anchor="start">1000 cm⁻¹ 响应</text><text data-part="power" x="260" y="342" class="n3-value" text-anchor="start"></text></g>
          </svg>
          <p class="n3-model-note">理想单波数 · 非负归一化功率 · 位移放大 · 空气中正入射</p>
        </div>
        <div class="n3-evidence">
          <div class="n3-path-explanation">
            <p class="n3-section-label">动臂新增的往返路程</p>
            <svg viewBox="0 0 540 240" class="n3-length-svg" role="img" aria-label="去程新增一个镜位移，回程再新增一个镜位移，合计二倍">
              <g data-part="out-extra"><text x="0" y="45">去程</text><path d="M95 38H230" class="n3-extra"/><text x="270" y="45">+ Δx</text></g>
              <g data-part="back-extra"><text x="0" y="112">回程</text><path d="M95 105H230" class="n3-extra"/><text x="270" y="112">+ Δx</text></g>
              <g data-part="sum-extra"><path d="M95 153H365" class="n3-extra"/><path d="M95 166v12H365v-12M230 145v16" class="n3-dimension"/><text x="230" y="214" text-anchor="middle">光程差变化 Δδ</text></g>
            </svg>
            <p class="n3-formula" data-part="formula">Δδ = 2Δx</p>
            <p class="n3-definition" data-part="definition">OPD：两臂往返光程之差</p>
          </div>
          <div class="n3-records">
            <div class="n3-record-meta"><span>归一化功率</span><span data-part="opd"></span></div>
            <svg class="n3-tracks" viewBox="0 0 540 335" role="img" aria-labelledby="n3-tracks-title">
              <title id="n3-tracks-title">同一光程差范围内，1000 与 3000 波数的一周期和三周期</title>
              <g class="n3-track"><text x="56" y="25" class="n3-track-name">1000 cm⁻¹</text><text data-part="p1" x="496" y="25" text-anchor="end"></text>
                <path d="M56 48V112H496M56 48H496" class="n3-grid"/><text x="35" y="55">1</text><text x="35" y="117">0</text>
                <path class="n3-trace" data-part="trace1"/><circle r="5" class="n3-dot" data-part="dot1"/></g>
              <g data-part="track3" transform="translate(0 128)"><text x="56" y="25" class="n3-track-name n3-gold">3000 cm⁻¹</text><text data-part="p3" x="496" y="25" text-anchor="end"></text>
                <path d="M56 48V112H496M56 48H496" class="n3-grid"/><text x="35" y="55">1</text><text x="35" y="117">0</text>
                <path class="n3-trace n3-trace-gold" data-part="trace3"/><circle r="5" class="n3-dot n3-dot-gold" data-part="dot3"/></g>
              <path data-part="cursor" class="n3-cursor"/>
              <g data-part="x-axis"><path d="M56 262H496" class="n3-axis"/><text x="56" y="286" text-anchor="middle">0</text><text x="276" y="286" text-anchor="middle">5</text><text x="496" y="286" text-anchor="middle">10</text><text x="276" y="321" text-anchor="middle">光程差 OPD / μm</text></g>
            </svg>
            <p class="n3-comparison-note"></p>
          </div>
        </div>
      </div>
      <div class="n3-bottom"><p class="n3-takeaway" aria-live="polite"></p>
        <div class="n3-exploration"><button type="button" class="n3-explore-toggle">手动移动镜子</button><label for="n3-mirror" class="n3-slider-label">镜位移 <output></output></label><input id="n3-mirror" type="range" min="0" max="5" step=".01" value="5"></div>
      </div>
      <nav class="n3-controls" aria-label="N3 教学控制"><button class="n3-prev" type="button">← 上一步</button><div class="n3-play-controls"><button class="n3-replay" type="button">重播</button><button class="n3-pause" type="button">暂停动作</button><button class="n3-auto" type="button">自动播放</button></div><button class="n3-next" type="button">下一步 →</button></nav>
    </section>`;
    const q=x=>host.querySelector(x),part=n=>q('[data-part="'+n+'"]'),el={};
    ['input','fixed','moving','output','directions','mirror','displacement','dimension','dx-label','response','power','out-extra','back-extra','sum-extra','formula','definition','opd','p1','p3','trace1','trace3','dot1','dot3','track3','cursor','x-axis'].forEach(n=>el[n]=part(n));
    const show=(e,v)=>{e.style.opacity=String(v);e.style.visibility=v>0?'visible':'hidden';};
    const phase=(p,a,b)=>clamp((p-a)/(b-a),0,1);
    function render(){
      const d=derive(s),g=geometry(d.mirrorUm),p=s.progress;
      q('.n3-shell').dataset.step=s.step;q('.n3-shell').dataset.progress=p.toFixed(4);q('.n3-shell').dataset.paused=String(s.paused);
      q('.n3-instrument').style.transform='translateX('+(s.step<2?56:s.step===2?56*(1-phase(p,0,.22)):0)+'%)';
      q('#n3-title').textContent=STEPS[s.step].title;q('.n3-position').textContent=(s.step+1)+' / 6';
      q('.n3-takeaway').textContent=s.step===2&&p<.75?'':STEPS[s.step].note;
      el.mirror.setAttribute('transform','translate('+(g.mirrorX-330)+' 0)');
      el.moving.setAttribute('d','M200 190H'+g.mirrorX);
      show(el.input,s.step===0?phase(p,0,.2):1);show(el.fixed,s.step===0?phase(p,.2,.5):1);show(el.moving,s.step===0?phase(p,.2,.5):1);show(el.output,s.step===0?phase(p,.5,.9):1);
      show(el.directions,s.step===0?phase(p,.7,1):1);
      el.dimension.setAttribute('d','M330 227v9M330 232H'+g.mirrorX+'M'+g.mirrorX+' 227v9');
      el['dx-label'].setAttribute('x',(330+g.mirrorX)/2);el['dx-label'].textContent=(s.step===1?'位移 ':'Δx = ')+d.mirrorUm.toFixed(2)+' μm';
      show(el.displacement,s.step>=1?1:0);show(el.response,s.step>=1?1:0);
      el.power.textContent=(s.step>=4?d.power3000:d.power1000).toFixed(2);
      part('response-label').textContent=(s.step>=4?'3000':'1000')+' cm⁻¹ 归一化功率';
      // Hold mirror fixed while sequentially revealing the two added path lengths.
      show(el['out-extra'],s.step===2?phase(p,.22,.4):0);show(el['back-extra'],s.step===2?phase(p,.43,.6):0);
      show(el['sum-extra'],s.step===2?phase(p,.6,.75):0);show(el.formula,s.step===2?phase(p,.78,1):0);show(el.definition,s.step===2?phase(p,.78,1):0);
      const recordProgress=s.step===3?phase(p,.18,1):s.step===4?phase(p,.16,1):1;
      el.trace1.setAttribute('d',curve(1000,s.step===3?10*recordProgress:10));
      el.trace3.setAttribute('d',curve(3000,s.step===4?10*recordProgress:10));
      const cx=56+d.opdUm*44;
      el.dot1.setAttribute('cx',cx);el.dot1.setAttribute('cy',112-d.power1000*64);
      el.dot3.setAttribute('cx',cx);el.dot3.setAttribute('cy',112-d.power3000*64);
      el.cursor.setAttribute('d','M'+cx+' 42V'+(s.step>=4?247:120));
      show(el.track3,s.step>=4?1:0);
      el.opd.textContent='δ = '+d.opdUm.toFixed(2)+' μm';el.p1.textContent=d.power1000.toFixed(2);el.p3.textContent=d.power3000.toFixed(2);
      const returning=(s.step===3&&p<.18)||(s.step===4&&p<.16);
      q('.n3-comparison-note').textContent=returning?'回到等光程位置，准备扫描':s.step>=4?'两次单波数比较 · 同尺度 0–1':'1000 cm⁻¹ · 记录随扫描逐点形成';
      q('.n3-exploration').hidden=s.step!==5;q('.n3-slider-label').hidden=!s.exploring;q('#n3-mirror').hidden=!s.exploring;
      q('.n3-explore-toggle').textContent=s.exploring?'结束手动观察':'手动移动镜子';q('#n3-mirror').value=d.mirrorUm;q('.n3-slider-label output').value=d.mirrorUm.toFixed(2)+' μm';
      q('.n3-next').textContent=s.step===5?'继续到干涉图 →':s.progress<1?'完成当前动作 →':'下一步 →';
      q('.n3-auto').textContent=s.auto?(s.paused?'继续自动':'暂停自动'):'自动播放';
      q('.n3-pause').disabled=s.progress===1&&!s.auto;q('.n3-pause').textContent=s.paused?'继续动作':'暂停动作';
    }
    function stop(){if(raf)cancelAnimationFrame(raf);raf=0;last=0;}
    function loop(now){raf=0;if(dead||s.paused)return;const dt=last?Math.min(100,now-last):0;last=now;s=advance(s,dt);render();if(!s.paused)raf=requestAnimationFrame(loop);else last=0;}
    function schedule(){if(s.paused)stop();else if(!raf){last=0;raf=requestAnimationFrame(loop);}}
    function dispatch(a){if(dead)return;s=reduce(s,a);if(s.exit){const direction=s.exit;options.onExit?.(direction);return;}render();schedule();}
    const listen=(target,event,fn)=>target.addEventListener(event,fn,{signal:events.signal});
    listen(q('.n3-next'),'click',()=>dispatch({type:'NEXT'}));listen(q('.n3-prev'),'click',()=>dispatch({type:'PREV'}));
    listen(q('.n3-replay'),'click',()=>dispatch({type:'REPLAY'}));listen(q('.n3-auto'),'click',()=>dispatch({type:'TOGGLE_AUTO'}));
    listen(q('.n3-pause'),'click',()=>dispatch({type:'TOGGLE_PAUSE'}));listen(q('.n3-explore-toggle'),'click',()=>dispatch({type:'EXPLORE'}));
    listen(q('#n3-mirror'),'input',e=>dispatch({type:'SET_MIRROR',value:e.target.value}));
    listen(document,'keydown',e=>{
      if(dead||!host.isConnected||document.body.dataset.view!=='story'||e.repeat||e.ctrlKey||e.metaKey||e.altKey)return;
      if(e.target.closest('input,select,textarea,[contenteditable=true]'))return;
      if(e.key===' '&&e.target.closest('button'))return;
      const type=({'ArrowRight':'NEXT','PageDown':'NEXT',' ':'NEXT','ArrowLeft':'PREV','PageUp':'PREV','r':'REPLAY','a':'TOGGLE_AUTO','p':'TOGGLE_PAUSE'})[e.key];
      if(type){e.preventDefault();dispatch({type});}
    });
    listen(document,'visibilitychange',()=>{if(document.hidden)dispatch({type:'PAUSE'});});
    listen(media,'change',e=>dispatch({type:'REDUCED',value:e.matches}));
    render();q('.n3-shell').focus({preventScroll:true});
    return {dispose(){dead=true;stop();events.abort();},next:()=>dispatch({type:'NEXT'}),prev:()=>dispatch({type:'PREV'}),replay:()=>dispatch({type:'REPLAY'}),toggleAuto:()=>dispatch({type:'TOGGLE_AUTO'}),getState:()=>({...s})};
  }
  return Object.freeze({STEPS,initialState,reduce,advance,derive,geometry,mount});
});
