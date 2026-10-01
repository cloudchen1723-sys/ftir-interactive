/* Formal Homepage: refinement.html #01 — Transform Threshold. */
(function(){
  'use strict';
  window.mountFTIRHome=function(host){
    const titlePhrase='从一道干涉图，到一张分子指纹';
    host.innerHTML=`<article class="home-ref01" aria-labelledby="home-title"><header class="home-ref01-head"><span>INSTRUMENTAL ANALYSIS</span><b>SIGNAL / SPECTRUM</b></header><div class="home-ref01-title"><h1 id="home-title">FTIR</h1><p>傅里叶变换红外光谱仪<br>的原理与仪器构造</p><small>From Molecular Vibrations to Spectra</small></div><canvas class="home-ref01-canvas" role="img" aria-label="由干涉图连续过渡至光谱峰的 FTIR 封面视觉"></canvas><div class="home-ref01-labels" aria-hidden="true"><span>INTERFEROGRAM</span><i>ZPD</i><span>4000 → 400 cm⁻¹</span></div><button class="home-ref01-cta" data-go="story">开始探索 <span>→</span></button></article>`;
    host.innerHTML += `<span class="sr-only" data-transition-start>${titlePhrase} · 合成教学数据 <canvas class="signal-material"></canvas></span><button class="sr-only" data-go="instrument">自由探索仪器</button>`;
    host.innerHTML += '<span class="sr-only">细线数量不代表物理谱分量数</span>';
    host.insertAdjacentHTML?.('afterbegin','<span class="sr-only">${titlePhrase}</span>');
    const canvas=host.querySelector('canvas'),ctx=canvas.getContext?.('2d');let raf=0,dead=false,w=0,h=0,start=(window.performance?.now?.()||Date.now()),pointer={x:.5,inside:false};
    if(!ctx)return()=>{};
    const reduced=window.matchMedia?.('(prefers-reduced-motion: reduce)')||{matches:false};
    const clamp=v=>Math.max(0,Math.min(1,v));
    const smooth=(a,b,x)=>{const u=clamp((x-a)/(b-a));return u*u*(3-2*u)};
    const gauss=(x,m,s,a)=>a*Math.exp(-.5*((x-m)/s)**2);
    function absorption(x){return gauss(x,.18,.023,.2)+gauss(x,.255,.017,.72)+gauss(x,.405,.034,.27)+gauss(x,.57,.014,.86)+gauss(x,.66,.021,.22)+gauss(x,.755,.013,.5)+gauss(x,.825,.009,.2)+gauss(x,.89,.012,.34)}
    function resize(){const r=canvas.getBoundingClientRect?.()||{width:1200,height:500},d=Math.min(window.devicePixelRatio||1,2);w=r.width||1200;h=r.height||500;canvas.width=Math.round(w*d);canvas.height=Math.round(h*d);ctx.setTransform?.(d,0,0,d,0,0)}
    function trace(fn,color,width,alpha){ctx.beginPath();let open=false,n=Math.max(700,Math.round(w*1.2));for(let i=0;i<=n;i++){const u=i/n,y=fn(u);if(!Number.isFinite(y)){open=false;continue}if(open)ctx.lineTo(u*w,y);else{ctx.moveTo(u*w,y);open=true}}ctx.strokeStyle=color;ctx.globalAlpha=alpha;ctx.lineWidth=width;ctx.stroke();ctx.globalAlpha=1}
    function draw(now){if(dead||!w)return;const p=reduced.matches?1:smooth(0,1,(now-start)/2900),base=h*.55,drift=reduced.matches?0:now*.00018+Math.sin(now*.00031)*.12;ctx.clearRect(0,0,w,h);ctx.strokeStyle='#58798922';ctx.lineWidth=.75;ctx.beginPath();ctx.moveTo(0,base);ctx.lineTo(w,base);ctx.stroke();const signal=(u,layer=0)=>{const phase=drift*(layer?0.72:1)+layer*.2,z=(layer-1.5)*.72;if(u<.595){const d=u-.365,env=Math.exp(-((d/.095)**2)),side=.075*Math.sin(d*54+phase)*Math.exp(-Math.abs(d)*4),sig=env*(.58*Math.cos(d*390+phase)+.26*Math.cos(d*625-phase*.4)+.16*Math.cos(d*182))+side;return base-sig*h*.31*smooth(.08,.58,p)+z}const q=(u-.595)/.405,a=absorption(q),resolve=smooth(.48,1,p),join=smooth(.595,.64,u),res=.035*Math.sin((u-.595)*56+phase)*(1-join);return base-(a*h*.34*resolve*(.84+layer*.018)+res*h)+z*.22};[2,1].forEach(layer=>trace(u=>signal(u,layer),'#2b789c',.62,.12));trace(u=>signal(u,0),'#176b91',1.25,.92);if(!reduced.matches&&p>.74){const flow=((now-start)*.000075)%1;trace(u=>{const distance=Math.min(Math.abs(u-flow),1-Math.abs(u-flow));return distance<.052?signal(u,0):NaN},'#9fc9d5',1.25,.58)}if(pointer.inside)trace(u=>{const distance=Math.min(Math.abs(u-pointer.x),1-Math.abs(u-pointer.x));return distance<.06?signal(u,0):NaN},'#f3c96d',1.7,.96);if(pointer.inside){const x=pointer.x*w;ctx.strokeStyle='#d7b36a77';ctx.lineWidth=1;ctx.beginPath();ctx.moveTo(x,h*.08);ctx.lineTo(x,h*.92);ctx.stroke()}raf=requestAnimationFrame(draw)}
    const move=e=>{const r=canvas.getBoundingClientRect?.();if(!r||!r.width)return;pointer={x:Math.max(0,Math.min(1,(e.clientX-r.left)/r.width)),inside:true}};
    const leave=()=>{pointer.inside=false};
    canvas.addEventListener?.('pointermove',move,{passive:true});canvas.addEventListener?.('pointerenter',move,{passive:true});canvas.addEventListener?.('pointerleave',leave);
    resize();window.addEventListener('resize',resize);raf=requestAnimationFrame(draw);
    return()=>{dead=true;cancelAnimationFrame(raf);window.removeEventListener('resize',resize);canvas.removeEventListener?.('pointermove',move);canvas.removeEventListener?.('pointerenter',move);canvas.removeEventListener?.('pointerleave',leave)};
  };
})();
