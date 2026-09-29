/* Hero-only material. Never use presentation jitter in quantitative lessons. */
(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.FTIRHomeSignal=api;
})(typeof window==='undefined'?this:window,function(){
  'use strict';
  const TAU=2*Math.PI;
  const smooth=(a,b,x)=>{const u=Math.max(0,Math.min(1,(x-a)/(b-a)));return u*u*(3-2*u);};
  const sample=(v,i)=>{i=Math.max(0,Math.min(v.length-1,i));const j=Math.floor(i);return v[j]+(v[Math.min(j+1,v.length-1)]-v[j])*(i-j);};
  let cached=null;
  function backbone(P){
    if(cached)return cached;
    const record=P.densityRecord(w=>P.response(w)*(1-P.transmission(w)),{n:4096,h:.000025,label:'首页合成信号视觉'});
    const spectrum=P.transform(record);
    cached={record,spectrum,gmax:Math.max(...record.ys.map(Math.abs)),smax:Math.max(...spectrum.values)};
    return cached;
  }
  // Two coordinate domains joined as a cover metaphor, not an optical process.
  function point(data,t,family,z,phase=0){
    const into=smooth(.29,.43,t),out=smooth(.64,.78,t),peaks=smooth(.76,.83,t);
    const centre=Math.exp(-Math.pow((t-.51)/.085,2));
    const jitter=(z-.5)*(family?7.2:3.6)*centre+phase*.13;
    const delta=(t-.51)*.065+jitter*.000025;
    const g=sample(data.record.ys,delta/data.record.h+data.record.n/2)/data.gmax;
    const wn=4000-(t-.765+(family?.009:0)+(z-.5)*(family?.005:.0015))/.235*3600;
    const s=sample(data.spectrum.values,(wn-data.spectrum.wn[0])/data.spectrum.gridSpacing)/data.smax;
    const carrier=Math.sin(t*TAU*3.2+(family?2.65:0)+(z-.5)*(family?.20:.075)+phase*.012);
    const simple=carrier*(family?100:94)*(family?.42+.58*z:.56+.44*z);
    const tail=Math.sin((t-.64)*TAU*4.1+(family?1.59:0)+phase*.009)*32*(.6+.4*z);
    const signal=simple*(1-into)+g*(family?-.91:1)*152*(.55+.45*z)*into*(1-out)+tail*out*(1-peaks)+s*142*(.18+.82*z)*peaks;
    const baseline=211+20*smooth(.71,1,t);
    const thickness=(1-peaks)*(2+centre*7)+peaks*(9+s*4);
    return {y:baseline-signal+(z-.5)*thickness,baseline,energy:Math.min(1,Math.abs(signal)/100+centre*.35+peaks*.10),centre};
  }
  function rng(seed){return()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};}
  function mount(canvas,P){
    const data=backbone(P),ctx=canvas.getContext('2d');
    if(!ctx)return()=>{};
    const doc=canvas.ownerDocument,win=doc.defaultView;
    const motion=win.matchMedia('(prefers-reduced-motion: reduce)');
    let width=0,height=0,dpr=0,layers=[],wash=null,volume=null,grain=null,raf=0,resizeTimer=0,dead=false,last=0,paused=false;
    let inView=true;
    function surface(){const c=doc.createElement('canvas');c.width=canvas.width;c.height=canvas.height;const cctx=c.getContext('2d');cctx.setTransform(dpr*width/1800,0,0,dpr*height/420,0,0);return[c,cctx];}
    function trace(c,ys,n,reverse=false){for(let j=0;j<=n;j++){const i=reverse?n-j:j,x=i/n*1800;if(j===0&&!reverse)c.moveTo(x,ys[i]);else c.lineTo(x,ys[i]);}}
    function familyLayer(family,phase){
      const [c,cctx]=surface(),count=width<580?(family?44:80):(family?76:144),n=Math.max(1800,Math.ceil(width*dpr)),random=rng(731+family);
      const color=family?'217,155,58':'26,123,217';
      const ink=cctx.createLinearGradient(0,0,1800,0);
      for(let i=0;i<=180;i++){
        const t=i/180,p=point(data,t,family,.7,phase);
        // Vanishing energy must not accumulate into a dark horizontal baseline.
        const weight=t>.76?.08+.92*Math.min(1,p.energy*3):.6+.4*Math.sqrt(p.energy);
        ink.addColorStop(t,`rgba(${color},${(family?.075:.10)*weight})`);
      }
      let previous=null;
      for(let j=0;j<count;j++){
        const z=j/(count-1),ys=new Float32Array(n+1);
        for(let i=0;i<=n;i++)ys[i]=point(data,i/n,family,z,phase).y;
        // Micro-laminae between fibres build optical density without a halo.
        if(previous){cctx.beginPath();trace(cctx,previous,n);trace(cctx,ys,n,true);cctx.closePath();cctx.fillStyle=`rgba(${color},${family?.028:.045})`;cctx.fill();}
        const density=.6+.4*Math.sin(Math.PI*z);
        cctx.beginPath();trace(cctx,ys,n);cctx.strokeStyle=ink;cctx.globalAlpha=density;
        cctx.lineWidth=(.22+random()*.23)*1800/width;cctx.stroke();previous=ys;
        cctx.globalAlpha=1;
      }
      return c;
    }
    function texture(){
      const [c,cctx]=surface(),random=rng(4819),count=15000;
      for(let j=0;j<count;j++){
        const t=random(),f=random()>.65?1:0,z=random(),p=point(data,t,f,z);
        if(random()>p.energy*.72)continue;
        cctx.fillStyle=f?'rgba(192,136,56,.07)':'rgba(30,111,179,.09)';
        const px=1800/width;
        cctx.fillRect(t*1800,p.y,(j%7===0?1.15:.38)*px,.35*420/height);
      }
      return c;
    }
    function atmosphere(){
      const [c,cctx]=surface();
      for(let i=0;i<90;i++){
        const t=i/89,p=point(data,t,0,.6),radius=19+25*p.energy;
        const grad=cctx.createRadialGradient(t*1800,p.baseline+29,0,t*1800,p.baseline+29,radius);
        grad.addColorStop(0,`rgba(84,142,187,${.002+.005*p.energy})`);grad.addColorStop(1,'rgba(84,142,187,0)');
        cctx.fillStyle=grad;cctx.fillRect(t*1800-radius,p.baseline+29-radius,radius*2,radius*2);
      }
      return c;
    }
    function bodyMaterial(){
      const [c,cctx]=surface(),columns=Math.ceil(width*dpr),dx=1800/columns;
      // Column-wise optical density inside the fibre envelope, no blur/filter.
      // This fills the material, not the entire figure or page background.
      for(const f of [1,0])for(let i=0;i<columns;i++){
        const t=i/columns,pts=Array.from({length:12},(_,j)=>point(data,t,f,j/11));
        const energy=Math.max(...pts.map(p=>p.energy));
        if(energy<.015)continue;
        const lo=Math.min(...pts.map(p=>p.y)),hi=t>.79?Math.max(pts[0].baseline,...pts.map(p=>p.y)):Math.max(...pts.map(p=>p.y));
        const feather=1.5+energy*3,color=f?'221,163,75':'37,137,219';
        const grad=cctx.createLinearGradient(0,lo-feather,0,hi+feather);
        grad.addColorStop(0,`rgba(${color},0)`);grad.addColorStop(.24,`rgba(${color},${(f?.048:.09)*energy})`);
        grad.addColorStop(.72,`rgba(${color},${(f?.025:.048)*energy})`);grad.addColorStop(1,`rgba(${color},0)`);
        cctx.fillStyle=grad;cctx.fillRect(i*dx,lo-feather,dx+.1,hi-lo+2*feather);
      }
      return c;
    }
    function draw(time=0){
      ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,canvas.width,canvas.height);
      ctx.globalAlpha=1;ctx.drawImage(wash,0,0);ctx.drawImage(volume,0,0);
      for(let f=1;f>=0;f--){
        const u=motion.matches?.5:(1-Math.cos(time/1000*TAU/(f?28:24)))/2;
        ctx.globalAlpha=1-u;ctx.drawImage(layers[f][0],0,0);ctx.globalAlpha=u;ctx.drawImage(layers[f][1],0,0);
      }
      ctx.globalAlpha=motion.matches?.8:.8+.08*Math.sin(time/1000*TAU/21);ctx.drawImage(grain,0,0);ctx.globalAlpha=1;
    }
    function tick(time){
      raf=0;if(dead||!canvas.isConnected)return;
      if(!doc.hidden&&inView&&!motion.matches&&!paused){if(time-last>=50){draw(time);last=time;}raf=win.requestAnimationFrame(tick);}
    }
    function resume(){win.cancelAnimationFrame(raf);raf=0;if(!dead&&layers.length){if(!paused)draw();if(!paused&&!motion.matches&&!doc.hidden&&inView)raf=win.requestAnimationFrame(tick);}}
    function rebuild(){
      if(dead)return;const box=canvas.getBoundingClientRect();
      if(!box.width||!box.height)return;
      width=box.width;height=box.height;dpr=win.devicePixelRatio||1;
      canvas.width=Math.round(width*dpr);canvas.height=Math.round(height*dpr);
      layers=[0,1].map(f=>[-1,1].map(phase=>familyLayer(f,phase)));wash=atmosphere();volume=bodyMaterial();grain=texture();
      canvas.dataset.fibres=width<580?'124':'220';canvas.dataset.renderDpr=String(dpr);resume();
    }
    function resize(){win.clearTimeout(resizeTimer);resizeTimer=win.setTimeout(rebuild,120);}
    const ro=new win.ResizeObserver(resize);ro.observe(canvas);
    const io=new win.IntersectionObserver(entries=>{inView=entries[0].isIntersecting;resume();});io.observe(canvas);
    motion.addEventListener('change',resume);doc.addEventListener('visibilitychange',resume);win.addEventListener('resize',resize);
    // DPR may change when moving between monitors without a CSS-size change.
    let resolution=win.matchMedia(`(resolution: ${win.devicePixelRatio||1}dppx)`);
    function resolutionChanged(){resolution.removeEventListener('change',resolutionChanged);resize();resolution=win.matchMedia(`(resolution: ${win.devicePixelRatio||1}dppx)`);resolution.addEventListener('change',resolutionChanged);}
    resolution.addEventListener('change',resolutionChanged);rebuild();
    const dispose=()=>{dead=true;win.cancelAnimationFrame(raf);win.clearTimeout(resizeTimer);ro.disconnect();io.disconnect();motion.removeEventListener('change',resume);resolution.removeEventListener('change',resolutionChanged);doc.removeEventListener('visibilitychange',resume);win.removeEventListener('resize',resize);layers=[];wash=volume=grain=null;};
    dispose.setPaused=value=>{paused=!!value;resume();};
    return dispose;
  }
  return {backbone,point,mount};
});
