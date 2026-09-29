/* One scroll-derived timeline for the cover, signal, header and optical core. */
(function(){
  'use strict';
  const clamp=v=>Math.max(0,Math.min(1,v));
  const smooth=(a,b,x)=>{const t=clamp((x-a)/(b-a));return t*t*(3-2*t);};
  const mix=(a,b,t)=>Math.round(a+(b-a)*t);
  const rgb=(a,b,t)=>`rgb(${a.map((v,i)=>mix(v,b[i],t)).join(',')})`;
  window.mountFTIRHomeTransition=function(journey,disposeSignal){
    const stage=journey.querySelector('.home-stage'),hero=journey.querySelector('.home-hero');
    const signal=journey.querySelector('.signal-material'),lab=journey.querySelector('.home-lab');
    const core=journey.querySelector('.home-lab-core'),fallback=journey.querySelector('.home-lab-fallback');
    const enter=journey.querySelector('[data-transition-start]'),continueButton=journey.querySelector('.home-lab-next');
    const header=document.querySelector('.home-header'),motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let progress=-1,raf=0,labModel=null,dead=false,coreAttempted=false;
    function mountCore(){
      if(labModel||coreAttempted||!window.mountFTIRHomeLab||!window.THREE)return;
      coreAttempted=true;
      labModel=window.mountFTIRHomeLab(core);
      if(labModel)fallback.setAttribute('hidden','');
    }
    function apply(p){
      p=clamp(p);if(p===progress){if(p>.55){mountCore();labModel?.setProgress(smooth(.69,1,p));}return;}progress=p;
      journey.dataset.transitionProgress=p.toFixed(3);
      const dark=smooth(.35,.78,p),headerDark=smooth(.42,.84,p);
      stage.style.setProperty('--cover-opacity',(1-smooth(.19,.58,p)).toFixed(3));
      stage.style.setProperty('--signal-opacity',(1-smooth(.55,.86,p)).toFixed(3));
      stage.style.setProperty('--signal-contraction',(1-.72*smooth(.38,.73,p)).toFixed(3));
      stage.style.setProperty('--lab-dark',dark.toFixed(3));
      stage.style.setProperty('--model-opacity',smooth(.69,.98,p).toFixed(3));
      stage.style.setProperty('--thread-opacity',(smooth(.54,.69,p)*(1-smooth(.82,.99,p))*.58).toFixed(3));
      stage.style.setProperty('--lab-next-opacity',smooth(.91,1,p).toFixed(3));
      header.style.setProperty('--header-background',rgb([250,251,249],[11,17,24],headerDark));
      header.style.setProperty('--header-ink',rgb([20,36,46],[224,235,241],headerDark));
      header.style.setProperty('--header-muted',rgb([101,117,133],[151,172,186],headerDark));
      header.style.setProperty('--header-rule',rgb([21,38,48],[127,175,186],headerDark));
      lab.inert=p<.88;lab.setAttribute('aria-hidden',String(p<.88));
      continueButton.disabled=p<.88;
      if(p>.88&&document.activeElement===enter)continueButton.focus({preventScroll:true});
      hero.inert=p>.88;hero.setAttribute('aria-hidden',String(p>.88));
      signal.dataset.transitionIdle=p>.9?'true':'false';
      disposeSignal.setPaused?.(p>.9);
      if(p>.55){mountCore();labModel?.setProgress(smooth(.69,1,p));}
    }
    function update(){raf=0;if(dead)return;
      const distance=Math.max(1,journey.offsetHeight-stage.offsetHeight);
      const raw=clamp(window.scrollY/distance);
      apply(motion.matches?(raw>.05?1:0):raw);
    }
    function request(){if(!raf&&!dead)raf=window.requestAnimationFrame(update);}
    function start(){const distance=Math.max(1,journey.offsetHeight-stage.offsetHeight);
      window.scrollTo({top:distance,behavior:motion.matches?'instant':'smooth'});
    }
    enter.addEventListener('click',start);
    window.addEventListener('scroll',request,{passive:true});window.addEventListener('resize',request);
    window.addEventListener('ftir-3d-ready',request);motion.addEventListener('change',request);
    update();
    return()=>{dead=true;window.cancelAnimationFrame(raf);enter.removeEventListener('click',start);
      window.removeEventListener('scroll',request);window.removeEventListener('resize',request);
      window.removeEventListener('ftir-3d-ready',request);motion.removeEventListener('change',request);
      labModel?.dispose();header.removeAttribute('style');delete signal.dataset.transitionIdle;};
  };
})();
