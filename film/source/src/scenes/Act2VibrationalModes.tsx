import React from 'react';
import { interpolate, interpolateColors, useCurrentFrame } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';

export const Act2VibrationalModes: React.FC<{ frameOverride?: number; editorial?: boolean; minimal?: boolean; modeOverride?: 'symmetric'|'bend'|'asymmetric'; amplitudeOverride?: number; couplingStrength?: number; motionGuides?:number }> = ({ frameOverride, editorial = false, minimal = false, modeOverride, amplitudeOverride, couplingStrength=0,motionGuides=0 }) => {
  const currentFrame = useCurrentFrame();
  const frame = frameOverride ?? currentFrame;

  // Local frame in Act 2: 0 to 600 (20 seconds @ 30fps)
  const centerX = 960;
  const centerY = 520;
  const bondLength = 150;

  // ---------------- Section 1: Montage (0 - 150) ----------------
  const montageModeIdx = editorial ? Math.min(3, Math.floor(frame / 50)) : Math.min(3, Math.floor(frame / 38));
  const montageLabels = ['伸缩', '弯曲', '剪式', '摇摆'];
  const currentMontageLabel = montageLabels[montageModeIdx];
  const montageOsc = Math.sin(frame * 0.32) * 26;

  // ---------------- Section 2 & 3: CO2 Comparison (150 - 600) ----------------
  const isSymmetric = modeOverride ? modeOverride==='symmetric' : frame >= 150 && frame < 300;
  const isAsymmetric = modeOverride ? modeOverride==='asymmetric' : frame >= 300;
  const isBending = modeOverride==='bend';

  // Resonant amplitude growth in Section 3
  const asymBaseAmp = interpolate(frame, [300, 360, 480, 560], [12, 18, 36, 42], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const symOsc = modeOverride ? Math.sin((frame-300)*.22)*(amplitudeOverride??22) : Math.sin((frame - 150) * 0.18) * 22;
  const asymOsc = Math.sin((frame - 300) * 0.22) * (amplitudeOverride??asymBaseAmp);

  let cX = centerX;
  let cY = centerY;
  let o1X = centerX - bondLength;
  let o1Y = centerY;
  let o2X = centerX + bondLength;
  let o2Y = centerY;

  if (isBending) {
    o1Y=centerY+asymOsc;
    o2Y=centerY+asymOsc;
    cY=centerY-asymOsc*.55;
  } else if (isSymmetric) {
    o1X = centerX - bondLength - symOsc;
    o2X = centerX + bondLength + symOsc;
  } else if (isAsymmetric) {
    o1X = centerX - bondLength + asymOsc;
    o2X = centerX + bondLength + asymOsc;
    cX = centerX - asymOsc * 0.55;
  }

  // Dynamic dipole vector
  const dipoleX = isAsymmetric ? (cX - centerX) * 4.4 : 0;

  // Oscillating Electric Field E(t)
  const eFieldPhase = isSymmetric ? (frame - 150) * 0.18 : (frame - 300) * 0.22;
  const eFieldVector = Math.cos(eFieldPhase) * 110;

  // Repeated Energy Pulses when E(t) aligns with μ(t)
  const isCouplingPulse = isAsymmetric && Math.cos(eFieldPhase) * Math.sin((frame - 300) * 0.22) < -0.6;
  // Opening-only resonant cue: force and velocity share a phase, so work is positive.
  // This is a slowed qualitative illustration; default legacy motion is preserved.
  const pulseIntensity = couplingStrength>0 ? .7*Math.pow(Math.cos(eFieldPhase),8)*couplingStrength : isCouplingPulse ? 0.7 : 0.0;
  const bondStroke = couplingStrength>0 ? interpolateColors(pulseIntensity,[0,.7],[PALETTE.grayContext,PALETTE.amberLight]) : minimal?PALETTE.grayContext:PALETTE.grayInactive;

  // Transition to continuous amber beam at end of Act 2 (540 - 600)
  const beamUncoilProgress = editorial ? 0 : interpolate(frame, [530, 595], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: editorial ? 'transparent' : PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= SECTION 1: MOVEMENT LIBRARY MONTAGE (0 - 150) ================= */}
        {frame < 150 && (
          <g>
            <circle cx={centerX} cy={centerY} r={28} fill="#141A24" stroke={PALETTE.grayContext} strokeWidth="2" />
            <circle
              cx={centerX - 130 + (montageModeIdx === 2 ? -montageOsc : montageOsc)}
              cy={centerY + (montageModeIdx === 1 ? montageOsc : 0)}
              r={24}
              fill="#0F141D"
              stroke={PALETTE.grayInactive}
              strokeWidth="2"
            />
            <circle
              cx={centerX + 130 + (montageModeIdx === 2 ? montageOsc : montageOsc)}
              cy={centerY + (montageModeIdx === 1 ? -montageOsc : 0)}
              r={24}
              fill="#0F141D"
              stroke={PALETTE.grayInactive}
              strokeWidth="2"
            />
            <line
              x1={centerX - 28}
              y1={centerY}
              x2={centerX - 106 + (montageModeIdx === 2 ? -montageOsc : montageOsc)}
              y2={centerY + (montageModeIdx === 1 ? montageOsc : 0)}
              stroke={PALETTE.grayInactive}
              strokeWidth="2.5"
            />
            <line
              x1={centerX + 28}
              y1={centerY}
              x2={centerX + 106 + (montageModeIdx === 2 ? montageOsc : montageOsc)}
              y2={centerY + (montageModeIdx === 1 ? -montageOsc : 0)}
              stroke={PALETTE.grayInactive}
              strokeWidth="2.5"
            />
          </g>
        )}

        {/* ================= SECTION 2 & 3: CO2 & FIELD INTERACTION (150 - 600) ================= */}
        {frame >= 150 && (
          <g opacity={1 - beamUncoilProgress * 0.9}>
            {motionGuides>0&&<g opacity={motionGuides}>
              {[centerX-bondLength,centerX,centerX+bondLength].map((x,i)=><circle key={i} cx={x} cy={centerY} r={i===1?24:28} fill="none" stroke={PALETTE.grayContext} strokeWidth="1.5" strokeDasharray="3 6" opacity=".4"/>)}
              {[[o1X,o1Y,centerX-bondLength],[o2X,o2Y,centerX+bondLength]].map(([x,y,restX],i)=>{
                const dx=x-restX,dy=y-centerY,length=Math.hypot(dx,dy);
                if(length<4)return null;
                const ux=dx/length,uy=dy/length,offsetX=isBending?-48:0,offsetY=isBending?0:58;
                const endX=x+offsetX,endY=y+offsetY;
                return <g key={i}>
                  <line x1={restX+offsetX} y1={centerY+offsetY} x2={endX} y2={endY} stroke={PALETTE.white} strokeWidth="2.5"/>
                  <path d={`M${endX-ux*7-uy*4} ${endY-uy*7+ux*4} L${endX} ${endY} L${endX-ux*7+uy*4} ${endY-uy*7-ux*4}`} stroke={PALETTE.white} strokeWidth="2" fill="none"/>
                </g>;
              })}
            </g>}
            {/* Restrained Energy Transfer Pulse */}
            {isAsymmetric && pulseIntensity > 0 && (
              <circle
                cx={centerX}
                cy={centerY}
                r={40 + pulseIntensity * 25}
                fill="none"
                stroke={PALETTE.amberLight}
                strokeWidth="2"
                opacity={pulseIntensity * 0.4}
              />
            )}

            {/* Molecule Context Label (Enlarged to 24px) */}
            <text x={centerX} y={centerY - 135} opacity={minimal ? 0 : 1} textAnchor="middle" fill={PALETTE.grayContext} fontSize="24" fontFamily={TYPOGRAPHY.sans} fontWeight="500" letterSpacing="0.04em">
              {editorial ? (frame >= 380 ? 'CO₂ · 同一分子的振动模式' : '') : `CO₂ ${isSymmetric ? '对称伸缩 (Symmetric)' : '不对称伸缩 (Asymmetric)'}`}
            </text>

            {/* Left C=O Double Bond */}
            <line x1={o1X + 28} y1={o1Y - 5} x2={cX - 26} y2={cY - 5} stroke={bondStroke} strokeWidth="3" strokeLinecap="round" />
            <line x1={o1X + 28} y1={o1Y + 5} x2={cX - 26} y2={cY + 5} stroke={bondStroke} strokeWidth="3" strokeLinecap="round" />

            {/* Right C=O Double Bond */}
            <line x1={cX + 26} y1={cY - 5} x2={o2X - 28} y2={o2Y - 5} stroke={bondStroke} strokeWidth="3" strokeLinecap="round" />
            <line x1={cX + 26} y1={cY + 5} x2={o2X - 28} y2={o2Y + 5} stroke={bondStroke} strokeWidth="3" strokeLinecap="round" />

            {/* Left Oxygen (Enlarged letter to 22px) */}
            <g transform={`translate(${o1X}, ${o1Y})`}>
              <circle r={28} fill="#141A24" stroke={minimal?PALETTE.white:PALETTE.grayContext} strokeWidth="2.5" />
              <text x="0" y="8" textAnchor="middle" fill={PALETTE.white} fontSize="22" fontFamily={TYPOGRAPHY.sans} fontWeight="bold">
                {minimal ? '' : 'O'}
              </text>
            </g>

            {/* Right Oxygen (Enlarged letter to 22px) */}
            <g transform={`translate(${o2X}, ${o2Y})`}>
              <circle r={28} fill="#141A24" stroke={minimal?PALETTE.white:PALETTE.grayContext} strokeWidth="2.5" />
              <text x="0" y="8" textAnchor="middle" fill={PALETTE.white} fontSize="22" fontFamily={TYPOGRAPHY.sans} fontWeight="bold">
                {minimal ? '' : 'O'}
              </text>
            </g>

            {/* Center Carbon (Enlarged letter to 20px) */}
            <g transform={`translate(${cX}, ${cY})`}>
              <circle r={24} fill="#0F141D" stroke={minimal?PALETTE.grayContext:PALETTE.grayInactive} strokeWidth="2.5" />
              <text x="0" y="7" textAnchor="middle" fill={PALETTE.white} fontSize="20" fontFamily={TYPOGRAPHY.sans} fontWeight="bold">
                {minimal ? '' : 'C'}
              </text>
            </g>

            {/* Dynamic Dipole Vector μ(t) (Enlarged to 22px) */}
            {!minimal && isAsymmetric && Math.abs(dipoleX) > 4 && (
              <g>
                <line x1={centerX} y1={centerY + 90} x2={centerX + dipoleX} y2={centerY + 90} stroke={PALETTE.cyanSignal} strokeWidth="3" strokeLinecap="round" />
                <circle cx={centerX + dipoleX} cy={centerY + 90} r={5} fill={PALETTE.cyanSignal} />
                <text x={centerX + dipoleX + (dipoleX > 0 ? 16 : -16)} y={centerY + 98} textAnchor={dipoleX > 0 ? 'start' : 'end'} fill={PALETTE.cyanSignal} fontSize="22" fontFamily={TYPOGRAPHY.mono} fontWeight="bold">
                  {editorial && frame < 410 ? '' : 'μ(t)'}
                </text>
              </g>
            )}

            {/* Oscillating Electric Field Vector E(t) (Enlarged to 22px) */}
            <g transform={`translate(${centerX}, ${centerY - 80})`} opacity={minimal ? couplingStrength : 1}>
              <line x1={0} y1={0} x2={eFieldVector} y2={0} stroke={PALETTE.amberLight} strokeWidth="3" strokeLinecap="round" />
              <polygon
                points={
                  eFieldVector >= 0
                    ? `${eFieldVector},-6 ${eFieldVector + 11},0 ${eFieldVector},6`
                    : `${eFieldVector},-6 ${eFieldVector - 11},0 ${eFieldVector},6`
                }
                fill={PALETTE.amberLight}
              />
              <text x={eFieldVector + (eFieldVector >= 0 ? 18 : -18)} y={7} textAnchor={eFieldVector >= 0 ? 'start' : 'end'} fill={PALETTE.amberLight} fontSize="22" fontFamily={TYPOGRAPHY.mono} fontWeight="bold">
                {minimal || (editorial && frame < 410) ? '' : 'E(t)'}
              </text>
            </g>
          </g>
        )}

        {/* Transition Beam Uncoiling into Act 3 */}
        {beamUncoilProgress > 0 && (
          <line
            x1={centerX - 100}
            y1={540}
            x2={centerX - 100 + beamUncoilProgress * 1100}
            y2={540}
            stroke={PALETTE.amberLight}
            strokeWidth="3.5"
            strokeLinecap="round"
          />
        )}
      </svg>

      {/* On-screen captions (Enlarged to 44px / 40px) */}
      {!editorial && frame < 150 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '230px', textAlign: 'center' }}>
          <div style={{ fontFamily: TYPOGRAPHY.sans, fontSize: '44px', fontWeight: 600, color: PALETTE.white, letterSpacing: '0.08em' }}>
            {currentMontageLabel}
          </div>
        </div>
      )}

      {!editorial && isSymmetric && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '210px', textAlign: 'center' }}>
          <div style={{ fontFamily: TYPOGRAPHY.mono, fontSize: '40px', fontWeight: 600, color: PALETTE.grayContext, letterSpacing: '0.04em' }}>
            Δμ = 0 (无动态偶极)
          </div>
        </div>
      )}

      {!editorial && isAsymmetric && frame < 530 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '210px', textAlign: 'center' }}>
          <div style={{ fontFamily: TYPOGRAPHY.mono, fontSize: '40px', fontWeight: 600, color: PALETTE.cyanSignal, letterSpacing: '0.04em' }}>
            Δμ ≠ 0 (偶极耦合 · 能量持续注入)
          </div>
        </div>
      )}
    </div>
  );
};
