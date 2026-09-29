/* Isolated functional decomposition. Copies never change the working optical model.
 * Geometry/materials are borrowed; only the detail renderer is owned here. */
(function(){
  'use strict';
  const descriptions={
    source:['热源提供宽带辐射，不随移动镜逐个改变波长。',['安装底座','壳体与散热片','辐射面示意'],[1,0,0]],
    splitter:['光学片建立两臂；镜架负责保持它的位置与朝向。不是按波数分类的滤色器。',['底座与支柱','压圈与调节镜架','分束光学片'],[.707,0,-.707]],
    fixed:['镜面负责返回光；支架负责保持对准。固定镜仍可能具有调节机构。',['底座与支柱','调节镜架','反射面'],[0,0,-1]],
    moving:['工作时镜面、镜架和滑台一起移动。这里的展开只为看结构，不是扫描运动。',['滑台与支柱','调节镜架','反射面'],[-1,0,0]],
    sample:['透射样品置于入、出射窗口之间；窗口和样品不是同一个对象。',['样品架支撑','仓体与通光窗口','可取出的样品托架'],[0,0,1]],
    detector:['入口接收辐射，探测响应变成电信号；这里不虚构内部敏感元件及电路。',['安装底座','封装与电连接','入射窗口示意'],[0,0,1]],
    laser:['参考激光提供光学长度标尺，不代替测样品的宽带红外源。',['安装座','激光模块封装','输出端接口'],[1,0,0]],
    electronics:['板卡示意电信号采集与传递；芯片外形不代表真实电路或处理流程。',['电路板','连接与外围元件','处理器件示意'],[0,1,0]],
    collimator:['这里只表达准直功能接口；没有可靠工程光路，因此不补画虚构的透镜内部。',['支座','开口镜架'],[1,0,0]],
    collector:['这里只表达收集光学接口；内部曲面镜和折叠光路未建模。',['支座','开口镜架'],[0,0,1]]
  };
  window.FTIRPartDetail=function(original,id,name,onClose){
    const T=window.THREE,info=descriptions[id],previous=document.activeElement;
    if(!T||!info)return null;
    const dialog=document.createElement('dialog');dialog.className='part-inspector';
    dialog.setAttribute('aria-labelledby','detail-title');
    dialog.innerHTML=`<header><div><small>功能分解 · 非实机拆装</small><h2 id="detail-title">${name}</h2></div><button data-close>返回仪器 ×</button></header><div class="detail-stage" aria-label="可旋转的独立部件模型"></div><div class="detail-caption"><p>${info[0]}</p><div class="detail-layers" aria-label="功能层"></div></div><div class="detail-controls"><button data-toggle>合拢</button><label>展开程度<input aria-label="部件展开程度" type="range" min="0" max="100" value="0"></label><button data-reset>复位视角</button></div><small class="detail-boundary">展开距离为显示放大，不改变镜位移、光程差或测量记录。</small>`;
    document.body.appendChild(dialog);dialog.showModal();
    const stage=dialog.querySelector('.detail-stage');let renderer;
    try{renderer=new T.WebGLRenderer({antialias:true,alpha:true});}catch(_){stage.textContent='此设备无法创建独立三维视图。下方仍可阅读部件功能。';}
    let disposed=false,frame=0,amount=0,target=1,last=0;
    const scene=new T.Scene(),root=new T.Group();scene.add(root);
    const layers=info[1].map(()=>new T.Group());layers.forEach(g=>root.add(g));
    for(const child of original.children){
      const copy=child.clone(true);copy.visible=true;
      layers[Math.min(child.userData.detailLayer||0,layers.length-1)].add(copy);
    }
    const axis=new T.Vector3(...info[2]);
    const offsets=layers.map((_,i)=>axis.clone().multiplyScalar((i-(layers.length-1)/2)*1.15));
    // Frame the union of assembled and expanded bounds; slider never changes zoom.
    const bounds=new T.Box3().setFromObject(root);
    layers.forEach((g,i)=>g.position.copy(offsets[i]));bounds.union(new T.Box3().setFromObject(root));
    const center=bounds.getCenter(new T.Vector3()),radius=bounds.getSize(new T.Vector3()).length()/2;
    const camera=new T.PerspectiveCamera(36,1,.05,100);
    scene.add(new T.HemisphereLight(0xdceeff,0x293240,2));
    const key=new T.DirectionalLight(0xffffff,2.5);key.position.set(-4,6,5);scene.add(key);
    const rim=new T.DirectionalLight(0x79dccc,1.8);rim.position.set(4,2,-3);scene.add(rim);
    let controls=null;
    if(renderer){
      renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.6));renderer.outputEncoding=T.sRGBEncoding;
      renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
      stage.appendChild(renderer.domElement);renderer.domElement.tabIndex=0;
      renderer.domElement.setAttribute('aria-label',name+'，拖动旋转，滚轮缩放；也可用方向键旋转');
      controls=new T.OrbitControls(camera,renderer.domElement);controls.enablePan=false;
      controls.target.copy(center);controls.minDistance=radius*1.4;controls.maxDistance=radius*12;
      controls.addEventListener('change',requestDraw);
      renderer.domElement.addEventListener('keydown',e=>{
        if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key))return;
        e.preventDefault();const v=camera.position.clone().sub(controls.target),s=new T.Spherical().setFromVector3(v);
        if(e.key==='ArrowLeft')s.theta-=.12;if(e.key==='ArrowRight')s.theta+=.12;
        if(e.key==='ArrowUp')s.phi-=.12;if(e.key==='ArrowDown')s.phi+=.12;
        s.phi=Math.max(.1,Math.min(Math.PI-.1,s.phi));camera.position.copy(controls.target).add(new T.Vector3().setFromSpherical(s));controls.update();
      });
    }
    const slider=dialog.querySelector('input'),toggle=dialog.querySelector('[data-toggle]');
    const labels=layers.map((_,i)=>{
      const b=document.createElement('button');b.textContent=info[1][i];b.setAttribute('aria-pressed','false');
      b.onclick=()=>{const isolate=b.getAttribute('aria-pressed')!=='true';labels.forEach((a,j)=>{a.setAttribute('aria-pressed',String(isolate&&j===i));layers[j].visible=!isolate||j===i;});requestDraw();};
      dialog.querySelector('.detail-layers').appendChild(b);return b;
    });
    const reduced=matchMedia('(prefers-reduced-motion: reduce)');
    function draw(now){
      frame=0;if(disposed)return;
      const dt=Math.min((now-last)||16,50);last=now;
      if(reduced.matches)amount=target;else amount+=(target-amount)*(1-Math.exp(-dt/135));
      if(Math.abs(target-amount)<.001)amount=target;
      layers.forEach((g,i)=>g.position.copy(offsets[i]).multiplyScalar(amount));
      slider.value=String(Math.round(amount*100));toggle.textContent=target>.5?'合拢':'展开';
      renderer?.render(scene,camera);if(amount!==target)requestDraw();
    }
    function requestDraw(){if(!frame&&!disposed)frame=requestAnimationFrame(draw);}
    function reset(){
      const tangent=new T.Vector3().crossVectors(axis,new T.Vector3(0,1,0));
      if(tangent.lengthSq()<.01)tangent.set(-1,0,1);
      const direction=tangent.normalize().addScaledVector(axis,.48).add(new T.Vector3(0,.7,0)).normalize();
      const right=new T.Vector3().crossVectors(new T.Vector3(0,1,0),direction).normalize();
      const up=new T.Vector3().crossVectors(direction,right).normalize(),tanV=Math.tan(T.MathUtils.degToRad(18));
      let distance=0;
      for(const x of [bounds.min.x,bounds.max.x])for(const y of [bounds.min.y,bounds.max.y])for(const z of [bounds.min.z,bounds.max.z]){
        const p=new T.Vector3(x,y,z).sub(center);
        distance=Math.max(distance,Math.abs(p.dot(right))/(tanV*camera.aspect)+p.dot(direction),Math.abs(p.dot(up))/tanV+p.dot(direction));
      }
      camera.position.copy(center).addScaledVector(direction,distance*1.1);
      controls?.target.copy(center);controls?.update();requestDraw();
    }
    function resize(){const w=stage.clientWidth,h=stage.clientHeight;if(!w||!h)return;renderer?.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();reset();}
    const observer=new ResizeObserver(resize);observer.observe(stage);
    slider.oninput=()=>{amount=target=Number(slider.value)/100;requestDraw();};
    toggle.onclick=()=>{target=target>.5?0:1;requestDraw();};dialog.querySelector('[data-reset]').onclick=reset;
    function dispose(){if(disposed)return;disposed=true;cancelAnimationFrame(frame);observer.disconnect();controls?.dispose();renderer?.dispose();dialog.close();dialog.remove();if(previous?.isConnected)previous.focus({preventScroll:true});onClose?.();}
    dialog.querySelector('[data-close]').onclick=dispose;dialog.addEventListener('cancel',e=>{e.preventDefault();dispose();});
    resize();requestDraw();return {dispose};
  };
})();
