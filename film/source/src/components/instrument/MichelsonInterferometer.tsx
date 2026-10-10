import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { TYPOGRAPHY } from '../../styles/visualSystem';

interface MichelsonInterferometerProps {
  mirrorDisplacement?: number;
  dimApparatus?: boolean;
}

export const MichelsonInterferometer: React.FC<MichelsonInterferometerProps> = ({
  mirrorDisplacement,
  dimApparatus = false,
}) => {
  const frame = useCurrentFrame();

  // =========================================================================
  // THE COMPLETE PHYSICAL CHAIN OF FTIR:
  // IR Source -> Michelson Interferometer -> SAMPLE -> Detector
  //
  // Section 1 (0 - 180):   Incoming Amber beam reaches 45° Beamsplitter; splits.
  // Section 2 (180 - 360): Fixed Mirror (top) & Moving Mirror (right) illuminated.
  // Section 3 (360 - 540): Moving mirror: outbound x + return x merge into 2x -> δ = 2x.
  // Section 4 (540 - 700): Waves & Phase: Δφ = 2π ν̃ δ. Recombination at beamsplitter.
  // Section 5 (700 - 820): AFTER MICHELSON statement:
  //                        "迈克尔逊干涉仪 将不同波数编码进干涉调制。"
  // Section 6 (820 - 990): AFTER SAMPLE & SELECTIVE ATTENUATION:
  //                        Beam continues downward to the Sample Compartment!
  //                        Interferometer dims to 15%.
  //                        Beam temporarily expands into 3 wavenumber components:
  //                        Before sample: all full amplitude.
  //                        After sample: 1715 cm⁻¹ is attenuated (weakened)!
  //                        Components recombine into outgoing beam toward detector.
  //                        Statement: "样品选择性削弱 其中某些波数成分。"
  // Section 7 (990 - 1200): AT DETECTOR & BACKGROUND VS SAMPLE (Pass 1 vs Pass 2):
  //                        Amber beam strikes detector face -> Light ends!
  //                        Cyan Dot (●) ignites at detector output -> Signal begins!
  //                        Pass 1: Background I_B(δ) frozen in muted gray.
  //                        Pass 2: Sample I_S(δ) drawn in brilliant cyan by Cyan Dot!
  //                        Statement: "检测器记录 改变后的干涉信号。"
  // =========================================================================

  // Key Coordinates (1920 x 1080)
  const sourceX = 260;
  const sourceY = 340;
  const bsX = 760;
  const bsY = 340;
  const fmX = 760;
  const fmY = 120;
  const mmBaseX = 1260;
  const mmY = 340;

  // The Sample & Detector: Placed AFTER the interferometer!
  const sampleX = 760;
  const sampleY = 560;
  const detX = 760;
  const detY = 740;

  // 1. Incoming Amber Beam
  const incomingProgress = interpolate(frame, [0, 80], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const currentBeamHeadX = sourceX + 26 + (bsX - (sourceX + 26)) * incomingProgress;

  // Beamsplitter split
  const bsSplitProgress = interpolate(frame, [80, 160], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const bsLabelOpacity = interpolate(frame, [100, 130, 200, 230], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 2. Mirrors illumination
  const armRayProgress = interpolate(frame, [160, 240], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const mirrorsReveal = interpolate(frame, [220, 260], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const returnRayProgress = interpolate(frame, [260, 340], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 3. Moving Mirror Displacement
  const isSection3 = frame >= 360 && frame < 540;
  const fixedArmDimOpacity = interpolate(frame, [360, 400, 520, 550], [1, 0.15, 0.15, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const mirrorMoveProgress = interpolate(frame, [380, 460], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const dispX = mirrorDisplacement !== undefined ? mirrorDisplacement : mirrorMoveProgress * 55;
  const mmCurrentX = mmBaseX + dispX;

  const xMergeProgress = interpolate(frame, [440, 480], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const deltaEqOpacity = interpolate(frame, [480, 510, 540, 570], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 4. Electric-field Waves & Recombination (540 - 700)
  const showEFieldWaves = frame >= 540 && frame < 720;
  const hardwareDimForInterference = interpolate(frame, [540, 570, 700, 730], [1, 0.12, 0.12, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const oscInterference = frame >= 540 && frame < 700 ? Math.sin((frame - 540) * 0.07) : 0;
  const oscDisp = frame >= 540 && frame < 700 ? oscInterference * 32 : dispX;
  const activeMMX = mmBaseX + oscDisp;

  const lambdaVisual1 = 48;
  const phaseDiff1 = ((2 * oscDisp) / lambdaVisual1) * 2 * Math.PI;
  const cos1 = Math.cos(phaseDiff1);
  const intensity1 = Math.max(0.05, 0.5 + 0.5 * cos1);

  // 5. AFTER MICHELSON STATEMENT (700 - 820)
  const stmt1Opacity = interpolate(frame, [700, 730, 800, 830], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 6. AFTER SAMPLE & SELECTIVE ATTENUATION (820 - 990)
  const isSampleSection = frame >= 820;
  const sampleSectionDim = interpolate(frame, [820, 860], [1, 0.15], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const beamToSampleProgress = interpolate(frame, [820, 870], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const beamThroughSampleProgress = interpolate(frame, [880, 930], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const sampleAbsorptionGlow = interpolate(frame, [870, 910, 960, 990], [0, 1, 1, 0.4], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const stmt2Opacity = interpolate(frame, [870, 900, 960, 990], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // 7. AT DETECTOR & BACKGROUND VS SAMPLE (990 - 1200)
  const isDetectorSection = frame >= 990;
  const beamToDetectorProgress = interpolate(frame, [990, 1030], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const amberToCyanProgress = interpolate(frame, [1020, 1060], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const traceDrawProgress = interpolate(frame, [1040, 1190], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const stmt3Opacity = interpolate(frame, [1030, 1060, 1140, 1180], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  const overallHardwareOpacity = dimApparatus
    ? 0.12
    : interpolate(frame, [1050, 1150], [1, 0.05], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Background Interferogram (Pass 1 - Frozen subtly in background)
  const bgIfgPts: Array<{ x: number; y: number }> = [];
  const numIfgPts = 200;
  const ifgStartX = 400;
  const ifgSpanX = 720;
  const ifgBaseY = 910;

  for (let i = 0; i <= numIfgPts; i++) {
    const norm = i / numIfgPts;
    const px = ifgStartX + norm * ifgSpanX;
    const t = (norm * 2 - 1) * 6 * Math.PI;
    // Unattenuated envelope
    const val = (Math.cos(t * 0.8) * 0.4 + Math.cos(t * 1.5) * 0.35 + Math.cos(t * 2.6) * 0.35) * Math.exp(-Math.abs(t) * 0.28) * 60;
    bgIfgPts.push({ x: px, y: ifgBaseY - val });
  }
  const bgIfgD = bgIfgPts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  // Sample Interferogram (Pass 2 - Drawn by Cyan Dot with 1715 cm⁻¹ attenuated)
  const maxSampleIdx = Math.floor(numIfgPts * traceDrawProgress);
  const sampleIfgPts: Array<{ x: number; y: number }> = [];
  for (let i = 0; i <= maxSampleIdx; i++) {
    const norm = i / numIfgPts;
    const px = ifgStartX + norm * ifgSpanX;
    const t = (norm * 2 - 1) * 6 * Math.PI;
    // Component at t*1.5 (corresponding to 1715 cm⁻¹) is attenuated from 0.35 down to 0.06!
    const val = (Math.cos(t * 0.8) * 0.4 + Math.cos(t * 1.5) * 0.06 + Math.cos(t * 2.6) * 0.35) * Math.exp(-Math.abs(t) * 0.28) * 60;
    sampleIfgPts.push({ x: px, y: ifgBaseY - val });
  }
  const sampleIfgD = sampleIfgPts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const activeDotPt = sampleIfgPts[sampleIfgPts.length - 1] || { x: ifgStartX, y: ifgBaseY };

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= 1. PHYSICAL OPTICAL HARDWARE ================= */}
        <g opacity={overallHardwareOpacity * (isSampleSection ? sampleSectionDim : frame >= 540 && frame < 700 ? hardwareDimForInterference : 1)}>
          {/* IR Source Emitter */}
          <g transform={`translate(${sourceX}, ${sourceY})`} opacity={isSection3 ? fixedArmDimOpacity : 1}>
            <circle r={34} fill="#FFA756" opacity="0.18" />
            <circle r={24} fill="#1E140C" stroke="#FFA756" strokeWidth="2" />
            <circle r={11} fill="#FFA756" />
            <circle r={4} fill="#FFFFFF" />
          </g>

          {/* 45° Beamsplitter */}
          <g transform={`translate(${bsX}, ${bsY}) rotate(45)`} opacity={incomingProgress > 0.5 ? 1 : 0.4}>
            <rect x={-55} y={-7} width={110} height={14} rx={2} fill="#0284C7" fillOpacity="0.4" stroke="#38BDF8" strokeWidth="1.5" />
            <line x1={-55} y1={0} x2={55} y2={0} stroke="#FFFFFF" strokeWidth="2.5" opacity="0.95" />
          </g>

          {/* Fixed Mirror (M1) - Top */}
          <g transform={`translate(${fmX}, ${fmY})`} opacity={mirrorsReveal * (isSection3 ? fixedArmDimOpacity : 1)}>
            <rect x={-55} y={-10} width={110} height={16} fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
            <line x1={-52} y1={6} x2={52} y2={6} stroke="#E2E8F0" strokeWidth="3" />
          </g>

          {/* Moving Mirror (M2) - Right */}
          <g
            transform={`translate(${frame >= 540 ? activeMMX : mmCurrentX}, ${mmY})`}
            opacity={mirrorsReveal}
          >
            <rect x={7} y={-28} width={26} height={56} fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
            <rect x={-8} y={-55} width={16} height={110} fill="#1E293B" stroke="#64748B" strokeWidth="1.5" />
            <line x1={-8} y1={-52} x2={-8} y2={52} stroke="#E2E8F0" strokeWidth="3" />
          </g>
        </g>

        {/* ================= 2. THE SAMPLE COMPARTMENT (AFTER INTERFEROMETER!) ================= */}
        <g opacity={overallHardwareOpacity}>
          <g transform={`translate(${sampleX}, ${sampleY})`}>
            {/* Sample Chamber Frame */}
            <rect x={-65} y={-20} width={130} height={40} rx={4} fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
            {/* Translucent Sample Cell / Material Plane */}
            <rect
              x={-50}
              y={-14}
              width={100}
              height={28}
              rx={3}
              fill="#064E3B"
              fillOpacity={0.4 + sampleAbsorptionGlow * 0.4}
              stroke="#10B981"
              strokeWidth={1.5}
            />
            {/* Sample Label (Minimalist, zero UI card) */}
            <text x={0} y={5} textAnchor="middle" fill="#A7F3D0" fontSize="16" fontFamily={TYPOGRAPHY.monoFont} letterSpacing="0.08em">
              SAMPLE 样品
            </text>
          </g>
        </g>

        {/* ================= 3. THE DETECTOR (AFTER THE SAMPLE!) ================= */}
        <g opacity={overallHardwareOpacity}>
          <g transform={`translate(${detX}, ${detY})`}>
            <rect x={-45} y={-10} width={90} height={26} rx={3} fill="#0F172A" stroke="#334155" strokeWidth="1.5" />
            {/* Sensor Receiving Face */}
            <rect
              x={-28}
              y={-14}
              width={56}
              height={6}
              fill={amberToCyanProgress > 0.5 ? '#00F5FF' : '#FFA756'}
              opacity={0.8}
            />
            <text x={0} y={7} textAnchor="middle" fill="#64748B" fontSize="14" fontFamily={TYPOGRAPHY.monoFont}>
              DETECTOR
            </text>
          </g>
        </g>

        {/* ================= 4. OPTICAL BEAMS INSIDE INTERFEROMETER ================= */}

        {/* 4A. Incoming Beam */}
        {currentBeamHeadX > sourceX + 26 && (
          <g opacity={(isSampleSection ? sampleSectionDim : isSection3 ? fixedArmDimOpacity : 1) * (1 - amberToCyanProgress)}>
            <line x1={sourceX + 26} y1={sourceY} x2={currentBeamHeadX} y2={sourceY} stroke="#FFA756" strokeWidth="10" opacity="0.3" strokeLinecap="round" />
            <line x1={sourceX + 26} y1={sourceY} x2={currentBeamHeadX} y2={sourceY} stroke="#FFF3E0" strokeWidth="3" strokeLinecap="round" />
          </g>
        )}

        {/* 4B. Transmitted Arm (Moving Mirror) */}
        {bsSplitProgress > 0 && (
          <g opacity={(isSampleSection ? sampleSectionDim : 1) * (1 - amberToCyanProgress)}>
            <line x1={bsX} y1={bsY} x2={bsX + ((frame >= 540 ? activeMMX : mmCurrentX) - 8 - bsX) * armRayProgress} y2={mmY} stroke="#FFA756" strokeWidth="10" opacity="0.3" />
            <line x1={bsX} y1={bsY} x2={bsX + ((frame >= 540 ? activeMMX : mmCurrentX) - 8 - bsX) * armRayProgress} y2={mmY} stroke="#FFA756" strokeWidth="3" />
          </g>
        )}

        {/* 4C. Reflected Arm (Fixed Mirror) */}
        {bsSplitProgress > 0 && (
          <g opacity={(isSampleSection ? sampleSectionDim : isSection3 ? fixedArmDimOpacity : 1) * (1 - amberToCyanProgress)}>
            <line x1={bsX} y1={bsY} x2={fmX} y2={bsY - (bsY - (fmY + 6)) * armRayProgress} stroke="#FFA756" strokeWidth="8" opacity="0.25" />
            <line x1={bsX} y1={bsY} x2={fmX} y2={bsY - (bsY - (fmY + 6)) * armRayProgress} stroke="#FFA756" strokeWidth="2.5" />
          </g>
        )}

        {/* 4D. Returning Arms */}
        {returnRayProgress > 0 && (
          <g opacity={(isSampleSection ? sampleSectionDim : 1) * (1 - amberToCyanProgress)}>
            <line x1={fmX} y1={fmY + 6} x2={bsX} y2={fmY + 6 + (bsY - (fmY + 6)) * returnRayProgress} stroke="#FFA756" strokeWidth="2.5" opacity={isSection3 ? fixedArmDimOpacity : 0.8} />
            <line
              x1={(frame >= 540 ? activeMMX : mmCurrentX) - 8}
              y1={mmY}
              x2={((frame >= 540 ? activeMMX : mmCurrentX) - 8) - (((frame >= 540 ? activeMMX : mmCurrentX) - 8) - bsX) * returnRayProgress}
              y2={mmY}
              stroke="#FFA756"
              strokeWidth="3"
            />
          </g>
        )}

        {/* ================= 5. THE CRITICAL RECOMBINED OUTGOING BEAM: TOWARD THE SAMPLE! ================= */}

        {/* 5A. Recombined Beam (From Beamsplitter down to Sample) */}
        {returnRayProgress > 0.8 && (
          <g opacity={1 - amberToCyanProgress}>
            {/* Primary Amber Recombined Beam exiting interferometer */}
            <line
              x1={bsX}
              y1={bsY}
              x2={bsX}
              y2={bsY + (sampleY - 14 - bsY) * (frame >= 820 ? beamToSampleProgress : 1)}
              stroke="#FFA756"
              strokeWidth="10"
              opacity="0.3"
            />
            <line
              x1={bsX}
              y1={bsY}
              x2={bsX}
              y2={bsY + (sampleY - 14 - bsY) * (frame >= 820 ? beamToSampleProgress : 1)}
              stroke="#FFF3E0"
              strokeWidth="3.5"
            />
          </g>
        )}

        {/* 5B. SELECTIVE ATTENUATION DEMONSTRATION (840 - 980) */}
        {/* Temporarily expand beam into 3 wavenumber components */}
        {frame >= 840 && frame < 990 && (
          <g>
            {/* Component 1: Low wavenumber ν̃_1 (Unattenuated) */}
            <path
              d={(() => {
                const pts: string[] = [];
                for (let y = bsY + 30; y <= sampleY + 120; y += 4) {
                  const x = bsX - 35 + Math.sin(((y - bsY) / 48) * 2 * Math.PI) * 12;
                  pts.push(`${y === bsY + 30 ? 'M' : 'L'} ${x.toFixed(1)} ${y}`);
                }
                return pts.join(' ');
              })()}
              fill="none"
              stroke="#FFA756"
              strokeWidth="2.5"
              opacity={0.8}
            />

            {/* Component 2: 1715 cm⁻¹ (ATTENUATED AFTER SAMPLE!) */}
            <path
              d={(() => {
                // Before sample: full amplitude (14px)
                const pts: string[] = [];
                for (let y = bsY + 30; y <= sampleY - 14; y += 4) {
                  const x = bsX + Math.sin(((y - bsY) / 32) * 2 * Math.PI) * 14;
                  pts.push(`${y === bsY + 30 ? 'M' : 'L'} ${x.toFixed(1)} ${y}`);
                }
                // After sample: ATTENUATED amplitude (dropped to 2.5px!)
                for (let y = sampleY + 14; y <= sampleY + 120; y += 4) {
                  const x = bsX + Math.sin(((y - bsY) / 32) * 2 * Math.PI) * 3;
                  pts.push(`${y === sampleY + 14 ? 'M' : 'L'} ${x.toFixed(1)} ${y}`);
                }
                return pts.join(' ');
              })()}
              fill="none"
              stroke="#F43F5E"
              strokeWidth="2.5"
            />
            {/* Attenuation Marker */}
            <text x={bsX + 45} y={sampleY + 50} fill="#F43F5E" fontSize="18" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
              1715 cm⁻¹ 吸收衰减
            </text>

            {/* Component 3: High wavenumber ν̃_3 (Unattenuated) */}
            <path
              d={(() => {
                const pts: string[] = [];
                for (let y = bsY + 30; y <= sampleY + 120; y += 4) {
                  const x = bsX + 35 + Math.sin(((y - bsY) / 22) * 2 * Math.PI) * 12;
                  pts.push(`${y === bsY + 30 ? 'M' : 'L'} ${x.toFixed(1)} ${y}`);
                }
                return pts.join(' ');
              })()}
              fill="none"
              stroke="#FFA756"
              strokeWidth="2"
              opacity={0.8}
            />
          </g>
        )}

        {/* 5C. Transmitted Beam from Sample Down to Detector */}
        {frame >= 900 && (
          <g opacity={1 - amberToCyanProgress}>
            <line
              x1={sampleX}
              y1={sampleY + 14}
              x2={sampleX}
              y2={sampleY + 14 + (detY - 14 - (sampleY + 14)) * (frame >= 990 ? beamToDetectorProgress : 1)}
              stroke="#FFA756"
              strokeWidth="8"
              opacity="0.3"
            />
            <line
              x1={sampleX}
              y1={sampleY + 14}
              x2={sampleX}
              y2={sampleY + 14 + (detY - 14 - (sampleY + 14)) * (frame >= 990 ? beamToDetectorProgress : 1)}
              stroke="#FFF3E0"
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* ================= 6. THE DETECTOR TRANSFORMATION & SEQUENTIAL INTERFEROGRAMS ================= */}
        {isDetectorSection && (
          <g>
            {/* PASS 1: BACKGROUND INTERFEROGRAM I_B(δ) (Frozen subtly in background) */}
            <g opacity={0.35}>
              <line x1={ifgStartX} y1={ifgBaseY} x2={ifgStartX + ifgSpanX} y2={ifgBaseY} stroke="#334155" strokeWidth="1" strokeDasharray="3 3" />
              <path d={bgIfgD} fill="none" stroke="#94A3B8" strokeWidth="2" strokeDasharray="4 4" />
              <text x={ifgStartX + ifgSpanX + 15} y={ifgBaseY + 6} fill="#64748B" fontSize="18" fontFamily={TYPOGRAPHY.monoFont}>
                I_B(δ) [背景测量]
              </text>
            </g>

            {/* PASS 2: SAMPLE INTERFEROGRAM I_S(δ) (Drawn in brilliant cyan by the Cyan Dot!) */}
            {sampleIfgPts.length > 1 && (
              <g>
                <path d={sampleIfgD} fill="none" stroke="#00F5FF" strokeWidth="3.5" strokeLinecap="round" />
                <text x={ifgStartX + ifgSpanX + 15} y={ifgBaseY - 25} fill="#00F5FF" fontSize="20" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
                  I_S(δ) [样品测量]
                </text>
              </g>
            )}

            {/* THE CYAN DOT (●): Active at the tip of the sample measurement */}
            {amberToCyanProgress > 0.4 && (
              <g transform={`translate(${activeDotPt.x}, ${activeDotPt.y})`}>
                <circle r={14} fill="#00F5FF" opacity="0.35" />
                <circle r={7.5} fill="#00F5FF" />
                <circle r={3} fill="#FFFFFF" />
              </g>
            )}
          </g>
        )}

        {/* Section 3: x + x -> 2x */}
        {frame >= 380 && frame < 540 && (
          <g opacity={interpolate(frame, [380, 410, 500, 530], [0, 1, 1, 0])}>
            <line x1={mmBaseX - 8} y1={mmY - 24} x2={mmCurrentX - 8} y2={mmY - 24} stroke="#00F5FF" strokeWidth="2" />
            <line x1={mmBaseX - 8} y1={mmY + 24} x2={mmCurrentX - 8} y2={mmY + 24} stroke="#00F5FF" strokeWidth="2" />
            {xMergeProgress > 0.6 ? (
              <text x={(mmBaseX + mmCurrentX) / 2 - 8} y={mmY + 8} textAnchor="middle" fill="#00F5FF" fontSize="30" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
                2x
              </text>
            ) : (
              <>
                <text x={(mmBaseX + mmCurrentX) / 2 - 8} y={mmY - 34} textAnchor="middle" fill="#00F5FF" fontSize="24" fontFamily={TYPOGRAPHY.monoFont}>+x</text>
                <text x={(mmBaseX + mmCurrentX) / 2 - 8} y={mmY + 48} textAnchor="middle" fill="#00F5FF" fontSize="24" fontFamily={TYPOGRAPHY.monoFont}>+x</text>
              </>
            )}
          </g>
        )}

        {deltaEqOpacity > 0 && (
          <text x={mmBaseX + 60} y={mmY + 95} textAnchor="middle" fill="#00F5FF" fontSize="38" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold" opacity={deltaEqOpacity}>
            δ = 2x
          </text>
        )}
      </svg>

      {/* ================= 7. THREE DISTINCT VISUAL STATEMENTS (REQUIREMENT 8) ================= */}

      {/* Statement 1: After Michelson (700 - 820) */}
      {stmt1Opacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '180px',
            textAlign: 'center',
            opacity: stmt1Opacity,
          }}
        >
          <div style={{ fontFamily: TYPOGRAPHY.chineseSerif, fontSize: '38px', color: '#FFFFFF', letterSpacing: '0.12em' }}>
            迈克尔逊干涉仪
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.chineseSerif, fontSize: '28px', color: '#00F5FF', marginTop: '10px', letterSpacing: '0.08em' }}>
            将不同波数编码进干涉调制
          </div>
        </div>
      )}

      {/* Statement 2: After Sample (870 - 990) */}
      {stmt2Opacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '180px',
            textAlign: 'center',
            opacity: stmt2Opacity,
          }}
        >
          <div style={{ fontFamily: TYPOGRAPHY.chineseSerif, fontSize: '38px', color: '#FFFFFF', letterSpacing: '0.12em' }}>
            样品选择性削弱
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.chineseSerif, fontSize: '28px', color: '#FFA756', marginTop: '10px', letterSpacing: '0.08em' }}>
            其中某些波数成分
          </div>
        </div>
      )}

      {/* Statement 3: At Detector (1030 - 1180) */}
      {stmt3Opacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '180px',
            textAlign: 'center',
            opacity: stmt3Opacity,
          }}
        >
          <div style={{ fontFamily: TYPOGRAPHY.chineseSerif, fontSize: '38px', color: '#FFFFFF', letterSpacing: '0.12em' }}>
            检测器记录
          </div>
          <div style={{ fontFamily: TYPOGRAPHY.chineseSerif, fontSize: '28px', color: '#00F5FF', marginTop: '10px', letterSpacing: '0.08em' }}>
            改变后的干涉信号
          </div>
        </div>
      )}
    </div>
  );
};
