import React from 'react';
import {useCurrentFrame,interpolate,interpolateColors} from 'remotion';
import {Act2VibrationalModes} from './Act2VibrationalModes';
import {SampleCell,Detector} from '../components/cinematic/OpticalAssets';
import {PALETTE as P,TYPOGRAPHY} from '../styles/visualSystem';
const ramp=(t:number,a:number,b:number)=>interpolate(t,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
const smooth=(t:number,a:number,b:number)=>{const p=ramp(t,a,b);return p*p*(3-2*p);};
const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const Text:React.FC<{x:number;y:number;children:React.ReactNode;opacity?:number;size?:number;color?:string}>=({x,y,children,opacity=1,size=30,color=P.white})=><text x={x} y={y} textAnchor="middle" fontFamily={TYPOGRAPHY.sans} fill={color} opacity={opacity} fontSize={size}>{children}</text>;
// Hand-built stroke paths use the established cinematic line language. Resampling preserves each moving strand.
const letterRoutes=[
 [[800,410],[700,410],[700,565],[700,490],[780,490]],
 [[825,410],[935,410],[880,410],[880,565]],
 [[975,410],[1045,410],[1010,410],[1010,565],[975,565],[1045,565]],
 [[1090,565],[1090,410],[1150,410],[1177,425],[1185,450],[1177,476],[1150,490],[1090,490],[1150,490],[1190,565]],
 ];
function routePoint(route:number[][],u:number){const lengths=route.slice(1).map((p,i)=>Math.hypot(p[0]-route[i][0],p[1]-route[i][1]));let distance=u*lengths.reduce((a,b)=>a+b,0);for(let i=0;i<lengths.length;i++){if(distance<=lengths[i]){const q=distance/lengths[i];return {x:mix(route[i][0],route[i+1][0],q),y:mix(route[i][1],route[i+1][1],q)};}distance-=lengths[i];}const p=route.at(-1)!;return{x:p[0],y:p[1]};}

export const CinematicIntro:React.FC=()=>{
 const t=useCurrentFrame()/30;
 const collapse=smooth(t,15,20);
 const titleMorph=smooth(t,20,24);
 const titleExit=smooth(t,28,30);
 const molecularFrame=300+Math.min(t,19)*30;
 const wavePhase=(molecularFrame-300)*.22;
 const chooseMode=smooth(t,7,9);
 const moleculeScale=mix(mix(1.16,1.6,chooseMode),.22,collapse);
 const moleculeX=mix(960,560,collapse),moleculeY=540;
 const electricFieldIn=smooth(t,9,11);
 const couplingStrength=electricFieldIn*(1-smooth(t,17,20));
 const amplitude=mix(18,42,smooth(t,11,16));
 const motionGuides=smooth(t,1.6,2.5)*(1-smooth(t,6,7));
 const measurementIn=smooth(t,28,30);
 const sampleY=540,detectorY=750;
 const strands=[0,1,2,3].map(i=>{
  const d=Array.from({length:97},(_,j)=>{const u=j/96;const wave={x:560+180*i+180*u,y:540-19*mix(1,.38,smooth(t,14,17))*Math.cos(u*Math.PI*2+wavePhase)};
   const route=routePoint(letterRoutes[i],u);
   const letter={x:960+(route.x-960)*1.5,y:495+(route.y-495)*1.5};
   const x=mix(mix(wave.x,letter.x,titleMorph),960,titleExit);
   const y=mix(mix(wave.y,letter.y,titleMorph),mix(344,472.8,u),titleExit);
   return `${j?'L':'M'} ${x.toFixed(2)} ${y.toFixed(2)}`;}).join(' ');
  return <path key={i} d={d} stroke={interpolateColors(t,[20,24,28,30],[P.amberLight,P.white,P.white,P.amberLight])} fill="none" strokeWidth={mix(3,6,titleMorph)*(1-titleExit*.42)} strokeLinecap="round" strokeLinejoin="round" opacity={smooth(t,15,19)*(1-titleExit*.75)}/>;
 });
 return <div style={{position:'absolute',inset:0,background:P.bgVoid,overflow:'hidden'}} data-opening-time={t}>
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   {t>=9&&t<20&&<path d={Array.from({length:241},(_,i)=>{const u=i/240;const right=mix(720,1520,smooth(t,9,11.5));const x=200+(right-200)*u;const after=x>moleculeX+240*moleculeScale;const attenuation=after?mix(1,.38,smooth(t,11,17)):1;return `${i?'L':'M'} ${x.toFixed(2)} ${(540-19*attenuation*Math.cos((x-moleculeX)/180*Math.PI*2+wavePhase)).toFixed(2)}`;}).join(' ')} fill="none" stroke={P.amberLight} strokeWidth="3" opacity={electricFieldIn*(1-smooth(t,18,20))}/>}
  </svg>
  {t<9&&(['symmetric','bend'] as const).map((mode,i)=>{const x=mix(i?1480:440,i?1770:150,chooseMode),scale=mix(1.16,.65,chooseMode);return <div key={mode} style={{position:'absolute',inset:0,transformOrigin:'0 0',transform:`translate(${x-scale*960}px,${540-scale*520}px) scale(${scale})`,opacity:smooth(t,0,1)*(1-chooseMode)}}>
   <Act2VibrationalModes frameOverride={molecularFrame} editorial minimal modeOverride={mode} amplitudeOverride={25} motionGuides={motionGuides}/>
  </div>;})}
  {t<22&&<div style={{position:'absolute',inset:0,transformOrigin:'0 0',transform:`translate(${moleculeX-moleculeScale*960}px,${moleculeY-moleculeScale*520}px) scale(${moleculeScale})`,opacity:1-smooth(t,19,22)}}>
   <Act2VibrationalModes frameOverride={molecularFrame} editorial minimal modeOverride="asymmetric" amplitudeOverride={amplitude} couplingStrength={couplingStrength} motionGuides={motionGuides}/>
  </div>}
  <svg width="1920" height="1080" style={{position:'absolute',inset:0}}>
   {strands}
   <Text x={960} y={670} size={35} opacity={smooth(t,24,25)*(1-titleExit)}>Listening to the Vibrations of Matter</Text>
   <g opacity={measurementIn}>
    <g transform="translate(960 540) scale(1.4) translate(-960 -540)"><SampleCell x={960} y={sampleY} label={false}/></g>
    <g opacity={measurementIn}>
     <line x1="941" y1="540" x2="979" y2="540" stroke={P.grayContext} strokeWidth="1.5"/>
     {[942,960,978].map((x,i)=><circle key={x} cx={x} cy="540" r={i===1?2.9:3.4} fill={P.bgVoid} stroke={P.white} strokeWidth="1"/>)}
    </g>
    <path d={`M960 607 V${mix(607,733,smooth(t,28,30))}`} stroke={P.amberLight} strokeWidth="3.5" fill="none"/>
    <g transform="translate(960 750) scale(1.4) translate(-960 -750)"><Detector x={960} y={detectorY} label={false}/></g>
    <circle cx="960" cy={detectorY} r="7" fill={P.cyanSignal} opacity={smooth(t,29,30)}/>
   </g>
  </svg>
 </div>;
};
