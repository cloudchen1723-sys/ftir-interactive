import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { evaluateMichelsonTeaching, getMichelsonTeachingState } from '../math/michelsonTeaching';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';
import {IRSource,Beamsplitter,FixedMirror,MovingMirror,Detector} from '../components/cinematic/OpticalAssets';

const clamp = (value: number, input: readonly [number, number], output: readonly [number, number]) =>
  interpolate(value, input, output, { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

const textStyle = { fontFamily: TYPOGRAPHY.sans, fill: PALETTE.white };

export const Act4MichelsonCore: React.FC = () => {
  const frame = useCurrentFrame();
  const state = getMichelsonTeachingState(frame);
  const { low, high, mirrorDisplacementUm: x } = state;
  const opd = low.opdUm;
  const power = low.normalizedPower;

  const hardwareIn = clamp(frame, [0, 70], [0, 1]);
  const hardwareOut = 1 - clamp(frame, [875, 940], [0, 1]);
  const focusBeat = frame >= 450 && frame < 900;
  const hardwareContextOpacity = focusBeat ? 0.12 : 1;
  const clocksIn = clamp(frame, [900, 950], [0, 1]);
  const clocksOut = 1 - clamp(frame, [1600, 1640], [0, 1]);
  const additionIn = clamp(frame, [1600, 1640], [0, 1]);
  const additionOut = 1 - clamp(frame, [2280, 2380], [0, 1]);
  const traceIn = clamp(frame, [2280, 2380], [0, 1]);
  const scan = clamp(frame, [2400, 2850], [0, 1]);
  const outboundExtraReveal = clamp(frame, [620, 650], [0, 1]);
  const returnExtraReveal = clamp(frame, [650, 680], [0, 1]);
  const extraMerge = clamp(frame, [700, 790], [0, 1]);
  const lowPhasorOpacity = clamp(frame, [900, 950], [0, 1]);

  const source = { x: 255, y: 450 };
  const splitter = { x: 820, y: 450 };
  const armLength = 300;
  const fixed = { x: splitter.x, y: splitter.y - armLength };
  const mirrorBaseX = splitter.x + armLength;
  const movingX = mirrorBaseX + x * (focusBeat ? 30 : 11);
  const detector = { x: splitter.x, y: splitter.y + armLength };
  const outboundFixed = clamp(frame, [120, 225], [0, 1]);
  const returnFixed = clamp(frame, [225, 335], [0, 1]);
  const outboundMoving = clamp(frame, [155, 265], [0, 1]);
  const returnMoving = clamp(frame, [265, 375], [0, 1]);
  const outputReveal = clamp(frame, [375, 450], [0, 1]);
  const inputReveal = clamp(frame, [10, 150], [0, 1]);

  const clockY = 435;
  const lowClock = { x: 610, y: clockY };
  const highClock = { x: 1310, y: clockY };
  const clockR = 120;
  const phaseTip = (ev: typeof low, center: { x: number; y: number }, radius: number) => ({
    x: center.x + ev.movingField.x * radius,
    y: center.y - ev.movingField.y * radius,
  });
  const highTip = phaseTip(high, highClock, clockR);

  const addCenter = { x: 650, y: 470 };
  const vectorR = 150;
  const e1Tip = { x: addCenter.x + vectorR, y: addCenter.y };
  const clockToReturn = clamp(frame, [1600, 1660], [0, 1]);
  const returnToField = clamp(frame, [1780, 1870], [0, 1]);
  const lerpPoint = (from: { x: number; y: number }, to: { x: number; y: number }, t: number) => ({
    x: from.x + (to.x - from.x) * t,
    y: from.y + (to.y - from.y) * t,
  });
  const fixedReturnStart = { x: fixed.x, y: 238 };
  const fixedReturnEnd = { x: splitter.x, y: splitter.y - 12 };
  const movingReturnStart = { x: movingX - 12, y: splitter.y + 8 };
  const movingReturnEnd = { x: splitter.x + 12, y: splitter.y + 8 };
  const clockE2Start = lowClock;
  const clockE2End = phaseTip(low, lowClock, clockR);
  const e2RayStart = lerpPoint(clockE2Start, movingReturnStart, clockToReturn);
  const e2RayEnd = lerpPoint(clockE2End, movingReturnEnd, clockToReturn);
  const e2Origin = lerpPoint(e2RayStart, e1Tip, returnToField);
  const e2Tip = lerpPoint(e2RayEnd, phaseTip(low, e1Tip, vectorR), returnToField);
  const e1Start = lerpPoint(fixedReturnStart, addCenter, returnToField);
  const e1End = lerpPoint(fixedReturnEnd, e1Tip, returnToField);
  const e1Angle = Math.atan2(e1End.y - e1Start.y, e1End.x - e1Start.x);
  const e1Label = {
    x: (e1Start.x + e1End.x) / 2 + 36 * Math.sin(e1Angle),
    y: (e1Start.y + e1End.y) / 2 - 36 * Math.cos(e1Angle),
  };
  const e2Angle = Math.atan2(e2Tip.y - e2Origin.y, e2Tip.x - e2Origin.x);
  const e2Label = {
    x: (e2Origin.x + e2Tip.x) / 2 + 36 * Math.sin(e2Angle),
    y: (e2Origin.y + e2Tip.y) / 2 - 36 * Math.cos(e2Angle),
  };
  const compactProgress = traceIn;
  const compactScale = 1 - 0.48 * compactProgress;
  const compactCenter = {
    x: addCenter.x + (420 - addCenter.x) * compactProgress,
    y: addCenter.y + (450 - addCenter.y) * compactProgress,
  };
  const vectorTransform = `translate(${compactCenter.x} ${compactCenter.y}) scale(${compactScale}) translate(${-addCenter.x} ${-addCenter.y})`;
  const totalTip = {
    x: addCenter.x + low.totalField.x * vectorR,
    y: addCenter.y - low.totalField.y * vectorR,
  };
  const resultantLength = Math.hypot(totalTip.x - addCenter.x, totalTip.y - addCenter.y);
  const resultantReveal = clamp(frame, [1870, 1900], [0, 1]);
  const detectorReveal = clamp(frame, [1900, 1940], [0, 1]);
  const resultantAngle = Math.atan2(totalTip.y - addCenter.y, totalTip.x - addCenter.x);
  const resultantLabel = {
    x: (addCenter.x + totalTip.x) / 2 + 48 * Math.sin(resultantAngle),
    y: (addCenter.y + totalTip.y) / 2 - 48 * Math.cos(resultantAngle),
  };
  const headSize = Math.min(24, resultantLength * 0.22);
  const headPoints = `${totalTip.x},${totalTip.y} ${totalTip.x - headSize * Math.cos(resultantAngle - Math.PI / 6)},${totalTip.y - headSize * Math.sin(resultantAngle - Math.PI / 6)} ${totalTip.x - headSize * Math.cos(resultantAngle + Math.PI / 6)},${totalTip.y - headSize * Math.sin(resultantAngle + Math.PI / 6)}`;

  const graph = { left: 660, right: 1630, top: 300, bottom: 650 };
  const pointFor = (sampleOpdUm: number) => {
    const ev = evaluateMichelsonTeaching(sampleOpdUm / 2, 1000);
    return {
      x: graph.left + ((sampleOpdUm - 20) / 40) * (graph.right - graph.left),
      y: graph.bottom - ev.normalizedPower * (graph.bottom - graph.top),
      power: ev.normalizedPower,
      opdUm: ev.opdUm,
    };
  };
  const tracePoints = Array.from({ length: 241 }, (_, index) => pointFor(20 + (40 * index) / 240));
  const traceCursor = pointFor(Math.max(20, Math.min(60, opd)));
  const detectorCenter = { x: 1510, y: 475 };
  const recordToken = lerpPoint(detectorCenter, traceCursor, traceIn);
  const recordTokenOpacity = detectorReveal * ((1 - traceIn) * power + traceIn);
  const endIndex = Math.min(240, Math.floor(((traceCursor.opdUm - 20) / 40) * 240));
  const exactTracePoints = tracePoints.slice(0, endIndex + 1);
  if (exactTracePoints.length === 0 || Math.abs(exactTracePoints[exactTracePoints.length - 1].opdUm - traceCursor.opdUm) > 1e-10) exactTracePoints.push(traceCursor);
  const tracePath = exactTracePoints.map((point, index) => `${index ? 'L' : 'M'} ${point.x.toFixed(2)} ${point.y.toFixed(2)}`).join(' ');
  const actualTraceEndpoint = exactTracePoints[exactTracePoints.length - 1] ?? traceCursor;
  const traceValue = actualTraceEndpoint.power;
  const traceEndpointMatches = Math.abs(actualTraceEndpoint.opdUm - opd) < 1e-8 && Math.abs(actualTraceEndpoint.power - power) < 1e-10;

  const dispReadout = `${x.toFixed(2)} μm`;
  const opdReadout = `${opd.toFixed(2)} μm`;
  const data = {
    'data-frame': state.frame,
    'data-x-um': x,
    'data-delta-um': opd,
    'data-phase-rad': low.phaseRad,
    'data-power': power,
    'data-cursor-power': traceValue,
    'data-cursor-opd-um': actualTraceEndpoint.opdUm,
    'data-trace-endpoint-matches': traceEndpointMatches,
    'data-high-phase-rad': high.phaseRad,
    'data-high-power': high.normalizedPower,
  };

  return (
    <div {...data} style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" viewBox="0 0 1920 1080" style={{ position: 'absolute', inset: 0 }}>
        <defs>
          <marker id="beam-arrow" markerWidth="9" markerHeight="9" refX="7" refY="4.5" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L9,4.5 L0,9 Z" fill={PALETTE.amberLight} />
          </marker>
          <marker id="field-arrow-fixed" markerWidth="20" markerHeight="20" refX="17" refY="10" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L20,10 L0,20 Z" fill={PALETTE.grayContext} />
          </marker>
          <marker id="field-arrow-moving" markerWidth="20" markerHeight="20" refX="17" refY="10" orient="auto" markerUnits="userSpaceOnUse">
            <path d="M0,0 L20,10 L0,20 Z" fill={PALETTE.amberLight} />
          </marker>
          <marker id="detector-arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
            <path d="M0,0 L8,4 L0,8 Z" fill={PALETTE.cyanSignal} />
          </marker>
        </defs>

        {/* Michelson layout: both arms are 300 schematic pixels at ZPD. */}
        <g opacity={Math.max(0, hardwareIn * hardwareOut)}>
          {!focusBeat && <text x="960" y="150" textAnchor="middle" fontSize="38" fontWeight="600" style={textStyle}>迈克尔逊干涉仪：光程差来自移动镜往返</text>}
          <IRSource x={source.x} y={source.y} opacity={hardwareContextOpacity} />
          <Beamsplitter x={splitter.x} y={splitter.y} />
          <FixedMirror x={fixed.x} y={fixed.y} opacity={hardwareContextOpacity} />
          <MovingMirror x={movingX} y={splitter.y} />
          <Detector x={detector.x} y={detector.y} opacity={hardwareContextOpacity} />

          {inputReveal > 0 && <path d={`M ${source.x + 21} ${source.y} H ${source.x + 21 + (splitter.x - source.x - 31) * inputReveal}`} fill="none" stroke={PALETTE.amberLight} strokeWidth="3.5" markerEnd="url(#beam-arrow)" opacity={hardwareContextOpacity} />}
          {outboundFixed > 0 && <path d={`M ${splitter.x} ${splitter.y - 8} V ${splitter.y - 8 - (armLength - 17) * outboundFixed}`} fill="none" stroke={PALETTE.amberLight} strokeWidth="3" markerEnd="url(#beam-arrow)" opacity={hardwareContextOpacity} />}
          {returnFixed > 0 && <path d={`M ${fixed.x - 10} ${fixed.y} V ${fixed.y + (armLength - 12) * returnFixed}`} fill="none" stroke={PALETTE.amberLight} strokeWidth="2.5" markerEnd="url(#beam-arrow)" opacity={0.8 * hardwareContextOpacity} />}
          {outboundMoving > 0 && <path d={`M ${splitter.x + 10} ${splitter.y} H ${splitter.x + 10 + (movingX - splitter.x - 20) * outboundMoving}`} fill="none" stroke={PALETTE.amberLight} strokeWidth="3" markerEnd="url(#beam-arrow)" opacity={hardwareContextOpacity} />}
          {returnMoving > 0 && <path d={`M ${movingX - 10} ${splitter.y + 9} H ${movingX - 10 - (movingX - splitter.x - 22) * returnMoving}`} fill="none" stroke={PALETTE.amberLight} strokeWidth="2.5" markerEnd="url(#beam-arrow)" opacity={0.8 * hardwareContextOpacity} />}
          {outputReveal > 0 && <path d={`M ${splitter.x} ${splitter.y + 10} V ${splitter.y + 10 + (armLength - 25) * outputReveal}`} fill="none" stroke={PALETTE.amberLight} strokeWidth="3.5" markerEnd="url(#beam-arrow)" opacity={hardwareContextOpacity} />}

          {!focusBeat && <>
            <line x1={mirrorBaseX} y1={splitter.y + 83} x2={movingX} y2={splitter.y + 83} stroke={PALETTE.white} strokeWidth="2" />
            <text x={(mirrorBaseX + movingX) / 2} y={splitter.y + 118} textAnchor="middle" fill={PALETTE.white} fontSize="22" fontFamily={TYPOGRAPHY.mono}>x = {dispReadout}</text>
            <text x="1510" y="680" textAnchor="end" fill={PALETTE.grayContext} fontSize="19" fontFamily={TYPOGRAPHY.sans}>示意图：镜面位移已放大</text>
            <rect x="930" y="686" width="500" height="58" rx="8" fill="#121824" stroke={PALETTE.grayInactive} />
            <text x="1180" y="723" textAnchor="middle" fill={PALETTE.white} fontSize="25" fontFamily={TYPOGRAPHY.mono}>往返增加 x + x  →  δ = 2x = {opdReadout}</text>
          </>}

          {focusBeat && <g>
            <text x="960" y="145" textAnchor="middle" fill={PALETTE.white} fontSize="44" fontWeight="600" fontFamily={TYPOGRAPHY.sans}>光程差为什么是 2x</text>
            <g opacity={x > 0.05 ? 0.68 : 0}>
              <line x1={mirrorBaseX} y1={splitter.y - 62} x2={mirrorBaseX} y2={splitter.y + 62} stroke={PALETTE.grayContext} strokeWidth="4" strokeDasharray="8 8" />
            </g>
            <line x1={splitter.x + 12} y1={splitter.y - 30} x2={mirrorBaseX} y2={splitter.y - 30} stroke={PALETTE.amberLight} strokeWidth="3" opacity="0.52" markerEnd="url(#beam-arrow)" />
            {x > 0.02 && <line x1={mirrorBaseX} y1={splitter.y - 30} x2={movingX} y2={splitter.y - 30} stroke={PALETTE.amberLight} strokeWidth="5" markerEnd="url(#beam-arrow)" />}
            <line x1={movingX} y1={splitter.y + 50} x2={mirrorBaseX} y2={splitter.y + 50} stroke={PALETTE.amberLight} strokeWidth="5" markerEnd="url(#beam-arrow)" />
            <line x1={mirrorBaseX} y1={splitter.y + 50} x2={splitter.x + 12} y2={splitter.y + 50} stroke={PALETTE.amberLight} strokeWidth="3" opacity="0.52" markerEnd="url(#beam-arrow)" />
            <line x1={movingX} y1={splitter.y - 45} x2={movingX} y2={splitter.y + 45} stroke={PALETTE.white} strokeWidth="7" />
            <line x1={mirrorBaseX} y1={splitter.y - 45} x2={mirrorBaseX} y2={splitter.y + 45} stroke={PALETTE.grayContext} strokeWidth="5" strokeDasharray="7 7" opacity="0.68" />
            <text x={(mirrorBaseX + movingX) / 2 + (1100 - (mirrorBaseX + movingX) / 2) * extraMerge} y={splitter.y - 39 + (splitter.y - 30 - (splitter.y - 39)) * extraMerge} textAnchor="middle" fill={PALETTE.amberLight} fontSize="44" fontFamily={TYPOGRAPHY.mono} opacity={outboundExtraReveal * (1 - extraMerge)}>+x</text>
            <text x={(mirrorBaseX + movingX) / 2 + (1100 - (mirrorBaseX + movingX) / 2) * extraMerge} y={splitter.y + 88 + (splitter.y + 12 - (splitter.y + 88)) * extraMerge} textAnchor="middle" fill={PALETTE.amberLight} fontSize="44" fontFamily={TYPOGRAPHY.mono} opacity={returnExtraReveal * (1 - extraMerge)}>+x</text>
            {extraMerge >= 0.96 && <text x="1100" y={splitter.y + 15} textAnchor="middle" fill={PALETTE.amberLight} fontSize="48" fontFamily={TYPOGRAPHY.mono}>2x</text>}
            {frame >= 790 && <text x="960" y="720" textAnchor="middle" fill={PALETTE.white} fontSize="56" fontFamily={TYPOGRAPHY.mono}>δ = 2x</text>}
          </g>}
        </g>

        {/* Both phase dials read the same moving mirror state. */}
        <g opacity={Math.max(0, clocksIn * clocksOut)}>
          <text x="960" y="145" textAnchor="middle" fontSize="44" fontWeight="600" style={textStyle}>同一光程差，高波数相位变化更快</text>
          <g>
            <circle cx={lowClock.x} cy={lowClock.y} r={clockR} fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="2" />
            <line x1={lowClock.x - clockR} y1={clockY} x2={lowClock.x + clockR} y2={clockY} stroke={PALETTE.gridLine} />
            <line x1={lowClock.x} y1={clockY - clockR} x2={lowClock.x} y2={clockY + clockR} stroke={PALETTE.gridLine} />
            <text x={lowClock.x} y="600" textAnchor="middle" fill={PALETTE.amberLight} fontSize="36" fontFamily={TYPOGRAPHY.sans}>1000 cm⁻¹</text>
            <text x={lowClock.x} y="648" textAnchor="middle" fill={PALETTE.amberLight} fontSize="32" fontFamily={TYPOGRAPHY.mono}>φ₁ = {low.phaseRad.toFixed(2)} rad</text>
          </g>
          <g>
            <circle cx={highClock.x} cy={highClock.y} r={clockR} fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="2" />
            <line x1={highClock.x - clockR} y1={clockY} x2={highClock.x + clockR} y2={clockY} stroke={PALETTE.gridLine} />
            <line x1={highClock.x} y1={clockY - clockR} x2={highClock.x} y2={clockY + clockR} stroke={PALETTE.gridLine} />
            <line x1={highClock.x} y1={clockY} x2={highTip.x} y2={highTip.y} stroke={PALETTE.cyanSignal} strokeWidth="4" strokeLinecap="round" />
            <circle cx={highTip.x} cy={highTip.y} r="5" fill={PALETTE.cyanSignal} />
            <text x={highClock.x} y="600" textAnchor="middle" fill={PALETTE.cyanSignal} fontSize="36" fontFamily={TYPOGRAPHY.sans}>3000 cm⁻¹</text>
            <text x={highClock.x} y="648" textAnchor="middle" fill={PALETTE.cyanSignal} fontSize="32" fontFamily={TYPOGRAPHY.mono}>φ₂ = {high.phaseRad.toFixed(2)} rad</text>
          </g>
          <g>
            <text x="960" y="520" textAnchor="middle" fill={PALETTE.grayContext} fontSize="20" fontFamily={TYPOGRAPHY.sans}>相位变化速率</text>
            <text x="862" y="560" textAnchor="middle" fill={PALETTE.amberLight} fontSize="38" fontFamily={TYPOGRAPHY.mono}>1×</text>
            <text x="960" y="560" textAnchor="middle" fill={PALETTE.grayContext} fontSize="30" fontFamily={TYPOGRAPHY.sans}>:</text>
            <text x="1058" y="560" textAnchor="middle" fill={PALETTE.cyanSignal} fontSize="38" fontFamily={TYPOGRAPHY.mono}>3×</text>
          </g>
          <g>
            <rect x="790" y="370" width="340" height="110" rx="10" fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="1.5" />
            <text x="960" y="405" textAnchor="middle" fill={PALETTE.grayContext} fontSize="22" fontFamily={TYPOGRAPHY.sans}>共同输入 · 光程差</text>
            <text x="960" y="458" textAnchor="middle" fill={PALETTE.white} fontSize="42" fontFamily={TYPOGRAPHY.mono}>δ = {opdReadout}</text>
          </g>
          <g transform="translate(960,760)">
            <line x1="-380" y1="0" x2="380" y2="0" stroke={PALETTE.grayInactive} strokeWidth="3" />
            <line x1="-380" y1="-12" x2="-380" y2="12" stroke={PALETTE.grayInactive} strokeWidth="2" />
            <line x1="380" y1="-12" x2="380" y2="12" stroke={PALETTE.grayInactive} strokeWidth="2" />
            <circle cx={-380 + (opd / 10) * 760} cy="0" r="9" fill={frame >= 965 && frame <= 1018 ? PALETTE.cyanSignal : PALETTE.white} />
            <text x="-380" y="42" fill={PALETTE.grayContext} fontSize="22" fontFamily={TYPOGRAPHY.mono}>ZPD · 0 μm</text>
            <text x="380" y="42" textAnchor="end" fill={PALETTE.grayContext} fontSize="22" fontFamily={TYPOGRAPHY.mono}>10 μm</text>
          </g>
          {frame >= 965 && frame <= 1018 && <g>
            <text x="960" y="842" textAnchor="middle" fill={PALETTE.cyanSignal} fontSize="26" fontFamily={TYPOGRAPHY.sans}>回到 ZPD：δ = 0，两相量同相</text>
          </g>}
          {frame >= 1360 && <g textAnchor="middle" fontFamily={TYPOGRAPHY.mono}>
            <text x="960" y="245" fontSize="36" fill={PALETTE.white}>φ₁ = 2π · <tspan fill={PALETTE.amberLight}>ν̃₁</tspan> · δ</text>
            <text x="960" y="285" fontSize="36" fill={PALETTE.white}>φ₂ = 2π · <tspan fill={PALETTE.cyanSignal}>ν̃₂</tspan> · δ</text>
            <text x="960" y="325" fontSize="28" fill={PALETTE.grayContext}>δ 换算为 cm</text>
          </g>}
        </g>

        {/* The same E₂ shaft and tip travel from the low clock into the addition diagram and compact trace view. */}
        <g opacity={Math.max(0, lowPhasorOpacity)} transform={vectorTransform}>
          <line x1={e2Origin.x} y1={e2Origin.y} x2={e2Tip.x} y2={e2Tip.y} stroke={PALETTE.amberLight} strokeWidth="5" strokeLinecap="round" markerEnd="url(#field-arrow-moving)" />
          <circle cx={e2Tip.x} cy={e2Tip.y} r="5" fill={PALETTE.amberLight} />
        </g>

        {/* Returning E₁/E₂ arrows travel into the phase-driven head-to-tail field diagram. */}
        <g opacity={Math.max(0, additionIn * additionOut, traceIn)}>
          <text x="960" y="145" textAnchor="middle" fontSize="38" fontWeight="600" style={textStyle} opacity={additionIn * additionOut}>
            {frame < 1780 ? '两路返回光在分束器处会合' : frame < 1870 ? '返回场转为相量' : '合成场驱动探测器响应'}
          </text>

          {/* The fixed return path and moving return path are the same arrows that become E₁ and E₂. */}
          <g transform={vectorTransform}>
            {frame >= 1600 && <g>
              <g opacity={1 - returnToField}>
                <rect x={fixedReturnStart.x - 52} y={fixedReturnStart.y - 7} width="104" height="14" rx="2" fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="1.5" />
                <line x1={fixedReturnStart.x - 50} y1={fixedReturnStart.y + 7} x2={fixedReturnStart.x + 50} y2={fixedReturnStart.y + 7} stroke={PALETTE.white} strokeWidth="3" />
                <rect x={movingX - 7} y={splitter.y - 48} width="14" height="96" fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="1.5" />
                <line x1={movingX - 7} y1={splitter.y - 46} x2={movingX - 7} y2={splitter.y + 46} stroke={PALETTE.white} strokeWidth="3" />
              </g>
              <g opacity={frame < 1780 ? 1 : 1 - returnToField}>
                <line x1={splitter.x - 20} y1={splitter.y + 20} x2={splitter.x + 20} y2={splitter.y - 20} stroke={PALETTE.white} strokeWidth="9" />
              </g>
              <line x1={e1Start.x} y1={e1Start.y} x2={e1End.x} y2={e1End.y} stroke={PALETTE.grayContext} strokeWidth="4" strokeLinecap="round" markerEnd="url(#field-arrow-fixed)" />
              <text x={e1Label.x} y={e1Label.y} textAnchor="middle" fill={PALETTE.white} fontSize="40" fontFamily={TYPOGRAPHY.mono}>E₁</text>
              <text x={e2Label.x} y={e2Label.y} textAnchor="middle" fill={PALETTE.amberLight} fontSize="40" fontFamily={TYPOGRAPHY.mono}>E₂</text>
            </g>}
            {frame >= 1780 && <circle cx={e1Tip.x} cy={e1Tip.y} r={vectorR} fill="none" stroke={PALETTE.grayInactive} strokeWidth="1.5" strokeDasharray="5 7" opacity={returnToField} />}
            {resultantReveal > 0 && resultantLength > 2 && <line x1={addCenter.x} y1={addCenter.y} x2={totalTip.x} y2={totalTip.y} stroke={PALETTE.white} strokeWidth="6" strokeLinecap="round" />}
            {resultantReveal > 0 && resultantLength > 8 && <polygon points={headPoints} fill={PALETTE.white} />}
            {resultantReveal > 0 && resultantLength > 38 && <text x={resultantLabel.x} y={resultantLabel.y} textAnchor="middle" fill={PALETTE.white} fontSize="40" fontFamily={TYPOGRAPHY.mono}>E</text>}
          </g>

          {frame >= 1870 && resultantReveal > 0 && <g transform={vectorTransform}>
            <line x1={totalTip.x} y1={totalTip.y} x2={detectorCenter.x - 68} y2={detectorCenter.y} stroke={PALETTE.cyanSignal} strokeWidth="3.5" markerEnd="url(#detector-arrow)" opacity={additionIn * additionOut * power * (1 - traceIn)} />
          </g>}
          {frame >= 1900 && <g opacity={Math.max(additionIn * additionOut, traceIn)}>
            <text x={detectorCenter.x} y={detectorCenter.y - 110} textAnchor="middle" fill={PALETTE.grayContext} fontSize="32" fontFamily={TYPOGRAPHY.sans} opacity={additionIn * additionOut}>探测器响应</text>
            <circle cx={detectorCenter.x} cy={detectorCenter.y} r="66" fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="2" opacity={additionIn * additionOut} />
            <circle cx={detectorCenter.x} cy={detectorCenter.y} r="54" fill={PALETTE.cyanSignal} fillOpacity={power} opacity={additionIn * additionOut} />
          </g>}

          {frame >= 1940 && frame <= 2020 && <text x={addCenter.x} y="710" textAnchor="middle" fill={PALETTE.grayContext} fontSize="32" fontFamily={TYPOGRAPHY.sans} opacity={additionIn * additionOut}>相消</text>}
          {frame >= 2240 && frame <= 2280 && <text x={addCenter.x} y="710" textAnchor="middle" fill={PALETTE.amberLight} fontSize="32" fontFamily={TYPOGRAPHY.sans} opacity={additionIn * additionOut}>相长</text>}
          {frame >= 1870 && <g opacity={additionIn * additionOut} textAnchor="middle" fontFamily={TYPOGRAPHY.mono}>
            <text x="960" y="245" fill={PALETTE.white} fontSize="38">E = E₁ + E₂</text>
            {frame >= 1970 && <text x="960" y="295" fill={PALETTE.cyanSignal} fontSize="38">P ∝ |E|²</text>}
          </g>}
        </g>

        {/* The power marker moves onto the live trace; every sample uses the same field model. */}
        <g opacity={Math.max(0, traceIn)}>
          <text x="960" y="145" textAnchor="middle" fontSize="37" fontWeight="600" style={textStyle}>镜面继续移动，探测器逐点记录归一化功率</text>
          <line x1={graph.left} y1={graph.bottom} x2={graph.right} y2={graph.bottom} stroke={PALETTE.grayInactive} strokeWidth="2" />
          <line x1={graph.left} y1={graph.top} x2={graph.left} y2={graph.bottom} stroke={PALETTE.grayInactive} strokeWidth="2" />
          <line x1={graph.left} y1={graph.top} x2={graph.right} y2={graph.top} stroke={PALETTE.gridLine} strokeWidth="1" />
          <line x1={graph.left} y1={(graph.top + graph.bottom) / 2} x2={graph.right} y2={(graph.top + graph.bottom) / 2} stroke={PALETTE.gridLine} strokeWidth="1" />
          <text x={graph.left - 18} y={graph.top + 6} textAnchor="end" fill={PALETTE.grayContext} fontSize="20" fontFamily={TYPOGRAPHY.mono}>1</text>
          <text x={graph.left - 18} y={graph.bottom + 6} textAnchor="end" fill={PALETTE.grayContext} fontSize="20" fontFamily={TYPOGRAPHY.mono}>0</text>
          <text x={graph.left} y={graph.bottom + 38} textAnchor="middle" fill={PALETTE.grayContext} fontSize="19" fontFamily={TYPOGRAPHY.mono}>20</text>
          <text x={graph.right} y={graph.bottom + 38} textAnchor="middle" fill={PALETTE.grayContext} fontSize="19" fontFamily={TYPOGRAPHY.mono}>60</text>
          <text x={(graph.left + graph.right) / 2} y="710" textAnchor="middle" fill={PALETTE.grayContext} fontSize="22" fontFamily={TYPOGRAPHY.sans}>光程差 δ (μm)</text>
          <text transform={`translate(${graph.left - 75},${(graph.top + graph.bottom) / 2}) rotate(-90)`} textAnchor="middle" fill={PALETTE.cyanSignal} fontSize="22" fontFamily={TYPOGRAPHY.sans}>归一化功率 P</text>
          {scan > 0 && <path d={tracePath} fill="none" stroke={PALETTE.cyanSignal} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />}
          <line x1={traceCursor.x} y1={graph.top} x2={traceCursor.x} y2={graph.bottom} stroke={PALETTE.grayContext} strokeDasharray="4 6" opacity="0.7" />
          <rect x="380" y="255" width="190" height="108" rx="10" fill="#121824" stroke={PALETTE.grayInactive} strokeWidth="2" />
          <text x="475" y="290" textAnchor="middle" fill={PALETTE.grayContext} fontSize="20" fontFamily={TYPOGRAPHY.sans}>当前探测功率</text>
          <text x="475" y="334" textAnchor="middle" fill={PALETTE.cyanSignal} fontSize="32" fontFamily={TYPOGRAPHY.mono}>{(power * 100).toFixed(0)}%</text>
          <text x="960" y="785" textAnchor="middle" fill={PALETTE.white} fontSize="23" fontFamily={TYPOGRAPHY.mono}>φ = 2πν̃δ　→　|E₁ + E₂|²　→　P　→　干涉图</text>
        </g>

        {/* One cyan detector-record marker continues into the live trace. */}
        <g opacity={recordTokenOpacity}>
          <circle
            cx={recordToken.x}
            cy={recordToken.y}
            r="10"
            fill={PALETTE.cyanSignal}
            stroke={PALETTE.white}
            strokeWidth="2"
          />
        </g>
      </svg>
    </div>
  );
};
