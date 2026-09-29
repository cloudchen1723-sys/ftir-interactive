/* Ideal isolated harmonic mode, electric-dipole fundamental; not a sample spectrum. */
(function(root){
  'use strict';
  const photonEV=wn=>6.62607015e-34*299792458*(wn*100)/1.602176634e-19;
  const allowed=(wn,active)=>wn===1700&&active;
  if(typeof module==='object'&&module.exports){module.exports={photonEV,allowed};return;}
  root.mountAbsorption=function(host){
    let wn=1000,active=true;
    host.innerHTML=`<section class="intro"><div class="eyebrow">从样品出发</div><h1>分子为什么只吸收某些红外光？</h1><p>分子可以振动，但振动能量不是任意连续的。只有光子能量匹配一个允许的振动跃迁时，这部分红外辐射才可能被吸收。</p></section>
      <section class="absorption-lab"><div><h2>能量只能一级一级改变</h2><p>横线是允许的振动能级，不是原子所在的高度。比较光子的能量箭头与两级之间的间隔。</p><div id="energyDiagram"></div><label for="photonWn">入射光子波数 <output id="photonValue"></output></label><input id="photonWn" type="range" min="800" max="2600" step="100" value="1000"><div class="controls"><button id="matchPhoton">匹配能级差</button><button id="higherPhoton">换成更高能量</button></div><p class="hint">单个假想振动模式 · 理想零线宽 · ΔE 对应 1700 cm⁻¹，不代表某种物质。</p></div>
      <div class="absorption-explanation"><h2>匹配，还不够</h2><p>振动还需要让分子的偶极矩发生变化，才能与红外电场有效耦合。这就是这里的“红外活性”。</p><label class="activity-switch"><input type="checkbox" id="irActive" checked> 振动使偶极矩改变</label><p class="hint">偶极矩描述正、负电荷分布的分离。这里切换的是两类假想模式，不是改变某个真实分子的选择定则。</p><div id="absorptionVerdict" class="absorption-verdict" role="status" aria-live="polite"></div><div class="formula">E光子 = hν = hcν̃<br>吸收跃迁：E光子 = E₁ − E₀</div></div></section>
      <section class="absorption-bridge"><h2>从一次跃迁，到一张光谱</h2><p>宽带红外同时含有许多波数分量。样品对允许跃迁附近的分量发生选择性吸收，使这些位置的透射率降低、吸光度升高。</p><p>FTIR 不直接看见分子跃迁：干涉仪先编码宽带辐射，光经过样品后由探测器记录；傅里叶变换恢复谱响应，再与背景比较，得到吸收信息。</p><button class="primary" data-go="instrument">进入仪器</button> <button class="text-button" data-go="measurement">观察背景与样品</button></section>
      <details><summary>为什么实际光谱是谱带，而不是精确的一根线？</summary><p>上方用零线宽、孤立谐振模式展示能量匹配。真实跃迁具有有限线宽，分子环境、振转结构等会影响谱带，仪器分辨率也会影响观测线形。不能把滑块的 100 cm⁻¹ 步长当成吸收容差或仪器分辨率。</p><p>谐振近似中 Eᵥ=(v+½)hν₀，电偶极基频吸收满足 Δv=+1。v=0 仍有零点能，并非分子完全静止；真实非谐性还可带来弱泛频与组合带。能量与选择定则满足，也不表示每一个入射光子必定被吸收。</p><p>并非要求分子具有永久偶极矩，而是有关振动引起偶极矩变化。此处忽略转动结构、激发态布居与跃迁速率，不计算吸收概率。</p><p>依据：<a href="https://chemistry.csueastbay.edu/~pfleming/chem/352/chap04/IR-Spec.htm" target="_blank" rel="noreferrer">CSU East Bay：振动跃迁与选择定则</a>；<a href="https://openstax.org/books/university-physics-volume-3/pages/9-2-molecular-spectra" target="_blank" rel="noreferrer">OpenStax：分子能谱</a>。</p></details>`;
    const q=s=>host.querySelector(s);
    function draw(){
      const match=wn===1700,can=allowed(wn,active),top=240-wn/1700*130,color=can?'#73ddc8':'#efbd76';
      q('#photonValue').textContent=`${wn} cm⁻¹ · ${photonEV(wn).toFixed(3)} eV`;
      q('#energyDiagram').innerHTML=`<svg viewBox="0 0 480 310" role="img" aria-label="振动能级：v等于0与1；光子能量${match?'匹配':'不匹配'}能级差"><defs><marker id="energyArrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0L10 5L0 10" fill="${color}"/></marker></defs><path d="M35 265V25" stroke="#96aab8"/><text x="18" y="20">能量</text><path d="M80 240H285M80 110H285" stroke="#92b3c4" stroke-width="2"/><text x="85" y="266">v = 0（基态）</text><text x="85" y="96">v = 1（激发态）</text><path d="M270 235V115" stroke="#73ddc8" stroke-dasharray="4 4"/><text x="80" y="170">ΔE = ${photonEV(1700).toFixed(3)} eV</text><path d="M365 240V${top}" stroke="${color}" stroke-width="4" marker-end="url(#energyArrow)"/><text x="318" y="275">光子能量</text>${can?'<path d="M205 232V120" stroke="#73ddc8" stroke-width="3" marker-end="url(#energyArrow)"/><text x="83" y="200">允许吸收跃迁</text>':''}</svg>`;
      q('#absorptionVerdict').innerHTML=`<strong>${can?'满足吸收条件':match?'能量匹配，但此模式不具红外活性':'光子能量不匹配'}</strong><p>${can?'可以发生 v=0 → v=1 的吸收跃迁；并非每个光子都一定被吸收。':match?'在本电偶极基频模型中，偶极矩不随振动改变，因此该跃迁不产生红外吸收。':wn>1700?'能量更高并不意味着更容易吸收：多出来的能量不能随意塞进两能级之间。':'这个光子的能量不足以跨越所示能级差。此处不考虑多光子过程。'}</p>`;
    }
    q('#photonWn').addEventListener('input',e=>{wn=Number(e.target.value);draw();});
    q('#irActive').addEventListener('change',e=>{active=e.target.checked;draw();});
    q('#matchPhoton').addEventListener('click',()=>{wn=1700;q('#photonWn').value=wn;draw();});
    q('#higherPhoton').addEventListener('click',()=>{wn=2400;q('#photonWn').value=wn;draw();});draw();
  };
})(typeof globalThis!=='undefined'?globalThis:this);
