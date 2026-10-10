import React from 'react';
import {Audio,Freeze,interpolate,Sequence,staticFile,useCurrentFrame} from 'remotion';
import {CinematicOpeningReconstruction} from '../scenes/CinematicOpeningReconstruction';
import {NarrativeVerticalSlice} from '../scenes/NarrativeVerticalSlice';
import {Act7FourierTransform} from '../scenes/Act7FourierTransform';
import {Act8BackgroundAndSample} from '../scenes/Act8BackgroundAndSample';
import {Act9SpectrumInterpretation} from '../scenes/Act9SpectrumInterpretation';
import {Act10Epilogue} from '../scenes/Act10Epilogue';
import {NARRATIVE_SAMPLE_RECORD} from '../math/narrativeTeaching';
import {SubtitleOverlay} from '../components/cinematic/SubtitleOverlay';
import {FULL_SUBTITLE_CUES,FULL_TAIL_SECTIONS} from '../timeline/fullPreviewTimeline';
import {PALETTE as P,TYPOGRAPHY} from '../styles/visualSystem';

/** Same illustrative T as the legacy background/sample scene; A is computed from T. */
const AbsorbanceBridge:React.FC=()=>{
 const frame=useCurrentFrame();
 const p=interpolate(frame,[180,300],[0,1],{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const d=Array.from({length:141},(_,i)=>{const u=i/140,nu=4000-u*3600;
  let trans=.95;
  if(Math.abs(nu-1715)<90)trans=.14+.81*(1-Math.exp(-Math.pow((nu-1715)/45,2)));
  else if(Math.abs(nu-2960)<100)trans=.45+.5*(1-Math.exp(-Math.pow((nu-2960)/60,2)));
  const a=-Math.log10(trans),y=(420+(1-trans)*220)*(1-p)+(650-a*270)*p;
  return `${i?'L':'M'} ${460+1000*u} ${y}`;
 }).join(' ');
 return <div style={{position:'absolute',inset:0,background:P.bgVoid}}><svg width="1920" height="1080">
  <path d={d} fill="none" stroke={P.cyanSignal} strokeWidth="3.5"/>
  <line x1="460" x2="1460" y1={420*(1-p)+650*p} y2={420*(1-p)+650*p} stroke={P.grayInactive} strokeDasharray="4 4"/>
  <text x="390" y={426*(1-p)+656*p} fill={P.white} fontSize="26" fontFamily={TYPOGRAPHY.sans}>{p>.5?'0 A':'100% T'}</text>
  <line x1="460" x2="1460" y1="700" y2="700" stroke={P.grayInactive}/>
  <text x="460" y="740" fill={P.grayContext} fontSize="24" fontFamily={TYPOGRAPHY.sans}>4000 cm⁻¹</text>
  <text x="1460" y="740" textAnchor="end" fill={P.grayContext} fontSize="24" fontFamily={TYPOGRAPHY.sans}>400 cm⁻¹</text>
  {p>.9&&<text x="960" y="200" textAnchor="middle" fill={P.white} fontSize="42" fontFamily={TYPOGRAPHY.sans}>A = −log₁₀(T)</text>}
 </svg></div>;
};

type TailSection=(typeof FULL_TAIL_SECTIONS)[number];
const ReusedTail:React.FC<{section:TailSection}>=({section})=>{
 const local=useCurrentFrame();
 const legacyFrame=interpolate(local,section.anchors.map(a=>a[0]),section.anchors.map(a=>a[1]),{extrapolateLeft:'clamp',extrapolateRight:'clamp'});
 const scene=section.scene==='narrative'?<NarrativeVerticalSlice presentation/>:
  section.scene==='fourier'?<Act7FourierTransform teachingRecord={NARRATIVE_SAMPLE_RECORD} showAmplitudeDemo={false} explainer/>:
  section.scene==='background'?<Act8BackgroundAndSample explainer/>:
  section.scene==='absorbance'?<AbsorbanceBridge/>:
  section.scene==='chemistry'?<Act9SpectrumInterpretation absorbance/>:<Act10Epilogue/>;
 return <><Freeze frame={legacyFrame}>{scene}</Freeze>
  {section.id==='background'&&local<75&&<div style={{position:'absolute',top:130,width:'100%',textAlign:'center',fontFamily:TYPOGRAPHY.sans,fontSize:28,color:P.grayContext}}>切换到连续光谱示意 · Continuous-spectrum illustration</div>}
 </>;
};

export const FTIRFullPreview:React.FC=()=> <div style={{position:'absolute',inset:0,background:P.bgVoid,overflow:'hidden'}}>
 <Sequence durationInFrames={5130}><CinematicOpeningReconstruction/></Sequence>
 {FULL_TAIL_SECTIONS.map(section=><Sequence key={section.id} from={section.startFrame} durationInFrames={section.endFrame-section.startFrame}><ReusedTail section={section}/></Sequence>)}
 <SubtitleOverlay cues={FULL_SUBTITLE_CUES} englishSize={26}/>
 <Audio src={staticFile('audio/music/ftir-preview-continuous.m4a')}/>
</div>;
