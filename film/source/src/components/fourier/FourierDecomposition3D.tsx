import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { TYPOGRAPHY } from '../../styles/visualSystem';
import { calculateInterferogramPoint } from '../../math/interferogram';

export const FourierDecompositionEngine: React.FC = () => {
  const frame = useCurrentFrame();

  // =========================================================================
  // THE SIGNAL THREAD IN ACT 5:
  // The Cyan Dot (●) detaches from the interferogram, becomes the Fourier Frequency Probe,
  // tests frequencies, deposits amplitude points on the wavenumber axis,
  // and builds the continuous spectrum!
  //
  // Phase A (0 - 240, 8s):   Hold - Solitary interferogram in deep stillness.
  //                          Cyan Dot rests at the tip of the curve.
  // Phase B (240 - 540, 10s): Cyan Dot detaches -> traces mismatched probe cosine ->
  //                          cancels to 0 -> flies to ν̃ axis and deposits low dot!
  // Phase C (540 - 840, 10s): Cyan Dot returns -> traces resonant probe cosine ->
  //                          surges high -> flies to ν̃ axis and deposits tall peak at 1715!
  // Phase D (840 - 1380, 18s): Accelerated sweep: Cyan Dot deposits points along ν̃ axis ->
  //                          points interpolate into continuous spectrum S(ν̃)!
  // Phase E (1380 - 1800, 14s): Dual representation I(δ) <-> S(ν̃).
  //                          Title: 傅里叶变换 / Fourier Transform
  // =========================================================================

  const centerX = 960;
  const centerY = 440;
  const spanX = 680;
  const specAxisY = 720;

  // Interferogram curve samples
  const samples = 220;
  const ifgPts: Array<{ x: number; y: number; val: number; t: number }> = [];
  for (let i = 0; i <= samples; i++) {
    const t = (i / samples) * 2 - 1;
    const px = centerX + t * spanX;
    const val = calculateInterferogramPoint(t * 0.045, true, 48);
    const py = centerY - val * 170;
    ifgPts.push({ x: px, y: py, val, t });
  }

  const ifgPathD = ifgPts
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  // ================= 1. PHASE B: TEST MISMATCHED PROBE (240 - 540) =================
  const phaseBOpacity = interpolate(frame, [240, 270, 500, 540], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const probeBProgress = interpolate(frame, [270, 430], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flyBProgress = interpolate(frame, [450, 510], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const probeWaveB: string[] = [];
  const maxIdxB = Math.floor(samples * probeBProgress);
  for (let i = 0; i <= maxIdxB; i++) {
    const p = ifgPts[i];
    const probeVal = Math.cos(p.t * 14.5 * Math.PI);
    const py = centerY + 170 - probeVal * 40;
    probeWaveB.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${py.toFixed(1)}`);
  }
  const probeWaveBD = probeWaveB.join(' ');

  // Cyan Dot coordinates during Phase B
  const bHeadPt = ifgPts[maxIdxB] || ifgPts[0];
  const bHeadProbeVal = Math.cos(bHeadPt.t * 14.5 * Math.PI);
  const bTracingY = centerY + 170 - bHeadProbeVal * 40;

  // Fly to target on wavenumber axis (nu = 3100 cm⁻¹, amplitude ≈ 0.08)
  const bTargetX = centerX - spanX + 0.25 * (spanX * 2);
  const bTargetY = specAxisY - 0.08 * 130;
  const bDotX = probeBProgress < 1 ? bHeadPt.x : bHeadPt.x * (1 - flyBProgress) + bTargetX * flyBProgress;
  const bDotY = probeBProgress < 1 ? bTracingY : bTracingY * (1 - flyBProgress) + bTargetY * flyBProgress;

  // ================= 2. PHASE C: MATCHING AUTHENTIC HARMONIC (540 - 840) =================
  const phaseCOpacity = interpolate(frame, [540, 570, 800, 840], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const probeCProgress = interpolate(frame, [570, 720], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const flyCProgress = interpolate(frame, [740, 800], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const probeWaveC: string[] = [];
  const maxIdxC = Math.floor(samples * probeCProgress);
  for (let i = 0; i <= maxIdxC; i++) {
    const p = ifgPts[i];
    const probeVal = Math.cos(p.t * 8.0 * Math.PI);
    const py = centerY + 170 - probeVal * 40;
    probeWaveC.push(`${i === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${py.toFixed(1)}`);
  }
  const probeWaveCD = probeWaveC.join(' ');

  // Cyan Dot coordinates during Phase C
  const cHeadPt = ifgPts[maxIdxC] || ifgPts[0];
  const cHeadProbeVal = Math.cos(cHeadPt.t * 8.0 * Math.PI);
  const cTracingY = centerY + 170 - cHeadProbeVal * 40;

  // Fly to target on wavenumber axis (1715 cm⁻¹, amplitude ≈ 1.05)
  // Wavenumber 1715 in [4000, 400] domain -> norm = (4000 - 1715) / 3600 = 0.635
  const cTargetX = centerX - spanX + 0.635 * (spanX * 2);
  const cTargetY = specAxisY - 1.05 * 130;
  const cDotX = probeCProgress < 1 ? cHeadPt.x : cHeadPt.x * (1 - flyCProgress) + cTargetX * flyCProgress;
  const cDotY = probeCProgress < 1 ? cTracingY : cTracingY * (1 - flyCProgress) + cTargetY * flyCProgress;

  // ================= 3. PHASE D: ACCELERATED SWEEP & DEPOSITION (840 - 1380) =================
  const phaseDProgress = interpolate(frame, [880, 1320], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const caveatOpacity = interpolate(frame, [890, 930, 1050, 1090], [0, 1, 1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const totalPoints = 32;
  const currentPointsCount = Math.floor(phaseDProgress * totalPoints);
  const depositedPoints: Array<{ x: number; y: number; nu: number; amp: number }> = [];

  for (let i = 0; i < totalPoints; i++) {
    const norm = i / (totalPoints - 1);
    const px = centerX - spanX + norm * (spanX * 2);
    const nu = 4000 - norm * 3600;
    let power = 0.22;
    if (Math.abs(nu - 1715) < 180) power += 0.85 * Math.exp(-Math.pow((nu - 1715) / 70, 2));
    if (Math.abs(nu - 2349) < 120) power += 0.7 * Math.exp(-Math.pow((nu - 2349) / 50, 2));
    if (Math.abs(nu - 2960) < 160) power += 0.55 * Math.exp(-Math.pow((nu - 2960) / 90, 2));
    if (Math.abs(nu - 3350) < 240) power += 0.65 * Math.exp(-Math.pow((nu - 3350) / 160, 2));
    const py = specAxisY - power * 130;
    depositedPoints.push({ x: px, y: py, nu, amp: power });
  }

  const specLineD = depositedPoints
    .slice(0, currentPointsCount + 1)
    .map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
    .join(' ');

  const activeSweptPoint = depositedPoints[Math.min(depositedPoints.length - 1, currentPointsCount)] || depositedPoints[0];

  // ================= 4. PHASE E: DUAL REPRESENTATION (1380 - 1800) =================
  const phaseEOpacity = interpolate(frame, [1380, 1440], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const equationOpacity = interpolate(frame, [1500, 1560], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const miniIfgD = (() => {
    const pts: string[] = [];
    const n = 120;
    for (let i = 0; i <= n; i++) {
      const t = (i / n) * 2 - 1;
      const px = 280 + (i / n) * 480;
      const val = calculateInterferogramPoint(t * 0.045, true, 36);
      const py = 450 - val * 90;
      pts.push(`${i === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    }
    return pts.join(' ');
  })();

  const miniSpecD = (() => {
    const pts: string[] = [];
    const n = depositedPoints.length;
    depositedPoints.forEach((p, idx) => {
      const px = 1160 + (idx / (n - 1)) * 480;
      const py = 450 - p.amp * 90;
      pts.push(`${idx === 0 ? 'M' : 'L'} ${px.toFixed(1)} ${py.toFixed(1)}`);
    });
    return pts.join(' ');
  })();

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= 1. PHASE A, B, C, D: INTERFEROGRAM ================= */}
        {frame < 1380 && (
          <g>
            <path
              d={ifgPathD}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth="3"
              opacity={frame >= 840 ? 0.65 : 1}
            />

            {frame >= 240 && (
              <line
                x1={centerX - spanX}
                y1={centerY}
                x2={centerX + spanX}
                y2={centerY}
                stroke="#1E293B"
                strokeWidth="1.5"
                opacity="0.5"
              />
            )}

            {/* Resting Cyan Dot at tip during Phase A */}
            {frame < 260 && (
              <g transform={`translate(${ifgPts[ifgPts.length - 1].x}, ${ifgPts[ifgPts.length - 1].y})`}>
                <circle r={14} fill="#00F5FF" opacity="0.3" />
                <circle r={7.5} fill="#00F5FF" />
                <circle r={3} fill="#FFFFFF" />
              </g>
            )}
          </g>
        )}

        {/* ================= 2. PHASE B: TEST MISMATCHED PROBE (CYAN DOT LEADS) ================= */}
        {phaseBOpacity > 0 && (
          <g opacity={phaseBOpacity}>
            <path d={probeWaveBD} fill="none" stroke="#FFA756" strokeWidth="2.5" />
            <line x1={centerX} y1={centerY + 230} x2={centerX + 6} y2={centerY + 230} stroke="#64748B" strokeWidth="6" strokeLinecap="round" />
            <text x={centerX + 22} y={centerY + 236} fill="#94A3B8" fontSize="20" fontFamily={TYPOGRAPHY.monoFont}>
              ∫ I · cos ≈ 0
            </text>

            {/* THE CYAN DOT (●) Tracing and Depositing Low Amplitude Dot */}
            <g transform={`translate(${bDotX}, ${bDotY})`}>
              <circle r={14} fill="#00F5FF" opacity="0.3" />
              <circle r={7.5} fill="#00F5FF" />
              <circle r={3} fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ================= 3. PHASE C: MATCHING HARMONIC PROBE (CYAN DOT LEADS) ================= */}
        {phaseCOpacity > 0 && (
          <g opacity={phaseCOpacity}>
            <path d={probeWaveCD} fill="none" stroke="#00F5FF" strokeWidth="3" />
            <line x1={centerX} y1={centerY + 230} x2={centerX + 180} y2={centerY + 230} stroke="#00F5FF" strokeWidth="7" strokeLinecap="round" />
            <text x={centerX + 200} y={centerY + 238} fill="#00F5FF" fontSize="22" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
              ν̃ = 1715 cm⁻¹  (∫ I · cos ≫ 0)
            </text>

            {/* THE CYAN DOT (●) Tracing and Depositing Tall 1715 cm⁻¹ Peak Dot */}
            <g transform={`translate(${cDotX}, ${cDotY})`}>
              <circle r={16} fill="#00F5FF" opacity="0.35" />
              <circle r={8} fill="#00F5FF" />
              <circle r={3.5} fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ================= 4. PHASE D: ACCUMULATING SPECTRUM (CYAN DOT SWEEPS) ================= */}
        {frame >= 840 && frame < 1380 && (
          <g>
            <line x1={centerX - spanX} y1={specAxisY} x2={centerX + spanX} y2={specAxisY} stroke="#334155" strokeWidth="2" />
            <text x={centerX - spanX} y={specAxisY + 28} fill="#64748B" fontSize="18" fontFamily={TYPOGRAPHY.monoFont}>
              4000 cm⁻¹
            </text>
            <text x={centerX + spanX} y={specAxisY + 28} textAnchor="end" fill="#64748B" fontSize="18" fontFamily={TYPOGRAPHY.monoFont}>
              400 cm⁻¹
            </text>
            <text x={centerX} y={specAxisY + 30} textAnchor="middle" fill="#94A3B8" fontSize="20" fontFamily={TYPOGRAPHY.monoFont}>
              波数 Wavenumber ν̃ [cm⁻¹]
            </text>

            {/* Deposited Amplitude Points */}
            {depositedPoints.slice(0, currentPointsCount + 1).map((pt, idx) => (
              <circle key={idx} cx={pt.x} cy={pt.y} r={4.5} fill="#00F5FF" />
            ))}

            {/* Connecting Spectral Curve */}
            {currentPointsCount > 2 && (
              <path d={specLineD} fill="none" stroke="#00F5FF" strokeWidth="3" />
            )}

            {/* THE CYAN DOT (●) Leading the active sweep on the axis */}
            <g transform={`translate(${activeSweptPoint.x}, ${activeSweptPoint.y})`}>
              <circle r={14} fill="#00F5FF" opacity="0.35" />
              <circle r={7.5} fill="#00F5FF" />
              <circle r={3} fill="#FFFFFF" />
            </g>
          </g>
        )}

        {/* ================= 5. PHASE E: DUAL REPRESENTATION ================= */}
        {phaseEOpacity > 0 && (
          <g opacity={phaseEOpacity}>
            {/* Left Panel: Interferogram I(δ) */}
            <path d={miniIfgD} fill="none" stroke="#FFFFFF" strokeWidth="3" />
            <line x1={280} y1={450} x2={760} y2={450} stroke="#334155" strokeWidth="1.5" />
            <text x={520} y={540} textAnchor="middle" fill="#FFFFFF" fontSize="34" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
              I(δ)
            </text>
            <text x={520} y={575} textAnchor="middle" fill="#94A3B8" fontSize="22" fontFamily={TYPOGRAPHY.chineseSerif}>
              光程差域
            </text>

            {/* Center: Bidirectional Transformation Arrow */}
            <g transform={`translate(${centerX}, 450)`}>
              <line x1={-60} y1={0} x2={60} y2={0} stroke="#00F5FF" strokeWidth="3" />
              <polygon points="60,-7 76,0 60,7" fill="#00F5FF" />
              <polygon points="-60,-7 -76,0 -60,7" fill="#00F5FF" />
            </g>

            {/* Right Panel: Spectrum S(ν̃) */}
            <path d={miniSpecD} fill="none" stroke="#00F5FF" strokeWidth="3" />
            <line x1={1160} y1={450} x2={1640} y2={450} stroke="#334155" strokeWidth="1.5" />
            <text x={1400} y={540} textAnchor="middle" fill="#00F5FF" fontSize="34" fontFamily={TYPOGRAPHY.monoFont} fontWeight="bold">
              S(ν̃)
            </text>
            <text x={1400} y={575} textAnchor="middle" fill="#94A3B8" fontSize="22" fontFamily={TYPOGRAPHY.chineseSerif}>
              波数光谱域
            </text>

            {/* The Cyan Dot resting at the 1715 cm⁻¹ peak in the spectrum! */}
            <g transform="translate(1465, 355)">
              <circle r={12} fill="#00F5FF" opacity="0.3" />
              <circle r={6.5} fill="#00F5FF" />
              <circle r={2.5} fill="#FFFFFF" />
            </g>
          </g>
        )}
      </svg>

      {/* Phase E Title */}
      {phaseEOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '90px',
            textAlign: 'center',
            opacity: phaseEOpacity,
          }}
        >
          <div
            style={{
              fontFamily: TYPOGRAPHY.chineseSerif,
              fontSize: '52px',
              fontWeight: 400,
              color: '#FFFFFF',
              letterSpacing: '0.14em',
              textShadow: '0 0 30px rgba(0,0,0,0.95)',
            }}
          >
            傅里叶变换
          </div>
          <div
            style={{
              fontFamily: TYPOGRAPHY.monoFont,
              fontSize: '26px',
              color: '#00F5FF',
              marginTop: '6px',
              letterSpacing: '0.08em',
            }}
          >
            Fourier Transform
          </div>
        </div>
      )}

      {/* Phase E Summary Equation */}
      {equationOpacity > 0 && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            top: '680px',
            textAlign: 'center',
            opacity: equationOpacity,
            fontFamily: TYPOGRAPHY.monoFont,
            fontSize: '34px',
            color: '#F8FAFC',
            letterSpacing: '0.08em',
            textShadow: '0 0 25px rgba(0,0,0,0.95)',
          }}
        >
          S(ν̃) ∝ ∫ I(δ) · cos(2π ν̃ δ) dδ
        </div>
      )}
    </div>
  );
};
