import fs from 'node:fs';
const parseTime=v=>{const[h,m,s]=v.replace(',','.').split(':').map(Number);return h*3600+m*60+s;};
const source=fs.readFileSync('docs/narration_draft.srt','utf8').trim().split(/\r?\n\r?\n/).map(block=>{const lines=block.split(/\r?\n/),[start,end]=lines[1].split(' --> ').map(parseTime);return{start,end,zh:lines.slice(2).join('\n')};});
const english=JSON.parse(fs.readFileSync('docs/narration_en.json','utf8'));
if(english.length!==source.length)throw new Error('Translation count mismatch');
const batchEnd=171,fullEnd=360,provisionalEnd=381.6;
const tailTime=t=>t<=batchEnd?t:batchEnd+(t-batchEnd)*(fullEnd-batchEnd)/(provisionalEnd-batchEnd);
const cues=source.map((c,i)=>({startFrame:Math.round(tailTime(c.start)*30),endFrame:Math.round(tailTime(c.end)*30),zh:c.zh,en:english[i]}));
for(let i=0;i<cues.length;i++)if(!cues[i].en||(i&&cues[i].startFrame<cues[i-1].endFrame)||cues[i].endFrame>10800)throw new Error(`Invalid cue ${i+1}`);
const q=v=>Math.round(tailTime(v)*30);
const tail=[
 {id:'sample',startFrame:q(171),endFrame:q(190.8),scene:'narrative',anchors:[[171,2340],[174.1,2400],[182.4,2500],[187,2550],[190.8,2580]]},
 {id:'record',startFrame:q(190.8),endFrame:q(223.3),scene:'narrative',anchors:[[190.8,2580],[193.6,2640],[201.9,3119],[208.2,3120],[214,3270],[221.3,3419],[223.3,3419]]},
 {id:'fourier',startFrame:q(223.3),endFrame:q(310.6),scene:'fourier',anchors:[[223.3,0],[227.6,150],[229.7,270],[233.5,360],[239.8,390],[248.2,610],[248.8,660],[251.7,780],[255.7,810],[270.8,1030],[278.7,1140],[282.2,1260],[285.2,1280],[292,2160],[296,2340],[299,2400],[310.6,2579]]},
 {id:'background',startFrame:q(310.6),endFrame:q(334.5),scene:'background',anchors:[[310.6,0],[313.7,75],[315.7,130],[319,180],[324.7,240],[326.7,260],[330.5,420],[334.5,599]]},
 {id:'absorbance',startFrame:q(334.5),endFrame:q(348.2),scene:'absorbance',anchors:[[334.5,0],[342.5,180],[345.1,300],[348.2,410]]},
 {id:'chemistry',startFrame:q(348.2),endFrame:q(371.5),scene:'chemistry',anchors:[[348.2,0],[350.2,180],[353.3,240],[355.3,480],[359.8,560],[368.5,659],[371.5,659]]},
 {id:'epilogue',startFrame:q(371.5),endFrame:10800,scene:'epilogue',anchors:[[371.5,0],[381.6,359]]},
].map(section=>({...section,anchors:section.anchors.map(([t,f])=>[q(t)-section.startFrame,f])}));
// Picture-driven OPD alignment hold and component merge in the current six-minute edit.
// Keep these anchors when regenerating the bilingual assembly from provisional narration.
tail.find(section=>section.id==='record').anchors=[
 [0,2580],[75,2640],[187,2880],[225,2880],[299,3119],
 [379,3160],[469,3180],[625,3270],[821,3419],[875,3419],
];
fs.writeFileSync('src/timeline/fullPreviewTimeline.ts',`/** Six-minute assembly requested by user. Later cinematic assets reused; no quality-gate PASS implied. */\nexport const FULL_PREVIEW_CONFIG={fps:30,width:1920,height:1080,totalFrames:10800} as const;\nexport const FULL_SUBTITLE_CUES=${JSON.stringify(cues,null,2)};\nexport const FULL_TAIL_SECTIONS=${JSON.stringify(tail,null,2)};\n`);
const stamp=f=>{const ms=Math.round(f/30*1000);return`${String(Math.floor(ms/3600000)).padStart(2,'0')}:${String(Math.floor(ms/60000)%60).padStart(2,'0')}:${String(Math.floor(ms/1000)%60).padStart(2,'0')},${String(ms%1000).padStart(3,'0')}`;};
fs.writeFileSync('docs/full-preview-bilingual.srt',cues.map((c,i)=>`${i+1}\n${stamp(c.startFrame)} --> ${stamp(c.endFrame)}\n${c.zh}\n${c.en}`).join('\n\n')+'\n');
console.log(`Full preview: 360s, ${cues.length} bilingual cues, existing tail assets remapped to ${360-batchEnd}s.`);
