import React from 'react';
import { interpolate, interpolateColors, Sequence, useCurrentFrame } from 'remotion';
import { Act7FourierTransform } from './Act7FourierTransform';
import {
  NARRATIVE_BEATS,
  NARRATIVE_IDENTITIES,
  NARRATIVE_SAMPLE_COMPONENTS,
  NARRATIVE_SAMPLE_RECORD,
  NARRATIVE_SOURCE_COMPONENTS,
  NARRATIVE_SLICE_DURATION,
  NARRATIVE_FOURIER_START,
  NARRATIVE_ANSWER_START,
  evaluateNarrativeMeasurement,
} from '../math/narrativeTeaching';
import { recoverTeachingSpectrum } from '../math/fourierTeaching';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';
import {SampleRecordExplainer} from '../components/cinematic/SampleRecordExplainer';

export { NARRATIVE_SLICE_DURATION, NARRATIVE_FOURIER_START, NARRATIVE_ANSWER_START } from '../math/narrativeTeaching';

const WIDTH = 1920;
const HEIGHT = 1080;
const clamp01 = (n: number) => Math.max(0, Math.min(1, n));
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const fade = (frame: number, start: number, end: number) => interpolate(frame, [start, end], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
const pointX = (index: number) => 960 + (NARRATIVE_SAMPLE_RECORD.opdCm[index] / (NARRATIVE_SAMPLE_RECORD.opdSpanCm / 2)) * 720;
const pathFor = (values: readonly number[], count: number, yZero: number, scale: number) =>
  values.slice(0, count).map((value, index) => `${index ? 'L' : 'M'} ${pointX(index).toFixed(2)} ${(yZero - value * scale).toFixed(2)}`).join(' ');
const dash = (id: string) => NARRATIVE_IDENTITIES.find((item) => item.id === id)?.strokeDasharray;
const energy = PALETTE.amberLight;
const data = PALETTE.cyanSignal;
const baseline = NARRATIVE_SAMPLE_COMPONENTS.reduce((sum, component) => sum + component.amplitude, 0);
const rawValues = NARRATIVE_SAMPLE_RECORD.opdCm.map((opd) => evaluateNarrativeMeasurement(opd, NARRATIVE_SAMPLE_COMPONENTS).totalRaw);
const puzzleB = Object.freeze([
  { wavenumber: 1000, amplitude: 0.35 },
  { wavenumber: 1750, amplitude: 0.75 },
  { wavenumber: 3000, amplitude: 0.35 },
]);
const identityFor = (nu: number) => NARRATIVE_IDENTITIES.find((item) => item.wavenumber === nu)!;

function Label({ x, y, children, size = 30, fill = PALETTE.white, anchor = 'middle', weight = 500 }: {
  x: number; y: number; children: React.ReactNode; size?: number; fill?: string; anchor?: 'start' | 'middle' | 'end'; weight?: number;
}) {
  return <text x={x} y={y} textAnchor={anchor} fill={fill} fontFamily={TYPOGRAPHY.sans} fontSize={size} fontWeight={weight}>{children}</text>;
}

function Wave({ id, amplitude, cycles, x, y, width, phase = 0, opacity = 1, progress = 1, color = energy, strokeWidth = 3.5 }: {
  id: string; amplitude: number; cycles: number; x: number; y: number; width: number; phase?: number; opacity?: number; progress?: number; color?: string; strokeWidth?: number;
}) {
  const points = Array.from({ length: Math.max(2, Math.floor(160 * clamp01(progress)) + 1) }, (_, i) => {
    const t = i / 160;
    return `${i ? 'L' : 'M'}${(x + width * t).toFixed(1)} ${(y - amplitude * Math.cos(t * cycles * Math.PI * 2 + phase)).toFixed(1)}`;
  }).join(' ');
  return <path d={points} fill="none" stroke={color} strokeWidth={strokeWidth} strokeDasharray={dash(id)} opacity={opacity} data-identity={id} />;
}

function SampleGlyph({ x = 600, y = 650, opacity = 1, highlight = false }: { x?: number; y?: number; opacity?: number; highlight?: boolean }) {
  return <g data-sample="true" transform={`translate(${x} ${y})`} opacity={opacity}>
    <rect x="-53" y="-48" width="106" height="96" rx="7" fill={PALETTE.bgSurface} stroke={PALETTE.grayContext} strokeWidth="2" />
    <path d="M-36 -30 L36 30 M-20 -30 L36 20 M-36 -12 L18 36" stroke={PALETTE.white} strokeWidth="3" opacity="0.65" />
    {highlight && <circle r="65" fill="none" stroke={energy} strokeWidth="2" opacity={0.85} />}
    <Label x={0} y={74} size={24}>样品</Label>
  </g>;
}

export const NarrativeVerticalSlice: React.FC<{ subtitles?: boolean; presentation?: boolean }> = ({ subtitles = false, presentation = false }) => {
  const frame = useCurrentFrame();
  if(presentation&&frame>=2340&&frame<3420)return <SampleRecordExplainer frame={frame}/>;
  const stage = NARRATIVE_BEATS.find((beat) => frame >= beat.start && frame < beat.end)?.name ?? 'answer-and-next-question';
  const sampleIndex = frame < 2640 ? -1 : Math.min(511, Math.floor(clamp01((frame - 2640) / 479) * 511));
  const latestOpd = sampleIndex >= 0 ? NARRATIVE_SAMPLE_RECORD.opdCm[sampleIndex] : 0;
  const latestMeasurement = evaluateNarrativeMeasurement(latestOpd, NARRATIVE_SAMPLE_COMPONENTS);
  const baselineProgress = frame < 3120 ? 0 : fade(frame, 3120, 3270);
  const visibleValues = rawValues.slice(0, Math.max(0, sampleIndex + 1)).map((value, index) =>
    baselineProgress === 1 ? NARRATIVE_SAMPLE_RECORD.signal[index] : value - baseline * baselineProgress);
  const activePath = pathFor(visibleValues, visibleValues.length, 520, 180 / 1.9);
  const handoffMix = fade(frame, 3270, 3420);
  const detectorValue = sampleIndex < 0 ? 0 : baselineProgress === 1 ? NARRATIVE_SAMPLE_RECORD.signal[sampleIndex] : latestMeasurement.totalRaw - baseline * baselineProgress;
  const detectorY = 520 - detectorValue * (180 / 1.9);

  // One world map persists throughout. The camera changes attention, while the optical elements stay put.
  const upstreamReveal = fade(frame, 720, 960);
  const openingZoom = mix(1.55, 1, upstreamReveal);
  const mirrorPan = frame >= 1290 && frame < 1620
    ? fade(frame, 1290, 1410) * (1 - fade(frame, 1530, 1620))
    : 0;
  const phaseAttention = fade(frame, 1530, 1620) * (1 - fade(frame, 1770, 1890));
  const cameraScale = openingZoom * (1 + 0.55 * mirrorPan + 0.1 * phaseAttention);
  const cameraCenter = {
    x: mix(mix(mix(610, 960, upstreamReveal), 735, mirrorPan), 735, phaseAttention),
    y: mix(mix(mix(742, 540, upstreamReveal), 400, mirrorPan), 530, phaseAttention),
  };
  const cameraTransform = `translate(${960 - cameraCenter.x * cameraScale} ${540 - cameraCenter.y * cameraScale}) scale(${cameraScale})`;
  const screenSpaceTransform = `translate(${cameraCenter.x - 960 / cameraScale} ${cameraCenter.y - 540 / cameraScale}) scale(${1 / cameraScale})`;
  const detectorScreenX = 960 + (600 - cameraCenter.x) * cameraScale;
  const detectorScreenY = 540 + (860 - cameraCenter.y) * cameraScale;

  const storySweep = clamp01((frame - 1980) / 360);
  const previewOpd = storySweep * 0.001; // 0..10 μm OPD, giving 1:1.75:3 cycles.
  const previewPhase = (nu: number) => 2 * Math.PI * nu * previewOpd;
  const scanSetup = fade(frame, 2580, 2640);
  const mirrorDisplacementUm = latestOpd * 10000 / 2;
  const phaseOffsetUm = 10000 / 1750;
  const phaseExtraUm = 10000 / (2 * 1750);
  const phaseOpd = frame < 1530
    ? phaseOffsetUm * 1e-4 * clamp01((frame - 1290) / 240)
    : phaseOffsetUm * 1e-4 + phaseExtraUm * 1e-4 * clamp01((frame - 1530) / 300);
  const fieldPhase = 2 * Math.PI * 1750 * phaseOpd;
  const storyMirrorDisplacementUm = frame < 1530
    ? phaseOffsetUm / 2 * clamp01((frame - 1290) / 240)
    : frame < 1890 ? phaseOpd * 5000
      : frame < 1980 ? phaseOpd * 5000 * (1 - fade(frame, 1890, 1980))
        : frame < 2580 ? previewOpd * 5000
          : frame < 2640 ? mix(previewOpd * 5000, NARRATIVE_SAMPLE_RECORD.opdCm[0] * 5000, scanSetup)
            : mirrorDisplacementUm;
  const mirrorX = 810 + storyMirrorDisplacementUm * 10;
  const visibleStoryOpdCm = storyMirrorDisplacementUm * 2e-4;
  const attenuation = fade(frame, 2400, 2500);
  const sampleComparison = frame >= 2340 && frame < 2640;
  const scanAlpha = frame < 2580 ? 0 : frame < 2640 ? fade(frame, 2580, 2640) : frame < 3420 ? 1 : 0;
  const scanPointX = sampleIndex >= 0 ? pointX(sampleIndex) : pointX(0);
  const scanPointY = sampleIndex >= 0 ? detectorY : 520 - rawValues[0] * (180 / 1.9);
  const movingPixelX = frame < 2580 ? 600 : mix(600, pointX(0), scanSetup);
  const movingPixelY = frame < 2580 ? 860 : mix(860, 520 - rawValues[0] * (180 / 1.9), scanSetup);
  const phaseOutput = (1 + Math.cos(fieldPhase)) / 2;
  const previewMeasurement = evaluateNarrativeMeasurement(visibleStoryOpdCm, NARRATIVE_SAMPLE_COMPONENTS);
  const totalPreview = clamp01(previewMeasurement.totalRaw / (2 * baseline));
  const showingPhase = frame >= 1530 && frame < 1890;
  const showingTotal = frame >= 1890 && frame < 2580;

  const rootData = {
    'data-frame': frame,
    'data-stage': stage,
    'data-record-id': NARRATIVE_SAMPLE_RECORD.id,
    'data-sample-index': sampleIndex,
    'data-opd-cm': sampleIndex >= 0 ? latestOpd : '',
    'data-raw': sampleIndex >= 0 ? latestMeasurement.totalRaw : '',
    'data-baseline': sampleIndex >= 0 ? baseline : '',
    'data-ac': sampleIndex >= 0 ? latestMeasurement.ac : '',
    'data-fourier-record-id': frame >= NARRATIVE_FOURIER_START ? NARRATIVE_SAMPLE_RECORD.id : '',
    'data-story-opd-cm': frame >= 2640 ? latestOpd : visibleStoryOpdCm,
    'data-mirror-displacement-um': storyMirrorDisplacementUm,
    'data-preview-raw': evaluateNarrativeMeasurement(frame >= 2640 ? latestOpd : visibleStoryOpdCm, NARRATIVE_SAMPLE_COMPONENTS).totalRaw,
  };

  return <div {...rootData} style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
    <svg width={WIDTH} height={HEIGHT} viewBox={`0 0 ${WIDTH} ${HEIGHT}`} style={{ position: 'absolute', inset: 0 }} data-local-frame={frame} data-stage={stage}>
      <defs>
        <marker id="narrative-energy-arrow" markerUnits="userSpaceOnUse" markerWidth="10" markerHeight="10" refX="8" refY="5" orient="auto"><path d="M0 0 L10 5 L0 10Z" fill={energy} /></marker>
        <clipPath id="narrative-sample-window"><rect x="640" y="290" width="845" height="390" /></clipPath>
        <clipPath id="narrative-upstream-reveal"><rect x="0" y={560 * (1 - upstreamReveal)} width="1920" height="1080" /></clipPath>
      </defs>

      <g transform={cameraTransform}>
        {/* The fixed optical world: source → Michelson → sample → one detector. */}
        <g data-world-optics="fixed" clipPath="url(#narrative-upstream-reveal)" opacity={frame >= 6000 ? 0.22 : frame >= 3270 ? 0.08 * (1 - fade(frame, 3270, 3420)) : frame >= 2640 ? 0.08 : frame >= 1890 && frame < 2640 ? 0.13 : frame >= 360 && frame < 960 ? mix(0.07, 1, upstreamReveal) : 1}>
          <path d={`M202 400 H598 M600 398 V206 M600 205 V398 M602 400 H${mirrorX - 2} M${mirrorX - 2} 404 H602 M600 402 V602 M600 698 V832`} fill="none" stroke={energy} strokeWidth="3.5" markerEnd="url(#narrative-energy-arrow)" />
          <g transform="translate(600 400) rotate(-45)"><rect x="-44" y="-7" width="88" height="14" fill={PALETTE.bgSurface} stroke={PALETTE.white} strokeWidth="3" /></g>
          <g data-source-identities="nu-1000 nu-1750 nu-3000" transform="translate(180 400)">
            <circle r="22" fill={PALETTE.bgSurface} stroke={energy} strokeWidth="3" /><circle r="7" fill={energy} />
            <Label x={0} y={52} size={22} fill={PALETTE.grayContext}>光源</Label>
          </g>
          <g data-mirror="fixed" transform="translate(600 190)"><line x1="-45" y1="0" x2="45" y2="0" stroke={PALETTE.white} strokeWidth="6"/><Label x={0} y={-17} size={22}>固定镜</Label></g>
          <g data-mirror="moving" transform={`translate(${frame >= 1290 && frame < 3420 ? mirrorX : 810} 400)`}>
            {frame >= 1290 && frame < 1530 && <line x1={810 - mirrorX} y1="-48" x2={810 - mirrorX} y2="48" stroke={PALETTE.grayContext} strokeWidth="4" strokeDasharray="7 7" />}
            <line x1="0" y1="-48" x2="0" y2="48" stroke={PALETTE.white} strokeWidth="6"/><Label x={70} y={-64} size={22}>移动镜</Label>
          </g>
          <Label x={636} y={458} anchor="start" size={20} fill={PALETTE.grayContext}>分束器</Label>
          {frame >= 960 && frame < 1290 && <g data-route-reveal="incident-and-return" opacity={fade(frame, 960, 1100) * (1 - fade(frame, 1200, 1290))}>
            <Label x={960} y={116} size={34} weight={600}>同一成分进入两臂，再沿共同出口经过样品</Label>
            <Label x={780} y={236} size={22} fill={PALETTE.grayContext}>固定臂</Label><Label x={800} y={462} size={22} fill={PALETTE.grayContext}>移动臂</Label>
            <Label x={880} y={500} size={22} fill={PALETTE.grayContext}>两臂都包含这三种成分</Label>
          </g>}
          {frame >= 1290 && frame < 1530 && <g data-round-trip="two-x">
            <path d={`M810 315 H${mirrorX}`} fill="none" stroke={PALETTE.white} strokeWidth="4" markerEnd="url(#narrative-energy-arrow)" />
            {frame >= 1400 && <path d={`M${mirrorX} 476 H810`} fill="none" stroke={PALETTE.white} strokeWidth="4" markerEnd="url(#narrative-energy-arrow)" />}
            <Label x={(810 + mirrorX) / 2} y={294} size={28}>+x</Label>
            {frame >= 1400 && <Label x={(810 + mirrorX) / 2} y={512} size={28}>+x</Label>}
            {frame >= 1470 && <Label x={850} y={578} size={29}>x + x → δ = 2x</Label>}
          </g>}
          {frame >= 1530 && frame < 1890 && <g data-return-fields="nu-1750">
            {/* Both fields originate at the two returning routes and share normalized amplitude. */}
            <path d="M600 206 C620 300 710 420 800 510" fill="none" stroke={PALETTE.grayContext} strokeWidth="2" markerEnd="url(#narrative-energy-arrow)" />
            <path d={`M${mirrorX} 400 C950 430 890 470 800 510`} fill="none" stroke={energy} strokeWidth="2.5" markerEnd="url(#narrative-energy-arrow)" />
            <g clipPath="url(#narrative-sample-window)">
              <Wave id="nu-1750" x={800} y={510} width={450} amplitude={35} cycles={2} color={PALETTE.grayContext} />
              <Wave id="nu-1750" x={800} y={510} width={450} amplitude={35} cycles={2} phase={fieldPhase} />
            </g>
            <Label x={1100} y={614} size={28} fill={PALETTE.white}>同一 1750 成分的两臂回波</Label>
            <Label x={1100} y={658} size={28} fill={Math.cos(fieldPhase) > 0 ? data : PALETTE.grayContext}>{Math.cos(fieldPhase) > 0 ? '对齐 → 输出增强' : '错开 → 输出减弱'}</Label>
          </g>}
        </g>
        <SampleGlyph opacity={frame >= 6000 ? 0.7 : frame >= 3270 ? 0.08 * (1 - fade(frame, 3270, 3420)) : frame >= 2640 ? 0.08 : 1} highlight={sampleComparison || frame >= 6000} />
        <g data-detector="true" transform="translate(600 860)" opacity={frame >= 2640 ? (frame >= 6000 ? 0.22 : 0.08 * (1 - fade(frame, 3270, 3420))) : 1}>
          <rect x="-35" y="-28" width="70" height="56" rx="5" fill={PALETTE.bgSurface} stroke={PALETTE.grayContext} strokeWidth="2" />
          <Label x={0} y={50} size={26} fill={PALETTE.grayContext}>探测器</Label>
          <circle r="14" fill={PALETTE.bgVoid} stroke={data} strokeWidth="3" />
        </g>

        <g data-persistent-detector-pixel="true">
          <circle cx={movingPixelX} cy={movingPixelY} r={showingPhase ? 4 + phaseOutput * 7 : showingTotal ? 4 + totalPreview * 3 : 6} fill={data}
            opacity={frame < 2580 ? (showingPhase ? 0.25 + phaseOutput * 0.75 : showingTotal ? 0.25 + totalPreview * 0.75 : 1) : frame < 2640 ? 1 : 0}
            data-measurement-point="true" data-selected-output-intensity={showingPhase ? phaseOutput : ''} data-total-preview-raw={showingTotal ? previewMeasurement.totalRaw : ''} />
        </g>

        {/* The opening is a crop of this same world; the incident source stays upstream, outside the camera. */}
        {/* Hypothetical composition changes at one persistent readout site. */}
        {frame >= 360 && frame < 720 && <g transform={screenSpaceTransform} data-puzzle="one-readout-equal-total">
          <Label x={960} y={152} size={41} weight={600}>总量相同，组成呢？</Label>
          {NARRATIVE_IDENTITIES.map((identity, i) => {
            const a = mix(NARRATIVE_SAMPLE_COMPONENTS[i].amplitude, puzzleB[i].amplitude, fade(frame, 490, 590));
            const y = 370 + i * 88;
            return <g key={identity.id} data-identity={identity.id}>
              <Label x={320} y={y + 8} anchor="end" size={27} fill={PALETTE.grayContext}>{identity.wavenumber} cm⁻¹</Label>
              <line x1="350" y1={y} x2="690" y2={y} stroke={PALETTE.grayInactive} strokeWidth="1" />
              <line x1="350" y1={y} x2={350 + a * 320} y2={y} stroke={energy} strokeWidth="12" strokeDasharray={dash(identity.id)} />
              <Label x={720} y={y + 8} anchor="start" size={25}>{a.toFixed(2)}</Label>
            </g>;
          })}
          <Label x={1180} y={500} size={28} fill={PALETTE.grayContext}>假设组成 A → B</Label>
          <Label x={detectorScreenX + 40} y={detectorScreenY + 9} anchor="start" size={26} fill={data}>1.45</Label>
        </g>}

        {frame >= 720 && frame < 960 && <g transform={screenSpaceTransform} data-need-record="unfolding">
          <Label x={960} y={158} size={39} weight={600}>一个总读数，分不出里面的组成</Label>
          <path d={`M${detectorScreenX + 20} ${detectorScreenY} C${detectorScreenX + 110} ${detectorScreenY} 950 770 1080 770 H1510`} fill="none" stroke={PALETTE.grayContext} strokeWidth="2" strokeDasharray="9 8" opacity={fade(frame, 720, 900)} />
          <Label x={1210} y={610} size={28} fill={PALETTE.grayContext}>需要可辨认的变化</Label>
        </g>}

        {/* A single shared OPD ruler reveals each component response in amber. */}
        {frame >= 1890 && frame < 2640 && <g data-shared-opd="true" opacity={fade(frame, 1890, 1970) * (1 - scanSetup)}>
          <Label x={1050} y={148} size={38} weight={600}>{sampleComparison ? '观察位置移到样品之后' : '同一光程差，三种不同节奏'}</Label>
          <line x1="760" y1="246" x2="1540" y2="246" stroke={PALETTE.white} strokeWidth="2" />
          {Array.from({ length: 6 }, (_, i) => <g key={i}><line x1={760 + i * 156} y1="237" x2={760 + i * 156} y2="255" stroke={PALETTE.white} strokeWidth="2"/><Label x={760 + i * 156} y={280} size={17} fill={PALETTE.grayContext}>{i * 2}</Label></g>)}
          <Label x={1560} y={252} anchor="start" size={20} fill={PALETTE.grayContext}>δ (μm)</Label>
          {NARRATIVE_SOURCE_COMPONENTS.map((component, i) => {
            const identity = identityFor(component.wavenumber);
            const y = 380 + i * 132;
            const modWeight = component.wavenumber === 1750 ? mix(1, 0.55, attenuation) : 1;
            const effective = component.amplitude * modWeight;
            const phase = previewPhase(component.wavenumber);
            const markerX = 760 + storySweep * 780;
            const markerY = y - 62 * effective * Math.cos(phase);
            return <g key={identity.id} data-identity={identity.id} data-phase={phase}>
              <Label x={1580} y={y + 8} anchor="start" size={28} fill={sampleComparison && component.wavenumber === 1750 ? data : PALETTE.grayContext}>{component.wavenumber}</Label>
              <line x1="760" y1={y} x2="1540" y2={y} stroke={PALETTE.grayInactive} strokeWidth="1" />
              {sampleComparison && component.wavenumber === 1750 && <Wave id={identity.id} x={760} y={y} width={780} amplitude={62 * component.amplitude} cycles={[1, 1.75, 3][i]} color={PALETTE.grayContext} opacity={0.6} />}
              <Wave id={identity.id} x={760} y={y} width={780} amplitude={62 * effective} cycles={[1, 1.75, 3][i]} progress={storySweep} />
              <circle cx={markerX} cy={markerY} r="6" fill={energy} data-opd-intersection={identity.id} />
            </g>;
          })}
          <line x1={760 + storySweep * 780} y1="300" x2={760 + storySweep * 780} y2="740" stroke={PALETTE.white} strokeWidth="2" data-shared-opd-cursor="true" />
          {sampleComparison && <g data-fixed-sample-observation="true">
            <circle cx={mix(520, 680, fade(frame, 2340, 2460))} cy="650" r="8" fill={PALETTE.white} data-observation-position="source-to-sample" />
            <Label x={mix(520, 680, fade(frame, 2340, 2460))} y={620} size={19} fill={PALETTE.grayContext}>{frame < 2460 ? '样品前' : '样品后'}</Label>
            <Label x={1110} y={905} size={26} fill={data}>1750：相位位置不变，贡献从 1 降至 0.55</Label>
          </g>}
          {!sampleComparison && <Label x={1050} y={910} size={23} fill={PALETTE.grayContext}>琥珀标记为贡献；一条白色光程差游标贯穿三条曲线</Label>}
          {!presentation && frame >= 2550 && <Label x={1050} y={950} size={22} fill={PALETTE.grayContext}>共同出口穿过样品后，仍由同一探测器记录总和</Label>}
        </g>}

        {/* The inspection layer closes. One cyan sample point then writes the actual cached record. */}
        {frame >= 2580 && frame < 3420 && <g data-scan="fixed-sample-world" opacity={scanAlpha}>
          <g opacity={frame < 2640 ? 0 : 0.55}><line x1="240" y1="520" x2="1680" y2="520" stroke={PALETTE.grayInactive} strokeWidth="1.4"/><line x1="960" y1="205" x2="960" y2="780" stroke={PALETTE.grayInactive} strokeWidth="1.4"/></g>
          <path d={activePath} fill="none" stroke={interpolateColors(handoffMix, [0, 1], [data, PALETTE.white])} strokeWidth="3.5" data-measured-trace="true" />
          <line x1="240" y1={520 - baseline * (1 - baselineProgress) * 180 / 1.9} x2="1680" y2={520 - baseline * (1 - baselineProgress) * 180 / 1.9} stroke={PALETTE.white} strokeWidth="2" strokeDasharray="8 8" opacity={frame < 2640 ? 0 : 0.65} />
          {frame >= 2640 && frame < 3420 && <g data-current-record-point={sampleIndex} opacity={1 - handoffMix}>
            <line x1={scanPointX} y1={scanPointY - 24} x2={scanPointX} y2={scanPointY + 24} stroke={data} strokeWidth="2" opacity="0.7" />
            <circle cx={scanPointX} cy={scanPointY} r="7" fill={data} data-measurement-point="true" data-measured-endpoint="true" />
          </g>}
          {frame >= 2580 && frame < 2640 && <g data-scan-reset="first-opd" opacity={fade(frame, 2580, 2640)}>
            <path d={`M600 860 Q${mix(600, 240, scanSetup)} ${mix(860, 690, scanSetup)} ${movingPixelX} ${movingPixelY}`} fill="none" stroke={data} strokeWidth="2" strokeDasharray="6 7" />
          </g>}
          {frame >= 2640 && frame < 3120 && <Label x={960} y={112} size={34} weight={600}>一个探测点，写下实际总响应</Label>}
          {frame >= 3120 && <Label x={960} y={310} size={30}>减去稳定底值 → 保留变化部分</Label>}
          {!presentation && frame >= 2640 && frame < 3120 && <Label x={960} y={945} size={21} fill={PALETTE.grayContext}>记录点 {sampleIndex + 1} / 512</Label>}
          {frame >= 2878 && frame < 2920 && <g data-natural-zpd="true" data-zpd-sample-index="256" data-zpd-source-opd-cm={NARRATIVE_SAMPLE_RECORD.opdCm[256]}>
            <line x1={pointX(256)} y1="220" x2={pointX(256)} y2="790" stroke={energy} strokeWidth="2.5" opacity="0.85"/><Label x={pointX(256)} y={190} size={26} fill={energy}>零光程差 · ZPD</Label>
          </g>}
        </g>}

        {frame >= 3270 && frame < 3420 && <Label x={960} y={914} size={36}>每一种节奏，还剩多少？</Label>}

        {/* Actual spectrum locations are preserved. The selected comparison travels as one group. */}
        {frame >= 6000 && <g data-answer="recovered-coefficients">
          {(() => {
            const spectrum = recoverTeachingSpectrum(NARRATIVE_SAMPLE_RECORD, [1000, 1750, 3000]);
            const positions = spectrum.map((point) => ({
              point,
              x: 340 + (4000 - point.wavenumber) / 3500 * 1130,
              y: 745 - 110 * point.coefficient,
            }));
            const selected = positions.find(({ point }) => point.wavenumber === 1750)!;
            const callout = fade(frame, 6000, 6120);
            const travel = fade(frame, 6000, 6140);
            const sampleX = 820;
            const sampleY = 650;
            const movedX = mix(selected.x, sampleX, travel);
            const movedY = mix(selected.y, sampleY, travel);
            const localReferenceY = 745 - 110;
            return <>
              <Label x={960} y={140} size={39} weight={600}>被样品削弱的成分，找回来了</Label>
              <line x1="340" y1="745" x2="1470" y2="745" stroke={PALETTE.grayInactive} strokeWidth="1.5" />
              {positions.filter(({ point }) => point.wavenumber !== 1750).map(({ point, x, y }) => <g key={point.wavenumber} data-identity={identityFor(point.wavenumber).id} data-recovered-coefficient={point.coefficient}>
                <line x1={x} y1="745" x2={x} y2={y} stroke={data} strokeWidth="3.5" strokeDasharray={dash(identityFor(point.wavenumber).id)} />
                <circle cx={x} cy={y} r="8" fill={data} data-spectrum-point={point.wavenumber} />
                <Label x={x} y={790} size={24}>{point.wavenumber} cm⁻¹</Label>
              </g>)}
              <path d={`M${selected.x} ${selected.y} C${mix(selected.x, sampleX, 0.3)} ${mix(selected.y, sampleY, 0.2) - 100} ${mix(selected.x, sampleX, 0.75)} ${mix(selected.y, sampleY, 0.75) - 50} ${sampleX} ${sampleY}`} fill="none" stroke={PALETTE.grayContext} strokeWidth="2" strokeDasharray="6 7" opacity={callout * 0.65} data-sample-identity-return="nu-1750" />
              <g data-selected-comparison="nu-1750" data-identity="nu-1750" data-recovered-coefficient={selected.point.coefficient}>
                <line x1={selected.x} y1={745} x2={selected.x} y2={selected.y} stroke={data} strokeWidth="3.5" strokeDasharray={dash('nu-1750')} opacity={1 - travel} />
                <g transform={`translate(${movedX - selected.x} ${movedY - selected.y})`}>
                  <circle cx={selected.x} cy={selected.y} r="8" fill={data} data-spectrum-point="1750" />
                  <Label x={selected.x + 30} y={selected.y + 38} anchor="start" size={28} fill={data}>1750　样品后 0.55</Label>
                  <g opacity={fade(frame, 6120, 6200)}>
                    <line x1={selected.x} y1={745} x2={selected.x} y2={localReferenceY} stroke={PALETTE.grayContext} strokeWidth="3" strokeDasharray={dash('nu-1750')} />
                    <line x1={selected.x} y1={745} x2={selected.x} y2={selected.y} stroke={data} strokeWidth="4" strokeDasharray={dash('nu-1750')} />
                    <circle cx={selected.x} cy={localReferenceY} r="10" fill={PALETTE.bgVoid} stroke={PALETTE.grayContext} strokeWidth="3" data-known-input-reference="1" />
                    <Label x={selected.x + 30} y={localReferenceY + 8} anchor="start" size={28} fill={PALETTE.grayContext}>已知教学输入 1.00</Label>
                  </g>
                </g>
              </g>
              <Label x={960} y={900} size={30} fill={PALETTE.grayContext}>实际测量中，怎样获得这份对照？</Label>
            </>;
          })()}
        </g>}
      </g>
      {frame < 360 && <Label x={960} y={165} size={43} weight={600}>哪些红外成分被削弱了？</Label>}
    </svg>
    {frame >= NARRATIVE_FOURIER_START && frame < NARRATIVE_ANSWER_START && <Sequence from={NARRATIVE_FOURIER_START} durationInFrames={NARRATIVE_ANSWER_START - NARRATIVE_FOURIER_START}>
      <Act7FourierTransform teachingRecord={NARRATIVE_SAMPLE_RECORD} showAmplitudeDemo={false} />
    </Sequence>}
    {subtitles && frame >= 2340 && frame < 2640 && <div style={{ position: 'absolute', bottom: 56, width: '100%', textAlign: 'center', color: PALETTE.white, fontFamily: TYPOGRAPHY.sans, fontSize: 26 }}>样品透过率改变成分强弱，但保留它的节奏</div>}
  </div>;
};
