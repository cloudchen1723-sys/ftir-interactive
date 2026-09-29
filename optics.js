/* Shared optical geometry, in arbitrary model units (not centimetres).
 * The pose exaggerates physical mirror motion. Physics lives in physics.js. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.FTIROptics=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  const Y=1.22;
  const parts=Object.freeze({source:[-3.7,Y,0],collimator:[-2.6,Y,0],splitter:[0,Y,0],fixed:[0,Y,3],moving:[3,Y,0],sample:[0,Y,-2.15],collector:[0,Y,-3.2],detector:[0,Y,-4.1],laser:[-3.35,.7,2.35],electronics:[2.75,.6,-3.35]});
  function mirrorX(mm){return 3+Math.max(-.02,Math.min(.02,mm))/.02*.58;}
  function reflect(v,n){const d=v.reduce((s,x,i)=>s+x*n[i],0);return v.map((x,i)=>x-2*d*n[i]);}
  function paths(mm=0){const bs=[0,Y,0],m=[mirrorX(mm),Y,0];return {input:[parts.source,parts.collimator,bs],fixed:[bs,parts.fixed,bs],moving:[bs,m,bs],output:[bs,parts.sample,parts.collector,parts.detector]};}
  return {Y,parts,mirrorX,reflect,paths,bsNormal:[Math.SQRT1_2,0,-Math.SQRT1_2]};
});
