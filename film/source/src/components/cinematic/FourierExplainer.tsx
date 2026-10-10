import React from 'react';
import {TeachingRecord,TeachingProjection,TeachingSpectrumPoint,projectTeachingRecord} from '../../math/fourierTeaching';
import {PALETTE as P,TYPOGRAPHY} from '../../styles/visualSystem';

const mix=(a:number,b:number,p:number)=>a+(b-a)*p;
const ease=(f:number,a:number,b:number)=>{const p=Math.max(0,Math.min(1,(f-a)/(b-a)));return p*p*(3-2*p);};
const Label:React.FC<{x:number;y:number;children:React.ReactNode;color?:string;opacity?:number;size?:number;anchor?:'start'|'middle'|'end'}>=({x,y,children,color=P.white,opacity=1,size=28,anchor='start'})=><text x={x} y={y} textAnchor={anchor} fill={color} opacity={opacity} fontSize={size} fontFamily={TYPOGRAPHY.sans}>{children}</text>;

/** Presentation of the original signed projection, with no replacement mathematics. */
export const FourierExplainer:React.FC<{
 frame:number;record:TeachingRecord;projection:TeachingProjection;cursor:number;targetNu:number;
 changing:boolean;wrongWindow:boolean;matchingWindow:boolean;scanProgress:number;
 spectrum:readonly TeachingSpectrumPoint[];deposits:number[];sweepCandidates:number[];sweptCount:number;
 flying:boolean;flightNu:number;flightProgress:number;showEquation:boolean;
}>=({frame:f,record,projection,cursor,targetNu,changing,wrongWindow,matchingWindow,scanProgress,spectrum,deposits,sweepCandidates,sweptCount,flying,flightNu,flightProgress,showEquation})=>{
 const reframe=ease(f,0,150),fold=ease(f,1260,1380);
 const left=mix(240,330,reframe),width=mix(1440,1160,reframe);
 const signalY=mix(mix(520,315,reframe),225,fold),signalScale=mix(mix(180/1.9,90,reframe),45,fold);
 const probeY=510,productY=710,productScale=65;
 const x=(i:number)=>left+width*(record.opdCm[i]+record.opdSpanCm/2)/record.opdSpanCm;
 const path=(values:readonly number[],zero:number,scale:number,count=values.length)=>values.slice(0,count).map((v,i)=>`${i?'L':'M'} ${x(i)} ${zero-v*scale}`).join(' ');
 const productCount=Math.round(record.sampleCount*ease(f,270,360));
 const area=(sign:number,count:number)=>{
  if(count<2)return '';
  return `M${x(0)} ${productY} `+projection.signedProduct.slice(0,count).map((v,i)=>`L${x(i)} ${productY-Math.max(0,v*sign)*sign*productScale}`).join(' ')+` L${x(count-1)} ${productY} Z`;
 };
 const selected=Math.max(0,Math.min(record.sampleCount-1,cursor));
 const accX=1650,accY=mix(710,355,fold),coefficient=projection.cumulative[cursor];
 const netY=accY-coefficient*190;
 const spectrumY=mix(815,600,fold),spectrumLeft=340,spectrumWidth=1130,spectrumScale=mix(110,240,fold);
 const nuX=(nu:number)=>spectrumLeft+(4000-nu)/3500*spectrumWidth;
 const flightCoefficient=projectTeachingRecord(record,flightNu).coefficient;
 const flightStartY=accY-flightCoefficient*190;
 const flightX=mix(accX,nuX(flightNu),flightProgress);
 const flightY=mix(flightStartY,spectrumY-flightCoefficient*spectrumScale,flightProgress)-55*Math.sin(Math.PI*flightProgress);
 const rowsOpacity=1-fold;
 const holdLabel=wrongWindow&&scanProgress>=1?'正负抵消':matchingWindow&&scanProgress>=1?'留下净值':'';
 return <div style={{position:'absolute',inset:0,background:P.bgVoid}}>
  <svg width="1920" height="1080" data-record-id={record.id} data-stage="explainer-projection" data-probe-wavenumber={targetNu} data-accumulated-coefficient={changing?'paused':coefficient}>
   <g opacity={mix(1,.28,fold)}>
    <line x1={left} x2={left+width} y1={signalY} y2={signalY} stroke={P.grayInactive} strokeWidth="1.5"/>
    <path d={path(record.signal,signalY,signalScale)} fill="none" stroke={P.white} strokeWidth="4" strokeLinecap="round"/>
    <Label x={left} y={signalY-155} opacity={ease(f,150,190)*(1-fold)}>同一份记录</Label>
   </g>
   <g opacity={rowsOpacity}>
    <g opacity={ease(f,150,210)}>
     <line x1={left} x2={left+width} y1={probeY} y2={probeY} stroke={P.grayInactive} strokeWidth="1.2"/>
     <path d={path(projection.probe,probeY,45)} fill="none" stroke={P.cyanSignal} strokeWidth="3.5" opacity={changing?.65:1}/>
     <Label x={left} y={probeY-65} color={P.cyanSignal}>试一个节奏</Label>
     <Label x={left+width} y={probeY-65} color={P.cyanSignal} anchor="end">{Math.round(targetNu)} cm⁻¹</Label>
    </g>
    {f>=270&&<g>
     <line x1={left} x2={left+width} y1={productY} y2={productY} stroke={P.grayContext} strokeWidth="1.5"/>
     <path d={area(1,productCount)} fill={P.cyanSignal} opacity={changing?.12:.22}/>
     <path d={area(-1,productCount)} fill={P.amberLight} opacity={changing?.12:.22}/>
     {!changing&&f>=390&&<>
      <path d={area(1,Math.min(cursor,productCount))} fill={P.cyanSignal} opacity=".62"/>
      <path d={area(-1,Math.min(cursor,productCount))} fill={P.amberLight} opacity=".62"/>
     </>}
     <path d={path(projection.signedProduct,productY,productScale,productCount)} fill="none" stroke={P.white} strokeWidth="1.4" opacity=".45"/>
     <Label x={left} y={productY+110} color={P.grayContext} opacity={1-ease(f,360,420)}>逐点相乘，保留正负</Label>
    </g>}
    {!changing&&f>=390&&f<1140&&<g>
     <line x1={x(selected)} x2={x(selected)} y1={signalY-110} y2={productY+105} stroke={P.white} strokeWidth="1.5" opacity=".45"/>
     {[record.signal[selected]*signalScale,projection.probe[selected]*45,projection.signedProduct[selected]*productScale].map((v,i)=><circle key={i} cx={x(selected)} cy={[signalY,probeY,productY][i]-v} r="6" fill={i===0?P.white:i===1?P.cyanSignal:projection.signedProduct[selected]>=0?P.cyanSignal:P.amberLight}/>)}
    </g>}
   </g>
   {f>=360&&f<1860&&<g opacity={changing?.25:1}>
    <line x1={accX-28} x2={accX+28} y1={accY} y2={accY} stroke={P.grayContext} strokeWidth="2"/>
    <line x1={accX} x2={accX} y1={accY} y2={netY} stroke={coefficient>=0?P.cyanSignal:P.amberLight} strokeWidth="5"/>
    {!flying&&<circle cx={accX} cy={netY} r="8" fill={coefficient>=0?P.cyanSignal:P.amberLight}/>}
    <Label x={accX} y={accY+55} anchor="middle" color={P.grayContext} opacity={1-fold}>净值</Label>
    {holdLabel&&<Label x={accX} y={accY-160} anchor="middle" color={wrongWindow?P.grayContext:P.cyanSignal}>{holdLabel}</Label>}
    {wrongWindow&&scanProgress>=1&&<Label x={accX} y={netY-28} anchor="middle" color={P.white} size={32}>≈ 0</Label>}
   </g>}
   {f>=1080&&<g opacity={ease(f,1080,1140)}>
    <line x1={spectrumLeft} x2={spectrumLeft+spectrumWidth} y1={spectrumY} y2={spectrumY} stroke={P.grayContext} strokeWidth="2"/>
    {deposits.map(nu=>{const a=spectrum.find(p=>p.wavenumber===nu)!.coefficient;return <g key={nu}>
     <line x1={nuX(nu)} x2={nuX(nu)} y1={spectrumY} y2={spectrumY-a*spectrumScale} stroke={P.cyanSignal} strokeWidth="4"/>
     <circle cx={nuX(nu)} cy={spectrumY-a*spectrumScale} r="7" fill={P.cyanSignal}/>
    </g>;})}
    {sweepCandidates.slice(0,sweptCount).filter(nu=>!deposits.includes(nu)).map(nu=>{const a=spectrum.find(p=>p.wavenumber===nu)!.coefficient;return <g key={nu}>
     <line x1={nuX(nu)} x2={nuX(nu)} y1={spectrumY} y2={spectrumY-a*spectrumScale} stroke={P.grayContext} strokeWidth="2"/>
     <circle cx={nuX(nu)} cy={spectrumY-a*spectrumScale} r="3" fill={P.grayContext}/>
    </g>;})}
    <Label x={spectrumLeft} y={spectrumY+45} color={P.grayContext} opacity={fold}>4000</Label>
    <Label x={spectrumLeft+spectrumWidth} y={spectrumY+45} color={P.grayContext} anchor="end" opacity={fold}>500 cm⁻¹</Label>
    <Label x={960} y={spectrumY-245} anchor="middle" size={36} opacity={fold*(1-ease(f,2340,2400))}>每次检验，留下一个谱点</Label>
   </g>}
   {flying&&<circle cx={flightX} cy={flightY} r="9" fill={P.cyanSignal} data-coefficient-token="true"/>}
   {showEquation&&<g opacity={ease(f,2400,2460)}>
    <Label x={960} y={770} anchor="middle" size={32}>a(ν̃) = Σᵢ I(δᵢ) cos(2πν̃δᵢ) / Σᵢ cos²(2πν̃δᵢ)</Label>
    <Label x={960} y={820} anchor="middle" color={P.grayContext} size={25}>有限采样的归一化投影 · 傅里叶系数</Label>
   </g>}
  </svg>
 </div>;
};
