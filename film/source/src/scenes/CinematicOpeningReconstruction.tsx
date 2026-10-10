import React from 'react';
import {interpolate,useCurrentFrame} from 'remotion';
import {PALETTE as P,TYPOGRAPHY} from '../styles/visualSystem';
import {evaluateNarrativeMeasurement} from '../math/narrativeTeaching';
import {AMBIGUITY_A,AMBIGUITY_B,AMBIGUITY_SOURCE} from '../math/measurementAmbiguity';
import {evaluateMichelsonTeaching} from '../math/michelsonTeaching';
import {IRSource,Beamsplitter,FixedMirror,MovingMirror,Detector,SampleCell} from '../components/cinematic/OpticalAssets';
import {CinematicIntro} from './CinematicIntro';
import {AbsorptionToReading} from '../components/cinematic/AbsorptionToReading';
export {AMBIGUITY_A,AMBIGUITY_B} from '../math/measurementAmbiguity';

const ramp=(t:number,a:number,b:number)=>interpolate(t,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const smooth=(t:number,a:number,b:number)=>{const p=ramp(t,a,b);return p*p*(3-2*p);};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const dash=['','12 8','2 8'];
const T:React.FC<{x:number;y:number;children:React.ReactNode;size?:number;color?:string;anchor?:'start'|'end'|'middle';opacity?:number}>=({x,y,children,size=30,color=P.white,anchor='middle',opacity=1})=><text x={x} y={y} fill={color} fontSize={size} fontFamily={TYPOGRAPHY.sans} textAnchor={anchor} opacity={opacity}>{children}</text>;
const linePath=(fn:(u:number)=>number,left:number,width:number,zero:number,scale:number,progress=1)=>{
 const p=Math.max(0,Math.min(1,progress)),n=Math.floor(p*360);
 const points=Array.from({length:n+1},(_,i)=>{const u=i/360;return `${i?'L':'M'} ${left+width*u} ${zero-fn(u)*scale}`;});
 if(p>n/360)points.push(`L ${left+width*p} ${zero-fn(p)*scale}`);
 return points.join(' ');
};
const verticalWave=(x:number,y:number,length:number,amplitude:number,cycles:number,phase:number)=>Array.from({length:181},(_,i)=>{const u=i/180;return `${i?'L':'M'} ${x+amplitude*Math.sin(Math.PI*u)*Math.cos(u*cycles*2*Math.PI+phase)} ${y+length*u}`;}).join(' ');

/** Shared, verified mirror state. Visual focus never changes the teaching data. */
export function openingMeasurementState(t:number){
 let x=0;
 if(t>=87&&t<106)x=5*smooth(t,87,90);
 else if(t>=106&&t<114)x=mix(5,7.5,smooth(t,106,110));
 else if(t>=114&&t<122)x=mix(7.5,10,smooth(t,114,118));
 else if(t>=122&&t<127)x=mix(10,15,ramp(t,122,127));
 else if(t>=127&&t<150)x=mix(15,20,ramp(t,132,140));
 else if(t>=150&&t<153)x=20*(1-smooth(t,150,153));
 else if(t>=153&&t<158)x=5*ramp(t,153,157);
 else if(t>=158&&t<161)x=5*(1-smooth(t,158,161));
 else if(t>=161&&t<162)x=0;
 else if(t>=162)x=5*ramp(t,162,166);
 const composition=t>=158?AMBIGUITY_B:AMBIGUITY_A;
 const measurement=evaluateNarrativeMeasurement(x*2e-4,composition);
 return {x,opdUm:2*x,composition,measurement,field:evaluateMichelsonTeaching(x,1000)};
}

export const CinematicOpeningReconstruction:React.FC=()=>{
 const frame=useCurrentFrame(),filmTime=frame/30,t=filmTime+6;
 if(filmTime<30)return <CinematicIntro/>;
 if(filmTime<58)return <AbsorptionToReading time={filmTime}/>;
 const s=openingMeasurementState(t);
 const overview=smooth(t,64,73),focus=smooth(t,104,107)*(1-smooth(t,124,128)),recordFocus=smooth(t,127,132);
 const scale=mix(mix(1.4,1,overview),.76,recordFocus)+focus*.28;
 const cx=mix(mix(820,960,overview),1670,recordFocus)-focus*50;
 const cy=mix(mix(650,500,overview),460,recordFocus)+focus*18;
 const camera=`translate(${960-cx*scale} ${540-cy*scale}) scale(${scale})`;
 const screen=(x:number,y:number)=>({x:960+(x-cx)*scale,y:540+(y-cy)*scale});
 // The focus shot expands only the displayed extra travel of this scan; the physical state is untouched.
 const mx=1120+s.x*14+recordFocus*Math.max(0,s.x-15)*38;
 const detector=screen(820,800),sample=screen(820,650);
 const upstream=smooth(t,71,75),phase=smooth(t,104.5,106)*(1-smooth(t,126,129));
 const rhythm=smooth(t,127,131)*(1-smooth(t,147,150)),progress=ramp(t,132,140);
 const graphIn=smooth(t,150,153),aProgress=ramp(t,153,157),bProgress=ramp(t,162,166);
 const graph={left:1010,width:710,zero:785,scale:135};
 const valueA=(u:number)=>evaluateNarrativeMeasurement(u*.001,AMBIGUITY_A).totalRaw;
 const valueB=(u:number)=>evaluateNarrativeMeasurement(u*.001,AMBIGUITY_B).totalRaw;
 const firstY=graph.zero-valueA(0)*graph.scale;
 let tokenX=detector.x,tokenY=detector.y;
 if(t>=150&&t<153){const p=smooth(t,150,153);tokenX=mix(detector.x,graph.left,p);tokenY=mix(detector.y,firstY,p);}
 else if(t>=153&&t<158){tokenX=graph.left+graph.width*aProgress;tokenY=graph.zero-valueA(aProgress)*graph.scale;}
 else if(t>=158&&t<161){const p=smooth(t,158,161);tokenX=mix(graph.left+graph.width,graph.left,p);tokenY=mix(graph.zero-valueA(1)*graph.scale,firstY,p)-65*Math.sin(Math.PI*p);}
 else if(t>=161){tokenX=graph.left+graph.width*bProgress;tokenY=graph.zero-valueB(bProgress)*graph.scale;}
 const recall=smooth(t,148,151)*(1-smooth(t,166,168));
 const compositionMix=smooth(t,158,161);
 const recallProfile=Array.from({length:181},(_,i)=>{
  const u=i/180,nu=500+3000*u;
  const strength=AMBIGUITY_SOURCE.reduce((sum,c,j)=>sum+mix(AMBIGUITY_A[j].amplitude,AMBIGUITY_B[j].amplitude,compositionMix)*Math.exp(-.5*((nu-c.wavenumber)/120)**2),0);
  return `${i?'L':'M'} ${sample.x-270+240*u} ${sample.y-45-strength*100}`;
 }).join(' ');
 const hardwareContext=mix(1,.2,recordFocus)*(1-phase*.46);
 const power=t<73?1:s.measurement.totalRaw/2.9;
 const responseIn=smooth(t,36,39);
 const emptyRecord=smooth(t,61,64);

 return <div data-production-batch="01-05" data-frame={frame} data-mirror-x={s.x} data-opd-um={s.opdUm} data-raw={s.measurement.totalRaw} style={{position:'absolute',inset:0,background:P.bgVoid,overflow:'hidden'}}>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   <defs><marker id="opening-beam" markerWidth="7" markerHeight="7" refX="6" refY="3.5" orient="auto"><path d="M0 0L7 3.5L0 7Z" fill={P.amberLight}/></marker></defs>
   <g transform={camera}>
    <g opacity={upstream*hardwareContext}>
     <IRSource x={255} y={450} label={false}/><Beamsplitter x={820} y={450} label={false}/><FixedMirror x={820} y={150} label={false}/>
     <path d={`M277 450 H${mix(277,808,ramp(t,73,74))}`} stroke={P.amberLight} strokeWidth="3.5" fill="none"/>
     <path d={`M820 438 V${mix(438,166,ramp(t,73.6,74.7))}`} stroke={P.amberLight} strokeWidth="3" fill="none" markerEnd="url(#opening-beam)"/>
     <path d={`M810 166 V${mix(166,438,ramp(t,74.7,76))}`} stroke={P.amberLight} strokeWidth="2.5" fill="none" markerEnd="url(#opening-beam)"/>
     <path d={`M832 450 H${mix(832,mx-8,ramp(t,74,75.1))}`} stroke={P.amberLight} strokeWidth="3" fill="none" markerEnd="url(#opening-beam)"/>
     <path d={`M${mx-8} 460 H${mix(mx-8,832,ramp(t,75.1,76.4))}`} stroke={P.amberLight} strokeWidth="2.5" fill="none" markerEnd="url(#opening-beam)"/>
    </g>
    <g opacity={upstream*mix(1,.42,recordFocus)}>
     <MovingMirror x={mx} y={450} label={false}/>
     {t>=104.5&&<g opacity={smooth(t,104.5,107)}>
      <line x1="1120" y1="535" x2={1120+mix(210,470,recordFocus)} y2="535" stroke={P.grayInactive} strokeWidth="3"/>
      <line x1={mx} y1="505" x2={mx} y2="546" stroke={P.white} strokeWidth="3"/>
      <circle cx={mx} cy="535" r="6" fill={P.white}/>
     </g>}
     {t>=87&&t<104.5&&<g opacity={1-smooth(t,103,104.5)}>
      <line x1="1120" y1="390" x2="1120" y2="510" stroke={P.grayInactive} strokeWidth="2" strokeDasharray="7 7"/>
      <line x1="1120" y1="420" x2={mx} y2="420" stroke={P.amberLight} strokeWidth="5"/>
      <line x1={mx} y1="490" x2="1120" y2="490" stroke={P.amberLight} strokeWidth="5"/>
      <T x={(1120+mx)/2} y={404} opacity={smooth(t,88,89)}>+x</T>
      <T x={(1120+mx)/2} y={536} opacity={smooth(t,89,90)}>+x</T>
      <T x={1185} y={625} size={38} opacity={smooth(t,92,94)*(1-smooth(t,100,102))}>x + x → 2x</T>
      <T x={1185} y={625} size={34} opacity={smooth(t,101,103)}>光程差　δ = 2x</T>
     </g>}
    </g>
    <SampleCell x={820} y={650} label={false} opacity={hardwareContext}/>
    <path d={t<73?'M820 510 V602':`M820 462 V${mix(462,602,ramp(t,76.4,78))}`} stroke={P.amberLight} strokeWidth={mix(3.5,3,recordFocus)} fill="none" opacity={(.12+.88*power)*mix(1,.3,recordFocus)}/>
    <path d="M820 698V788" stroke={P.amberLight} strokeWidth={mix(3.5,3,recordFocus)} opacity={(.12+.88*power)*mix(1,.3,recordFocus)}/>
    <Detector x={820} y={800} label={false}/>
    {/* Field observation stays on the returning optical arm; selected component, not total detector power. */}
    <g opacity={phase}>
     <path d={linePath(u=>Math.cos(4*Math.PI*u),832,mx-840,460,34)} fill="none" stroke={P.grayContext} strokeWidth="3"/>
     <path d={linePath(u=>Math.cos(4*Math.PI*u+s.field.phaseRad),832,mx-840,460,34)} fill="none" stroke={P.amberLight} strokeWidth="3.5"/>
     <path d={verticalWave(820,475,120,27*Math.cos(s.field.phaseRad/2),2,s.field.phaseRad/2)} fill="none" stroke={P.amberLight} strokeWidth="3.5"/>
    </g>
   </g>

   {recall>0&&<g opacity={recall}>
    {/* Recall the SAME known frequency distribution, then let the detector write the scan. */}
    <path d={recallProfile} fill="none" stroke={P.amberLight} strokeWidth="3"/>
    <T x={sample.x+70} y={sample.y+12} size={30} anchor="start">样品 {compositionMix<.02?'A':compositionMix>.98?'B':'A → B'}</T>
   </g>}
   {/* One integrated detector aperture responds to total power, so the fixed-state invariant is visible. */}
   <circle cx={detector.x} cy={detector.y} r={mix(7,29,responseIn)} fill={P.bgVoid} stroke={P.cyanSignal} strokeWidth="1.5" opacity={responseIn*.65}/>
   <circle cx={detector.x} cy={detector.y} r={mix(7,12+power*13,responseIn)} fill={P.cyanSignal} opacity={mix(1,.15+power*.55,responseIn)}/>
   {/* Empty writing space starts at the detector before any record exists. */}
   <path d={`M${detector.x+10} ${detector.y} Q${detector.x+110} ${detector.y+80} ${graph.left} ${graph.zero} H${mix(graph.left,graph.left+graph.width,emptyRecord)}`} fill="none" stroke={P.grayInactive} strokeWidth="1.6" strokeDasharray="4 12" opacity={emptyRecord*(1-smooth(t,70,73))}/>
   {t>=80&&t<87&&<T x={1440} y={310} size={36} opacity={smooth(t,80,82)*(1-smooth(t,85,87))}>迈克尔逊干涉仪</T>}
   {t>=105&&t<116&&<T x={1130} y={230} size={29} color={P.grayContext} opacity={smooth(t,105,106)*(1-smooth(t,114,116))}>只观察一个成分：1000 cm⁻¹</T>}
   {t>=119&&t<125&&<T x={1130} y={230} size={34} opacity={smooth(t,119,120)*(1-smooth(t,123,125))}>相位差</T>}
   {t>=128&&t<133&&<T x={1365} y={218} size={29} color={P.grayContext} opacity={smooth(t,128,129)*(1-smooth(t,131,133))}>展开观察成分 · 同一个扫描</T>}

   {/* One scan opens into explanatory traces rooted in the same detector, no dashboard enclosure. */}
   <g opacity={rhythm}>
    {[1000,3000].map((nu,i)=>{const zero=470+i*235,fn=(u:number)=>(1+Math.cos(2*Math.PI*(nu/1000)*u))/2;const headX=graph.left+graph.width*progress,headY=zero-fn(progress)*132;return <g key={nu}>
     <T x={graph.left} y={zero-175} anchor="start" size={29}>{nu} cm⁻¹</T>
     <path d={linePath(fn,graph.left,graph.width,zero,132,progress)} fill="none" stroke={P.amberLight} strokeWidth="4" strokeDasharray={i?dash[2]:undefined} strokeLinecap="round"/>
     <circle cx={headX} cy={headY} r={6+fn(progress)*7} fill={P.amberLight}/>
    </g>;})}
    <line x1={graph.left+graph.width*progress} y1="285" x2={graph.left+graph.width*progress} y2="748" stroke={P.white} strokeWidth="1.5" opacity=".4"/>
    {t>=141&&t<147&&<T x={1365} y={838} size={29} color={P.grayContext} opacity={smooth(t,141,142)*(1-smooth(t,146,147))}>同一扫描：光程差 30 → 40 μm</T>}
   </g>

   {/* True nonnegative power, common scale. A is frozen before B is acquired. */}
   <g opacity={graphIn}>
    <line x1={graph.left} y1={graph.zero} x2={graph.left+graph.width} y2={graph.zero} stroke={P.grayInactive} strokeWidth="1.8"/>
    <path d={linePath(valueA,graph.left,graph.width,graph.zero,graph.scale,aProgress)} fill="none" stroke={P.cyanSignal} strokeWidth="4" strokeLinecap="round"/>
    {t>=162&&<path d={linePath(valueB,graph.left,graph.width,graph.zero,graph.scale,bProgress)} fill="none" stroke={P.white} strokeWidth="3.5" strokeDasharray="12 8" strokeLinecap="round"/>}
    <circle cx={graph.left} cy={firstY} r="7" fill={P.cyanSignal}/>
    {t>=157&&<T x={graph.left+graph.width+28} y={graph.zero-valueA(1)*graph.scale-5} anchor="start" size={28} color={P.cyanSignal}>样品 A</T>}
    {t>=166&&<T x={graph.left+graph.width+28} y={graph.zero-valueB(1)*graph.scale+15} anchor="start" size={28}>样品 B</T>}
    {t>=167&&<g opacity={smooth(t,167,169)}>
     <T x={1365} y={848} color={P.grayContext} size={29}>光程差 0 → 10 μm</T>
     <T x={graph.left} y={firstY-34} anchor="start" color={P.grayContext} size={28}>总响应 · 同一尺度</T>
    </g>}
   </g>
   <circle cx={detector.x} cy={detector.y} r="7" fill={P.cyanSignal} opacity={.25+.75*power}/>
   {t>=150&&<circle cx={tokenX} cy={tokenY} r="8" fill={t>=162?P.white:P.cyanSignal} stroke={P.bgVoid} strokeWidth="2"/>}
  </svg>
 </div>;
};
