import React from 'react';
import {NARRATIVE_SAMPLE_RECORD, NARRATIVE_SAMPLE_COMPONENTS, evaluateNarrativeMeasurement} from '../../math/narrativeTeaching';
import {SampleCell, Detector} from './OpticalAssets';
import {PALETTE as P, TYPOGRAPHY} from '../../styles/visualSystem';

const mix = (a: number, b: number, p: number) => a + (b - a) * p;
const ease = (f: number, a: number, b: number) => {
  const p = Math.max(0, Math.min(1, (f - a) / (b - a)));
  return p * p * (3 - 2 * p);
};
const Label: React.FC<{x: number; y: number; children: React.ReactNode; color?: string; opacity?: number}> =
  ({x, y, children, color = P.white, opacity = 1}) =>
    <text x={x} y={y} fill={color} opacity={opacity} fontSize="28" fontFamily={TYPOGRAPHY.sans}>{children}</text>;
const record = NARRATIVE_SAMPLE_RECORD;
const baseline = NARRATIVE_SAMPLE_COMPONENTS.reduce((s, c) => s + c.amplitude, 0);
const measurements = record.opdCm.map(opd => evaluateNarrativeMeasurement(opd, NARRATIVE_SAMPLE_COMPONENTS));
const raw = measurements.map(m => m.totalRaw);
const identityDash = ['', '12 8', '2 8'];
const rowZero = [310, 470, 630];
const x = (i: number) => 960 + record.opdCm[i] / (record.opdSpanCm / 2) * 720;
const path = (count: number, px: (i: number) => number, py: (i: number) => number) =>
  Array.from({length: count}, (_, i) => [i ? 'L' : 'M', px(i), py(i)].join(' ')).join(' ');

/** Actual component powers share one OPD cursor and sum into the same cached record. */
export const SampleRecordExplainer: React.FC<{frame: number}> = ({frame: f}) => {
  const attenuate = ease(f, 2400, 2500), others = ease(f, 2500, 2540);
  const reset = ease(f, 2580, 2640);
  const count = f < 2640 ? 0 : Math.min(512, Math.floor(Math.max(0, Math.min(1, (f - 2640) / 479)) * 511) + 1);
  const merge = ease(f, 3119, 3160), zoom = ease(f, 3160, 3180);
  const baselineProgress = ease(f, 3180, 3270), handoff = ease(f, 3270, 3420);
  const recordZero = mix(835, 520, zoom), recordScale = mix(55, 180 / 1.9, zoom);
  const value = (i: number) => baselineProgress === 1 ? record.signal[i] : raw[i] - baseline * baselineProgress;
  const y = (i: number) => recordZero - value(i) * recordScale;
  const index = Math.max(0, count - 1);
  const pointX = mix(314, x(index), reset), pointY = mix(798, y(index), reset);
  const componentX = (i: number) => mix(550 + 1120 * i / 512, x(i), reset);
  const componentY = (component: number, i: number) => {
    const term = measurements[i].terms[component];
    const initialZero = component === 1 ? mix(520, 510, others) : component === 0 ? 310 : 710;
    const sampleY = mix(initialZero, rowZero[component], reset)
      - mix(105, 65, reset) * mix(term.ac, term.raw, reset);
    // Each contribution moves to its cumulative boundary; the final one is exactly totalRaw.
    const cumulative = measurements[i].terms.slice(0, component + 1).reduce((sum, c) => sum + c.raw, 0);
    return mix(sampleY, recordZero - cumulative * recordScale, merge);
  };
  const zpd = f >= 2880 && f < 2884;
  const cursorOpacity = reset * (1 - ease(f, 3119, 3140));
  const lineZero = recordZero - baseline * (1 - baselineProgress) * recordScale;

  return <div style={{position: 'absolute', inset: 0, background: P.bgVoid}}>
    <svg width="1920" height="1080" data-record-id={record.id} data-stage="sample-record-explainer">
      <g opacity={1 - reset}>
        <path d="M314 532V648 M314 721V788" stroke={P.amberLight} strokeWidth="4" fill="none"/>
        <g transform="translate(314 684) scale(.76) translate(-314 -684)"><SampleCell x={314} y={684} label={false}/></g>
        <Label x={270} y={752} opacity={1 - others}>样品 A</Label>
        <g transform="translate(314 798) scale(.76) translate(-314 -798)"><Detector x={314} y={798} label={false}/></g>
        <path d="M325 684 Q415 684 440 520 H550" stroke={P.grayInactive} strokeWidth="2" fill="none" opacity=".6"/>
        <path d={path(512, componentX, i => mix(520, 510, others) - measurements[i].terms[1].ac / .55 * 105)}
          fill="none" stroke={P.grayContext} strokeWidth="3" strokeDasharray="12 8" opacity={.4 * attenuate}/>
        <Label x={550} y={365} opacity={1 - others}>只看一个成分 · 1750 cm⁻¹</Label>
        <Label x={550} y={225} color={P.grayContext} opacity={others}>强弱改变，节奏保留</Label>
      </g>
      {NARRATIVE_SAMPLE_COMPONENTS.map((c, k) => <g key={c.wavenumber}
        opacity={(k === 1 ? 1 : others) * (1 - ease(f, 3140, 3160))}>
        <path d={path(512, componentX, i => {
          if (k === 1 && f < 2580) return mix(520, 510, others) - measurements[i].terms[1].ac / .55 * mix(1, .55, attenuate) * 105;
          return componentY(k, i);
        })} fill="none" stroke={P.amberLight} strokeWidth={k === 1 ? 4 : 3}
          strokeDasharray={identityDash[k]} opacity={k === 1 ? 1 : .7}/>
        {count > 0 && <circle cx={x(index)} cy={componentY(k, index)} r="5" fill={zpd ? P.white : P.amberLight} opacity={cursorOpacity}/>}
      </g>)}
      <g opacity={reset}>
        <line x1="240" x2="1680" y1={recordZero} y2={recordZero} stroke={P.grayInactive} strokeWidth="1.5"/>
        <line x1="240" x2="1680" y1={lineZero} y2={lineZero} stroke={P.grayContext} strokeWidth="1.5" strokeDasharray="8 8"
          opacity={baselineProgress * (1 - handoff)}/>
        <path d={path(count, x, y)} fill="none" stroke={handoff > .5 ? P.white : P.cyanSignal} strokeWidth="3.5" strokeLinecap="round"/>
        {count > 0 && <line x1={x(index)} x2={x(index)} y1="210" y2={recordZero + 15}
          stroke={zpd ? P.amberLight : P.grayContext} strokeWidth="1.5" strokeDasharray="4 7" opacity={cursorOpacity * .6}/>}
        <Label x={240} y={195} opacity={1 - merge} color={P.grayContext}>成分贡献的展开</Label>
        <Label x={1370} y={recordZero + 42} opacity={1 - handoff} color={P.grayContext}>光程差 OPD →</Label>
        {zpd && <Label x={995} y={195}>δ = 0 · 各成分同时达到最大贡献</Label>}
        <Label x={265} y={lineZero - 25} opacity={baselineProgress * (1 - handoff)} color={P.grayContext}>稳定底值</Label>
      </g>
      {f < 3270 && <circle cx={pointX} cy={pointY} r="8" fill={P.cyanSignal} data-measured-endpoint="true"/>}
    </svg>
  </div>;
};
