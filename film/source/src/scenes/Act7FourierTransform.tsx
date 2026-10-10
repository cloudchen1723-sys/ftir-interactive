import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { DEFAULT_TEACHING_RECORD, TeachingRecord, createTeachingRecord, projectTeachingRecord, recoverTeachingSpectrum, WRONG_PROBE_WAVENUMBER } from '../math/fourierTeaching';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';
import {FourierExplainer} from '../components/cinematic/FourierExplainer';

const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
const clamp01 = (value: number) => Math.max(0, Math.min(1, value));
const xForNu = (nu: number, left: number, width: number) => left + ((4000 - nu) / 3500) * width;

export const Act7FourierTransform: React.FC<{ teachingRecord?: TeachingRecord; showAmplitudeDemo?: boolean; explainer?:boolean }> = ({
  teachingRecord = DEFAULT_TEACHING_RECORD,
  showAmplitudeDemo = true,
  explainer=false,
}) => {
  const frame = useCurrentFrame();
  const amplitudeProgress = showAmplitudeDemo
    ? interpolate(frame, [2160, 2340], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 0;
  const activeComponents = teachingRecord.components.map((component) => ({
    ...component,
    amplitude: component.wavenumber === 1750 ? lerp(component.amplitude, component.amplitude * 0.55, amplitudeProgress) : component.amplitude,
  }));
  const record: TeachingRecord = amplitudeProgress > 0 ? createTeachingRecord(activeComponents, {
    sampleCount: teachingRecord.sampleCount,
    opdSpanCm: teachingRecord.opdSpanCm,
  }) : teachingRecord;

  // Act 6 hands off the same record centered at (960, 520), spanning 720 px,
  // with its fixed signal scale. It then moves into the four-row teaching layout.
  const reframe = interpolate(frame, [0, 150], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const chartCenter = lerp(960, 900, reframe);
  const chartSpan = lerp(720, 580, reframe);
  const signalY = lerp(520, 190, reframe);
  const signalScale = lerp(180 / 1.9, 78 / 1.9, reframe);
  const graphLeft = chartCenter - chartSpan;
  const graphRight = chartCenter + chartSpan;
  const xAtSample = (index: number) => chartCenter + (record.opdCm[index] / (record.opdSpanCm / 2)) * chartSpan;
  const signalPath = record.signal.map((value, index) => {
    const x = xAtSample(index);
    const y = signalY - value * signalScale;
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${y.toFixed(2)}`;
  }).join(' ');

  const changing = frame >= 660 && frame < 780;
  const wrongActive = frame >= 360 && frame < 780;
  const matchActive = frame >= 780 && frame < 2160;
  const sweepActive = frame >= 1860;
  const targetNu = frame < 660 ? WRONG_PROBE_WAVENUMBER : frame < 780
    ? lerp(WRONG_PROBE_WAVENUMBER, 1750, clamp01((frame - 660) / 120))
    : frame < 1260 ? 1750 : frame < 1560 ? 1000 : frame < 1860 ? 3000
    : frame < 2160 ? 4000 - Math.floor(clamp01((frame - 1860) / 300) * 14) * 250 : 1750;
  const selectedProjection = projectTeachingRecord(record, targetNu);
  const scanProgress = wrongActive
    ? clamp01((frame - 390) / 220)
    : matchActive && frame < 1140 ? clamp01((frame - 810) / 220)
    : frame >= 1260 && frame < 1560 ? clamp01((frame - 1280) / 130)
    : frame >= 1560 && frame < 1860 ? clamp01((frame - 1580) / 130) : 1;
  const cursor = Math.floor(scanProgress * record.sampleCount);
  const productReveal = clamp01((frame - 270) / 90);
  const productCursor = frame < 360 ? Math.floor(productReveal * record.sampleCount) : record.sampleCount;
  const probeY = 330;
  const productY = 465;
  const probeScale = 35;
  const probePath = selectedProjection.probe.map((value, index) => {
    const x = xAtSample(index);
    return `${index === 0 ? 'M' : 'L'} ${x.toFixed(2)} ${(probeY - value * probeScale).toFixed(2)}`;
  }).join(' ');

  const accCenterX = 1640;
  const accZeroY = 380;
  const accHeight = Math.min(115, Math.abs(selectedProjection.cumulative[cursor]) * 115);
  const accCoefficient = selectedProjection.cumulative[cursor];
  const spectrumLeft = 340;
  const spectrumWidth = 1130;
  const spectrumY = 745;
  const candidates = Array.from({ length: 15 }, (_, i) => 500 + i * 250);
  const sweepCandidates = [...candidates].reverse();
  const spectrum = recoverTeachingSpectrum(record, candidates);
  const spectrumScale = 110;
  const deposits = [1000, 1750, 3000].filter((nu) => {
    if (nu === 1750) return frame >= 1260;
    if (nu === 1000) return frame >= 1500;
    return frame >= 1800;
  });
  const scanProgressSpectrum = sweepActive ? clamp01((frame - 1860) / 300) : 0;
  const sweptCount = Math.floor(scanProgressSpectrum * spectrum.length);
  const flightNu = frame >= 1710 ? 3000 : frame >= 1410 ? 1000 : 1750;
  const amplitudesForFlight = projectTeachingRecord(record, flightNu).coefficient;
  const flying = (frame >= 1140 && frame < 1260) || (frame >= 1410 && frame < 1500) || (frame >= 1710 && frame < 1800);
  const flightProgress = frame >= 1710 ? clamp01((frame - 1710) / 90) : frame >= 1410 ? clamp01((frame - 1410) / 90) : clamp01((frame - 1140) / 120);
  const flightStartX = accCenterX;
  const flightStartY = accZeroY - Math.sign(accCoefficient) * Math.min(115, Math.abs(accCoefficient) * 115);
  const flightEndX = xForNu(flightNu, spectrumLeft, spectrumWidth);
  const flightEndY = spectrumY - amplitudesForFlight * spectrumScale;
  const tokenPosition = flying
    ? { x: lerp(flightStartX, flightEndX, flightProgress), y: lerp(flightStartY, flightEndY, flightProgress) }
    : frame >= 1800 ? { x: flightEndX, y: flightEndY }
    : frame >= 1560 && frame < 1710 ? { x: accCenterX, y: accZeroY - Math.sign(accCoefficient) * Math.min(115, Math.abs(accCoefficient) * 115) }
    : frame >= 1500 ? { x: xForNu(1000, spectrumLeft, spectrumWidth), y: spectrumY - projectTeachingRecord(record, 1000).coefficient * spectrumScale }
    : frame >= 1260 ? { x: accCenterX, y: accZeroY - Math.sign(accCoefficient) * Math.min(115, Math.abs(accCoefficient) * 115) }
    : { x: accCenterX, y: accZeroY - Math.sign(accCoefficient) * Math.min(115, Math.abs(accCoefficient) * 115) };
  const tokenCoefficient = flying ? amplitudesForFlight
    : (frame < 1260 || (frame >= 1260 && frame < 1410) || (frame >= 1560 && frame < 1710)) ? accCoefficient
    : frame < 1560 ? projectTeachingRecord(record, 1000).coefficient : projectTeachingRecord(record, 3000).coefficient;
  const showToken = (frame >= 780 && frame < 1500) || (frame >= 1560 && frame < 1800);
  const showEquation = frame >= 2400;
  const matchingWindow = frame >= 780 && frame < 1140;
  const stage = frame < 150 ? 'record' : frame < 270 ? 'probe' : frame < 360 ? 'product' : changing ? 'frequency-change' : frame < 660 ? 'wrong-scan' : frame < 1140 ? 'matching-scan' : flying ? 'coefficient-flight' : frame < 1860 ? 'recover-components' : frame < 2160 ? 'spectrum-sweep' : frame < 2400 ? (showAmplitudeDemo ? 'amplitude-change' : 'spectrum-hold') : 'formula';
  const wrongWindow = frame >= 360 && frame < 660;

  if(explainer)return <FourierExplainer frame={frame} record={record} projection={selectedProjection} cursor={cursor} targetNu={targetNu} changing={changing} wrongWindow={wrongWindow} matchingWindow={matchingWindow} scanProgress={scanProgress} spectrum={spectrum} deposits={deposits} sweepCandidates={sweepCandidates} sweptCount={sweptCount} flying={flying} flightNu={flightNu} flightProgress={flightProgress} showEquation={showEquation}/>;

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }} data-local-frame={frame} data-stage={stage} data-record-id={record.id} data-probe-wavenumber={targetNu} data-accumulated-coefficient={changing ? 'paused' : accCoefficient.toFixed(9)}>
        <text x="960" y="72" textAnchor="middle" fill={PALETTE.white} fontFamily={TYPOGRAPHY.sans} fontSize="31" fontWeight="600">把混合信号拆开：逐个波数检验</text>
        <text x="960" y="105" textAnchor="middle" fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.mono} fontSize="17">合成教学分量 · 输入振幅 a：{record.components.map((component) => `${component.wavenumber} → ${component.amplitude.toFixed(2)}`).join(' ｜ ')}</text>

        {/* Signal: same source as Act 6's last frame, now reframed upward. */}
        <g>
          <text x="95" y={signalY + 7} fill={PALETTE.white} fontFamily={TYPOGRAPHY.mono} fontSize="27">信号 I(δ)</text>
          <line x1={graphLeft} y1={signalY} x2={graphRight} y2={signalY} stroke={PALETTE.grayInactive} strokeDasharray="4 5" />
            <path d={signalPath} fill="none" stroke={PALETTE.white} strokeWidth="3.5" />
          <text x={graphLeft} y={signalY + 27} fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.mono} fontSize="20">−20 μm</text>
          <text x={graphRight} y={signalY + 27} textAnchor="end" fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.mono} fontSize="20">+20 μm</text>
          {frame >= 150 && <text x={graphRight} y={signalY - 48} textAnchor="end" fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.sans} fontSize="20">三个余弦分量相加</text>}
        </g>

        {/* Probe is introduced alone, then the signed pointwise product. */}
        {frame >= 150 && (
          <g>
            <text x="95" y={probeY + 7} fill={PALETTE.cyanSignal} fontFamily={TYPOGRAPHY.mono} fontSize="26">探针 cos</text>
            <line x1={graphLeft} y1={probeY} x2={graphRight} y2={probeY} stroke={PALETTE.grayInactive} strokeDasharray="4 5" />
            <path d={probePath} fill="none" stroke={PALETTE.cyanSignal} strokeWidth="2.4" opacity={changing ? 0.66 : 1} />
            {changing && <text x={chartCenter} y={probeY + 7} textAnchor="middle" fill={PALETTE.white} fontFamily={TYPOGRAPHY.sans} fontSize="24">连续改变探针频率 · 暂停累加</text>}
            <text x={graphRight} y={probeY - 35} textAnchor="end" fill={PALETTE.cyanSignal} fontFamily={TYPOGRAPHY.mono} fontSize="22">ν̃ = {Math.round(targetNu)} cm⁻¹</text>
          </g>
        )}

        {frame >= 270 && (
          <g>
            <text x="95" y={productY + 6} fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.mono} fontSize="24">I · cos</text>
            <line x1={graphLeft} y1={productY} x2={graphRight} y2={productY} stroke={PALETTE.grayInactive} />
            {selectedProjection.signedProduct.slice(0, productCursor).map((product, index) => {
              const x = xAtSample(index);
              const height = Math.max(2, Math.abs(product) * 30);
              const scanned = !changing && (wrongActive || matchActive || (frame >= 1260 && frame < 1860)) && index < cursor;
              return <rect key={index} x={x - 1.05} y={product >= 0 ? productY - height : productY} width="2.1" height={height} fill={product >= 0 ? PALETTE.cyanSignal : PALETTE.amberLight} opacity={changing ? 0.2 : scanned || frame < 360 ? 0.88 : 0.42} />;
            })}
            {wrongWindow && <text x={chartCenter} y={productY + 40} textAnchor="middle" fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.sans} fontSize="22">正负乘积交替出现</text>}
          </g>
        )}

        {!changing && frame >= 390 && frame < 1860 && (
          <line x1={xAtSample(Math.min(cursor, record.sampleCount - 1))} y1={signalY + 38} x2={xAtSample(Math.min(cursor, record.sampleCount - 1))} y2={productY + 40} stroke={PALETTE.white} strokeWidth="1.5" opacity="0.65" />
        )}

        {frame >= 360 && (
          <g>
            <text x={accCenterX} y="205" textAnchor="middle" fill={PALETTE.white} fontFamily={TYPOGRAPHY.sans} fontSize="24">有符号累加</text>
            <rect x={accCenterX - 38} y={accZeroY - 116} width="76" height="232" rx="3" fill={PALETTE.bgSurface} stroke={PALETTE.grayInactive} strokeWidth="1.5" />
            <line x1={accCenterX - 38} y1={accZeroY} x2={accCenterX + 38} y2={accZeroY} stroke={PALETTE.white} strokeWidth="1.5" />
            {!changing && <rect x={accCenterX - 25} y={accCoefficient >= 0 ? accZeroY - accHeight : accZeroY} width="50" height={accHeight} fill={accCoefficient >= 0 ? PALETTE.cyanSignal : PALETTE.amberLight} opacity="0.9" />}
            <text x={accCenterX} y={accZeroY + 144} textAnchor="middle" fill={wrongWindow ? PALETTE.grayContext : PALETTE.cyanSignal} fontFamily={TYPOGRAPHY.mono} fontSize="22">{changing ? '—' : `Σ = ${accCoefficient.toFixed(3)}`}</text>
            <text x={accCenterX} y={accZeroY + 169} textAnchor="middle" fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.sans} fontSize="18">{changing ? '换频时不累加' : '累计和 / 全部探针能量'}</text>
            {wrongWindow && scanProgress >= 1 && <text x={accCenterX} y={accZeroY - 132} textAnchor="middle" fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.mono} fontSize="29">≈ 0</text>}
          </g>
        )}

        {frame >= 1080 && (
          <g>
            {frame < 2400 && <text x={spectrumLeft} y={spectrumY + 34} fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.mono} fontSize="20">4000</text>}
            {frame < 2400 && <text x={spectrumLeft + spectrumWidth} y={spectrumY + 34} textAnchor="end" fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.mono} fontSize="20">500 cm⁻¹</text>}
            <line x1={spectrumLeft} y1={spectrumY} x2={spectrumLeft + spectrumWidth} y2={spectrumY} stroke={PALETTE.grayInactive} strokeWidth="1.6" />
            {frame < 2400 && <text x={spectrumLeft + spectrumWidth / 2} y={spectrumY + 63} textAnchor="middle" fill={PALETTE.white} fontFamily={TYPOGRAPHY.sans} fontSize="22">计算出的离散教学谱 · 横轴：波数 cm⁻¹</text>}
            {deposits.map((nu) => {
              const point = spectrum.find((candidate) => candidate.wavenumber === nu)!;
              const current = point.coefficient;
              const y = spectrumY - current * spectrumScale;
              return <g key={nu}><line x1={xForNu(nu, spectrumLeft, spectrumWidth)} y1={spectrumY} x2={xForNu(nu, spectrumLeft, spectrumWidth)} y2={y} stroke={PALETTE.cyanSignal} strokeWidth="2"/><circle cx={xForNu(nu, spectrumLeft, spectrumWidth)} cy={y} r="5" fill={PALETTE.cyanSignal}/><text x={xForNu(nu, spectrumLeft, spectrumWidth)} y={y - 12} textAnchor="middle" fill={PALETTE.cyanSignal} fontFamily={TYPOGRAPHY.mono} fontSize="15">{current.toFixed(2)}</text></g>;
            })}
            {sweepActive && sweepCandidates.slice(0, sweptCount).map((nu) => {
              const point = spectrum.find((candidate) => candidate.wavenumber === nu)!;
              const x = xForNu(point.wavenumber, spectrumLeft, spectrumWidth);
              const y = spectrumY - point.coefficient * spectrumScale;
              return <g key={point.wavenumber} opacity="0.72"><line x1={x} y1={spectrumY} x2={x} y2={y} stroke={PALETTE.grayContext} strokeWidth="1.5"/><circle cx={x} cy={y} r="2.5" fill={PALETTE.grayContext}/></g>;
            })}
            {sweepActive && frame < 2400 && <text x={spectrumLeft} y={spectrumY - 25} fill={PALETTE.grayContext} fontFamily={TYPOGRAPHY.sans} fontSize="20">候选频率逐点投影；细线显示计算系数</text>}
          </g>
        )}

        {showToken && <g data-token-id="coefficient-token"><circle data-coefficient-token="true" cx={tokenPosition.x} cy={tokenPosition.y} r="7" fill={PALETTE.cyanSignal}/><text x={tokenPosition.x} y={tokenPosition.y - 15} textAnchor="middle" fill={PALETTE.cyanSignal} fontFamily={TYPOGRAPHY.mono} fontSize="16">{tokenCoefficient.toFixed(3)}</text></g>}

        {showAmplitudeDemo && frame >= 2160 && frame < 2400 && <text x="960" y="830" textAnchor="middle" fill={PALETTE.amberLight} fontFamily={TYPOGRAPHY.sans} fontSize="19">降低 1750 cm⁻¹ 分量：{teachingRecord.components.find((component) => component.wavenumber === 1750)?.amplitude.toFixed(2)} → {activeComponents.find((component) => component.wavenumber === 1750)?.amplitude.toFixed(2)} · 信号与投影同步更新</text>}
      </svg>

      {wrongWindow && scanProgress >= 1 && <div style={{ position: 'absolute', top: 555, left: 0, right: 0, textAlign: 'center', color: PALETTE.grayContext, fontFamily: TYPOGRAPHY.sans, fontSize: 34 }}>失配：正负贡献互相抵消</div>}
      {matchingWindow && scanProgress >= 1 && <div style={{ position: 'absolute', top: 555, left: 0, right: 0, textAlign: 'center', color: PALETTE.cyanSignal, fontFamily: TYPOGRAPHY.sans, fontSize: 34 }}>匹配：净贡献等于该分量振幅</div>}

      {showEquation && (
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 190, textAlign: 'center', opacity: interpolate(frame, [2400, 2460], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }) }}>
          <div style={{ fontFamily: TYPOGRAPHY.mono, fontSize: 39, fontWeight: 600, color: PALETTE.white }}>a(ν̃) = Σᵢ I(δᵢ) cos(2πν̃δᵢ) / Σᵢ cos²(2πν̃δᵢ)</div>
          <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: 21, color: PALETTE.grayContext, marginTop: 10 }}>有限采样下的归一化投影 · 傅里叶系数</div>
        </div>
      )}
    </div>
  );
};
