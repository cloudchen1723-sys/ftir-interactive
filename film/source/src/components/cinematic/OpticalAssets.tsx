import React from 'react';
import {PALETTE as P,TYPOGRAPHY} from '../../styles/visualSystem';
type Position={x:number;y:number;opacity?:number;label?:boolean};
/** Original Act4 optical glyphs, shared without changing their geometry. */
export const IRSource:React.FC<Position>=({x,y,opacity=1,label=true})=><g opacity={opacity}>
 <circle cx={x} cy={y} r="21" fill="#141A24" stroke={P.amberLight} strokeWidth="2"/><circle cx={x} cy={y} r="7" fill={P.amberLight}/>
 {label&&<text x={x} y={y+53} textAnchor="middle" fontSize="22" fill={P.grayContext} fontFamily={TYPOGRAPHY.sans}>红外光源</text>}
</g>;
export const Beamsplitter:React.FC<Position>=({x,y,opacity=1,label=true})=><g opacity={opacity}>
 <g transform={`translate(${x},${y}) rotate(-45)`}><rect x="-48" y="-7" width="96" height="14" rx="2" fill="#121824" stroke={P.grayInactive} strokeWidth="1.5"/><line x1="-45" y1="0" x2="45" y2="0" stroke={P.white} strokeWidth="3"/></g>
 {label&&<text x={x+68} y={y-42} fontSize="19" fill={P.grayContext} fontFamily={TYPOGRAPHY.sans}>分束器</text>}
</g>;
export const FixedMirror:React.FC<Position>=({x,y,opacity=1,label=true})=><g transform={`translate(${x},${y})`} opacity={opacity}>
 <rect x="-52" y="-8" width="104" height="16" fill="#121824" stroke={P.grayInactive} strokeWidth="1.5"/><line x1="-50" y1="8" x2="50" y2="8" stroke={P.white} strokeWidth="3"/>
 {label&&<text x="0" y="-22" textAnchor="middle" fontSize="22" fill={P.white} fontFamily={TYPOGRAPHY.sans}>固定镜</text>}
</g>;
export const MovingMirror:React.FC<Position>=({x,y,opacity=1,label=true})=><g transform={`translate(${x},${y})`} opacity={opacity}>
 <rect x="-8" y="-52" width="16" height="104" fill="#121824" stroke={P.grayInactive} strokeWidth="1.5"/><line x1="-8" y1="-50" x2="-8" y2="50" stroke={P.white} strokeWidth="3"/>
 {label&&<text x="22" y="-24" fontSize="22" fill={P.white} fontFamily={TYPOGRAPHY.sans}>移动镜</text>}
</g>;
export const Detector:React.FC<Position>=({x,y,opacity=1,label=true})=><g transform={`translate(${x},${y})`} opacity={opacity}>
 <rect x="-36" y="-8" width="72" height="22" rx="2" fill="#121824" stroke={P.grayInactive} strokeWidth="1.5"/><rect x="-20" y="-12" width="40" height="5" fill={P.cyanSignal}/>
 {label&&<text x="0" y="43" textAnchor="middle" fontSize="19" fill={P.grayContext} fontFamily={TYPOGRAPHY.mono}>探测器</text>}
</g>;
/** Original Act3 sample cell. */
export const SampleCell:React.FC<Position>=({x,y,opacity=1,label=true})=><g transform={`translate(${x},${y})`} opacity={opacity}>
 <rect x="-14" y="-48" width="28" height="96" rx="2" fill="rgba(125,136,152,0.08)" stroke={P.grayContext} strokeWidth="2"/>
 {label&&<text x="63" y="9" fill={P.white} fontSize="23" fontFamily={TYPOGRAPHY.sans}>样品</text>}
</g>;
