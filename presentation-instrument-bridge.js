/* 3D prelude wrapper. The existing presentation-optics renderer remains the only 2D teaching renderer. */
(function(){
  'use strict';
  function mount(host,options={}){
    let dead=false,busy=false,auto=false,autoTimer=0,tween=null,poseTween=null,instrument=null,inner=null,prelude=0,progress=1,basePose=null,focusPose=null,topPose=null,dom=null;
    const reduced=()=>window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const targets={source:[170,290],splitter:[650,290],fixed:[650,95],moving:[1050,290],detector:[650,500]};
    function shell(){
      host.innerHTML='<div class="pib-viewport"><main class="pib-stage" tabindex="-1"><div class="pib-top" id="pibTop"><span>FTIR · 从完整仪器到 Michelson</span><span>3D PRELUDE</span></div><h1 id="pibTitle"></h1><div class="pib-model-layer" id="pibModelLayer"><div class="pib-model" id="pibModel"></div><svg class="pib-anchor-svg" viewBox="0 0 1452 592" aria-hidden="true"><g id="pibAnchors"></g></svg><div class="pib-focus" id="pibFocus"><strong>迈克尔逊干涉仪</strong><small>Michelson interferometer · source 之后，sample / detector 之前</small></div></div><div class="pib-optics-layer" id="pibOpticsLayer"><div id="pibOpticsMount"></div></div><p class="pib-question" id="pibQuestion"></p><p class="pib-note" id="pibNote"></p><p class="pib-status" hidden></p><button id="pibNext" class="pib-next-btn" aria-label="下一步">下一步 →</button></main></div>';
      return {
        stage:host.querySelector('.pib-stage'),
        top:host.querySelector('#pibTop'),
        title:host.querySelector('#pibTitle'),
        modelLayer:host.querySelector('#pibModelLayer'),
        model:host.querySelector('#pibModel'),
        anchors:host.querySelector('.pib-anchor-svg'),
        anchorGroup:host.querySelector('#pibAnchors'),
        focus:host.querySelector('#pibFocus'),
        opticsLayer:host.querySelector('#pibOpticsLayer'),
        opticsMount:host.querySelector('#pibOpticsMount'),
        question:host.querySelector('#pibQuestion'),
        note:host.querySelector('#pibNote'),
        status:host.querySelector('.pib-status'),
        nextBtn:host.querySelector('#pibNext')
      };
    }
    dom=shell();
    if(options.embedded){
      dom.top.style.display='none';
      dom.title.style.display='none';
      dom.question.style.display='none';
      dom.note.style.display='none';
      dom.nextBtn.style.display='none';
      dom.focus.style.display='none';
    }

    function resize(){
      if(!dom?.stage)return;
      const scale=Math.max(.01,Math.min(window.innerWidth/1600,window.innerHeight/900));
      dom.stage.style.transform=`translate(-50%, -50%) scale(${scale})`;
    }
    window.addEventListener('resize',resize);
    resize();

    function labelMap(){
      instrument?.setHotspotLabels?.({source:{zh:'红外光源',en:'IR source'},splitter:{zh:'分束器',en:'beam splitter'},fixed:{zh:'固定镜',en:'fixed mirror'},moving:{zh:'动镜',en:'moving mirror'},sample:{zh:'样品室',en:'sample'},detector:{zh:'探测器',en:'detector'}});
      instrument?.setHotspotOffsets?.({source:[0,-80],splitter:[160,-100],fixed:[300,-120],moving:[470,-90],sample:[360,-60],detector:[560,-60]});
    }

    function drawAnchors(){
      if(!dom.anchorGroup||!instrument||prelude!==3){
        if(dom.anchorGroup)dom.anchorGroup.innerHTML='';
        return;
      }
      const ids=['source','splitter','fixed','moving','detector'];
      const actual=instrument.projectPart
        ? Object.fromEntries(ids.map(id=>[id,instrument.projectPart(id)]))
        : (instrument.getPartAnchors(ids)||{});
      dom.anchorGroup.innerHTML=Object.entries(targets).map(([id,t])=>{
        const p=actual[id]||{x:0,y:0};
        return '<path class="anchor" d="M'+p.x+' '+p.y+'L'+t[0]+' '+t[1]+'"/><circle class="dot" cx="'+t[0]+'" cy="'+t[1]+'" r="6"/>';
      }).join('');
    }

    function killAllAnimations(){
      if(tween){tween.kill();tween=null;}
      if(poseTween){poseTween.kill();poseTween=null;}
      if(window.gsap&&dom?.stage){gsap.killTweensOf(dom.stage);}
    }

    function pose(kind){
      if(!instrument)return;
      const target=kind==='inside'?basePose:kind==='focus'?focusPose:topPose;
      if(!target)return;
      poseTween?.kill?.();
      const from=instrument.getCameraPose(),v={p:0};
      if(reduced()){instrument.setCameraPose(target);return;}
      poseTween=gsap.to(v,{p:1,duration:.75,ease:'power2.inOut',onUpdate(){
        instrument.setCameraPose({
          position:from.position.map((x,i)=>x+(target.position[i]-x)*v.p),
          target:from.target.map((x,i)=>x+(target.target[i]-x)*v.p)
        });
      }});
    }

    function capturePoses(){
      if(!instrument)return;
      instrument.view('overview');
      basePose=instrument.getCameraPose();
      instrument.view('detail','splitter');
      focusPose=instrument.getCameraPose();
      instrument.view('top');
      topPose=instrument.getCameraPose();
      instrument.setCameraPose(basePose);
    }

    function update(){
      if(!dom||dead)return;
      dom.stage.dataset.prelude=String(prelude);
      dom.stage.dataset.progress=progress.toFixed(3);
      dom.stage.dataset.busy=String(busy);

      dom.focus.style.opacity=prelude===2?'1':'0';
      dom.title.textContent=['完整仪器先告诉我们：信号从哪里来？','快速预览一次测量：光源→干涉仪→样品→探测器。','聚焦迈克尔逊：三件核心部件怎样编码位移？','从俯视看，固定镜与动镜怎样原路返回？'][prelude]||'';
      dom.question.textContent=['先保留完整仪器身份。','先看因果顺序，细节随后解释。','区域位于光源之后、样品与探测器之前。','让部件身份继续可追踪。'][prelude]||'';
      dom.note.textContent=['完整模型 · 点击空白或按空格继续','光路预览 · 点击可跳过','Michelson 区域 · 点击继续','俯视关系 · 点击进入光路'][prelude]||'';

      if(dom.nextBtn){
        dom.nextBtn.style.display=inner?'none':'block';
        dom.nextBtn.textContent=prelude>=3?'进入干涉光路 →':'下一步 →';
      }

      if(instrument){
        instrument.setHotspotsVisible(prelude===0?['source','splitter','sample','detector']:prelude===2?['splitter','fixed','moving']:prelude===3?['splitter','fixed','moving','detector']:[]);
        drawAnchors();
      }
    }

    function finish(){
      busy=false;
      update();
      if(auto&&!inner)schedule();
    }

    function jumpToEnd(){
      if(!busy)return false;
      killAllAnimations();
      if(prelude===1){
        progress=1;
        instrument?.trace?.(2);
        instrument?.setSample?.(true);
      }else{
        const target=prelude<=1?basePose:prelude===2?focusPose:topPose;
        if(target&&instrument)instrument.setCameraPose(target);
      }
      finish();
      return true;
    }

    function transitionToOptics(){
      if(dead)return;
      killAllAnimations();
      busy=false;
      prelude=4;

      if(!inner){
        inner=window.FTIRPresentationOptics.mount(dom.opticsMount,{
          startN4:false,
          onNext:options.onNext,
          onBack:backToPrelude
        });
      }

      // Keep the 3D model on screen while the projected SVG anchors and beam
      // geometry take over. The title is hidden only after this handoff ends.
      dom.opticsLayer.style.opacity='0';
      dom.opticsLayer.style.pointerEvents='auto';
      dom.opticsLayer.style.visibility='visible';
      dom.modelLayer.style.opacity='1';
      dom.modelLayer.style.pointerEvents='none';
      dom.modelLayer.style.visibility='visible';
      const anchors=dom.anchorGroup?.querySelectorAll('.anchor,.dot');
      if(anchors?.length) gsap.set(anchors,{opacity:0});
      const poStage=dom.opticsMount.querySelector('.po-stage');
      const handoff=gsap.timeline({defaults:{ease:'power2.inOut'},onComplete(){
        dom.modelLayer.style.visibility='hidden';
      dom.top.style.display='none';
      dom.title.style.display='none';
      dom.question.style.display='none';
      dom.note.style.display='none';
      dom.nextBtn.style.display='none';
      dom.focus.style.display='none';
        instrument?.dispose?.();
        instrument=null;
        if(poStage)poStage.focus({preventScroll:true});
      }});
      handoff.to(dom.modelLayer,{opacity:.24,duration:.8},0);
      handoff.to(dom.opticsLayer,{opacity:1,duration:1.35},.35);
      const anchorPaths=dom.anchorGroup?.querySelectorAll('.anchor');
      if(anchorPaths?.length && window.DrawSVGPlugin){
        gsap.set(anchorPaths,{drawSVG:'0%'});
        handoff.to(anchorPaths,{drawSVG:'100%',duration:.9,stagger:.06,ease:'none'},.62);
      }
      if(anchors?.length) handoff.to(anchors,{opacity:1,duration:.85,stagger:.04},.7);
      if(anchorPaths?.length && window.MotionPathPlugin){
        const firstDot=dom.anchorGroup.querySelector('.dot');
        if(firstDot) handoff.to(firstDot,{duration:.9,motionPath:{path:anchorPaths[0],align:false},ease:'none'},.72);
      }
    }

    function reinitInstrument(viewKind='inside'){
      if(!instrument){
        instrument=window.FTIRInstrument?.(dom.model,{
          onUnavailable:()=>{
            dom.status.hidden=false;
            dom.status.textContent='3D 暂不可用；二维桥接保留。';
          }
        });
        labelMap();
        capturePoses();
      }
      instrument?.setMode?.(viewKind==='inside'?'inside':'optical');
      pose(viewKind);
    }

    function advance(){
      if(dead)return;
      if(inner){
        inner.next?.();
        return;
      }
      if(busy){
        jumpToEnd();
        return;
      }
      if(prelude>=3){
        transitionToOptics();
        return;
      }
      busy=true;
      prelude++;
      progress=prelude===1?0:1;
      const kind=prelude<=1?'inside':prelude===2?'focus':'top';
      instrument?.setMode?.(prelude>=2?'optical':'inside');
      if(prelude!==1)pose(kind);
      update();

      if(reduced()){
        progress=1;
        if(prelude===1){instrument?.trace?.(2);instrument?.setSample?.(true);}
        finish();
        return;
      }

      if(prelude===1){
        const v={x:0};
        tween=gsap.to(v,{
          x:1,
          duration:2.5,
          ease:'power1.inOut',
          onUpdate(){
            progress=v.x;
            const step=progress<.28?0:progress<.58?1:2;
            instrument?.trace?.(step);
            instrument?.setSample?.(progress>.75);
            update();
          },
          onComplete:finish
        });
      }else{
        tween=gsap.delayedCall(.65,finish);
      }
    }

    function backToPrelude(){
      if(inner){
        inner.dispose?.();
        inner=null;
        dom.opticsMount.innerHTML='';
        prelude=3;
        progress=1;
        busy=false;

        dom.top.style.display='';
        dom.title.style.display='';
        dom.question.style.display='';
        dom.note.style.display='';
        dom.nextBtn.style.display='';

        dom.opticsLayer.style.opacity='0';
        dom.opticsLayer.style.pointerEvents='none';
        dom.opticsLayer.style.visibility='hidden';

        dom.modelLayer.style.opacity='1';
        dom.modelLayer.style.pointerEvents='auto';
        dom.modelLayer.style.visibility='visible';

        reinitInstrument('top');
        update();
        dom.stage.focus({preventScroll:true});
        return;
      }
      if(busy){
        jumpToEnd();
        return;
      }
      if(prelude>0){
        prelude--;
        progress=1;
        const kind=prelude<=1?'inside':prelude===2?'focus':'top';
        instrument?.setMode?.(prelude>=2?'optical':'inside');
        pose(kind);
        update();
        dom.stage.focus({preventScroll:true});
      }else{
        options.onBack?.();
      }
    }

    function replay(){
      inner?.dispose?.();
      inner=null;
      if(dom.opticsMount)dom.opticsMount.innerHTML='';
      killAllAnimations();
      busy=false;
      auto=false;
      prelude=0;
      progress=1;

      dom.top.style.display='';
      dom.title.style.display='';
      dom.question.style.display='';
      dom.note.style.display='';
      dom.nextBtn.style.display='';

      dom.opticsLayer.style.opacity='0';
      dom.opticsLayer.style.pointerEvents='none';
      dom.opticsLayer.style.visibility='hidden';

      dom.modelLayer.style.opacity='1';
      dom.modelLayer.style.pointerEvents='auto';
      dom.modelLayer.style.visibility='visible';

      reinitInstrument('inside');
      instrument?.trace?.(-1);
      instrument?.setSample?.(false);
      update();
      dom.stage.focus({preventScroll:true});
    }

    function toggleAuto(){if(inner)return;auto=!auto;if(auto)schedule();else clearTimeout(autoTimer);}
    function schedule(){clearTimeout(autoTimer);if(auto&&!dead&&!inner)autoTimer=setTimeout(()=>{if(!busy&&prelude<3)advance();},2400);}

    function key(e){
      if(dead||e.repeat||e.target.matches?.('button,input,textarea,select,a'))return;
      if(inner)return;
      if(e.key===' '||e.key==='ArrowRight'){e.preventDefault();advance();}
      else if(e.key==='ArrowLeft'){e.preventDefault();backToPrelude();}
      else if(e.key.toLowerCase()==='r'){e.preventDefault();replay();}
      else if(e.key.toLowerCase()==='a'){e.preventDefault();toggleAuto();}
    }

    let pointerDownPos=null;
    dom.stage.addEventListener('pointerdown',e=>{pointerDownPos={x:e.clientX,y:e.clientY};});
    dom.stage.addEventListener('click',e=>{
      if(e.target.closest('button,input,textarea,select,a,.po-stage'))return;
      if(pointerDownPos){
        const dist=Math.hypot(e.clientX-pointerDownPos.x,e.clientY-pointerDownPos.y);
        if(dist>8)return;
      }
      advance();
    });

    let touchStartX=null,touchStartY=null;
    dom.stage.addEventListener('touchstart',e=>{const t=e.touches[0];touchStartX=t.clientX;touchStartY=t.clientY;},{passive:true});
    dom.stage.addEventListener('touchend',e=>{
      if(e.target.closest('button,input,textarea,select,a,.po-stage'))return;
      if(touchStartX===null)return;
      const t=e.changedTouches[0],dx=t.clientX-touchStartX,dy=t.clientY-touchStartY;
      touchStartX=null;touchStartY=null;
      if(Math.abs(dx)>40&&Math.abs(dx)>Math.abs(dy)){if(dx<0)advance();else backToPrelude();}
    },{passive:true});

    dom.nextBtn?.addEventListener('click',e=>{e.stopPropagation();advance();});
    if(!options.embedded) document.addEventListener('keydown',key);

    reinitInstrument('inside');
    update();
    dom.stage.focus({preventScroll:true});

    return {
      next:advance,
      prev:backToPrelude,
      replay,
      toggleAuto,
      getState:()=>inner?inner.getState?.():{prelude,busy,auto},
      dispose(){
        dead=true;
        clearTimeout(autoTimer);
        killAllAnimations();
        window.removeEventListener('resize',resize);
        if(!options.embedded) document.removeEventListener('keydown',key);
        inner?.dispose?.();
        instrument?.dispose?.();
        host.innerHTML='';
      }
    };
  }
  window.FTIRPresentationInstrumentBridge={mount};
}());
