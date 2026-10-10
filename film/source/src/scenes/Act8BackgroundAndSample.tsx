import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';
import { PALETTE, TYPOGRAPHY } from '../styles/visualSystem';

export const Act8BackgroundAndSample: React.FC<{explainer?:boolean}> = ({explainer=false}) => {
  const frame = useCurrentFrame();

  // Local frame in Act 8: 0 to 600 (20 seconds @ 30fps)
  const centerX = 960;

  // Shot 30: Two rows reveal
  const row1Opacity = interpolate(frame, [20, 60], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const row2Opacity = interpolate(frame, [90, 130], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Shot 31: Ratio Morphing (240 - 450)
  const ratioMorph = interpolate(frame, [260, 420], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ratioEqOpacity = interpolate(frame, [380, 420], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  // Spectral points calculation
  const n = 140;
  const bgPts: Array<{ x: number; y: number }> = [];
  const samplePts: Array<{ x: number; y: number }> = [];
  const transPts: Array<{ x: number; y: number }> = [];

  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const px = centerX - 500 + t * 1000;
    const nu = 4000 - t * 3600;

    const normNu = (nu - 2100) / 1100;
    const globar = Math.exp(-0.5 * normNu * normNu);
    const co2Atm = nu > 2300 && nu < 2400 ? 0.35 : 1.0;
    const bgVal = globar * co2Atm;
    const bgY = 520 - bgVal * 160;
    bgPts.push({ x: px, y: bgY });

    let trans = 0.95;
    if (Math.abs(nu - 1715) < 90) {
      trans = 0.14 + 0.81 * (1 - Math.exp(-Math.pow((nu - 1715) / 45, 2)));
    } else if (Math.abs(nu - 2960) < 100) {
      trans = 0.45 + 0.5 * (1 - Math.exp(-Math.pow((nu - 2960) / 60, 2)));
    }
    const sampleY = 520 - bgVal * trans * 160;
    samplePts.push({ x: px, y: sampleY });

    const tY = 420 + (1 - trans) * 220;
    transPts.push({ x: px, y: tY });
  }

  const bgCurveD = bgPts.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');

  const activeTransD = transPts
    .map((pt, idx) => {
      const startY = samplePts[idx].y;
      const targetY = pt.y;
      const py = startY * (1 - ratioMorph) + targetY * ratioMorph;
      return `${idx === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${py.toFixed(1)}`;
    })
    .join(' ');

  if(explainer){
    const reveal=(a:number,b:number)=>interpolate(frame,[a,b],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
    const path=(pts:Array<{x:number;y:number}>,p:number)=>pts.slice(0,Math.max(1,Math.floor(p*pts.length))).map((pt,i)=>`${i?'L':'M'} ${pt.x} ${pt.y}`).join(' ');
    const selectedIndex=Math.round((4000-1715)/3600*n),selectedX=bgPts[selectedIndex].x;
    const compare=reveal(175,225)*(1-ratioMorph);
    return <div style={{position:'absolute',inset:0,background:PALETTE.bgVoid}}><svg width="1920" height="1080">
      <line x1="460" x2="1460" y1="520" y2="520" stroke={PALETTE.grayInactive} strokeWidth="1.5" opacity={1-ratioMorph}/>
      <g opacity={1-ratioMorph}>
        <path d={path(bgPts,reveal(20,80))} fill="none" stroke={PALETTE.amberLight} strokeWidth="4"/>
        <path d={path(samplePts,reveal(90,170))} fill="none" stroke={PALETTE.cyanSignal} strokeWidth="4"/>
        <text x="460" y="270" fill={PALETTE.amberLight} fontSize="30" fontFamily={TYPOGRAPHY.sans} opacity={row1Opacity}>背景 B</text>
        <text x="460" y="320" fill={PALETTE.cyanSignal} fontSize="30" fontFamily={TYPOGRAPHY.sans} opacity={row2Opacity}>样品 S</text>
      </g>
      <g opacity={compare}>
        <line x1={selectedX} x2={selectedX} y1="520" y2={bgPts[selectedIndex].y} stroke={PALETTE.amberLight} strokeWidth="2" strokeDasharray="5 7"/>
        <circle cx={selectedX} cy={bgPts[selectedIndex].y} r="7" fill={PALETTE.amberLight}/>
        <circle cx={selectedX} cy={samplePts[selectedIndex].y} r="7" fill={PALETTE.cyanSignal}/>
      </g>
      {frame>=260&&<path d={activeTransD} fill="none" stroke={PALETTE.cyanSignal} strokeWidth="4"/>}
      <g opacity={ratioMorph}>
        <line x1="460" x2="1460" y1="420" y2="420" stroke={PALETTE.grayContext} strokeWidth="1.5" strokeDasharray="5 7"/>
        <text x="390" y="426" fill={PALETTE.white} fontSize="26" fontFamily={TYPOGRAPHY.sans}>100% T</text>
        <line x1="460" x2="1460" y1="700" y2="700" stroke={PALETTE.grayInactive} strokeWidth="1.5"/>
        <text x="460" y="740" fill={PALETTE.grayContext} fontSize="24" fontFamily={TYPOGRAPHY.sans}>4000 cm⁻¹</text>
        <text x="1460" y="740" textAnchor="end" fill={PALETTE.grayContext} fontSize="24" fontFamily={TYPOGRAPHY.sans}>400 cm⁻¹</text>
      </g>
      <text x="960" y="200" textAnchor="middle" fill={PALETTE.white} fontSize="42" fontFamily={TYPOGRAPHY.sans} opacity={ratioEqOpacity}>T = S / B</text>
    </svg></div>;
  }

  return (
    <div style={{ position: 'absolute', inset: 0, backgroundColor: PALETTE.bgVoid, overflow: 'hidden' }}>
      <svg width="1920" height="1080" style={{ position: 'absolute', inset: 0 }}>
        {/* ================= SHOT 30: TWO SEQUENTIAL ROWS (0 - 240) ================= */}
        {frame < 260 && (
          <g>
            {/* Row 1: Background Measurement */}
            <g transform="translate(0, 320)" opacity={row1Opacity}>
              <text x={340} y={10} fill={PALETTE.grayContext} fontSize="26" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
                I_B(δ) [背景干涉图]
              </text>
              <line x1={600} y1={0} x2={740} y2={0} stroke={PALETTE.grayInactive} strokeWidth="2" strokeDasharray="4 4" />
              <text x={670} y={-14} textAnchor="middle" fill={PALETTE.white} fontSize="18" fontFamily={TYPOGRAPHY.mono} fontWeight="bold">
                FT
              </text>
              <text x={780} y={10} fill={PALETTE.amberLight} fontSize="28" fontFamily={TYPOGRAPHY.mono} fontWeight="bold">
                B(ν̃) [背景单光束]
              </text>
            </g>

            {/* Row 2: Sample Measurement */}
            <g transform="translate(0, 480)" opacity={row2Opacity}>
              <text x={340} y={10} fill={PALETTE.cyanSignal} fontSize="26" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
                I_S(δ) [样品干涉图]
              </text>
              <line x1={600} y1={0} x2={740} y2={0} stroke={PALETTE.grayInactive} strokeWidth="2" strokeDasharray="4 4" />
              <text x={670} y={-14} textAnchor="middle" fill={PALETTE.white} fontSize="18" fontFamily={TYPOGRAPHY.mono} fontWeight="bold">
                FT
              </text>
              <text x={780} y={10} fill={PALETTE.cyanSignal} fontSize="28" fontFamily={TYPOGRAPHY.mono} fontWeight="bold">
                S(ν̃) [样品单光束]
              </text>
            </g>
          </g>
        )}

        {/* ================= SHOT 31: SPECTRA ALIGN & RATIO T = S / B (240 - 600) ================= */}
        {frame >= 240 && (
          <g>
            {/* Background Spectrum Curve */}
            {ratioMorph < 0.95 && (
              <path d={bgCurveD} fill="none" stroke={PALETTE.amberLight} strokeWidth="2" opacity={(1 - ratioMorph) * 0.7} />
            )}

            {/* Active Morphing Sample Curve into Transmittance */}
            <path d={activeTransD} fill="none" stroke={PALETTE.cyanSignal} strokeWidth="3" />

            {/* 100% Baseline Line */}
            {ratioMorph > 0.4 && (
              <g opacity={ratioMorph}>
                <line x1={centerX - 500} y1={420} x2={centerX + 500} y2={420} stroke={PALETTE.grayInactive} strokeWidth="1.5" strokeDasharray="4 4" />
                <text x={centerX - 570} y={426} fill={PALETTE.white} fontSize="22" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
                  100% T
                </text>
                <text x={centerX - 555} y={646} fill={PALETTE.grayContext} fontSize="22" fontFamily={TYPOGRAPHY.mono}>
                  0% T
                </text>
              </g>
            )}

            {/* Wavenumber Axis Scale */}
            <g opacity={ratioMorph}>
              <line x1={centerX - 500} y1={680} x2={centerX + 500} y2={680} stroke={PALETTE.grayInactive} strokeWidth="2" />
              <text x={centerX - 500} y={715} fill={PALETTE.grayContext} fontSize="22" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
                4000 cm⁻¹
              </text>
              <text x={centerX + 500} y={715} textAnchor="end" fill={PALETTE.grayContext} fontSize="22" fontFamily={TYPOGRAPHY.mono} fontWeight="500">
                400 cm⁻¹
              </text>
              <text x={centerX} y={715} textAnchor="middle" fill={PALETTE.white} fontSize="24" fontFamily={TYPOGRAPHY.sans} fontWeight="500">
                波数 Wavenumber [cm⁻¹]
              </text>
            </g>
          </g>
        )}
      </svg>

      {/* On-screen: T = S / B (Enlarged to 50px) */}
      {ratioEqOpacity > 0 && (
        <div style={{ position: 'absolute', left: 0, right: 0, top: '150px', textAlign: 'center', opacity: ratioEqOpacity }}>
          <div style={{ fontFamily: TYPOGRAPHY.mono, fontSize: '50px', fontWeight: 600, color: PALETTE.white, letterSpacing: '0.04em' }}>
            T(ν̃) = S(ν̃) / B(ν̃)
          </div>
        </div>
      )}
    </div>
  );
};
