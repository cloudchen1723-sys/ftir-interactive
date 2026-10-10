import React from 'react';
import {Act2VibrationalModes} from '../../scenes/Act2VibrationalModes';
import {AMBIGUITY_SOURCE, AMBIGUITY_A, AMBIGUITY_B} from '../../math/measurementAmbiguity';
import {SampleCell, Detector} from './OpticalAssets';
import {PALETTE as P, TYPOGRAPHY} from '../../styles/visualSystem';

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = (t: number, a: number, b: number) => {
  const p = Math.max(0, Math.min(1, (t-a)/(b-a))); return p*p*(3-2*p);
};
const Text: React.FC<{x: number; y: number; children: React.ReactNode; opacity?: number; color?: string; anchor?: 'middle'|'start'}> =
  ({x,y,children,opacity=1,color=P.white,anchor='middle'}) =>
    <text x={x} y={y} opacity={opacity} fill={color} textAnchor={anchor} fontSize="29" fontFamily={TYPOGRAPHY.sans}>{children}</text>;

/** Known teaching decomposition of the same light, not a spectrum read by the detector. */
export const AbsorptionToReading: React.FC<{time: number}> = ({time: t}) => {
  const inspect = ease(t,30,33), returnToCell = ease(t,52,56);
  const absorb = ease(t,32,36), compare = ease(t,43,46);
  const weights = AMBIGUITY_A.map((c,i) => mix(AMBIGUITY_SOURCE[i].amplitude, mix(c.amplitude, AMBIGUITY_B[i].amplitude, compare), absorb));
  const remaining = weights.reduce((sum,w) => sum+w,0);
  const totalPower = 2*remaining; // The existing fixed zero-OPD example, revealed later.
  const selectedLoss = AMBIGUITY_SOURCE[1].amplitude-weights[1];
  const moleculeY = mix(mix(540,330,inspect),540,returnToCell);
  const moleculeScale = mix(mix(.12,1.05,inspect),.12,returnToCell);
  const molecularFrame = 300+t*30;
  const phase = (molecularFrame-300)*.22;
  const sourceTotal = AMBIGUITY_SOURCE.reduce((sum,c) => sum+c.amplitude,0);
  const response = ease(t,37,39), pointY = mix(750,820,inspect)*(1-returnToCell)+750*returnToCell;
  const gathered = weights.map((_,i)=>ease(t,37+i*.24,38.4+i*.24));
  const integrated = weights.reduce((sum,w,i)=>sum+w*gathered[i],0)/remaining;
  const plotOpacity = ease(t,33,35)*(1-ease(t,50,54));
  const spectrumX = (nu: number) => 510+900*(nu-500)/3000;
  const shape = (values: readonly number[], px: number) => values.reduce((sum,w,i) => sum+w*Math.exp(-.5*((px-spectrumX(AMBIGUITY_SOURCE[i].wavenumber))/36)**2),0);
  const points = Array.from({length:361},(_,i) => 510+i*2.5);
  const trace = (values: readonly number[]) => points.map((px,i) => `${i?'L':'M'} ${px} ${640-190*shape(values,px)}`).join(' ');
  const source = AMBIGUITY_SOURCE.map(c=>c.amplitude), sampleTrace = trace(weights);
  const area = sampleTrace+' L1410 640 L510 640 Z';
  const lostArea = trace(source)+' '+points.slice().reverse().map(px=>`L ${px} ${640-190*shape(weights,px)}`).join(' ')+' Z';
  const lightLayout = inspect*(1-returnToCell);
  const carrier = (after: boolean) => Array.from({length:181},(_,i) => {
    const u=i/180;
    const horizontalX = after?1010+410*u:300+610*u;
    const horizontalY = moleculeY-18*(after?Math.sqrt(weights[1]/AMBIGUITY_SOURCE[1].amplitude):1)*Math.cos((horizontalX-960)/180*2*Math.PI-phase);
    const verticalY = after?607.2+126*u:344+128.8*u;
    return `${i?'L':'M'} ${mix(960,horizontalX,lightLayout)} ${mix(verticalY,horizontalY,lightLayout)}`;
  }).join(' ');
  const sceneLabelOpacity = inspect*(1-ease(t,51,53));
  const empty = ease(t,55,58);

  return <div style={{position:'absolute',inset:0,background:P.bgVoid}}
    data-causal-stage="absorption-to-one-reading" data-sample={compare===0?'A':compare===1?'B':'A-to-B'}
    data-total-power={totalPower} data-transmission={weights.map((w,i)=>w/AMBIGUITY_SOURCE[i].amplitude).join(',')}>
    <svg width="1920" height="1080">
      <path d={carrier(false)} fill="none" stroke={P.amberLight} strokeWidth="3.5"/>
      <path d={carrier(true)} fill="none" stroke={P.amberLight} strokeWidth="3.5"/>
      <g transform="translate(960 540) scale(1.4) translate(-960 -540)" opacity={mix(1,0,inspect)*(1-returnToCell)+returnToCell}>
        <SampleCell x={960} y={540} label={false}/>
      </g>
      <Text x={960} y={215} opacity={sceneLabelOpacity}>样品 {compare<.02?'A':compare>.98?'B':'A → B'}</Text>
      <g opacity={plotOpacity}>
        {/* A common kernel only softens finite component stems for legibility; no measured spectrum is claimed. */}
        <path d={lostArea} fill={P.redAbsorption} opacity=".25"/>
        <path d={trace(source)} fill="none" stroke={P.grayContext} strokeWidth="2" strokeDasharray="5 8" opacity=".5"/>
        <path d={area} fill={P.amberLight} opacity=".13"/>
        <path d={sampleTrace} fill="none" stroke={P.amberLight} strokeWidth="4"/>
        <line x1="510" x2="1410" y1="640" y2="640" stroke={P.grayInactive} strokeWidth="1.5"/>
        <Text x={960} y={690} color={P.grayContext}>按红外频率展开剩余光 · 示意</Text>
      </g>
      <g transform={`translate(960 ${pointY}) scale(1.4) translate(-960 -${pointY})`}><Detector x={960} y={pointY} label={false}/></g>
      <circle cx="960" cy={pointY} r={mix(7,29,response)} fill={P.bgVoid} stroke={P.cyanSignal} strokeWidth="1.5" opacity={response*.65}/>
      <circle cx="960" cy={pointY} r={mix(7,12+13*totalPower/2.9,integrated)} fill={P.cyanSignal} opacity={mix(1,.15+.55*totalPower/2.9,integrated)}/>
      <circle cx="960" cy={pointY} r="7" fill={P.cyanSignal}/>
      <Text x={1025} y={pointY+9} anchor="start" color={P.cyanSignal} opacity={response*(1-ease(t,51,53))}>总响应</Text>
      {/* Known contributions are gathered as data into ONE reading, not three optical paths. */}
      {t>=37&&t<39&&weights.map((w,i)=>{const p=gathered[i];return <circle key={i}
        cx={mix(spectrumX(AMBIGUITY_SOURCE[i].wavenumber),960,p)}
        cy={mix(640-190*w*.45,pointY,p)} r={5+3*Math.sqrt(w)} fill={P.cyanSignal} opacity={Math.sin(Math.PI*p)}/>;})}
      {t>=33&&t<35.5&&(()=>{const p=ease(t,33,35.5);return <circle
        cx={mix(spectrumX(1750),960,p)} cy={mix(495,moleculeY,p)} r="5" fill={P.redAbsorption} opacity={Math.sin(Math.PI*p)*plotOpacity}/>;})()}
      <path d={`M970 750 Q1070 830 1010 785 H${mix(1010,1720,empty)}`} stroke={P.grayInactive} strokeWidth="1.6" strokeDasharray="4 12" opacity={empty} fill="none"/>
    </svg>
    <div style={{position:'absolute',inset:0,transformOrigin:'0 0',transform:`translate(${960-moleculeScale*960}px,${moleculeY-moleculeScale*520}px) scale(${moleculeScale})`,opacity:1-ease(t,56,57)}}>
      <Act2VibrationalModes frameOverride={molecularFrame} editorial minimal modeOverride="asymmetric"
        amplitudeOverride={18+26*selectedLoss/.45} couplingStrength={inspect*(1-returnToCell)*selectedLoss/.45}/>
    </div>
  </div>;
};
