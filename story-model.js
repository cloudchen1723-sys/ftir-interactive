/* Pure helpers for the guided lesson. Units remain separate from display geometry. */
(function(root,factory){const a=factory();if(typeof module==='object'&&module.exports)module.exports=a;else root.FTIRStoryModel=a;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const lines=Object.freeze([{wn:1000,weight:1},{wn:1700,weight:.6},{wn:3000,weight:.4}].map(Object.freeze));
  function mode(asymmetric,q){return asymmetric?[q,-8*q/3,q]:[-q,0,q];}
  function frequency(k,m){if(!(k>0&&m>0))throw Error('弹性与约化质量必须为正');return 1700*Math.sqrt(k/m);}
  function power(wn,delta){return (1+Math.cos(2*Math.PI*wn*delta))/2;}
  return {lines,mode,frequency,power};
});
