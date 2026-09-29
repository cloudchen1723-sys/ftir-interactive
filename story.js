/* Guided learning layer. Reuses physics.js records; never substitutes a painted spectrum for a transform. */
(function(){
  'use strict';
  const P=window.FTIRPhysics,M=window.FTIRStoryModel;
  let saved=null;
  window.resetFTIRStory=()=>{saved=null;};
  window.mountFTIRStory=function(host,{chart,go}){
    const s=saved||(saved={step:0,asym:false,q:25,encoded:false,signalView:false,x:0,wn:1000,moved:false,count:1,discovered:false,candidate:1000,found:[],fourierView:0,measureStage:0,probe:1715,abs:false,band:0,challenge:false});
    const colors=['#edbd7e','#89b4ef','#d29aa5'];
    let instrument=null,resizeTimer=0,dead=false;
    const q=id=>host.querySelector('#'+id),on=(id,event,fn)=>q(id)?.addEventListener(event,fn);
    const stepNames=['未知样品','吸收的来由','区分混合光','从简单到复杂','找回光谱','排除背景','分子线索'];
    const titles=['拿到一个未知样品，我想知道里面有什么。','分子振动不同，留下的吸收特征也不同。','很多红外分量同时到达，怎样区分？','复杂信号，是怎样一步步形成的？','不同的节奏，并没有消失。','变换之后，还要排除仪器的影响。','光谱不是终点，而是分子的线索。'];
    const nextNames=['看看分子怎样吸收','这给仪器出了什么难题','加入更多波数','从总和找回分量','回到真实的测量问题','看看光谱提供什么线索','回到起点'];
    const note=t=>`<p class="story-note">${t}</p>`;
    const science=(t,link='')=>`<details class="story-science"><summary>深入原理与模型边界</summary>${t}${link}</details>`;
    const plot=(id,series,opts={})=>chart(id,series,{height:310,...opts});
    const section=t=>`<div class="story-evidence">${t}</div>`;
    function feedback(text){q('storyFinding').textContent=text;}
    function ensureRecords(){if(!s.bg){s.bg=P.measure('background');s.sample=P.measure('sample');s.b=P.transform(s.bg);s.a=P.transform(s.sample);s.r=P.ratio(s.a,s.b);}}
    function currentRecord(){if(!s.record)s.record=P.lineRecord(M.lines.slice(0,s.count));return s.record;}
    function draw(){
      const focused=host.contains(document.activeElement)?document.activeElement:null;
      const focusId=focused?.id;
      instrument?.dispose();instrument=null;
      host.innerHTML=`<nav class="story-steps" aria-label="教学主线">${stepNames.map((n,i)=>`<button data-story-step="${i}" ${s.step===i?'aria-current="step"':''}><span>${i+1}</span>${n}</button>`).join('')}</nav><header class="story-heading"><h1 tabindex="-1" id="storyTitle">${titles[s.step]}</h1></header><div id="storyScene"></div><p id="storyFinding" class="story-finding" role="status" aria-live="polite"></p><div id="storyDeep"></div><nav class="story-next" aria-label="学习进度"><button id="storyPrev" ${s.step===0?'disabled':''}>返回</button><button class="primary" id="storyNext">${nextNames[s.step]} →</button></nav>`;
      host.querySelectorAll('[data-story-step]').forEach(b=>b.addEventListener('click',()=>visit(Number(b.dataset.storyStep))));
      on('storyNext','click',()=>{
        if(s.step===2&&!s.encoded){s.encoded=true;draw();}
        else if(s.step===2&&!s.moved){s.x=.00125;s.moved=true;draw();}
        else if(s.step===2&&!s.signalView){s.signalView=true;draw();}
        else if(s.step===3&&s.count<3){s.count++;s.record=s.count===4?P.densityRecord(P.response):P.lineRecord(M.lines.slice(0,s.count));s.found=[];draw();}
        else if(s.step===4&&s.fourierView<2){s.fourierView++;draw();}
        else if(s.step===5&&s.measureStage<2){s.measureStage++;draw();}
        else visit((s.step+1)%7);
        q('storyTitle').focus({preventScroll:true});host.scrollIntoView({block:'start',behavior:'instant'});
      });on('storyPrev','click',()=>visit(s.step-1));
      [purpose,molecular,encoding,summing,fourier,reference,meaning][s.step]();
      if(s.step===1)q('storyNext').textContent='仪器怎样区分这些波数 →';
      if(s.step===2&&!s.encoded)q('storyNext').textContent='引入干涉仪 →';
      else if(s.step===2&&!s.moved)q('storyNext').textContent='试着移动镜子 →';
      else if(s.step===2&&!s.signalView)q('storyNext').textContent='把明暗变化画成曲线 →';
      if(s.step===3&&s.count<3)q('storyNext').textContent=['','加入第二个分量 →','加入第三个分量 →','扩展到宽带 →'][s.count];
      if(s.step===4&&s.fourierView<2)q('storyNext').textContent=s.fourierView===0?'看匹配如何累积 →':'按波数排列结果 →';
      if(s.step===5&&s.measureStage<2)q('storyNext').textContent=s.measureStage===0?'放入样品再比较 →':'留下样品的变化 →';
      if(focusId)q(focusId)?.focus({preventScroll:true});
    }
    function visit(i){s.step=i;draw();q('storyTitle').focus({preventScroll:true});host.scrollIntoView({block:'start',behavior:'instant'});}
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
      const r=currentRecord();q('storyScene').innerHTML=`<p class="story-note">沿用上一站${r.kind==='density'?'宽带':'离散分量'}的同一条记录</p><div class="story-tabs"><button data-fourier="0" aria-pressed="${s.fourierView===0}">比较周期</button><button data-fourier="1" aria-pressed="${s.fourierView===1}">看累积</button><button data-fourier="2" aria-pressed="${s.fourierView===2}">排列匹配结果</button></div>${section('<div id="fourierPlot"></div><div id="fourierMeter"></div>')}<label for="storyCandidate">候选波数 <output id="candidateValue"></output></label><input id="storyCandidate" type="range" min="400" max="4000" step="10" value="${s.candidate}"><div class="story-tabs"><button data-probe="1000">试 1000</button><button data-probe="1700">试 1700</button><button data-probe="2400">试 2400</button><button id="keepCandidate">留下这个匹配结果</button></div><div id="foundCandidates" class="story-note"></div>`;
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
      ensureRecords();q('storyScene').innerHTML=`<div class="story-tabs">${['只看背景','加入样品','比较比值'].map((n,i)=>`<button data-measure="${i}" aria-pressed="${s.measureStage===i}">${n}</button>`).join('')}</div>${section('<div id="referenceChart"></div><div id="referenceValues" class="story-equation"></div>')}<label for="referenceProbe">比较同一个波数 <output id="referenceWn"></output></label><input id="referenceProbe" type="range" min="600" max="3800" step="5" value="${s.probe}"><div id="ratioSwitch"></div>${note('同一对合成背景／样品记录 · 同一处理条件')}`;
      function update(){let i=0;s.r.wn.forEach((v,j)=>{if(Math.abs(v-s.probe)<Math.abs(s.r.wn[i]-s.probe))i=j;});q('referenceWn').textContent=Math.round(s.r.wn[i])+' cm⁻¹';
        const ratio=s.measureStage===2,ys=s.abs?s.r.a:s.r.t;
        plot('referenceChart',ratio?[{xs:s.r.wn,ys}]:[{xs:s.b.wn,ys:s.b.values,color:colors[0],dash:true},...(s.measureStage===1?[{xs:s.a.wn,ys:s.a.values}]:[])],{x0:4000,x1:400,y0:0,y1:ratio?(s.abs?.8:1.05):1.05,xlabel:'波数 / cm⁻¹',ylabel:ratio?(s.abs?'吸光度 A（无量纲）':'透射率 T'):'单光束谱 / 相对谱密度',marker:{x:s.r.wn[i],y:ratio?ys[i]:s.b.values[i]},title:'同一对背景样品记录与比值'});
        q('referenceValues').textContent=s.measureStage===0?`背景 ${s.b.values[i].toFixed(3)}`:s.measureStage===1?`背景 ${s.b.values[i].toFixed(3)} ｜ 样品 ${s.a.values[i].toFixed(3)}`:`${s.a.values[i].toFixed(3)} ÷ ${s.b.values[i].toFixed(3)} = T ${s.r.t[i].toFixed(3)}${s.abs?' → A '+s.r.a[i].toFixed(3):''}`;
        feedback(['背景本身就有形状：光源、光学系统和探测器的响应都在里面。','虚线是背景，实线是样品；共同起伏之上，样品额外削弱了部分波数。',s.abs?'同一个吸收带，从透射率的低谷变成吸光度的高峰：A = −log₁₀T。':'同波数处用样品除以背景，共同系统响应被抵消，样品的变化留下来。'][s.measureStage]);
      }
      q('ratioSwitch').innerHTML=s.measureStage===2?`<button id="switchAbs">${s.abs?'看透射率':'看吸光度'}</button>`:'';on('switchAbs','click',()=>{s.abs=!s.abs;draw();});host.querySelectorAll('[data-measure]').forEach(b=>b.addEventListener('click',()=>{s.measureStage=Number(b.dataset.measure);draw();}));on('referenceProbe','input',e=>{s.probe=Number(e.target.value);update();});update();
      q('storyDeep').innerHTML=science(`<p>背景与样品分别生成干涉记录 ${s.bg.id}、${s.sample.id}，经同一变换得到单光束谱（Single-beam Spectrum），再计算 T=B样品/B背景、A=−log₁₀T。不是干涉图相除、不是谱相减，也不是各自归一化后再除。</p><p>本页为了比较而预先生成两条记录，切换视图并非重新采集。理想模型 B背景=H、B样品=HT；真实漂移、环境变化与散射不能总被背景消除。低背景区留空。</p><p><a href="https://www.shimadzu.co.uk/service-support/technical-support/ftir/tips_and_tricks/power.html" target="_blank" rel="noreferrer">Shimadzu：单光束谱与背景比值</a></p><button id="freeMeasure" class="text-button">自行采集与重测 →</button>`);on('freeMeasure','click',()=>go('measurement'));
    }
    function meaning(){
      ensureRecords();const bands=[2950,1715,1150],labels=['高波数特征','中间特征','指纹区特征'];q('storyScene').innerHTML=section(`<div id="meaningChart"></div><div class="story-tabs">${bands.map((w,i)=>`<button data-band="${i}" aria-pressed="${s.band===i}">${labels[i]}</button>`).join('')}</div><div id="meaningEvidence"></div>`)+`<button id="co2Example">对照 CO₂ 的振动实例</button> <button id="checkUnderstanding">检验一下：一个峰能确定一种分子吗？</button><div id="understandingAnswer"></div>`;
      on('co2Example','click',()=>{s.molecule=1;s.asym=true;visit(1);});const wn=bands[s.band];let i=0;s.r.wn.forEach((w,j)=>{if(Math.abs(w-wn)<Math.abs(s.r.wn[i]-wn))i=j;});plot('meaningChart',[{xs:s.r.wn,ys:s.r.a}],{x0:4000,x1:400,y0:0,y1:.8,xlabel:'波数 / cm⁻¹',ylabel:'吸光度 A（无量纲）',marker:{x:s.r.wn[i],y:s.r.a[i]},title:'同一测量得到的吸收特征组合'});
      q('meaningEvidence').innerHTML=`<div class="story-mapping"><strong>约 ${wn} cm⁻¹</strong><span>→</span><p>${['可提示某类伸缩振动；真实样品中这一带附近常见 C—H 伸缩信息。','可提供羰基等振动的线索，但峰位受分子环境影响。','指纹区常有多种耦合振动；应比较整体模式，不作单键一峰解释。'][s.band]}</p></div>${note('这张谱是合成示例，以上只作一般线索说明，不是该虚构样品的真实峰归属。')}`;
      host.querySelectorAll('[data-band]').forEach(b=>b.addEventListener('click',()=>{s.band=Number(b.dataset.band);draw();}));on('checkUnderstanding','click',()=>{s.challenge=true;q('understandingAnswer').innerHTML='<p>不能。需要多个特征带、指纹区组合、测量条件和其他证据。红外光谱用于鉴别与辅助结构分析，不保证唯一解出完整结构。</p>';});
      feedback('分子结构影响振动模式；允许的跃迁留下吸收特征，多个特征共同构成分子线索。');q('storyDeep').innerHTML=science('<p>正常模式是分子中原子的协同运动。原子质量、键的力常数、几何对称性和模式耦合共同影响频率与活性，因此不是“一根键一个峰”。本模型的三条合成吸收带未绑定实测分子，不能用于库匹配结论。</p><p>[NEEDS VERIFICATION] 若加入真实分子指认，需有来源的振动模式、样品状态、实测谱与专家核查；不以任意动画对应合成峰。</p><button id="backToMolecules" class="text-button">重新观察分子模式 →</button><button id="resolutionLab" class="text-button">深入：分辨率与补零 →</button>');on('backToMolecules','click',()=>{s.molecule=1;visit(1);});on('resolutionLab','click',()=>go('quality'));
    }
    function ready(){if(s.step===2&&s.encoded&&!s.signalView)mountInstrument();}
    function resize(){clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>{if(!dead)draw();},180);}
    window.addEventListener('ftir-3d-ready',ready);window.addEventListener('resize',resize);draw();
    return ()=>{dead=true;clearTimeout(resizeTimer);instrument?.dispose();window.removeEventListener('ftir-3d-ready',ready);window.removeEventListener('resize',resize);};
  };
})();
