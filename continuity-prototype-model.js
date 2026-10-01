/* Pure state/data helpers for the N0→N3 continuity prototype. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FTIRContinuityModel=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const states=Object.freeze([
    {id:0,key:'instrument',title:'FTIR 仪器里，信号从哪里来？'},
    {id:1,key:'preview',title:'一次测量发生了什么？'},
    {id:2,key:'michelson',title:'先看 Michelson 干涉仪'},
    {id:3,key:'top',title:'从俯视看两条光路'},
    {id:4,key:'handoff',title:'从真实部件到教学几何'},
    {id:5,key:'displacement',title:'动镜改变了什么？'},
    {id:6,key:'outbound',title:'先看去程'},
    {id:7,key:'return',title:'再看回程'},
    {id:8,key:'opd',title:'把两次变化合在一起'},
    {id:9,key:'periods',title:'不同波数留下不同周期'}
  ]);
  function clamp(v,a=0,b=1){return Math.max(a,Math.min(b,Number(v)||0));}
  function mirrorToOPD(um){return 2*Number(um||0);}
  function phase(wn,opdUm){return 2*Math.PI*wn*opdUm*1e-4;}
  function power(wn,opdUm){return (1+Math.cos(phase(wn,opdUm)))/2;}
  function ac(wn,opdUm,weight=1){return weight*Math.cos(phase(wn,opdUm));}
  function curve(wn,weight=1,n=241,lo=0,hi=10){const xs=[],ys=[];for(let i=0;i<n;i++){const x=lo+(hi-lo)*i/(n-1);xs.push(x);ys.push(ac(wn,x,weight));}return {xs,ys};}
  function periodCount(wn,lo=0,hi=10){return wn*(hi-lo)*1e-4;}
  return Object.freeze({states,clamp,mirrorToOPD,phase,power,ac,curve,periodCount});
});
