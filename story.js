/* Guided learning layer. Reuses physics.js records; never substitutes a painted spectrum for a transform. */
(function(){
  'use strict';
  const P=window.FTIRPhysics,M=window.FTIRStoryModel;
  let saved=null;
  window.resetFTIRStory=()=>{saved=null;};
  window.mountFTIRStory=function(host,{chart,go}){
    const s=saved||(saved={step:0,chapter:0,asym:false,q:25,molecularStage:0,energyState:0,detectorAlt:false,encoded:false,signalView:false,x:0,wn:1000,moved:false,count:1,discovered:false,candidate:1000,found:[],fourierView:0,measureStage:0,probe:1715,abs:false,band:0,challenge:false,scene03Stage:0,scene04Stage:0,scene04X:0,scene04Wn:1000,scene05Count:1,scene05Discovered:false,presentationRecord:null,presentationRecordId:null,presentationProvenance:''});
    const colors=['#edbd7e','#89b4ef','#d29aa5'];
    let instrument=null,resizeTimer=0,dead=false,autoTimer=null,n3=null,n3EntryStep=0,pass1=null;
    const deckEvents=new AbortController();
    const q=id=>host.querySelector('.story-deck.visible #'+id)||host.querySelector('#'+id),on=(id,event,fn)=>q(id)?.addEventListener(event,fn);
    const chapters=[
      {name:'Chapter 01',title:'分子为什么选择性吸收红外？',scenes:[0,1]},
      {name:'Chapter 02',title:'FTIR 如何把波数编码进 Interferogram？',scenes:[2,3,4]},
      {name:'Chapter 03',title:'Interferogram 如何成为可解释的吸收光谱？',scenes:[5,6,7,8]}
    ];
    const sceneMeta=[
      ['01','为什么有些振动能吸收红外？'],['02','探测器为什么不能直接给出光谱？'],
      ['03','Michelson 干涉仪改变了什么？'],['04','一个波数如何被编码？'],['05','多个波数怎样成为一条 Interferogram？'],
      ['06','怎样从 Interferogram 找回波数？'],['07','为什么需要 Background / Sample？'],['08','最终光谱能告诉我们什么？'],['09','完成 FTIR 主线闭环']
    ];
    const titles=sceneMeta.map(x=>x[1]);
    const nextNames=['先观察两种振动','看看探测器遇到的难题','进入 Michelson','让一个波数留下节奏','叠加更多波数','从干涉图找回波数','继续追问测到的是什么','完成闭环','重新开始 N1'];
    const note=t=>`<p class="story-note">${t}</p>`;
    const science=(t,link='')=>`<details class="story-science"><summary>深入原理与模型边界</summary>${t}${link}</details>`;
    const plot=(id,series,opts={})=>chart(id,series,{height:310,...opts});
    const section=t=>`<div class="story-evidence">${t}</div>`;
    let wheelLock=false,touchX=null,touchY=null,chromeTimer=0;
    function goScene(delta){if(n3)return;if(delta<0&&s.step===5&&s.fourierView>0){s.fourierView--;draw();return;}if(delta<0&&s.step===6&&s.measureStage>0){s.measureStage--;draw();return;}const target=Math.max(0,Math.min(8,s.step+delta));if(target!==s.step)visit(target,delta<0&&s.step===4?5:0);wakeChrome();}
    function wakeChrome(){const deck=host.querySelector('.story-deck.visible');if(!deck)return;deck.classList.add('chrome-visible');clearTimeout(chromeTimer);chromeTimer=setTimeout(()=>deck.classList.remove('chrome-visible'),2600);}
    function bindDeckInput(){
      if(host.dataset.deckBound)return;host.dataset.deckBound='true';
      const listen=(target,event,fn,options={})=>target.addEventListener(event,fn,{...options,signal:deckEvents.signal});
      listen(host,'click',e=>{if(n3||pass1)return;const b=e.target.closest('[data-story-step],[data-chapter]');if(b)return;if(e.target.closest('button,input,a,details,summary'))return;const rect=host.getBoundingClientRect();goScene(e.clientX<rect.left+rect.width/2?-1:1);});
      listen(host,'wheel',e=>{if(n3||pass1||wheelLock||Math.abs(e.deltaY)<18||e.target.closest('input,details'))return;wheelLock=true;goScene(e.deltaY>0?1:-1);setTimeout(()=>wheelLock=false,520);},{passive:true});
      listen(host,'touchstart',e=>{if(n3||pass1)return;const t=e.changedTouches[0];touchX=t.clientX;touchY=t.clientY;},{passive:true});
      listen(host,'touchend',e=>{if(n3||pass1||touchX===null)return;const t=e.changedTouches[0],dx=t.clientX-touchX,dy=t.clientY-touchY;if(Math.abs(dx)>50&&Math.abs(dx)>Math.abs(dy))goScene(dx<0?1:-1);touchX=touchY=null;},{passive:true});
      listen(document,'keydown',e=>{if(n3||pass1||dead)return;if(e.target.matches('input,textarea,[contenteditable=true]'))return;if(!host.closest('body')||document.body.dataset.view!=='story')return;if(['ArrowRight','PageDown',' '].includes(e.key)){e.preventDefault();q('storyNext')?.click();}else if(['ArrowLeft','PageUp'].includes(e.key)){e.preventDefault();goScene(-1);}else if(e.key.toLowerCase()==='r'){e.preventDefault();q('storyReplay')?.click();}else if(e.key.toLowerCase()==='a'){e.preventDefault();q('storyAuto')?.click();}});
      listen(window,'mousemove',()=>{if(!n3)wakeChrome();});listen(window,'keydown',()=>{if(!n3)wakeChrome();});
    }
    function feedback(text){q('storyFinding').textContent=text;}
    function ensureRecords(){if(!s.bg){s.bg=P.measure('background');s.sample=P.measure('sample');s.b=P.transform(s.bg);s.a=P.transform(s.sample);s.r=P.ratio(s.a,s.b);}}
    function currentRecord(){if(s.presentationRecord)return s.presentationRecord;if(!s.record)s.record=P.lineRecord(M.lines.slice(0,s.count));return s.record;}
    function draw(){
      pass1?.dispose();pass1=null;
      n3?.dispose();n3=null;
      if((s.step===0||s.step===1)&&window.FTIRPass1){
        delete host.dataset.n3Active;
        pass1=window.FTIRPass1.mount(host,{scene:s.step,onNext:()=>visit(Math.min(8,s.step+1)),onBack:()=>visit(Math.max(0,s.step-1))});
        return;
      }
      if(s.step===2&&window.FTIRPresentationInstrumentBridge){
        instrument?.dispose();instrument=null;clearInterval(autoTimer);autoTimer=null;
        delete host.dataset.n3Active;
        n3=window.FTIRPresentationInstrumentBridge.mount(host,{onNext:handoff=>{if(handoff?.record)s.presentationRecord=handoff.record;if(handoff?.recordId)s.presentationRecordId=handoff.recordId;if(handoff?.provenance)s.presentationProvenance=handoff.provenance;visit(5);},onBack:()=>visit(1)});
        return;
      }
      if((s.step===3||s.step===4)&&window.FTIRPresentationOptics){
        instrument?.dispose();instrument=null;clearInterval(autoTimer);autoTimer=null;
        delete host.dataset.n3Active;
        n3=window.FTIRPresentationOptics.mount(host,{startN4:s.step===4,onNext:handoff=>{if(handoff?.record)s.presentationRecord=handoff.record;if(handoff?.recordId)s.presentationRecordId=handoff.recordId;if(handoff?.provenance)s.presentationProvenance=handoff.provenance;visit(5);},onBack:()=>visit(s.step===4?3:1)});
        return;
      }
      if(s.step===2||s.step===3){
        instrument?.dispose();instrument=null;clearInterval(autoTimer);autoTimer=null;
        host.dataset.n3Active='true';
        n3=window.FTIRN3.mount(host,{initialStep:n3EntryStep,onExit:direction=>visit(direction<0?1:4)});
        return;
      }
      delete host.dataset.n3Active;
      const focused=host.contains(document.activeElement)?document.activeElement:null;
      const focusId=focused?.id;
      instrument?.dispose();instrument=null;
      const chapterNav=chapters.map((c,i)=>`<button class="story-chapter" data-chapter="${i}" aria-current="${s.chapter===i?'true':'false'}"><span>${c.name}</span>${c.title}</button>`).join('');
      const sceneNav=chapters[s.chapter].scenes.map(i=>`<button data-story-step="${i}" ${s.step===i?'aria-current="step"':''}><span>${sceneMeta[i][0]}</span>${sceneMeta[i][1]}</button>`).join('');
      host.innerHTML=`<div class="story-deck scene-${String(s.step+1).padStart(2,'0')} active visible"><div class="story-deck-progress"><span>${chapters[s.chapter].name}</span><i></i><b>${String(s.step+1).padStart(2,'0')} / 09</b></div><nav class="story-chapters" aria-label="教学章节">${chapterNav}</nav><nav class="story-steps" aria-label="本章场景">${sceneNav}</nav><header class="story-heading"><p>${chapters[s.chapter].title}</p><h1 tabindex="-1" id="storyTitle">${titles[s.step]}</h1></header><div class="story-scene-frame active visible" id="storyScene"></div><p id="storyFinding" class="story-finding" role="status" aria-live="polite"></p><div id="storyDeep"></div><nav class="story-next" aria-label="学习进度"><button id="storyPrev" ${s.step===0?'disabled':''}>上一步</button><button id="storyReplay" class="story-replay">重播</button><button id="storyAuto" class="story-auto">自动播放</button><button class="primary" id="storyNext">${nextNames[s.step]} →</button></nav><div class="story-deck-hint">Space / → · R 重播 · A 自动</div></div>`;
      const currentDeck=host.querySelector('.story-deck.visible');
      currentDeck.querySelectorAll('[data-chapter]').forEach(b=>b.addEventListener('click',()=>{s.chapter=Number(b.dataset.chapter);visit(chapters[s.chapter].scenes[0]);}));
      currentDeck.querySelectorAll('[data-story-step]').forEach(b=>b.addEventListener('click',()=>visit(Number(b.dataset.storyStep))));
      function advanceStory(){
        if(s.step===0&&s.molecularStage<2){s.molecularStage++;draw();}
        else if(s.step===1&&!s.detectorAlt){s.detectorAlt=true;draw();}
        else if(s.step===2&&s.scene03Stage<3){s.scene03Stage++;draw();}
        else if(s.step===3&&s.scene04Stage<2){s.scene04Stage++;draw();}
        else if(s.step===4&&s.scene05Count<4){s.scene05Count++;draw();}
        else if(s.step===4&&!s.scene05Discovered){s.scene05Discovered=true;draw();}
        else if(s.step===5&&s.fourierView<2){s.fourierView++;draw();}
        else if(s.step===6&&s.measureStage<3){s.measureStage++;draw();}
        else if(s.step===8){restartIntro();}
        else visit(Math.min(8,s.step+1));
        q('storyTitle')?.focus({preventScroll:true});host.scrollIntoView({block:'start',behavior:'instant'});
      }
      on('storyNext','click',advanceStory);on('storyPrev','click',()=>{if(s.step===5&&s.fourierView>0){s.fourierView--;draw();}else if(s.step===6&&s.measureStage>0){s.measureStage--;draw();}else visit(s.step-1,s.step===4?5:0);});
      on('storyReplay','click',()=>{stopAuto();if(s.step===2)s.scene03Stage=0;if(s.step===3){s.scene04Stage=0;s.scene04X=0;}if(s.step===5)s.fourierView=0;if(s.step===6){s.measureStage=0;s.abs=false;}draw();q('storyTitle').focus({preventScroll:true});});
      on('storyAuto','click',()=>{if(autoTimer)stopAuto();else startAuto();});
      function startAuto(){const b=q('storyAuto');if(!b)return;b.textContent='暂停自动';autoTimer=setInterval(()=>{if(!dead)advanceStory();},2600);}
      function stopAuto(){clearInterval(autoTimer);autoTimer=null;q('storyAuto')&&(q('storyAuto').textContent='自动播放');}
      [molecularChapter,detectorChapter,michelsonScene,singleWavenumberScene,interferogramScene,fourier,reference,meaning,closure][s.step]();
      if(s.step===0&&s.molecularStage<2)q('storyNext').textContent=s.molecularStage===0?'比较偶极变化 →':'加入频率匹配 →';
      if(s.step===1)q('storyNext').textContent=s.detectorAlt?'进入 Michelson 干涉仪 →':'换一种组成 →';
      if(s.step===2&&s.scene03Stage<3)q('storyNext').textContent=['观察 Michelson →','显示移动镜变化 →','聚焦光程差 →'][s.scene03Stage];
      if(s.step===3&&s.scene04Stage<2)q('storyNext').textContent=s.scene04Stage===0?'观察探测器响应 →':'比较 1000 / 3000 cm⁻¹ →';
      if(s.step===4&&s.scene05Count<4)q('storyNext').textContent=['','加入第二个波数 →','加入第三个波数 →','扩展到宽带 →'][s.scene05Count];
      if(s.step===4&&s.scene05Count===4&&!s.scene05Discovered)q('storyNext').textContent='揭示 ZPD / centerburst →';
      /* Chapter 02 owns its own progressive reveal states. */
      if(s.step===6&&s.measureStage<3)q('storyNext').textContent=['加入样品 →','计算透射率 T →','转换为吸光度 A →'][s.measureStage];
      if(s.step===8)q('storyNext').textContent='回到开场 →';
      if(focusId)q(focusId)?.focus({preventScroll:true});
    }
    function restartIntro(){s.step=0;s.chapter=0;s.asym=false;s.q=25;s.molecularStage=0;s.detectorAlt=false;s.fourierView=0;s.measureStage=0;s.abs=false;s.band=0;s.challenge=false;s.scene03Stage=0;s.scene04Stage=0;s.scene04X=0;s.scene04Wn=1000;s.presentationRecord=null;s.presentationRecordId=null;s.presentationProvenance='';clearInterval(autoTimer);autoTimer=null;draw();q('storyTitle')?.focus({preventScroll:true});host.scrollIntoView({block:'start',behavior:'instant'});}
    function visit(i,entryStep=0){clearInterval(autoTimer);autoTimer=null;const next=Math.max(0,Math.min(8,i));n3EntryStep=entryStep;s.step=next;s.chapter=next<2?0:next<5?1:2;if(next===2)s.scene03Stage=0;if(next===3){s.scene04Stage=0;s.scene04X=0;}if(next===4){s.scene05Count=1;s.scene05Discovered=false;}draw();q('storyTitle')?.focus({preventScroll:true});host.scrollIntoView({block:'start',behavior:'instant'});}
    function purpose(){
      ensureRecords();
      if(!s.otherRatio){const other=P.densityRecord(w=>P.response(w)*P.transmission(w+220));s.otherRatio=P.ratio(P.transform(other),s.b);}
      q('storyScene').innerHTML='<p class="story-lead">想知道它是什么、有哪些官能团或结构线索，可以观察它怎样吸收红外光。</p>'+section(`<div class="story-purpose"><div><div class="specimen" aria-hidden="true"><span></span></div><button id="purposeSample">${s.introSample?'取出样品':'放入样品'}</button><button id="compareSample" class="text-button" hidden>换一个样品</button></div><div><div id="purposeChart"></div>${note('合成示例 · 不用于物质鉴定')}</div></div>`);
      function update(){
        const r=s.otherSample?s.otherRatio:s.r;
        plot('purposeChart',[{xs:r.wn,ys:s.introSample?r.t:r.wn.map(()=>1)}],{x0:4000,x1:400,y0:0,y1:1.05,xlabel:'波数 / cm⁻¹',ylabel:'透过的比例',title:'不同示意样品留下不同的吸收特征'});
        q('purposeSample').textContent=s.introSample?'取出样品':'放入样品';q('compareSample').hidden=!s.introSample;q('compareSample').textContent=s.otherSample?'换回示意样品 A':'换成示意样品 B';
        host.querySelector('.specimen').classList.toggle('inserted',!!s.introSample);
        feedback(s.introSample?(s.otherSample?'换了样品，吸收特征的位置也变了。我们比较这些特征，寻找分子结构的线索。':'部分波数透过得少：样品选择性吸收了这些红外分量。'):'不同分子的振动方式不同，因此会留下不同的红外吸收特征。');
      }
      on('purposeSample','click',()=>{s.introSample=!s.introSample;update();});on('compareSample','click',()=>{s.otherSample=!s.otherSample;update();});update();
      q('storyDeep').innerHTML=science('<p>波数越大，波长越短，单个光子能量越高。“透过的比例”是透射率 T。这里预览最终结果，背景比较稍后解释。</p><p>A、B 为不同带位的合成样品，不对应具体化合物；B 的带形只为对比而平移，不是声称真实结构变化会使所有峰等量移动。后续测量继续使用 A，B 仅用于开场比较。</p><p>多个吸收带、官能团与指纹区可以辅助鉴别，但一个峰不能唯一确定完整分子结构。</p>');
    }
    function molecularChapter(){
      const stage=s.molecularStage;
      q('storyScene').innerHTML=`<div class="molecular-layout"><div class="molecular-copy"><p class="molecular-kicker">MOLECULAR VIBRATION · CO₂</p><p class="molecular-brief">同一个分子，可以用不同方式振动。关键不在于“动没动”，而在于振动时偶极矩是否改变。</p><div class="molecular-modes"><button id="modeSym" aria-pressed="${!s.asym}">对称伸缩</button><button id="modeAsym" aria-pressed="${s.asym}">不对称伸缩</button></div><div id="molecularStatus" class="molecular-status"></div></div><div class="molecular-stage"><div id="co2Scene" class="story-diagram"></div><label for="modePhase">拖动相位，观察键长变化</label><input id="modePhase" type="range" min="0" max="100" value="${s.q}"></div></div>`;
      function update(){
        const u=10*Math.sin(s.q/100*2*Math.PI),d=M.mode(s.asym,u),xs=[180+d[0],300+d[1],420+d[2]],active=s.asym;
        const dipole=active?`<path d="M300 42v-25M300 17l-6 9M300 17l6 9" stroke="#168b7c" stroke-width="3" fill="none"/><text class="dipole-label active" x="320" y="25">偶极矩变化</text>`:'<path d="M275 42h50" stroke="#526873" stroke-width="2"/><text class="dipole-label" x="300" y="25" text-anchor="middle">偶极矩相消</text>';
        const match=stage>1&&s.asym?'<g><circle cx="300" cy="75" r="24" fill="none" stroke="#89b4ef" stroke-width="2"/><path d="M300 51v48M276 75h48" stroke="#89b4ef" stroke-width="2"/><text x="300" y="155" text-anchor="middle" fill="#89b4ef">频率匹配 → 吸收</text></g>':'';
        q('co2Scene').innerHTML=`<svg viewBox="0 0 600 220" role="img" aria-label="CO₂ ${s.asym?'不对称':'对称'}伸缩，显示${active?'净偶极变化':'偶极相消'}">${[180,300,420].map(x=>`<path d="M${x} 55V155" stroke="#3c5364" stroke-dasharray="4 5"/>`).join('')}<path d="M${xs[0]} 105H${xs[2]}" stroke="#a9bdc8" stroke-width="7"/>${xs.map((x,i)=>`<circle cx="${x}" cy="105" r="${i===1?24:28}" fill="${i===1?'#365568':'#a66358'}"/><text x="${x}" y="112" text-anchor="middle" fill="#f5f0e6">${i===1?'C':'O'}</text>`).join('')}${dipole}${match}</svg>`;
        q('molecularStatus').innerHTML=s.asym?'<strong class="status-active">IR active</strong><span>偶极矩随振动改变</span>':'<strong class="status-inactive">IR inactive</strong><span>偶极矩前后相消</span>';
        feedback(s.asym?'不对称伸缩：偶极矩在振动中改变。':'对称伸缩：两端变化相互抵消。');
      }
      on('modeSym','click',()=>{s.asym=false;update();});on('modeAsym','click',()=>{s.asym=true;update();});on('modePhase','input',e=>{s.q=Number(e.target.value);update();});update();
      q('storyDeep').innerHTML=science(`<p>必要条件可概括为：振动引起偶极矩变化，并且入射光子能量与允许振动跃迁匹配。主线暂不展开选择定则微分形式。</p>${stage>1?'<p class="story-equation">ΔE = hν</p>':''}<p>CO₂ 同伸同缩时偶极矩相消；一伸一缩时偶极矩改变。永久偶极矩不是必要条件。</p><button id="energyDeep" class="text-button">深入：光子能级实验 →</button>`);on('energyDeep','click',()=>go('absorption'));
    }
    function detectorChapter(){
      q('storyScene').innerHTML='<p class="story-lead">如果三种波数同时到达，探测器先看到的是什么？</p>'+section(`<div id="ambiguousSpectra"></div><div class="story-total">Detector total response <strong>2.0</strong></div><button id="swapSpectrum">${s.detectorAlt?'换回第一种组成':'换一种组成'}</button>${note('只改变组成，不改变总响应；先不引入干涉仪。')}`);
      const a=s.detectorAlt?[.2,1.6,.2]:[.8,.4,.8];
      q('ambiguousSpectra').innerHTML=`<svg class="story-bars" viewBox="0 0 600 260" role="img" aria-label="两种不同波数组成具有相同总读数">${a.map((v,i)=>`<rect x="${100+i*170}" y="${195-v*95}" width="48" height="${v*95}" fill="${colors[i]}"/><text x="${124+i*170}" y="${182-v*95}" text-anchor="middle">${v.toFixed(1)}</text><text x="${124+i*170}" y="225" text-anchor="middle">${[1000,1700,3000][i]}</text>`).join('')}<text x="510" y="255">cm⁻¹</text></svg>`;
      on('swapSpectrum','click',()=>{s.detectorAlt=!s.detectorAlt;draw();});
      feedback(s.detectorAlt?'spectrum composition changed · detector total response did not change.':'不同波数组成可以给出同一个总读数；单次总量无法告诉我们每个波数分别有多少。');
      q('storyDeep').innerHTML=science('<p>这里使用等响应探测器与离散分量示意。真实探测器的响应还会随波长、光学系统与电子学变化，但本场景只建立“总量不等于组成”的信息问题。</p>');
    }
    function michelsonScene(){
      const stage=s.scene03Stage;
      const moved=stage>0,focus=stage>1,named=stage>2;
      q('storyScene').innerHTML=section(`<div class="motion-prototype michelson-prototype"><svg viewBox="0 0 900 330" role="img" aria-label="Michelson 光路：分束、两臂返回并在探测器处重合"><path class="proto-axis" d="M65 165H430M450 165V55M450 165V275M470 165H835"/><path class="proto-input" d="M65 165H430"/><path class="proto-arm fixed-arm" d="M450 165V55M450 55V165"/><path class="proto-arm moving-arm ${focus?'is-focus':''}" d="M450 165V275M450 275V165"/><path class="proto-output" d="M470 165H835"/><rect class="proto-splitter" x="432" y="147" width="36" height="36" transform="rotate(45 450 165)"/><rect class="proto-mirror fixed" x="426" y="35" width="48" height="9"/><rect class="proto-mirror moving" x="426" y="${moved?stage>1?282:278:266}" width="48" height="9"/><circle class="proto-source" cx="48" cy="165" r="11"/><circle class="proto-detector" cx="850" cy="165" r="15"/><g class="proto-labels ${focus?'show':''}"><text x="32" y="205">source</text><text x="505" y="52">fixed mirror</text><text class="moving-label" x="505" y="292">moving mirror</text><text x="785" y="205">detector</text></g>${focus?'<path class="proto-bracket" d="M520 55V275M510 55h20M510 275h20"/><text class="proto-opd-label" x="535" y="170">光程差 δ</text>':''}</svg>${named?'<div class="proto-formula">Δδ = 2Δx</div>':''}</div><div class="proto-caption">${stage===0?'分束器把入射光送入两条可比较的路径。':stage===1?'移动镜改变一臂的往返路径；探测器读数随之变化。':stage===2?'去程和回程各改变一次：现在聚焦光程差。':'光程差（OPD）是两臂往返光程之差。'}</div>`);
      feedback(stage===0?'先观察光路：分束、反射、返回、重合。':stage===1?'只改变移动镜，其他条件保持不变。':stage===2?'把注意力集中到 moving arm：去程与回程各贡献一次路径变化。':'名称与公式现在出现：Δδ = 2Δx。下一步看它如何留下探测器信号。');
      q('storyDeep').innerHTML=science('<p>这里使用理想 Michelson 拓扑。移动镜位移 Δx 在空气近似、沿轴正入射的条件下造成光程差变化 Δδ=2Δx；模型中的机械位移和标签均为教学尺度。</p>');
    }
    function singleWavenumberScene(){
      const stage=s.scene04Stage,delta=P.mirrorToOPD(s.scene04X),power=M.power(s.scene04Wn,delta);
      q('storyScene').innerHTML=section(`<div class="encoding-prototype"><div class="encoding-plot" id="singleWnPlot"></div><div class="encoding-readout"><span>detector response</span><strong>${power.toFixed(2)}</strong><small>δ ${(delta*10000).toFixed(2)} μm</small></div></div><label class="scene-control" for="scene04Mirror">移动镜位移 Δx <output>${(delta*10000).toFixed(2)} μm OPD</output></label><input id="scene04Mirror" type="range" min="-0.01" max="0.01" step="0.00005" value="${s.scene04X}"><div class="scene-switch"><button data-scene04wn="1000" aria-pressed="${s.scene04Wn===1000}">1000 cm⁻¹</button><button data-scene04wn="3000" aria-pressed="${s.scene04Wn===3000}">3000 cm⁻¹</button></div>${stage>1?'<p class="story-equation">g<sub>ν̃</sub>(δ) ∝ cos(2πν̃δ)</p>':''}`);
      const xs=Array.from({length:501},(_,i)=>-.002+i*.004/500);plot('singleWnPlot',[{xs,ys:xs.map(x=>M.power(s.scene04Wn,x))}],{height:245,x0:-.002,x1:.002,y0:0,y1:1.05,xlabel:'OPD / cm',ylabel:'relative response',marker:{x:delta,y:power},title:`one wavenumber · ${s.scene04Wn} cm⁻¹`});
      on('scene04Mirror','input',e=>{s.scene04X=Number(e.target.value);s.moved=true;singleWavenumberScene();});
      host.querySelectorAll('[data-scene04wn]').forEach(b=>b.addEventListener('click',()=>{s.scene04Wn=Number(b.dataset.scene04wn);singleWavenumberScene();}));
      feedback(stage===0?'先观察：移动镜的路径变化已经成为探测器响应。':stage===1?'拖动镜子，OPD 改变；探测器响应沿着同一条周期曲线起伏。':'相同 OPD 范围内，3000 cm⁻¹ 的振荡明显更密：波数被编码进周期。');
      q('storyDeep').innerHTML=science(`<p>镜面位移 Δx 造成往返光程差 δ=2Δx。这里的 detector 曲线是理想单波数功率响应，不是可见光亮度。</p>${stage>1?'<p>改变 ν̃ 只改变曲线周期，不改变“移动镜 → OPD → detector response”的关系。</p>':''}`);
    }
    function interferogramScene(){
      const count=s.scene05Count,wide=count===4,range=wide?.008:.002,record=wide?P.densityRecord(P.response):P.lineRecord(M.lines.slice(0,count));
      q('storyScene').innerHTML=section(`<div class="scene-visual interferogram-visual">${!wide&&count>1?'<div id="componentMini"></div>':''}<div id="interferogramPlot"></div></div><div class="scene-addition"><span>${wide?'broadband':'components'} · ${wide?'continuous':'+'+count}</span>${s.scene05Discovered?'<b>ZPD / centerburst revealed</b>':''}</div>${s.scene05Discovered?'<p class="story-equation">g(δ) = Σ w<sub>j</sub> cos(2πν̃<sub>j</sub>δ)</p>':''}`);
      if(!wide&&count>1)plot('componentMini',M.lines.slice(0,count).map((l,i)=>({xs:record.xs,ys:record.xs.map(x=>l.weight*Math.cos(2*Math.PI*l.wn*x)),color:i===0?'#176b91':'#f3c96d',dash:i>0})),{height:150,x0:-range,x1:range,y0:-2.2,y1:2.2,ylabel:'each contribution'});
      plot('interferogramPlot',[{xs:record.xs,ys:record.ys}],{height:wide?310:260,x0:-range,x1:range,y0:wide?undefined:-2.2,y1:wide?undefined:2.2,zpd:s.scene05Discovered&&wide,xlabel:'OPD / cm',ylabel:wide?'interferogram':'sum',title:wide?'many wavenumbers → one interferogram':'add one more periodic contribution'});
      feedback(wide?(s.scene05Discovered?'在 ZPD 附近，许多分量同向叠加，形成 centerburst。':'宽带包含许多不同周期；中心附近的共同增强开始显现。'):count===1?'一个波数，留下一个规则周期。':`加入第 ${count} 个波数：不同快慢的节奏叠加成一条更复杂的记录。`);
      q('storyDeep').innerHTML=science('<p>这里复用项目已有的离散线与宽带响应模型。图中的交流信号允许正负值，表示相对调制，不是负光功率。</p><p>只有宽带阶段才揭示明显 centerburst；单一离散线本身不会产生孤立的宽带中心突峰。</p>');
    }
    function placeholder(){
      const i=s.step,m=sceneMeta[i];
      q('storyScene').innerHTML=section(`<div class="story-placeholder"><span>${m[0]}</span><h2>${m[1]}</h2><p>本场景已加入主线导航，教学交互将在 Chapter 02 / 03 阶段实现。</p></div>`);
      feedback(i===2?'Detector 不能直接区分混在一起的波数。下一步：让不同波数留下不同的变化规律。':'此处暂为占位，不改变已保留的旧实验与 Advanced 内容。');
      q('storyDeep').innerHTML=science('<p>当前阶段先完成 Chapter 01 的体验闭环；旧版 Fourier、测量、仪器与质量实验仍可从站点其他入口访问。</p>');
    }
    function molecular(){
      q('storyScene').innerHTML=section(`<div class="story-tabs"><button id="modeSym" aria-pressed="${!s.asym}">CO₂：同伸同缩</button><button id="modeAsym" aria-pressed="${s.asym}">CO₂：一伸一缩</button></div><div id="co2Scene" class="story-diagram"></div><label for="modePhase">移动滑块，比较振动方式</label><input id="modePhase" type="range" min="0" max="100" value="${s.q}">${note('模式示意 · 位移放大')}`);
      function update(){
        const u=10*Math.sin(s.q/100*2*Math.PI),d=M.mode(s.asym,u),xs=[180+d[0],300+d[1],420+d[2]];
        q('co2Scene').innerHTML=`<svg viewBox="0 0 600 260" role="img" aria-label="CO₂ ${s.asym?'不对称':'对称'}伸缩，两根键${s.asym?'一长一短':'同时变长或变短'}"><path d="M180 65V160M300 65V160M420 65V160" stroke="#3c5364" stroke-dasharray="4 5"/><path d="M${xs[0]} 115H${xs[2]}" stroke="#a9bdc8" stroke-width="7"/>${xs.map((x,i)=>`<circle cx="${x}" cy="115" r="${i===1?24:28}" fill="${i===1?'#365568':'#a66358'}"/><text x="${x}" y="122" text-anchor="middle">${i===1?'C':'O'}</text>`).join('')}<text x="300" y="218" text-anchor="middle">${s.asym?'这种振动能留下红外吸收特征':'这种振动的基频不产生红外吸收'}</text></svg>`;
        feedback(s.asym?'某些振动能选择性吸收特定波数。分子结构不同，振动的频率、方式和特征组合也会不同。':'分子中的原子可以用不同方式振动，但并非每一种振动都能吸收红外。');
      }
      on('modeSym','click',()=>{s.asym=false;draw();});on('modeAsym','click',()=>{s.asym=true;draw();});on('modePhase','input',e=>{s.q=Number(e.target.value);update();});update();
      q('storyDeep').innerHTML=science('<p>为什么只吸收某些波数？振动能级是量子化的：光子能量需匹配允许跃迁的能级差，ΔE=hν。匹配仍不够，在电偶极基频模型中，振动还须引起偶极矩变化，即 (∂μ/∂Q)₀≠0。</p><p>CO₂ 同伸同缩时偶极矩相消；一伸一缩时偶极矩改变。永久偶极矩不是必要条件。这里保持原子质心不动，位移已放大，滑块不是实际振动速度，也不是光照后才开始振动。</p><p>原子质量、键强度、几何与模式耦合共同影响频率和活性；双原子谐振近似 ν̃∝√(k/μ)。一根键不等于一个峰；真实谱还受环境、线宽与仪器响应影响。</p><button id="energyDeep" class="text-button">动手比较光子能量与能级 →</button><p><a href="https://chem.libretexts.org/Bookshelves/Analytical_Chemistry/Molecular_and_Atomic_Spectroscopy_%28Wenzel%29/4%3A_Infrared_Spectroscopy/4.1%3A_Introduction_to_Infrared_Spectroscopy" target="_blank" rel="noreferrer">Wenzel：红外吸收与分子振动</a></p>');
      on('energyDeep','click',()=>go('absorption'));
    }
    function encoding(){
      if(!s.encoded){
        q('storyScene').innerHTML='<p class="story-lead">我们想知道每个波数有多少光，但探测器先看到的只是总量。</p>'+section(`<div id="ambiguousSpectra"></div><div class="story-total">探测器读数 <strong>总量：2</strong></div><button id="swapSpectrum">换一种光谱组合</button>${note('等响应探测器 · 离散分量示意')}`);
        function update(){
          const a=s.ambiguous?[.2,1.6,.2]:[.8,.4,.8];
          q('ambiguousSpectra').innerHTML=`<svg class="story-bars" viewBox="0 0 600 260" role="img" aria-label="三种波数组成不同，但总量均为2">${a.map((v,i)=>`<rect x="${100+i*170}" y="${195-v*95}" width="48" height="${v*95}" fill="${colors[i]}"/><text x="${124+i*170}" y="${182-v*95}" text-anchor="middle">${v.toFixed(1)}</text><text x="${124+i*170}" y="225" text-anchor="middle">${[1000,1700,3000][i]}</text>`).join('')}<text x="510" y="255">cm⁻¹</text></svg>`;
          feedback(s.ambiguous?'组成变了，总读数却没变。FTIR 需要让不同波数留下可区分的变化规律。':'可以逐段选波数测量；FTIR 选择让宽带同时参与，用干涉仪编码，再分解信号。');
        }
        on('swapSpectrum','click',()=>{s.ambiguous=!s.ambiguous;update();});update();
      }else{
        q('storyScene').innerHTML=section(`<div class="story-instrument-grid ${s.signalView?'signal-focus':'structure-focus'}"><div class="story-model-wrap" ${s.signalView?'hidden':''}><div id="storyInstrument" class="instrument-host"></div><div class="story-tabs path-stages"><button data-path="0">入射</button><button data-path="1">分成两路</button><button data-path="2">返回叠加</button></div><p id="storyPart" class="story-part">分束器把光分成两路，一路到固定镜，一路到移动镜。</p></div><div class="story-response"><div class="story-detector"><span id="detectorLamp"></span><div>探测器响应<strong id="detectorValue"></strong></div></div><div id="singlePeriod" ${s.signalView?'':'hidden'}></div><label for="storyMirror">移动镜 <output id="mirrorValue"></output></label><input id="storyMirror" type="range" min="-0.01" max="0.01" step="0.00005" value="${s.x}"><div id="periodChoices" class="story-tabs" ${s.signalView?'':'hidden'}><button data-wn="1000" aria-pressed="${s.wn===1000}">较低波数 · 1000</button><button data-wn="3000" aria-pressed="${s.wn===3000}">较高波数 · 3000</button></div><button id="signalFocus" ${s.moved?'':'hidden'}>${s.signalView?'回到两路光':'把明暗变化画成曲线'}</button></div></div>${note(s.signalView?'单波数理想模型 · 波数单位 cm⁻¹':'结构示意 · 位移放大 · 单波数练习')}`);
        if(!s.signalView)mountInstrument();
        on('storyMirror','input',e=>{s.x=Number(e.target.value);s.moved=true;instrument?.setMirror(s.x);mirrorFeedback();});
        on('signalFocus','click',()=>{s.signalView=!s.signalView;draw();});
        host.querySelectorAll('[data-wn]').forEach(b=>b.addEventListener('click',()=>{s.wn=Number(b.dataset.wn);host.querySelectorAll('[data-wn]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));mirrorFeedback();}));
        host.querySelectorAll('[data-path]').forEach(b=>b.addEventListener('click',()=>{const stage=Number(b.dataset.path);instrument?.trace(stage);q('storyPart').textContent=['光源同时提供许多红外波数；此处先用一个分量练习。','分束器分出两路：固定镜一臂、移动镜一臂。','两路经镜面原路返回，在分束器重合；选择的输出送往探测器。'][stage];host.querySelectorAll('[data-path]').forEach(a=>a.setAttribute('aria-pressed',String(a===b)));}));
        mirrorFeedback();
      }
      q('storyDeep').innerHTML=science('<p>逐段选择窄波段测量是色散式光谱仪的一种路线，并非不能测。FTIR 让宽带同时参与，利用光程差编码，避免依次只选窄波段；光通量、多路采集和波数标尺是其常见优势，但信噪比收益取决于噪声来源，不能说总是更好。</p><p>光程差（Optical Path Difference，OPD）是两臂往返光程之差。空气近似、正入射、单臂平面镜移动时，去程与回程各改变 Δx，所以 Δδ=2Δx；以等臂位置为零点，δ=2x。相位 φ=2πν̃δ。</p><p>单波数选定端口的相对功率为 (1+cosφ)/2。另一输出端口未完整绘出，变暗不是能量消失。这里的明暗是功率指示，不是红外光变成可见光；理论曲线不是实时采集记录。</p><p>通用结构未复刻曲面聚焦镜及参考激光共路细节。单波数是原理练习，实际热源不随镜子扫描波长。</p><p><a href="https://www.shimadzu.com/an/sites/shimadzu.com.an/files/pim/pim_document_file/journal/talk_letters/10523/jpa216013.pdf" target="_blank" rel="noreferrer">Shimadzu：色散式与 FTIR 的发展</a></p><button id="fullInstrument" class="text-button">自由探索全部部件 →</button>');
      on('fullInstrument','click',()=>go('instrument'));
    }
    function mountInstrument(){
      if(instrument||!q('storyInstrument'))return;
      const names={source:'光源：提供宽带红外',splitter:'分束器：分为两臂，返回后叠加',moving:'移动镜：改变往返光程',fixed:'固定镜：提供参照返回路径',sample:'样品仓：辐射与样品相互作用',detector:'探测器：把总辐射响应变成电信号',laser:'参考激光：给光程差一把标尺',electronics:'采集：记录电信号',collimator:'准直组件：将辐射送入干涉仪',collector:'收集光学：把辐射送往探测器'};
      instrument=window.FTIRInstrument(q('storyInstrument'),{onSelect:id=>{q('storyPart').textContent=names[id]||'Michelson 干涉仪';},onMirror:v=>{s.x=Math.max(-.01,Math.min(.01,v));s.moved=true;q('storyMirror').value=s.x;instrument?.setMirror(s.x);mirrorFeedback();},onUnavailable:fallback});
      if(instrument){q('storyInstrument').querySelector('.story-fallback')?.remove();instrument.setMirror(s.x);instrument.setSample(false);instrument.view('top');}else fallback();
    }
    function fallback(){if(!q('storyInstrument'))return;instrument?.dispose();instrument=null;q('storyInstrument').innerHTML='<svg viewBox="0 0 420 340" class="story-fallback" role="img" aria-label="二维 Michelson：左侧输入，分束器两臂向上和向右，输出向下"><path d="M40 150H210V50V150V290M210 150H350" stroke="#73ddc8" stroke-width="4" fill="none"/><path d="M185 175L235 125M180 48H240M350 120V180" stroke="#bfd3de" stroke-width="7"/><text x="15" y="185">光源</text><text x="160" y="25">固定镜</text><text x="300" y="105">移动镜</text><text x="230" y="215">分束器</text><text x="235" y="292">探测器</text></svg>';}
    function mirrorFeedback(){
      if(!q('singlePeriod'))return;
      const delta=P.mirrorToOPD(s.x),power=M.power(s.wn,delta);
      if(s.signalView){
        const xs=Array.from({length:601},(_,i)=>-.002+i*.004/600);
        plot('singlePeriod',[{xs,ys:xs.map(x=>M.power(s.wn,x))}],{height:300,x0:-.002,x1:.002,y0:0,y1:1.05,xlabel:'两路往返光程之差 / cm',ylabel:'相对光功率',marker:{x:delta,y:power},title:'一个波数对应一个重复周期'});
      }
      q('detectorValue').textContent=power.toFixed(2);q('detectorLamp').style.opacity=.08+.92*power;
      q('mirrorValue').textContent=(s.x*1000).toFixed(2)+' μm';q('signalFocus').hidden=!s.moved;
      if(s.signalView)feedback('同样一段扫描，较高波数的起伏更密。移动镜没有扫描波长，而是给各波数留下不同的节奏。');
      else feedback(s.moved?`镜子移动 ${(s.x*1000).toFixed(2)} μm，去程、回程各变一次。这种往返路径差叫光程差，此时为 ${(delta*10000).toFixed(2)} μm。`:'两路光返回后重新叠加。拖动移动镜，看看探测器的明暗怎样变化。');
    }
    function summing(){
      q('storyScene').innerHTML=`<div class="story-tabs">${['一个分量','两个分量','三个分量','宽带'].map((n,i)=>`<button data-count="${i+1}" aria-pressed="${s.count===i+1}">${n}</button>`).join('')}</div>${section('<div id="componentChart"></div><div id="sumChartStory"></div><div id="sumAction"></div>')}`;
      const r=currentRecord(),wide=s.count===4,range=wide?.008:.002;
      if(!wide&&s.count>1){plot('componentChart',M.lines.slice(0,s.count).map((l,i)=>({xs:r.xs,ys:r.xs.map(x=>l.weight*Math.cos(2*Math.PI*l.wn*x)),color:colors[i],dash:i>0})),{height:210,x0:-range,x1:range,y0:-2.2,y1:2.2,ylabel:'各自的贡献 / 相对单位',title:'各波数分别在两臂自干涉后的贡献'});}else q('componentChart').hidden=true;
      plot('sumChartStory',[{xs:r.xs,ys:r.ys}],{height:300,x0:-range,x1:range,...(!wide?{y0:-2.2,y1:2.2}:{}),zpd:s.discovered&&wide,xlabel:'两路往返光程之差 / cm',ylabel:wide?'宽带交流信号 / 相对单位':s.count===1?'交流信号 / 相对单位':'相加后的交流信号 / 相对单位',title:'探测器的干涉图总和'});
      q('sumAction').innerHTML=wide?'<button id="discoverZero">为什么中心特别强？</button>':note(M.lines.slice(0,s.count).map(l=>l.wn+' cm⁻¹').join(' + ')+(s.count>1?' · 上下图同一幅度尺度':''));
      feedback(wide?(s.discovered?'两臂等光程时，各分量的调制贡献共同增强：这里是零光程差 ZPD，宽带中心强信号称为中心突峰。':'连续宽带有许多周期贡献，中心附近显著增强。单分量不会产生孤立的中心突峰。'):s.count===1?'一个波数，留下一个重复周期。加入另一种波数，看看会发生什么。':s.count===2?'两种波数，各有自己的快慢；探测器记录的是它们的总和。':'多个周期叠在一起，形成这条复杂曲线——干涉图（Interferogram）。');
      host.querySelectorAll('[data-count]').forEach(b=>b.addEventListener('click',()=>{s.count=Number(b.dataset.count);s.record=s.count===4?P.densityRecord(P.response):P.lineRecord(M.lines.slice(0,s.count));s.found=[];draw();}));on('discoverZero','click',()=>{s.discovered=true;draw();});
      q('storyDeep').innerHTML=science('<p>干涉图（Interferogram）描述信号随光程差（Optical Path Difference，OPD）变化。这里已去直流，允许负值；不表示负光功率。不同光频率之间的快速交叉项不是所示贡献。</p><p>零光程差（Zero Path Difference，ZPD）在理想零相位、同号权重下使各余弦贡献为正极大。中心突峰（Centerburst）与谱宽相关；少数离散线可以重复增强，不能当成连续宽带。</p><p>宽带采用带限谱密度积分的离散近似；其幅度单位不与离散谱线积分权重作跨模型比较。真实扫描可以用 δ(t) 关联时间，显示动画速度不是采样率。</p>');
    }
    function fourier(){
      const r=currentRecord();q('storyScene').innerHTML=`<p class="story-note">沿用 N4 的同一条记录 · ${r.kind==='density'?'宽带':'离散分量'} · ${s.presentationRecordId||r.id}</p><div class="story-tabs"><button data-fourier="0" aria-pressed="${s.fourierView===0}">比较周期</button><button data-fourier="1" aria-pressed="${s.fourierView===1}">看累积</button><button data-fourier="2" aria-pressed="${s.fourierView===2}">排列匹配结果</button></div>${section('<div id="fourierPlot"></div><div id="fourierMeter"></div>')}<label for="storyCandidate">候选波数 <output id="candidateValue"></output></label><input id="storyCandidate" type="range" min="400" max="4000" step="10" value="${s.candidate}"><div class="story-tabs"><button data-probe="1000">试 1000</button><button data-probe="1700">试 1700</button><button data-probe="2400">试 2400</button><button id="keepCandidate">留下这个匹配结果</button></div><div id="foundCandidates" class="story-note"></div>`;
      function update(){
        const p=P.projection(r,s.candidate),scale=Math.max(...r.ys.map(Math.abs)),xs=r.xs;q('candidateValue').textContent=s.candidate+' cm⁻¹';
        if(s.fourierView===0){plot('fourierPlot',[{xs,ys:r.ys.map(v=>v/scale)},{xs,ys:xs.map(x=>Math.cos(2*Math.PI*s.candidate*x)),color:colors[0],dash:true}],{x0:-.002,x1:.002,y0:-1.2,y1:1.2,ylabel:'实线：总信号（显示缩放）；虚线：候选周期',title:'总信号与候选周期模板'});}
        else if(s.fourierView===1){let total=0;plot('fourierPlot',[{xs,ys:p.product.map(v=>(total+=2*r.h*v))}],{x0:xs[0],x1:xs.at(-1),ylabel:'乘积沿 OPD 累积 / 相对单位',title:'匹配时更多贡献同向累积'});}
        else {const spectrum=P.transform(r);plot('fourierPlot',[{xs:spectrum.wn,ys:spectrum.values}],{x0:4000,x1:400,xlabel:'波数 / cm⁻¹',ylabel:r.kind==='density'?'恢复单光束响应 / 相对谱密度':'恢复投影 / 相对单位',marker:{x:s.candidate,y:p.value},title:'从相同记录计算的波数响应'});}
        q('fourierMeter').textContent=`完整记录的匹配累积：${p.value.toFixed(4)}`;q('foundCandidates').textContent=s.found.length?'已比较：'+s.found.map(w=>`${w} cm⁻¹ → ${P.projection(r,w).value.toFixed(4)}`).join(' ｜ '):'';
        feedback(['用一个已知节奏与总信号比较：改变候选波数，看看谁更能持续对上。','把总信号与候选周期相乘，再沿整条记录累积；不匹配的正负贡献更多抵消。','傅里叶变换把不同周期的响应按波数排列。得到的是谱响应，还不是样品吸光度。'][s.fourierView]);
      }
      host.querySelectorAll('[data-fourier]').forEach(b=>b.addEventListener('click',()=>{s.fourierView=Number(b.dataset.fourier);draw();}));on('storyCandidate','input',e=>{s.candidate=Number(e.target.value);update();});host.querySelectorAll('[data-probe]').forEach(b=>b.addEventListener('click',()=>{s.candidate=Number(b.dataset.probe);q('storyCandidate').value=s.candidate;update();}));on('keepCandidate','click',()=>{if(!s.found.includes(s.candidate))s.found.push(s.candidate);update();});update();
      q('storyDeep').innerHTML=science('<p>傅里叶变换（Fourier Transform）分析 OPD 域的周期成分。理想零相位模型 g(δ)=∫B(ν̃)cos(2πν̃δ)dν̃；实际计算使用保存记录的全部采样点，而非当前显示的一小段。</p><p>此处直接投影为 2hΣgᵢcos(2πν̃δᵢ)，与 FFT 实部采用同一比例约定。比较周期时只对总信号作统一显示缩放，恢复谱保留原幅度和有限窗口的有符号旁瓣。候选点未必位于 FFT 格点，不能任意取绝对值美化。</p><p>真实仪器还可能需要相位校正、切趾等；此处不以余弦模板冒充完整工程处理。</p>');
    }
    function reference(){
      ensureRecords();q('storyScene').innerHTML=`<div class="story-tabs">${['Background','Sample','透射率 T','吸光度 A'].map((n,i)=>`<button data-measure="${i}" aria-pressed="${s.measureStage===i}">${n}</button>`).join('')}</div>${section('<div id="referenceChart"></div><div id="referenceValues" class="story-equation"></div>')}<label for="referenceProbe">比较同一个波数 <output id="referenceWn"></output></label><input id="referenceProbe" type="range" min="600" max="3800" step="5" value="${s.probe}"><div id="ratioSwitch"></div>${note('同一对合成背景／样品记录 · 同一处理条件')}`;
      function update(){let i=0;s.r.wn.forEach((v,j)=>{if(Math.abs(v-s.probe)<Math.abs(s.r.wn[i]-s.probe))i=j;});q('referenceWn').textContent=Math.round(s.r.wn[i])+' cm⁻¹';
        const ratio=s.measureStage>=2,absorbance=s.measureStage===3,ys=absorbance?s.r.a:s.r.t;
        plot('referenceChart',ratio?[{xs:s.r.wn,ys}]:[{xs:s.b.wn,ys:s.b.values,color:colors[0],dash:true},...(s.measureStage===1?[{xs:s.a.wn,ys:s.a.values}]:[])],{x0:4000,x1:400,y0:0,y1:ratio?(absorbance?.8:1.05):1.05,xlabel:'波数 / cm⁻¹',ylabel:ratio?(absorbance?'吸光度 A（无量纲）':'透射率 T'):'单光束谱 / 相对谱密度',marker:{x:s.r.wn[i],y:ratio?ys[i]:s.b.values[i]},title:'同一对背景样品记录与比值'});
        q('referenceValues').textContent=s.measureStage===0?`背景 ${s.b.values[i].toFixed(3)}`:s.measureStage===1?`背景 ${s.b.values[i].toFixed(3)} ｜ 样品 ${s.a.values[i].toFixed(3)}`:s.measureStage===2?`${s.a.values[i].toFixed(3)} ÷ ${s.b.values[i].toFixed(3)} = T ${s.r.t[i].toFixed(3)}`:`T ${s.r.t[i].toFixed(3)} → A ${s.r.a[i].toFixed(3)}`;
        feedback(['背景本身就有形状：光源、光学系统和探测器的响应都在里面。','虚线是背景，实线是样品；共同起伏之上，样品额外削弱了部分波数。','同波数处用样品除以背景，共同系统响应被抵消，得到透射率 T。','同一个吸收带，从透射率的低谷变成吸光度的高峰：A = −log₁₀T。'][s.measureStage]);
      }
      q('ratioSwitch').innerHTML='';host.querySelectorAll('[data-measure]').forEach(b=>b.addEventListener('click',()=>{s.measureStage=Number(b.dataset.measure);draw();}));on('referenceProbe','input',e=>{s.probe=Number(e.target.value);update();});update();
      q('storyDeep').innerHTML=science(`<p>背景与样品分别生成干涉记录 ${s.bg.id}、${s.sample.id}，经同一变换得到单光束谱（Single-beam Spectrum），再计算 T=B样品/B背景、A=−log₁₀T。不是干涉图相除、不是谱相减，也不是各自归一化后再除。</p><p>本页为了比较而预先生成两条记录，切换视图并非重新采集。理想模型 B背景=H、B样品=HT；真实漂移、环境变化与散射不能总被背景消除。低背景区留空。</p><p><a href="https://www.shimadzu.co.uk/service-support/technical-support/ftir/tips_and_tricks/power.html" target="_blank" rel="noreferrer">Shimadzu：单光束谱与背景比值</a></p><button id="freeMeasure" class="text-button">自行采集与重测 →</button>`);on('freeMeasure','click',()=>go('measurement'));
    }
    function closure(){
      q('storyScene').innerHTML=section('<div class="story-placeholder"><span>09</span><h2>从信号回到分子信息</h2><p>吸收带与整体谱形提供结构线索；完整判断还需要多个特征、测量条件和其他证据。</p><button id="returnOpening" class="primary">回到开场</button></div>');
      feedback('主线完成：分子吸收 → 编码 → 干涉图 → Fourier → 背景比值 → 分子信息。');
      on('returnOpening','click',restartIntro);
      q('storyDeep').innerHTML=science('<p>这里回到 N1 可以重新观察选择性吸收。示例数据是合成教学模型，不用于单峰鉴定。</p>');
    }
    function meaning(){
      ensureRecords();const bands=[2950,1715,1150],labels=['高波数特征','中间特征','指纹区特征'];q('storyScene').innerHTML=section(`<div id="meaningChart"></div><div class="story-tabs">${bands.map((w,i)=>`<button data-band="${i}" aria-pressed="${s.band===i}">${labels[i]}</button>`).join('')}</div><div id="meaningEvidence"></div>`)+`<button id="co2Example">对照 CO₂ 的振动实例</button> <button id="checkUnderstanding">检验一下：一个峰能确定一种分子吗？</button><div id="understandingAnswer"></div>`;
      on('co2Example','click',()=>{s.molecule=1;s.asym=true;visit(1);});const wn=bands[s.band];let i=0;s.r.wn.forEach((w,j)=>{if(Math.abs(w-wn)<Math.abs(s.r.wn[i]-wn))i=j;});plot('meaningChart',[{xs:s.r.wn,ys:s.r.a}],{x0:4000,x1:400,y0:0,y1:.8,xlabel:'波数 / cm⁻¹',ylabel:'吸光度 A（无量纲）',marker:{x:s.r.wn[i],y:s.r.a[i]},title:'同一测量得到的吸收特征组合'});
      q('meaningEvidence').innerHTML=`<div class="story-mapping"><strong>约 ${wn} cm⁻¹</strong><span>→</span><p>${['可提示某类伸缩振动；真实样品中这一带附近常见 C—H 伸缩信息。','可提供羰基等振动的线索，但峰位受分子环境影响。','指纹区常有多种耦合振动；应比较整体模式，不作单键一峰解释。'][s.band]}</p></div>${note('这张谱是合成示例，以上只作一般线索说明，不是该虚构样品的真实峰归属。')}`;
      host.querySelectorAll('[data-band]').forEach(b=>b.addEventListener('click',()=>{s.band=Number(b.dataset.band);draw();}));on('checkUnderstanding','click',()=>{s.challenge=true;q('understandingAnswer').innerHTML='<p>不能。需要多个特征带、指纹区组合、测量条件和其他证据。红外光谱用于鉴别与辅助结构分析，不保证唯一解出完整结构。</p>';});
      feedback('分子结构影响振动模式；允许的跃迁留下吸收特征，多个特征共同构成分子线索。');q('storyDeep').innerHTML=science('<p>正常模式是分子中原子的协同运动。原子质量、键的力常数、几何对称性和模式耦合共同影响频率与活性，因此不是“一根键一个峰”。本模型的三条合成吸收带未绑定实测分子，不能用于库匹配结论。</p><p>[NEEDS VERIFICATION] 若加入真实分子指认，需有来源的振动模式、样品状态、实测谱与专家核查；不以任意动画对应合成峰。</p><button id="backToMolecules" class="text-button">重新观察分子模式 →</button><button id="resolutionLab" class="text-button">深入：分辨率与补零 →</button>');on('backToMolecules','click',()=>{s.molecule=1;visit(1);});on('resolutionLab','click',()=>go('quality'));
    }
    function ready(){if(s.step===2&&s.encoded&&!s.signalView)mountInstrument();}
    function resize(){if(n3||pass1)return;clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!dead&&!n3&&!pass1)draw();},180);}
    bindDeckInput();
    window.addEventListener('ftir-3d-ready',ready);window.addEventListener('resize',resize);draw();
    return ()=>{dead=true;deckEvents.abort();delete host.dataset.deckBound;delete host.dataset.n3Active;n3?.dispose();n3=null;clearTimeout(chromeTimer);clearTimeout(resizeTimer);clearInterval(autoTimer);autoTimer=null;instrument?.dispose();window.removeEventListener('ftir-3d-ready',ready);window.removeEventListener('resize',resize);};
  };
})();
