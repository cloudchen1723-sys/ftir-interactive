window.addEventListener('error', (event) => {
  const box = document.getElementById('loadError');
  const detail = document.getElementById('loadErrorDetail');
  if (box) box.style.display = 'block';
  if (detail) detail.textContent = 'JavaScript error: ' + (event.message || 'unknown error');
});

const $ = (s) => document.querySelector(s);
const $$ = (s) => [...document.querySelectorAll(s)];
const canvas = $('#scene');
const copyPanel = $('#sceneCopy');
const interactionPanel = $('#interactionPanel');
const chartPanel = $('#chartPanel');
const chartTitle = $('#chartTitle');
const chartKicker = $('#chartKicker');
const chartMeta = $('#chartMeta');
const curveA = $('#curveA');
const curveB = $('#curveB');
const axes = $('#axes');
const markers = $('#markers');
const deeperPanel = $('#deeperPanel');
const deeperContent = $('#deeperContent');
const objectPanel = $('#objectPanel');
const objectBreadcrumb = $('#objectBreadcrumb');
const objectKicker = $('#objectKicker');
const objectTitle = $('#objectTitle');
const objectBody = $('#objectBody');
const objectActions = $('#objectActions');
const hoverLabel = $('#hoverLabel');

const QUALITY = (() => {
  const coarse = matchMedia('(pointer: coarse)').matches;
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const lowCpu = navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4;
  const mobileWidth = innerWidth <= 760;
  const safe = coarse || lowCpu || mobileWidth;
  document.body.classList.toggle('quality-safe', safe);
  return { safe, reducedMotion, dpr: safe ? 1 : 1.5, shadows: !safe };
})();

const state = {
  scene: 1,
  paused: false,
  free: false,
  wavenumber: 1715,
  mirrorMm: 0,
  scanDirection: 1,
  scanRunning: false,
  scanStarted: false,
  mode: 'single',
  t: 0,
  beamClock: 0,
  transformProgress: 0,
  transformRunning: false,
  transformStep: 0,
  transformFocusWn: 760,
  spectrumMode: 'transmittance',
  selectedPeak: null,
  dragMirror: false,
  exploded: false,
  focusKey: null,
  focusSubpart: null,
  localExploded: null,
  hoverKey: null,
  pointerDown: null,
  pausedByFocus: false,
  componentDemo: null,
  componentDemoTime: 0,
  componentDemoMirrorHome: 0,
};

const MM_TO_WORLD = 0.26;
const DISPLAY_OPD_CM_PER_MM = 0.1; // physical conversion: 1 mm = 0.1 cm
const SCAN_MAX_MM = 0.25;
const SAMPLE_N = 768;
const MAX_OPD_CM = 0.06;

const renderer = new THREE.WebGLRenderer({ canvas, antialias: !QUALITY.safe, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, QUALITY.dpr));
renderer.setSize(canvas.clientWidth || innerWidth, canvas.clientHeight || innerHeight, false);
renderer.shadowMap.enabled = QUALITY.shadows;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputEncoding = THREE.sRGBEncoding;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 0.9;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x0d0f10, 0.014);
const camera = new THREE.PerspectiveCamera(40, innerWidth / innerHeight, 0.1, 180);
camera.position.set(14, 9, 18);
const controls = new THREE.OrbitControls(camera, renderer.domElement);
controls.enabled = false;
controls.enableDamping = true;
controls.dampingFactor = .06;
controls.target.set(0, 1.2, 0);
controls.minDistance = 7;
controls.maxDistance = 34;

const hemi = new THREE.HemisphereLight(0xaeb9b8, 0x111314, 1.15);
scene.add(hemi);
const key = new THREE.DirectionalLight(0xf0eee5, 3.5);
key.position.set(8, 14, 8);
key.castShadow = true;
key.shadow.mapSize.set(QUALITY.safe ? 512 : 1024, QUALITY.safe ? 512 : 1024);
key.shadow.camera.left = -18;
key.shadow.camera.right = 18;
key.shadow.camera.top = 18;
key.shadow.camera.bottom = -18;
scene.add(key);
const rim = new THREE.DirectionalLight(0x7899a0, 1.2);
rim.position.set(-10, 7, -12);
scene.add(rim);
const warmRim = new THREE.PointLight(0xb79f68, .35, 16);
warmRim.position.set(-4, 5, 5);
scene.add(warmRim);
const focusLight = new THREE.PointLight(0xd8ddda, 0, 8, 2);
focusLight.position.set(0, 3, 0);
scene.add(focusLight);

const matDark = new THREE.MeshStandardMaterial({ color: 0x25292a, metalness: .72, roughness: .38 });
const matBlack = new THREE.MeshStandardMaterial({ color: 0x15191a, metalness: .66, roughness: .44 });
const matMetal = new THREE.MeshStandardMaterial({ color: 0x565c5d, metalness: .88, roughness: .24 });
const matLightMetal = new THREE.MeshStandardMaterial({ color: 0x8c8578, metalness: .58, roughness: .32 });
const matCeramic = new THREE.MeshStandardMaterial({ color: 0xc8c5bb, metalness: .05, roughness: .72 });
const matGlass = new THREE.MeshPhysicalMaterial({ color: 0xaab4b2, transmission: QUALITY.safe ? 0 : .32, transparent: true, opacity: QUALITY.safe ? .24 : .48, metalness: 0, roughness: .08, thickness: .28, side: THREE.DoubleSide });
const matCoating = new THREE.MeshPhysicalMaterial({ color: 0xb7ab78, transparent: true, opacity: QUALITY.safe ? .20 : .32, metalness: .18, roughness: .12, transmission: QUALITY.safe ? 0 : .18, side: THREE.DoubleSide });
const matHousing = new THREE.MeshStandardMaterial({ color:0x252a2b, metalness:.76, roughness:.34, transparent:true, opacity:QUALITY.safe ? .34 : .52 });
const matMirror = new THREE.MeshStandardMaterial({ color: 0xa9adaa, metalness: 1, roughness: .055 });
const matMirrorEdge = new THREE.MeshStandardMaterial({ color: 0x343a3a, metalness: .82, roughness: .24 });
const matSignal = new THREE.MeshBasicMaterial({ color: 0xe5c56a, transparent: true, opacity: .92 });
const matSecondary = new THREE.MeshBasicMaterial({ color: 0x84a8b2, transparent: true, opacity: .8 });
const matGuide = new THREE.LineBasicMaterial({ color: 0x9da3a3, transparent: true, opacity: .35 });

function box(w,h,d,material=matDark) {
  const m = new THREE.Mesh(new THREE.BoxGeometry(w,h,d), material);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function cyl(r, h, material=matMetal, radial=32) {
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,radial),material);
  m.castShadow = true;
  return m;
}
function screw(x,y,z,scale=1) {
  const g = new THREE.Group();
  const head = cyl(.08*scale,.06*scale,matLightMetal,20); head.rotation.x=Math.PI/2;
  const slot = box(.1*scale,.018*scale,.018*scale,matBlack); slot.position.z=.032*scale;
  g.add(head,slot); g.position.set(x,y,z); return g;
}
function rail(length=4) {
  const g = new THREE.Group();
  const r1 = box(length,.16,.16,matMetal); r1.position.z=-.38;
  const r2 = box(length,.16,.16,matMetal); r2.position.z=.38;
  g.add(r1,r2);
  for (let i=-1;i<=1;i++){ const tie=box(.38,.08,1.0,matBlack); tie.position.x=i*length*.32; tie.position.y=-.09; g.add(tie); }
  return g;
}

const world = new THREE.Group();
scene.add(world);
const floor = new THREE.Mesh(new THREE.PlaneGeometry(60,60), new THREE.MeshStandardMaterial({ color:0x111415, roughness:.97, metalness:.03 }));
floor.rotation.x = -Math.PI/2; floor.position.y=-1.05; floor.receiveShadow=true; scene.add(floor);

const bench = box(16,.7,10,new THREE.MeshStandardMaterial({ color:0x1f2324, metalness:.74, roughness:.34 }));
bench.position.set(0,-.58,0); world.add(bench);
// bench perforation marks, intentionally restrained
const benchDetails=new THREE.Group(); world.add(benchDetails);
for(let x=-6.8;x<=6.8;x+=1.7){ for(let z=-4;z<=4;z+=1.7){
  const p = new THREE.Mesh(new THREE.CylinderGeometry(.045,.045,.012,12), new THREE.MeshBasicMaterial({color:0x0d0f10}));
  p.position.set(x,-.22,z); benchDetails.add(p);
}}

function mount(x,z,h=.9, scale=1) {
  const g = new THREE.Group();
  const base = box(1.8*scale,.28,1.5*scale,matMetal); base.position.y=-.1;
  const post = cyl(.16*scale,h,matMetal,28); post.position.y=h/2;
  const collar = cyl(.28*scale,.15,matBlack,28); collar.position.y=.18; 
  g.add(base,post,collar,screw(-.62*scale,.055,.48*scale,scale),screw(.62*scale,.055,.48*scale,scale));
  g.position.set(x,0,z); return g;
}

// Source, with aperture and conditioning optic
const source = new THREE.Group();
const sourceBody = box(2.1,1.5,1.8,matDark); source.add(sourceBody);
const sourceFace = new THREE.Mesh(new THREE.CircleGeometry(.32,48), new THREE.MeshStandardMaterial({ color:0x6d5b37, emissive:0xe5c56a, emissiveIntensity:.45, roughness:.4 }));
sourceFace.rotation.y=Math.PI/2; sourceFace.position.x=1.061; source.add(sourceFace);
const sourceRing = new THREE.Mesh(new THREE.TorusGeometry(.38,.07,12,48),matMetal); sourceRing.rotation.y=Math.PI/2; sourceRing.position.x=1.075; source.add(sourceRing);
// Optical axis is y=1.30 throughout the interferometer.
source.position.set(-6.2,1.30,0); world.add(source);
const sourceLensMount=mount(-4.45,0,.82,.72); world.add(sourceLensMount);
const sourceLens=new THREE.Mesh(new THREE.CylinderGeometry(.54,.54,.08,48),matGlass); sourceLens.rotation.z=Math.PI/2; sourceLens.position.set(-4.45,1.30,0); world.add(sourceLens);

// Beamsplitter on precision rotary mount
const bsMount=mount(0,0,1.18,1.05); world.add(bsMount);
const bsFrame=new THREE.Mesh(new THREE.TorusGeometry(1.18,.09,16,64),matMetal); bsFrame.rotation.y=Math.PI/2; bsFrame.position.set(0,1.28,0); world.add(bsFrame);
const beamsplitter=new THREE.Mesh(new THREE.BoxGeometry(.10,2.05,2.05),matGlass); beamsplitter.rotation.y=Math.PI/4; beamsplitter.position.set(0,1.28,0); world.add(beamsplitter);
const bsCoating=new THREE.Mesh(new THREE.PlaneGeometry(1.92,1.92),matCoating); bsCoating.rotation.y=-Math.PI/4; bsCoating.position.set(.041,1.28,-.041); world.add(bsCoating);
const bsClampGroup=new THREE.Group();
for(const sy of [-1,1]){ const clamp=box(.34,.18,.44,matBlack); clamp.position.set(.64,1.28+sy*.91,-.64); clamp.rotation.y=Math.PI/4; bsClampGroup.add(clamp); }
world.add(bsClampGroup);
const recombinationHalo=new THREE.Mesh(new THREE.RingGeometry(.13,.24,48),new THREE.MeshBasicMaterial({color:0xe5c56a,transparent:true,opacity:.18,side:THREE.DoubleSide,blending:THREE.AdditiveBlending,depthWrite:false})); recombinationHalo.rotation.x=Math.PI/2; recombinationHalo.position.set(0,1.305,0); world.add(recombinationHalo);

function mirrorAssembly(x,z,axis='x') {
  const g=new THREE.Group();
  const mnt=mount(0,0,1.3,.95); g.add(mnt);
  const y=1.35;
  const cradle=box(.34,1.62,1.68,matBlack); cradle.position.set(.18,y,0); g.add(cradle);
  const outerRing=new THREE.Mesh(new THREE.TorusGeometry(1.17,.105,14,64),matMetal); outerRing.rotation.y=Math.PI/2; outerRing.position.set(-.02,y,0); g.add(outerRing);
  const innerRing=new THREE.Mesh(new THREE.TorusGeometry(1.04,.055,12,64),matLightMetal); innerRing.rotation.y=Math.PI/2; innerRing.position.set(-.13,y,0); g.add(innerRing);
  const barrel=new THREE.Mesh(new THREE.CylinderGeometry(1.12,1.12,.24,64),matMirrorEdge); barrel.rotation.z=Math.PI/2; barrel.position.y=y; g.add(barrel);
  const mirror=new THREE.Mesh(new THREE.CylinderGeometry(1.02,1.02,.055,64),matMirror); mirror.rotation.z=Math.PI/2; mirror.position.set(axis==='x' ? -.14 : 0,y,axis==='z' ? .14 : 0); mirror.castShadow=true; g.add(mirror);
  for (const [yy,zz] of [[y+.72,.66],[y-.72,.66]]) { const knob=cyl(.12,.38,matLightMetal,24); knob.rotation.z=Math.PI/2; knob.position.set(.42,yy,zz); g.add(knob); }
  const lock=cyl(.16,.42,matBlack,24); lock.rotation.z=Math.PI/2; lock.position.set(.43,y,-.72); g.add(lock);
  g.position.set(x,0,z); return {group:g,mirror,barrel,outerRing,innerRing,cradle,lock,mount:mnt};
}
const fixed=mirrorAssembly(0,-4.1,'z'); fixed.group.rotation.y=Math.PI/2; world.add(fixed.group);
const moving=mirrorAssembly(4.3,0,'x'); world.add(moving.group);
const mirrorRail=rail(4.1); mirrorRail.position.set(3.7,-.13,0); world.add(mirrorRail);
const carriage=box(1.4,.22,1.25,matBlack); carriage.position.set(4.3,.03,0); world.add(carriage);

// V4 assembly roots: keep the physical model as the interaction surface.
const sourceAssembly=new THREE.Group(); world.add(sourceAssembly);
[source,sourceLensMount,sourceLens].forEach(o=>sourceAssembly.add(o));
const beamsplitterAssembly=new THREE.Group(); world.add(beamsplitterAssembly);
[bsMount,bsFrame,beamsplitter,bsCoating,bsClampGroup,recombinationHalo].forEach(o=>beamsplitterAssembly.add(o));
const movingAssembly=new THREE.Group(); world.add(movingAssembly);
[moving.group,mirrorRail,carriage].forEach(o=>movingAssembly.add(o));

// Sample and detector assemblies
const sampleGroup=new THREE.Group();
const sampleBody=box(1.8,1.7,2.2,new THREE.MeshStandardMaterial({color:0x3f4545,metalness:.38,roughness:.5})); sampleGroup.add(sampleBody);
const sampleSlot=box(.18,1.12,1.1,matBlack); sampleSlot.position.x=-.92; sampleGroup.add(sampleSlot);
const sampleWindow=new THREE.Mesh(new THREE.BoxGeometry(.08,1.0,.9),matGlass); sampleWindow.position.x=-1.02; sampleGroup.add(sampleWindow);
// The recombined output leaves the beamsplitter at 45° in the x-z plane.
sampleGroup.position.set(3.7,1.30,3.3); sampleGroup.rotation.y=3*Math.PI/4; world.add(sampleGroup);
const detectorGroup=new THREE.Group();
const detectorBody=box(1.8,1.9,1.8,matDark); detectorGroup.add(detectorBody);
const detectorAperture=new THREE.Mesh(new THREE.CircleGeometry(.33,40),new THREE.MeshStandardMaterial({color:0x222525,metalness:.75,roughness:.18})); detectorAperture.rotation.y=-Math.PI/2; detectorAperture.position.x=-.91; detectorGroup.add(detectorAperture);
const detectorRing=new THREE.Mesh(new THREE.TorusGeometry(.39,.065,12,42),matMetal); detectorRing.rotation.y=Math.PI/2; detectorRing.position.x=-.925; detectorGroup.add(detectorRing);
detectorGroup.position.set(5.25,1.30,4.85); detectorGroup.rotation.y=3*Math.PI/4; world.add(detectorGroup);

// Reference laser - intentionally subdued until scene 5 / free explore
const refLaser=new THREE.Group();
const laserBody=box(1.7,.62,.62,matBlack); refLaser.add(laserBody);
const laserAperture=new THREE.Mesh(new THREE.CircleGeometry(.12,24),new THREE.MeshBasicMaterial({color:0xa55f54})); laserAperture.rotation.y=Math.PI/2; laserAperture.position.x=.86; refLaser.add(laserAperture);
refLaser.position.set(-3.2,.45,-3.45); world.add(refLaser);

// Instrument enclosure: cutaway industrial shell, not a CAD replica.
const housing=new THREE.Group();
const chassis=box(16.9,.44,10.6,matHousing); chassis.position.y=-.92; housing.add(chassis);
const rearPanel=box(16.9,3.65,.24,matHousing); rearPanel.position.set(0,.95,-5.18); housing.add(rearPanel);
const leftPanel=box(.24,3.65,10.1,matHousing); leftPanel.position.set(-8.34,.95,.12); housing.add(leftPanel);
const rightRear=box(.24,3.65,3.1,matHousing); rightRear.position.set(8.34,.95,-3.5); housing.add(rightRear);
const fascia=box(4.4,2.0,.28,matHousing); fascia.position.set(5.8,.2,5.13); housing.add(fascia);
const lid=box(16.6,.24,10.2,matHousing); lid.position.set(0,4.15,-1.55); lid.rotation.x=-.035; housing.add(lid);
for(let i=0;i<8;i++){const vent=box(.06,.46,1.9,matBlack);vent.position.set(-6.4+i*.46,1.05,-5.33);housing.add(vent);}
const badge=box(2.2,.06,.52,matLightMetal); badge.position.set(5.8,.15,5.31); housing.add(badge);
housing.visible=false; world.add(housing);

// V4 · object-first inspection metadata. The model itself becomes the entry point.
const objectInfo={
  source:{
    label:'红外光源',kicker:'IR SOURCE',breadcrumb:'FTIR / 红外光源',camera:'focusSource',
    problem:'我们事先并不知道样品会在哪些波数吸收。如果一次只照一个波数，测完整段光谱会非常低效。',
    action:'光源同时提供许多红外波数成分，让一整段波数范围一起进入测量链。',
    quantity:'它主要决定“送进去有哪些波数和多少辐射”，而不是负责把波数分开。',
    result:'于是问题被转移给干涉仪：这些波数都混在一起时，怎样让探测器以后还能把它们区分出来？',
    watch:'观察宽带输入如何继续进入 Michelson 干涉仪。',
    deeper:'<h3>红外光源 · 深入</h3><p>真实 FTIR 的光源、工作波段以及后续光学材料取决于仪器配置。这里不绑定具体厂商，只保留“宽带输入 → 干涉编码”的测量逻辑。</p>'
  },
  beamsplitter:{
    label:'分束器',kicker:'BEAMSPLITTER',breadcrumb:'FTIR / 干涉仪 / 分束器',camera:'focusBS',explode:true,
    problem:'如果光只有一条路径，就没有第二条光路可以比较，也就无法用“光程差”产生稳定的干涉调制。',
    action:'分束器让同一束入射辐射产生部分透射与部分反射，建立两条干涉臂；两束返回光又在这里重新组合。',
    quantity:'它建立的是两条不同 optical path，而不是把红外按颜色或波长分开。',
    result:'两束光经历不同光程后具有相对相位；重合时，探测强度会随相位关系增强或减弱。',
    watch:'先看“分成两臂”，再看两束返回光在同一输出方向重合。',
    deeper:'<h3>分束器 · 深入</h3><p>教学模型将它表示为带功能镀膜的光学片。实际材料、镀膜、分束比与可用波段有关。关键不是色散，而是部分透射 / 部分反射以及返回后的重组。</p><div class="math">I ∝ 1 + cos(2πν̃δ)</div><p>上式是单波数、理想化情况下帮助理解相位调制的表达。</p>'
  },
  fixed:{
    label:'固定镜',kicker:'FIXED MIRROR',breadcrumb:'FTIR / 干涉仪 / 固定镜',camera:'focusFixed',explode:true,
    problem:'要判断“另一条光路改变了多少”，必须先有一条相对稳定的参考。',
    action:'固定镜把参考臂的光反射回分束器，并在教学模型中保持该臂几何光程不变。',
    quantity:'参考臂提供一个稳定的 optical path；变化主要来自移动镜所在的另一臂。',
    result:'这样两臂之差才可以明确写成 OPD，而不是两条光路同时无规则变化。',
    watch:'拖动移动镜时，比较固定臂与移动臂：一条保持不变，一条主动变化。',
    deeper:'<h3>固定镜 · 深入</h3><p>这里采用理想化 Michelson 结构。真实仪器还要控制镜面姿态、准直、机械稳定性以及具体的扫描机构；“固定”描述的是其在主扫描中的参考角色。</p>'
  },
  moving:{
    label:'移动镜',kicker:'MOVING MIRROR',breadcrumb:'FTIR / 干涉仪 / 移动镜',camera:'focusMoving',explode:true,
    problem:'不同波数现在仍混在同一束宽带红外里。怎样让它们留下可以被区分的变化规律？',
    action:'移动镜沿光轴改变一条干涉臂的长度。光要走到镜面再返回，所以镜面移动 Δx 会让该臂往返光程改变 2Δx。',
    quantity:'核心变量是 Optical Path Difference：δ。理想几何中，Δδ = 2Δx。',
    result:'因为相位 φ = 2πν̃δ，高波数随 OPD 变化得更快、低波数更慢；这就是后面能用傅里叶变换区分波数的基础。',
    watch:'直接拖动镜面，盯住 Δx、δ 和输出干涉强度如何一起变化。',
    deeper:'<h3>移动镜 · 深入</h3><p>Mirror displacement 与 OPD 不是同一个量。在本教学几何中：</p><div class="math">δ = 2(x − x<sub>ZPD</sub>)</div><p>因此单波数相位满足：</p><div class="math">φ = 2πν̃δ</div><p>三维位移为了课堂观察进行了视觉放大，数值仍按真实 mm / cm 换算。</p>'
  },
  sample:{
    label:'样品室',kicker:'SAMPLE COMPARTMENT',breadcrumb:'FTIR / 样品室',camera:'focusSample',
    problem:'仪器最终不是为了研究干涉仪本身，而是要知道样品改变了哪些红外波数。',
    action:'调制后的红外穿过样品区域；样品对某些波数吸收更强，对另一些波数影响较弱。',
    quantity:'样品改变的是不同 ν̃ 下到达探测器的辐射贡献，因此最终表现为波数相关的 transmittance / absorbance。',
    result:'这种选择性衰减把 Scene 01 的“分子振动选择性吸收”重新连接到最终 FTIR 光谱。',
    watch:'把样品看作“改变各波数权重”的对象，而不是一个分光元件。',
    deeper:'<h3>样品室 · 深入</h3><p>实际 FTIR 可以使用透射、ATR、漫反射等不同采样附件。当前采用简化透射路径，只服务于“样品改变波数分布 → 与背景比较”的核心逻辑。</p>'
  },
  detector:{
    label:'探测器',kicker:'DETECTOR',breadcrumb:'FTIR / 探测器',camera:'focusDetector',
    problem:'两束光已经重新组合，但探测器并不会直接告诉我们“这里有 1715 cm⁻¹”。那它实际记录什么？',
    action:'在每一个 OPD 位置，探测器只记录所有波数共同形成的总辐射信号。',
    quantity:'连续扫描得到一串 (δ, I) 数据点，形成 I(δ)——也就是 interferogram。',
    result:'因此一条看似复杂的干涉图里同时包含许多波数信息；下一步必须用数学方法把这些周期成分重新解析出来。',
    watch:'看信号从探测器位置逐点生成，再变成一条 OPD-domain 曲线。',
    deeper:'<h3>探测器 · 深入</h3><p>真实探测器的响应波段、速度与灵敏度取决于类型。教学模型只保留最重要的测量角色：总辐射变化 → 电信号 → interferogram，而不是让探测器直接完成光谱分辨。</p>'
  },
  laser:{
    label:'参考激光',kicker:'REFERENCE LASER',breadcrumb:'FTIR / 参考激光',camera:'focusLaser',
    problem:'如果不知道移动镜在每个采样时刻究竟走了多少，干涉图横轴 δ 就无法精确建立。',
    action:'参考激光提供稳定的位置参考，帮助系统确定镜位移与采样位置。',
    quantity:'它服务的是 position / OPD sampling 与波数标度，而不是样品的红外吸收信号。',
    result:'于是每个探测强度值都能和一个可靠的 OPD 位置对应起来。',
    watch:'把它理解成“尺子”，不是另一束用来分析样品的红外光。',
    deeper:'<h3>参考激光 · 深入</h3><p>具体参考激光路径与采样实现取决于仪器设计。这里展示的是典型测量角色，不把某一厂商拓扑当成全部 FTIR 的唯一方案。</p>'
  }
};
const subpartInfo={
  'bs.optic':{parent:'beamsplitter',label:'分束片',kicker:'OPTICAL PLATE',breadcrumb:'FTIR / 干涉仪 / 分束器 / 分束片',problem:'需要在同一位置建立两条相干比较光路。',action:'光学片让一部分辐射透射、另一部分反射。',quantity:'关键是透射 / 反射比例与光学相位关系。',result:'两条干涉臂由此建立，并能在返回后重新组合。'},
  'bs.coating':{parent:'beamsplitter',label:'功能镀膜面',kicker:'COATING',breadcrumb:'FTIR / 干涉仪 / 分束器 / 镀膜面',problem:'裸基片通常不能自动获得需要的分束性能。',action:'材料与镀膜共同调节特定工作波段内的反射和透射。',quantity:'影响分束比、工作波段与相位响应。',result:'让分束器在目标红外范围内具备可用的光学性能。'},
  'bs.mount':{parent:'beamsplitter',label:'分束器镜架',kicker:'PRECISION MOUNT',breadcrumb:'FTIR / 干涉仪 / 分束器 / 镜架',problem:'光学片姿态稍有漂移，两臂就可能无法可靠重合。',action:'镜架稳定并允许调整分束器的位置与角度。',quantity:'约束的是 alignment 与机械自由度。',result:'保证返回光能在正确位置重新重合。'},
  'moving.mirror':{parent:'moving',label:'反射镜面',kicker:'MIRROR SURFACE',breadcrumb:'FTIR / 干涉仪 / 移动镜 / 镜面',problem:'需要把可控机械位移直接转成光程变化。',action:'镜面反射光束并随滑台沿光轴平移。',quantity:'Δx → Δδ = 2Δx。',result:'机械扫描被转换为可用于干涉编码的 OPD 扫描。'},
  'moving.stage':{parent:'moving',label:'移动滑台',kicker:'TRANSLATION STAGE',breadcrumb:'FTIR / 干涉仪 / 移动镜 / 滑台',problem:'镜子如果同时横移、倾转和摆动，OPD 将难以稳定解释。',action:'滑台把主要运动约束为单轴平移。',quantity:'控制的是位移自由度与重复性。',result:'镜位移可以稳定映射为 OPD。'},
  'moving.rail':{parent:'moving',label:'精密导轨',kicker:'GUIDE RAIL',breadcrumb:'FTIR / 干涉仪 / 移动镜 / 导轨',problem:'长距离扫描需要稳定的直线运动基准。',action:'导轨约束滑台沿预定轴线运动。',quantity:'减少横向漂移与无关自由度。',result:'提高扫描几何的可重复性。'},
  'fixed.mirror':{parent:'fixed',label:'反射镜面',kicker:'MIRROR SURFACE',breadcrumb:'FTIR / 干涉仪 / 固定镜 / 镜面',problem:'参考臂需要把光原路送回。',action:'镜面反射参考臂光束回到分束器。',quantity:'参考臂 optical path 在教学模型中保持稳定。',result:'为移动臂的变化提供比较基准。'},
  'sample.window':{parent:'sample',label:'样品光窗',kicker:'SAMPLE WINDOW',breadcrumb:'FTIR / 样品室 / 光窗',problem:'红外需要经过样品区域而又保持明确光路。',action:'光窗定义样品与光束相互作用的通道。',quantity:'样品改变各波数的透过贡献。',result:'不同波数的衰减差异进入后续探测信号。'},
  'detector.aperture':{parent:'detector',label:'探测入口',kicker:'DETECTOR APERTURE',breadcrumb:'FTIR / 探测器 / 探测入口',problem:'调制后的辐射需要进入有效探测区域。',action:'入口限定并接收输出光束。',quantity:'进入探测器的是总辐射强度贡献。',result:'后续转换为随 OPD 变化的采样信号。'}
};

const hiddenHitMaterial=new THREE.MeshBasicMaterial({transparent:true,opacity:0,depthWrite:false});
hiddenHitMaterial.colorWrite=false;
const interactiveHitMeshes=[];
function addHitBox(parent,key,size,pos=new THREE.Vector3()){
  const m=new THREE.Mesh(new THREE.BoxGeometry(size[0],size[1],size[2]),hiddenHitMaterial);
  m.position.copy(pos); m.userData.interactiveKey=key; parent.add(m); interactiveHitMeshes.push(m); return m;
}
addHitBox(source,'source',[2.5,2.1,2.3]);
addHitBox(beamsplitterAssembly,'beamsplitter',[2.8,3.0,2.8],new THREE.Vector3(0,1.25,0));
addHitBox(fixed.group,'fixed',[2.6,2.9,2.6],new THREE.Vector3(0,1.25,0));
addHitBox(moving.group,'moving',[2.7,2.9,2.7],new THREE.Vector3(0,1.25,0));
addHitBox(sampleGroup,'sample',[2.2,2.2,2.5],new THREE.Vector3(0,.55,0));
addHitBox(detectorGroup,'detector',[2.2,2.4,2.2],new THREE.Vector3(0,.55,0));
addHitBox(refLaser,'laser',[2.0,1.1,1.1]);

// Subparts become selectable only after a local construction view is opened.
function tagSubpart(obj,key){obj.userData.subpartKey=key; obj.userData.interactiveKey=subpartInfo[key].parent;}
tagSubpart(beamsplitter,'bs.optic'); tagSubpart(bsCoating,'bs.coating'); tagSubpart(bsFrame,'bs.mount');
tagSubpart(moving.mirror,'moving.mirror'); tagSubpart(carriage,'moving.stage'); tagSubpart(mirrorRail,'moving.rail');
tagSubpart(fixed.mirror,'fixed.mirror'); tagSubpart(sampleWindow,'sample.window'); tagSubpart(detectorAperture,'detector.aperture');

function explodePart(obj,offset){return {obj,home:obj.position.clone(),offset:new THREE.Vector3(...offset)};}
const localExplodeSets={
  beamsplitter:[explodePart(beamsplitter,[.34,0,-.34]),explodePart(bsCoating,[.52,0,-.52]),explodePart(bsFrame,[-.18,0,.18]),explodePart(bsClampGroup,[.22,0,-.22])],
  moving:[explodePart(moving.mirror,[-.48,0,0]),explodePart(moving.innerRing,[-.27,0,0]),explodePart(moving.outerRing,[.13,0,0]),explodePart(moving.barrel,[.31,0,0]),explodePart(moving.cradle,[.48,0,0])],
  fixed:[explodePart(fixed.mirror,[-.48,0,0]),explodePart(fixed.innerRing,[-.27,0,0]),explodePart(fixed.outerRing,[.13,0,0]),explodePart(fixed.barrel,[.31,0,0]),explodePart(fixed.cradle,[.48,0,0])]
};
const interactiveRoots={source:sourceAssembly,beamsplitter:beamsplitterAssembly,fixed:fixed.group,moving:movingAssembly,sample:sampleGroup,detector:detectorGroup,laser:refLaser};

// V6 · unified component registry: one source of truth for identity, interaction, teaching and construction.
const componentRegistry=Object.fromEntries(Object.entries(objectInfo).map(([id,teaching])=>[id,{id,root:interactiveRoots[id],teaching,camera:teaching.camera,canExplode:!!teaching.explode,physicsRole:{source:'input spectrum',beamsplitter:'split/recombine',fixed:'reference path',moving:'OPD scan',sample:'spectral attenuation',detector:'I(delta) sampling',laser:'position reference'}[id]}]));
const subpartTargets=[beamsplitter,bsCoating,bsFrame,moving.mirror,carriage,mirrorRail,fixed.mirror,sampleWindow,detectorAperture];

// V5 · restrained CAD-like silhouette highlighting. The outline is a back-face
// shell around the actual render meshes; no bloom and no neon glow.
const outlineGroup=new THREE.Group(); scene.add(outlineGroup); outlineGroup.renderOrder=20;
const outlineMaterial=new THREE.MeshBasicMaterial({color:0xc9cdca,transparent:true,opacity:.22,side:THREE.BackSide,depthWrite:false,depthTest:true,toneMapped:false});
let outlinePairs=[];
function clearOutline(){for(const p of outlinePairs){outlineGroup.remove(p.clone);if(p.clone.material&&p.clone.material.dispose)p.clone.material.dispose();}outlinePairs=[];outlineGroup.visible=false;}
function outlineTargetFromInfo(info){
  if(!info)return null;
  if(info.subpart){return subpartTargets.find(o=>o.userData.subpartKey===info.subpart)||null;}
  return interactiveRoots[info.key]||null;
}
function setOutline(info,selected=false){
  clearOutline();
  if(QUALITY.safe||innerWidth<=760||!info)return;
  const root=outlineTargetFromInfo(info); if(!root)return;
  root.updateMatrixWorld(true);
  const addMesh=(m)=>{
    if(!m.isMesh||m.material===hiddenHitMaterial||!m.geometry||m===recombinationHalo)return;
    const clone=new THREE.Mesh(m.geometry,outlineMaterial.clone());
    clone.material.opacity=selected?.30:.20;
    clone.matrixAutoUpdate=false; clone.frustumCulled=false; clone.renderOrder=20;
    outlineGroup.add(clone); outlinePairs.push({source:m,clone});
  };
  if(root.isMesh)addMesh(root);else root.traverse(addMesh);
  outlineGroup.visible=outlinePairs.length>0;
  updateOutlineMatrices();
}
function updateOutlineMatrices(){
  if(!outlineGroup.visible)return;
  const expansion=new THREE.Matrix4().makeScale(1.025,1.025,1.025);
  for(const p of outlinePairs){p.source.updateMatrixWorld(true);p.clone.matrix.copy(p.source.matrixWorld).multiply(expansion);}
}


// Molecule: CO2 teaching model
const molecule=new THREE.Group();
function atom(r,color,x,y,z){const m=new THREE.Mesh(new THREE.SphereGeometry(r,40,28),new THREE.MeshStandardMaterial({color,roughness:.5,metalness:.03}));m.position.set(x,y,z);m.castShadow=true;molecule.add(m);return m;}
function bond(a,b,r=.11){const dir=new THREE.Vector3().subVectors(b,a),len=dir.length();const m=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,20),matCeramic);m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());molecule.add(m);return m;}
const O1=atom(.5,0xc3c9c8,-1.25,0,0), C=atom(.58,0x555c5d,0,0,0), O2=atom(.5,0xc3c9c8,1.25,0,0); bond(O1.position,C.position,.12); bond(C.position,O2.position,.12);
molecule.position.set(0,1.6,0); scene.add(molecule);

// Beam rendering: shader-revealed cylinders, one segment per physical leg
const beams=new THREE.Group(); world.add(beams);
function beamMaterial(color=0xe5c56a){
  return new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,uniforms:{uColor:{value:new THREE.Color(color)},uOpacity:{value:.92},uReveal:{value:1},uTail:{value:.22}},vertexShader:`varying vec2 vUv; void main(){vUv=uv;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}`,fragmentShader:`uniform vec3 uColor;uniform float uOpacity;uniform float uReveal;uniform float uTail;varying vec2 vUv;void main(){float x=vUv.y;float head=smoothstep(uReveal+.015,uReveal-.015,x);float tail=smoothstep(uReveal-uTail-.06,uReveal-uTail+.06,x);float a=max(0.0,head-tail*.72);a*=smoothstep(0.0,.08,x)*smoothstep(1.0,.92,x);if(a<.01)discard;gl_FragColor=vec4(uColor,a*uOpacity);}`});
}
function makeBeamSegment(a,b,color=0xe5c56a,r=.042){
  const dir=new THREE.Vector3().subVectors(b,a),len=dir.length();
  const mat=beamMaterial(color); const mesh=new THREE.Mesh(new THREE.CylinderGeometry(r,r,len,14,16,true),mat);
  mesh.position.copy(a).add(b).multiplyScalar(.5); mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize()); beams.add(mesh);
  return {mesh,mat,a:a.clone(),b:b.clone(),length:len};
}
const P={source0:new THREE.Vector3(-5.05,1.3,0),bs:new THREE.Vector3(0,1.3,0),fixed:new THREE.Vector3(0,1.3,-3.45),moving:new THREE.Vector3(3.48,1.3,0),sample:new THREE.Vector3(3.7,1.3,3.3),detector:new THREE.Vector3(5.25,1.3,4.85)};
const beamSegments=[
  makeBeamSegment(P.source0,P.bs),
  makeBeamSegment(P.bs,P.fixed),
  makeBeamSegment(P.fixed,P.bs),
  makeBeamSegment(P.bs,P.moving),
  makeBeamSegment(P.moving,P.bs),
  makeBeamSegment(P.bs,P.sample),
  makeBeamSegment(P.sample,P.detector)
];

// Localized phase ribbons near the recombination/output port. They are pedagogical
// phase traces, not literal visible electromagnetic waves.
const interferenceWaves=new THREE.Group(); world.add(interferenceWaves);
function dynamicWave(opacity=.5,width=1){
  const geom=new THREE.BufferGeometry();
  const mat=new THREE.LineBasicMaterial({color:0xe5c56a,transparent:true,opacity,linewidth:width,depthWrite:false,blending:THREE.AdditiveBlending});
  const line=new THREE.Line(geom,mat); interferenceWaves.add(line); return line;
}
const fixedReturnWave=dynamicWave(.28), movingReturnWave=dynamicWave(.62), resultantWave=dynamicWave(.92);
const overlapGuide=dynamicWave(.18); overlapGuide.material.color.set(0xc7c0a9);
function setWaveGeometry(line, points){
  const pos=line.geometry.getAttribute('position');
  if(pos && pos.count===points.length){
    for(let i=0;i<points.length;i++) pos.setXYZ(i,points[i].x,points[i].y,points[i].z);
    pos.needsUpdate=true;
  } else {
    line.geometry.setFromPoints(points);
  }
}
function updateInterferenceWaves(){
  if(!interferenceWaves.visible) return;
  const deltaCm=2*state.mirrorMm*DISPLAY_OPD_CM_PER_MM;
  const wn=state.mode==='single'?state.wavenumber:1715;
  const phase=2*Math.PI*wn*deltaCm;
  const n=QUALITY.safe?40:72;
  const a=[],b=[],r=[],g=[];
  const start=P.bs.clone(), end=P.sample.clone();
  const dir=end.clone().sub(start), total=dir.length(); dir.normalize();
  const side=new THREE.Vector3(-dir.z,0,dir.x).normalize();
  const mergeU=.42;
  for(let i=0;i<=n;i++){
    const u=i/n, carrier=u*Math.PI*8.2;
    const center=start.clone().addScaledVector(dir,total*(.04+u*mergeU));
    const wave=.075*Math.sin(carrier);
    const wave2=.075*Math.sin(carrier+phase);
    a.push(center.clone().addScaledVector(side,wave).add(new THREE.Vector3(0,.055,0)));
    b.push(center.clone().addScaledVector(side,wave2).add(new THREE.Vector3(0,-.055,0)));
    g.push(center.clone());
  }
  for(let i=0;i<=n;i++){
    const u=i/n, carrier=u*Math.PI*8.2;
    const center=start.clone().addScaledVector(dir,total*(mergeU+u*(.92-mergeU)));
    const amp=.105*Math.cos(phase/2);
    r.push(center.clone().addScaledVector(side,amp*Math.sin(carrier+phase/2)));
  }
  setWaveGeometry(fixedReturnWave,a); setWaveGeometry(movingReturnWave,b); setWaveGeometry(resultantWave,r); setWaveGeometry(overlapGuide,g);
  const visibility=Math.abs(Math.cos(phase/2));
  resultantWave.material.opacity=.20+.78*visibility;
  recombinationHalo.material.opacity=.08+.34*visibility;
  // Output beam intensity represents constructive/destructive interference at the output port.
  const detectorFactor=.15+.85*((interferogramAt(deltaCm,state.mode)+1)/2);
  beamSegments[5].mat.uniforms.uOpacity.value=.18+.74*detectorFactor;
  beamSegments[6].mat.uniforms.uOpacity.value=.18+.74*detectorFactor;
}

// Reference laser path, scene 5 only
const refBeamSegments=[makeBeamSegment(new THREE.Vector3(-2.35,.8,-3.45),new THREE.Vector3(0,.8,-3.45),0xa55f54,.018)];
refBeamSegments.forEach(s=>s.mesh.visible=false);

// OPD dimension line objects
const opdGuide=new THREE.Group(); world.add(opdGuide);
const guideGeom=new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(3.45,2.65,-.6),new THREE.Vector3(4.3,2.65,-.6)]);
const guideLine=new THREE.Line(guideGeom,matGuide); opdGuide.add(guideLine);
for(const x of [3.45,4.3]){const tick=new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(x,2.52,-.6),new THREE.Vector3(x,2.78,-.6)]),matGuide);opdGuide.add(tick);}
opdGuide.visible=false;

// Camera states
const cameraStates={
  1:{pos:[0,2.2,9.4],target:[0,1.55,0],fov:34},
  2:{pos:[11.8,8.4,12.8],target:[.3,1.15,-.6],fov:39},
  3:{pos:[10.8,7.8,13.8],target:[1.0,1.15,.3],fov:40},
  4:{pos:[13.2,10.5,17.4],target:[0,1.2,0],fov:40},
  5:{pos:[15.7,8.5,17.4],target:[1.2,1.0,1.2],fov:42},
  opd:{pos:[8.6,5.1,8.8],target:[2.4,1.4,0],fov:36},
  focusSource:{pos:[-1.2,4.4,6.3],target:[-5.0,1.0,.15],fov:31},
  focusBS:{pos:[5.4,4.8,6.4],target:[.7,1.32,.25],fov:29},
  focusFixed:{pos:[5.0,4.4,-.1],target:[.65,1.28,-3.8],fov:30},
  focusMoving:{pos:[8.4,4.7,5.8],target:[4.85,1.35,.25],fov:30},
  focusSample:{pos:[8.0,4.5,8.3],target:[4.2,.9,3.45],fov:31},
  focusDetector:{pos:[10.0,4.7,7.5],target:[6.55,.95,3.45],fov:31},
  focusLaser:{pos:[1.2,3.6,.6],target:[-2.8,.65,-3.25],fov:31}
};
let camFrom={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov},camTo=cameraStates[1],camLerp=1;
function goCamera(id){camFrom={pos:camera.position.clone(),target:controls.target.clone(),fov:camera.fov};camTo=typeof id==='object'?id:cameraStates[id];camLerp=0;}

const copy={
1:{code:'01 / MOLECULAR ABSORPTION',title:'为什么分子会“挑着”吸收红外？',body:'不同振动模式具有不同能量间隔。入射红外只有在能量匹配、并且该振动会改变偶极矩时，才可能产生常规红外吸收。',formula:'ΔE = hν',note:'先看“哪些振动能响应”，再问仪器怎样把许多波数一次测出来。',deeper:`<h3>深入 · IR-ACTIVE</h3><p>对常规电偶极红外吸收，一个振动模式需要在振动过程中引起偶极矩变化。</p><div class="math">(∂μ / ∂Q)<sub>0</sub> ≠ 0</div><p><code>Q</code> 表示 normal coordinate，<code>μ</code> 表示 dipole moment。当前分子动画只用于建立选择规则与振动模式的直觉。</p>`},
2:{code:'02 / MICHELSON INTERFEROMETER',title:'怎样让混在一起的波数留下不同“节奏”？',body:'Michelson 干涉仪先建立两条可比较的光路，再让移动镜连续改变其中一条的往返光程。这样不同波数会随 OPD 产生不同快慢的相位变化。',formula:'Δδ = 2Δx',note:'桌面端直接停留或点击模型即可探索。重点不是记零件，而是看每个部件解决了哪个测量问题。',deeper:`<h3>深入 · 光程差</h3><p>在理想化 Michelson 几何中，移动镜相对 ZPD 位置移动 Δx，该臂往返光程改变 2Δx：</p><div class="math">δ = 2(x − x<sub>ZPD</sub>)</div><p>因此不同波数的相位满足 <code>φ = 2πν̃δ</code>。这条关系直接通向 interferogram。</p>`},
3:{code:'03 / INTERFEROGRAM',title:'一个波数留下一种周期，许多波数叠成一条干涉图。',body:'移动镜扫描 OPD 时，单一波数产生周期变化；波数越高，同样 OPD 范围内振荡越密。探测器只记录这些贡献的总和，因此得到 I(δ)。',formula:'φ = 2πν̃δ',note:'这一幕只保留 Michelson 核心与探测器。先比较单一 / 多个 / 宽带，再观察 ZPD 附近的 centerburst。',deeper:`<h3>深入 · 干涉图</h3><p>理想化交流分量可以写成：</p><div class="math">I(δ) = ∫ B(ν̃) cos(2πν̃δ) dν̃</div><p>探测器没有直接“识别 1715 cm⁻¹”；它只记录每个 OPD 位置上的总信号。不同波数的信息体现在不同的 OPD 空间周期中。</p>`},
4:{code:'04 / FOURIER TRANSFORM',title:'复杂曲线里，波数信息其实从未消失。',body:'干涉图中“振荡得多快”对应波数高低。傅里叶变换不是制造新信息，而是把同一组数据从 OPD 域重新表达为波数域。',formula:'I(δ) ⇄ B(ν̃)',note:'3D 仪器退到背景，只留下空间记忆；这一幕真正的主角是 interferogram 与 spectrum 的对应关系。',deeper:`<h3>深入 · 数学关系</h3><div class="math">I(δ) = ∫ B(ν̃) cos(2πν̃δ) dν̃</div><p><code>I(δ)</code> 是 OPD-domain interferogram，<code>B(ν̃)</code> 是 wavenumber-domain spectral distribution。有限扫描长度意味着实际变换并不是理想无限区间积分。</p>`},
5:{code:'05 / FTIR SPECTRUM',title:'为什么傅里叶变换后，还不能直接叫“样品吸收谱”？',body:'光源、光学系统和环境本身也会影响响应。因此先测 Background，再测 Sample；两者的 single-beam spectra 作比，才把重点放到样品造成的相对变化。',formula:'T = Iₛₐₘₚₗₑ / Iᵦₐcₖgᵣₒᵤₙd',note:'默认让谱图成为主体；只有最终整机总结时，完整 3D 仪器才重新出现。',deeper:`<h3>深入 · 透射率 / 吸光度</h3><div class="math">T(ν̃)=I<sub>sample</sub>/I<sub>background</sub></div><div class="math">A(ν̃)=−log<sub>10</sub>T(ν̃)</div><p>Background correction 的核心是比值，而不是简单减法。实际 background 还可能受到水汽、CO₂、光源漂移、附件状态等影响。</p>`}
};

function renderCopy(){const d=copy[state.scene];const phase={1:'先观察现象',2:'操作仪器',3:'观察探测结果',4:'解析数据',5:'解释光谱'}[state.scene];copyPanel.innerHTML=`<div class="lesson-phase">${phase}</div><div class="section-code">${d.code}</div><h2>${d.title}</h2><p>${d.body}</p><div class="formula">${d.formula}</div><p class="science-note">${d.note}</p><button class="deeper-trigger">深入解释</button>`;copyPanel.querySelector('.deeper-trigger').onclick=()=>{deeperContent.innerHTML=d.deeper;deeperPanel.classList.add('open');deeperPanel.setAttribute('aria-hidden','false');document.body.classList.add('deeper-open');};}

function phaseSvg(){
  return `<div class="phase-panel"><div class="phase-head"><span>探测器处相位</span><strong id="phaseValue">0.00 rad</strong></div><svg id="phasePlot" viewBox="0 0 360 116" aria-label="两臂相位与叠加"><path id="waveFixed" class="phase-wave fixed"/><path id="waveMoving" class="phase-wave moving"/><path id="waveSum" class="phase-wave sum"/><line x1="0" y1="58" x2="360" y2="58" class="phase-axis"/></svg><div class="phase-foot"><span>固定臂</span><span>移动臂</span><span>合成</span></div></div>`;
}
function renderControls(){
  if(state.scene===1){interactionPanel.innerHTML=`<div class="control-label"><span>入射波数</span><strong id="wnValue">${state.wavenumber} cm⁻¹</strong></div><input id="wnSlider" class="range" type="range" min="400" max="4000" value="${state.wavenumber}" step="5"><div class="control-ticks"><span>400</span><span>2000</span><span>4000 cm⁻¹</span></div>`;$('#wnSlider').oninput=e=>{state.wavenumber=+e.target.value;$('#wnValue').textContent=`${state.wavenumber} cm⁻¹`;};}
  else if(state.scene===2){interactionPanel.innerHTML=`<div class="mirror-instruction">直接拖动移动镜 <span>观察机械量怎样变成探测信号</span></div><div class="control-label"><span>镜面位移</span><strong id="mirrorValue">Δx = ${state.mirrorMm.toFixed(2)} mm</strong></div><input id="mirrorSlider" class="range" type="range" min="-${SCAN_MAX_MM}" max="${SCAN_MAX_MM}" step="0.01" value="${state.mirrorMm}"><div class="control-ticks"><span>−0.25</span><span>ZPD</span><span>+0.25 mm</span></div><div class="opd-readout"><span>光程差</span><strong id="opdValue">δ = ${(2*state.mirrorMm).toFixed(2)} mm</strong><small>往返光程 = Δx + Δx</small></div><div class="detector-preview"><div class="detector-preview-head"><span>探测器此刻记录</span><strong id="detectorNow">I = 1.00</strong></div><svg viewBox="0 0 320 70" aria-label="当前探测器信号"><line x1="8" y1="58" x2="312" y2="58"/><path id="detectorTrail" d=""/><circle id="detectorDot" cx="160" cy="12" r="3.5"/></svg><small>继续扫描，这些 (δ, I) 点会连成干涉图。</small></div>`;$('#mirrorSlider').oninput=e=>setMirrorMm(+e.target.value,true);updateDetectorPreview();}
  else if(state.scene===3){const modeName={single:'单一波数',multiple:'多个波数',broadband:'宽带红外'}[state.mode];const singleControl=state.mode==='single'?`<div class="single-frequency-control"><div class="control-label"><span>教学波数</span><strong id="scene3WnValue">${state.wavenumber} cm⁻¹</strong></div><input id="scene3WnSlider" class="range" type="range" min="400" max="4000" step="10" value="${state.wavenumber}"></div>`:'';interactionPanel.innerHTML=`<div class="control-label"><span>信号组成</span><strong>${modeName}</strong></div><div class="text-selector"><button data-mode="single">单一波数</button><button data-mode="multiple">多个波数</button><button data-mode="broadband">宽带红外</button></div><div class="scan-lab"><span>亲手生成干涉图</span><strong>移动镜每到一个 OPD 位置，探测器只记录一个 I 值。</strong><button id="scanBtn" class="primary-action">${state.scanRunning?'暂停扫描':(state.scanStarted?'继续扫描':'开始扫描')}</button><small>也可以直接拖动 3D 移动镜；曲线只绘制已经扫描过的区间。</small></div><div class="concept-cue"><b>观察关系</b><span>波数越高 → 相同 OPD 范围内振荡越密</span></div>${singleControl}${phaseSvg()}`;$$('[data-mode]').forEach(b=>{b.classList.toggle('active',b.dataset.mode===state.mode);b.onclick=()=>{state.mode=b.dataset.mode;state.scanRunning=false;state.scanStarted=false;setMirrorMm(-SCAN_MAX_MM,false);renderControls();renderInterferogram();};});const scanBtn=$('#scanBtn');if(scanBtn)scanBtn.onclick=()=>{if(!state.scanStarted){state.scanStarted=true;setMirrorMm(-SCAN_MAX_MM,false);}state.scanRunning=!state.scanRunning;state.paused=false;renderControls();renderInterferogram();};const scene3Slider=$('#scene3WnSlider');if(scene3Slider)scene3Slider.oninput=e=>{state.wavenumber=+e.target.value;$('#scene3WnValue').textContent=`${state.wavenumber} cm⁻¹`;state.scanRunning=false;state.scanStarted=false;setMirrorMm(-SCAN_MAX_MM,false);renderControls();renderInterferogram();updatePhasePanel();};updatePhasePanel();}
  else if(state.scene===4){
    const stepText=[
      '先不要急着看公式。先从复杂干涉图里找一个变化较慢的周期。',
      '慢周期已经被单独标出。它对应较低的波数：760 cm⁻¹。',
      '再比较一个明显更快的周期。相同 OPD 内，它完成了更多次振荡。',
      '快周期对应更高波数：2950 cm⁻¹。现在把所有周期一起交给傅里叶变换。',
      '傅里叶变换没有创造新信息：它把 OPD 域中不同的振荡周期重新排列成波数轴上的谱峰。'
    ][state.transformStep];
    const action=state.transformStep===0?'找出慢周期':state.transformStep===1?'比较快周期':state.transformStep===2?'定位高波数':state.transformStep===3?'恢复完整光谱':'重新解析';
    interactionPanel.innerHTML=`<div class="transform-readout"><span>当前问题</span><strong>这条复杂曲线里藏着哪些波数？</strong></div><div class="transform-lesson"><span>步骤 ${Math.min(state.transformStep+1,5)} / 5</span><p>${stepText}</p></div><div class="concept-cue"><b>核心对应</b><span>OPD 中振荡越快 ↔ 波数越高</span></div><button id="decomposeBtn" class="primary-action">${action}</button><button id="autoTransformBtn" class="quiet-action">连续演示</button>`;
    $('#decomposeBtn').onclick=()=>advanceTransformLesson();
    $('#autoTransformBtn').onclick=()=>{state.transformStep=0;state.transformProgress=0;state.transformRunning=true;};
    renderTransformLesson();
  }
  else {const demoT=sampleTransmittance(1715);interactionPanel.innerHTML=`<div class="control-label"><span>显示方式</span><strong>${state.spectrumMode==='absorbance'?'吸光度':'透射率'}</strong></div><div class="text-selector"><button id="transBtn" class="${state.spectrumMode==='transmittance'?'active':''}">透射率 %T</button><button id="absBtn" class="${state.spectrumMode==='absorbance'?'active':''}">吸光度 A</button></div><div class="ratio-demo"><b>教学示例 · 1715 cm⁻¹</b><span>背景 1.00 → 样品 ${demoT.toFixed(2)} → T = ${demoT.toFixed(2)}</span></div><button id="explodeBtn" class="primary-action">${state.exploded?'返回光谱':'查看整机结构'}</button><div id="peakInfo" class="peak-info">点击谱图中的标记峰查看谨慎归属。</div>`;$('#transBtn').onclick=()=>{state.spectrumMode='transmittance';renderControls();renderSpectrum();};$('#absBtn').onclick=()=>{state.spectrumMode='absorbance';renderControls();renderSpectrum();};$('#explodeBtn').onclick=()=>{state.exploded=!state.exploded;document.body.classList.toggle('system-exploded',state.exploded);renderControls();updateVisibility();if(state.exploded)goCamera(5);};}
}

function updateDetectorPreview(){
  if(state.scene!==2)return;
  const value=(interferogramAt(2*state.mirrorMm*DISPLAY_OPD_CM_PER_MM,'single')+1)/2;
  const now=$('#detectorNow'),dot=$('#detectorDot'),trail=$('#detectorTrail');
  if(now)now.textContent=`I = ${value.toFixed(2)}`;
  if(dot)dot.setAttribute('cy',String(58-value*44));
  if(trail){let d='';for(let i=0;i<=72;i++){const mm=-SCAN_MAX_MM+2*SCAN_MAX_MM*i/72;const v=(interferogramAt(2*mm*DISPLAY_OPD_CM_PER_MM,'single')+1)/2;const x=8+i/72*304,y=58-v*44;d+=`${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)} `;}trail.setAttribute('d',d);}
}

function setMirrorMm(v, user=false){
  state.mirrorMm=THREE.MathUtils.clamp(v,-SCAN_MAX_MM,SCAN_MAX_MM);
  const x=4.3+state.mirrorMm*MM_TO_WORLD; moving.group.position.x=x; carriage.position.x=x;
  P.moving.set(3.48+state.mirrorMm*MM_TO_WORLD,1.3,0); updateBeamGeometry(3,P.bs,P.moving); updateBeamGeometry(4,P.moving,P.bs);
  const a=$('#mirrorValue'),b=$('#opdValue'); if(a)a.textContent=`Δx = ${state.mirrorMm.toFixed(2)} mm`; if(b)b.textContent=`δ = ${(2*state.mirrorMm).toFixed(2)} mm`;
  if(state.scene===3){state.scanStarted=true;renderInterferogram();updatePhasePanel();}
  if(state.scene===2)updateDetectorPreview();
  if(user) state.paused=true;
}
function updateBeamGeometry(index,a,b){const seg=beamSegments[index],dir=new THREE.Vector3().subVectors(b,a),len=dir.length();seg.mesh.geometry.dispose();seg.mesh.geometry=new THREE.CylinderGeometry(.042,.042,len,14,16,true);seg.mesh.position.copy(a).add(b).multiplyScalar(.5);seg.mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.clone().normalize());seg.a.copy(a);seg.b.copy(b);seg.length=len;}

// V4 · object-first inspection + direct mirror drag
const raycaster=new THREE.Raycaster();
const pointer=new THREE.Vector2();
const dragPlane=new THREE.Plane(new THREE.Vector3(0,1,0),-1.35);
const hitPoint=new THREE.Vector3();
function pointerNDC(e){const r=canvas.getBoundingClientRect();pointer.x=((e.clientX-r.left)/r.width)*2-1;pointer.y=-((e.clientY-r.top)/r.height)*2+1;}
function desktopInspectionAllowed(){return innerWidth>760 && (state.scene===2 || state.free || (state.scene===5&&state.exploded));}
function climbUserData(obj,field){let p=obj;while(p){if(p.userData&&p.userData[field])return p.userData[field];p=p.parent;}return null;}
function raycastInfo(e){
  if(!desktopInspectionAllowed())return null;
  pointerNDC(e);raycaster.setFromCamera(pointer,camera);
  if(state.localExploded){
    const subHits=raycaster.intersectObjects(subpartTargets,true);
    for(const h of subHits){const sub=climbUserData(h.object,'subpartKey');if(sub&&subpartInfo[sub]&&subpartInfo[sub].parent===state.localExploded)return {key:subpartInfo[sub].parent,subpart:sub};}
  }
  const hits=raycaster.intersectObjects(interactiveHitMeshes,false);
  for(const h of hits){const key=h.object.userData.interactiveKey;if(!key)continue;if(key==='laser'&&!refLaser.visible)continue;return {key,subpart:null};}
  return null;
}
let hoverIntentTimer=0;
let activeHoverSignature='';
let pendingHoverSignature='';
let pendingHoverPoint={clientX:0,clientY:0};
function hoverSignature(info){return info?`${info.key}:${info.subpart||''}`:'';}
function applyHover(info,e){
  const sig=hoverSignature(info);
  activeHoverSignature=sig;
  const label=info?(info.subpart?subpartInfo[info.subpart].label:objectInfo[info.key].label):'';
  state.hoverKey=sig||null;
  document.body.classList.toggle('model-hover',!!info);
  document.body.classList.toggle('mirror-hover',!!info&&info.key==='moving'&&!state.localExploded);
  if(!hoverLabel)return;
  if(!info){hoverLabel.classList.remove('visible');hoverLabel.setAttribute('aria-hidden','true');if(state.focusKey)setOutline({key:state.focusKey,subpart:state.focusSubpart},true);else clearOutline();return;}
  hoverLabel.textContent=label;
  hoverLabel.style.left=`${Math.min(innerWidth-150,e.clientX+15)}px`;
  hoverLabel.style.top=`${Math.min(innerHeight-42,e.clientY+13)}px`;
  hoverLabel.classList.add('visible');hoverLabel.setAttribute('aria-hidden','false');
  setOutline(info,false);
}
function queueHover(info,e){
  const sig=hoverSignature(info);
  pendingHoverPoint={clientX:e.clientX,clientY:e.clientY};
  if(sig===activeHoverSignature){
    pendingHoverSignature='';clearTimeout(hoverIntentTimer);
    if(info&&hoverLabel){hoverLabel.style.left=`${Math.min(innerWidth-150,e.clientX+15)}px`;hoverLabel.style.top=`${Math.min(innerHeight-42,e.clientY+13)}px`;}
    return;
  }
  if(sig===pendingHoverSignature)return;
  clearTimeout(hoverIntentTimer);pendingHoverSignature=sig;
  if(!info){pendingHoverSignature='';applyHover(null,e);return;}
  hoverIntentTimer=setTimeout(()=>{pendingHoverSignature='';applyHover(info,pendingHoverPoint);},120);
}
function renderObjectPanel(key,subpart=null){
  const d=subpart?subpartInfo[subpart]:objectInfo[key]; if(!d)return;
  objectBreadcrumb.textContent=d.breadcrumb;
  objectKicker.textContent=d.kicker;
  objectTitle.textContent=d.label;
  objectBody.innerHTML=`
    <div class="teach-question"><span>为什么需要它？</span><p>${d.problem}</p></div>
    <div class="teach-causal"><p>${d.action}</p><i>↓</i><strong>${d.quantity}</strong><i>↓</i><p>${d.result}</p></div>
    ${d.watch?`<div class="watch-cue"><span>现在只看这一点</span><p>${d.watch}</p></div>`:''}
    ${!subpart&&['beamsplitter','moving','detector'].includes(key)?`<div class="principle-demo"><span>模型正在说明</span><strong id="principleDemoTitle">${key==='beamsplitter'?'同一束光如何建立两条可比较光路':key==='moving'?'机械位移如何变成 OPD 与强度变化':'探测器怎样逐点得到 I(δ)'}</strong><p id="principleDemoStatus">点击组件后，模型会自动演示一次。</p></div>`:''}`;
  objectActions.innerHTML='';
  if(subpart){
    const back=document.createElement('button');back.textContent='返回组件';back.onclick=()=>{state.focusSubpart=null;renderObjectPanel(key,null);setOutline({key},true);};objectActions.appendChild(back);
  }else{
    if(['beamsplitter','moving','detector'].includes(key)){
      const replay=document.createElement('button');replay.className='primary';replay.textContent='重播原理';replay.onclick=()=>startComponentDemo(key,true);objectActions.appendChild(replay);
    }
    if(objectInfo[key].explode){
      const structure=document.createElement('button');structure.className='primary';structure.textContent=state.localExploded===key?'收拢构造':'拆解构造';structure.onclick=()=>{stopComponentDemo(false);state.localExploded=state.localExploded===key?null:key;state.focusSubpart=null;renderObjectPanel(key,null);setOutline({key},true);};objectActions.appendChild(structure);
    }
    const deeper=document.createElement('button');deeper.textContent='深入原理';deeper.onclick=()=>{deeperContent.innerHTML=objectInfo[key].deeper;deeperPanel.classList.add('open');deeperPanel.setAttribute('aria-hidden','false');document.body.classList.add('deeper-open');};objectActions.appendChild(deeper);
  }
  objectPanel.classList.add('open');objectPanel.setAttribute('aria-hidden','false');
}

function setPrincipleDemoStatus(text,title=null){
  const p=$('#principleDemoStatus'),h=$('#principleDemoTitle');
  if(p)p.textContent=text;if(h&&title)h.textContent=title;
}
function startComponentDemo(key,restart=false){
  if(state.scene!==2||!['beamsplitter','moving','detector'].includes(key)||state.localExploded)return;
  state.componentDemo=key;state.componentDemoTime=0;state.componentDemoMirrorHome=state.mirrorMm;
  if(key==='beamsplitter')setPrincipleDemoStatus('先看入射光到达分束器。接下来同一束辐射会同时建立两条干涉臂。');
  if(key==='moving'){state.componentDemoMirrorHome=0;setMirrorMm(0,false);setPrincipleDemoStatus('镜面开始沿光轴移动。注意：它不是在选择某一个波长。');}
  if(key==='detector'){state.componentDemoMirrorHome=state.mirrorMm;setPrincipleDemoStatus('保持注意力在探测器：每一个 OPD 位置只记录一个总强度值 I。');}
}
function stopComponentDemo(restoreMirror=false){
  if(restoreMirror&&state.componentDemo&&['moving','detector'].includes(state.componentDemo))setMirrorMm(state.componentDemoMirrorHome,false);
  state.componentDemo=null;state.componentDemoTime=0;
}
function updateComponentDemo(dt){
  const demo=state.componentDemo;if(!demo||state.focusKey!==demo||state.localExploded)return;
  state.componentDemoTime+=dt;const t=state.componentDemoTime;
  if(demo==='beamsplitter'){
    // Override the normal beam reveal just during this short explanation.
    const stages=[0,1,3,2,4,5,6];
    beamSegments.forEach((seg,i)=>{seg.mat.uniforms.uOpacity.value=(i===0?.9:.10);seg.mat.uniforms.uReveal.value=i===0?Math.min(1,t/.75):0;});
    if(t>.8){beamSegments[1].mat.uniforms.uOpacity.value=.82;beamSegments[3].mat.uniforms.uOpacity.value=.82;beamSegments[1].mat.uniforms.uReveal.value=Math.min(1,(t-.8)/.75);beamSegments[3].mat.uniforms.uReveal.value=Math.min(1,(t-.8)/.75);setPrincipleDemoStatus('分束器不是按波长分色：同一入射辐射被部分透射、部分反射，形成两条光路。');}
    if(t>2.0){beamSegments[2].mat.uniforms.uOpacity.value=.78;beamSegments[4].mat.uniforms.uOpacity.value=.78;beamSegments[2].mat.uniforms.uReveal.value=Math.min(1,(t-2)/.75);beamSegments[4].mat.uniforms.uReveal.value=Math.min(1,(t-2)/.75);setPrincipleDemoStatus('两束光从固定镜和移动镜返回；它们已经经历了不同的光程。');}
    if(t>3.25){beamSegments[5].mat.uniforms.uOpacity.value=.92;beamSegments[6].mat.uniforms.uOpacity.value=.92;beamSegments[5].mat.uniforms.uReveal.value=Math.min(1,(t-3.25)/.7);beamSegments[6].mat.uniforms.uReveal.value=Math.min(1,(t-3.25)/.7);setPrincipleDemoStatus('返回光在分束器处重新重合。相对相位决定输出增强还是减弱，这才产生可测的干涉调制。');}
    if(t>5.3){state.componentDemo=null;setPrincipleDemoStatus('结论：分束器建立“两条可比较的光程”，并让返回光重新组合。可点击「拆解构造」继续看光学片与镀膜。');}
  }
  if(demo==='moving'){
    const u=Math.min(1,t/4.4),x=-.16+.32*u;setMirrorMm(x,false);
    if(t<1.4)setPrincipleDemoStatus(`镜面位移 Δx = ${x.toFixed(2)} mm。光在这一臂中要往返一次。`);
    else if(t<2.8)setPrincipleDemoStatus(`因此 OPD 变化是两倍：δ = ${(2*x).toFixed(2)} mm。现在看输出光强也随相位改变。`);
    else setPrincipleDemoStatus('不同波数对同一个 OPD 扫描会留下不同快慢的振荡；这就是后面傅里叶解析能够区分波数的基础。');
    if(t>4.4){state.componentDemo=null;setPrincipleDemoStatus('结论：移动镜创造的是 OPD 扫描，不是“扫描波长”。现在可以直接拖动镜面验证。');}
  }
  if(demo==='detector'){
    const u=Math.min(1,t/4.5),x=-.18+.36*u;setMirrorMm(x,false);updateDetectorPreview();
    if(t<1.5)setPrincipleDemoStatus('镜子改变 OPD；在这个位置，探测器只得到一个总强度 I。');
    else if(t<3.1)setPrincipleDemoStatus('继续扫描：每到一个新的 OPD，就记录新的 (δ, I) 数据点。');
    else setPrincipleDemoStatus('这些数据点按 OPD 排列起来，就是 I(δ)——干涉图。探测器本身并不会直接输出“1715 cm⁻¹”。');
    if(t>4.5){state.componentDemo=null;setPrincipleDemoStatus('结论：探测器负责采样 I(δ)；波数信息仍编码在复杂信号里，需要下一步傅里叶变换解析。');}
  }
}
function focusObject(key,subpart=null){
  if(!desktopInspectionAllowed()||!objectInfo[key])return;
  if(!state.focusKey){state.focusReturnCam={pos:camera.position.toArray(),target:controls.target.toArray(),fov:camera.fov};if(state.scene===3&&!state.paused){state.pausedByFocus=true;state.paused=true;}}
  if(state.focusKey&&state.focusKey!==key){state.localExploded=null;state.focusSubpart=null;}
  state.focusKey=key;state.focusSubpart=subpart;
  controls.enabled=false;
  document.body.classList.add('object-focus');
  document.body.classList.toggle('focus-moving',key==='moving');
  renderObjectPanel(key,subpart);
  setOutline({key,subpart},true);
  goCamera(objectInfo[key].camera);
  updateVisibility();
  if(state.scene===2&&['beamsplitter','moving','detector'].includes(key)) setTimeout(()=>{if(state.focusKey===key&&!state.localExploded)startComponentDemo(key,false);},QUALITY.reducedMotion?80:520);
}
function clearFocus(restoreCamera=true){
  if(!state.focusKey)return;
  stopComponentDemo(true);
  state.focusKey=null;state.focusSubpart=null;state.localExploded=null;
  objectPanel.classList.remove('open');objectPanel.setAttribute('aria-hidden','true');
  document.body.classList.remove('object-focus','focus-moving','model-hover','mirror-hover');
  hoverLabel.classList.remove('visible');activeHoverSignature='';clearOutline();
  if(state.pausedByFocus){state.paused=false;state.pausedByFocus=false;}
  focusLight.intensity=0;
  if(restoreCamera&&state.focusReturnCam)goCamera(state.focusReturnCam);
  state.focusReturnCam=null;
  controls.enabled=state.free;
  updateVisibility();
}
function selectSubpart(subpart){const d=subpartInfo[subpart];if(!d||state.localExploded!==d.parent)return;state.focusSubpart=subpart;renderObjectPanel(d.parent,subpart);setOutline({key:d.parent,subpart},true);}

canvas.addEventListener('pointerdown',e=>{
  if(innerWidth<=760)return;
  const hit=raycastInfo(e);
  state.pointerDown={x:e.clientX,y:e.clientY,hit,pointerId:e.pointerId};
});
canvas.addEventListener('pointermove',e=>{
  if(innerWidth<=760)return;
  if(state.pointerDown&&state.pointerDown.hit&&state.pointerDown.hit.key==='moving'&&(state.scene===2||state.scene===3||state.free)&&!state.localExploded){
    const dist=Math.hypot(e.clientX-state.pointerDown.x,e.clientY-state.pointerDown.y);
    if(dist>5&&!state.dragMirror){state.dragMirror=true;state.paused=true;try{canvas.setPointerCapture(e.pointerId)}catch{}document.body.classList.add('dragging-mirror');hoverLabel.classList.remove('visible');clearTimeout(hoverIntentTimer);activeHoverSignature='';setOutline({key:'moving'},true);}
  }
  pointerNDC(e);raycaster.setFromCamera(pointer,camera);
  if(state.dragMirror){
    if(raycaster.ray.intersectPlane(dragPlane,hitPoint)){const mm=(hitPoint.x-4.3)/MM_TO_WORLD;setMirrorMm(mm,true);const slider=$('#mirrorSlider');if(slider)slider.value=state.mirrorMm;}
    return;
  }
  queueHover(raycastInfo(e),e);
});
canvas.addEventListener('pointerup',e=>{
  if(innerWidth<=760)return;
  if(state.dragMirror){state.dragMirror=false;state.pointerDown=null;document.body.classList.remove('dragging-mirror');try{canvas.releasePointerCapture(e.pointerId)}catch{}return;}
  const down=state.pointerDown;state.pointerDown=null;
  if(!down)return;
  const moved=Math.hypot(e.clientX-down.x,e.clientY-down.y)>5;if(moved)return;
  const hit=raycastInfo(e);
  if(hit){if(hit.subpart)selectSubpart(hit.subpart);else focusObject(hit.key);}
  else if(state.focusKey)clearFocus(true);
});
canvas.addEventListener('pointerleave',e=>{if(!state.dragMirror){clearTimeout(hoverIntentTimer);applyHover(null,e);}});
addEventListener('keydown',e=>{if(e.key==='Escape'){if(deeperPanel.classList.contains('open')){deeperPanel.classList.remove('open');deeperPanel.setAttribute('aria-hidden','true');document.body.classList.remove('deeper-open');}else clearFocus(true);}});

function updateVisibility(){
  molecule.visible=state.scene===1;
  world.visible=state.scene!==1;
  const s=state.scene;
  const finalStructure=s===5&&state.exploded;

  // Scene 02 = full instrument context. Scene 03 = only the Michelson core + detector.
  // Scene 04 = faint spatial memory. Scene 05 = spectrum first, instrument only on demand.
  sourceAssembly.visible=(s===2)||state.free||finalStructure;
  beamsplitterAssembly.visible=(s===2||s===3||s===4)||state.free||finalStructure;
  fixed.group.visible=(s===2||s===3||s===4)||state.free||finalStructure;
  movingAssembly.visible=(s===2||s===3||s===4)||state.free||finalStructure;
  sampleGroup.visible=(s===2)||state.free||finalStructure;
  detectorGroup.visible=(s===2||s===3)||state.free||finalStructure;
  bench.visible=(s===2||s===3)||state.free||finalStructure;
  benchDetails.visible=(s===2)||state.free||finalStructure;

  const focusOptics=finalStructure&&['source','beamsplitter','fixed','moving','sample','detector'].includes(state.focusKey);
  beams.visible=(s===2||s===3)||state.free||focusOptics;
  housing.visible=(s===2||finalStructure) && !QUALITY.safe && !state.focusKey;
  interferenceWaves.visible=(s===2||s===3) && !QUALITY.reducedMotion;
  opdGuide.visible=s===2;
  refLaser.visible=finalStructure||state.free;
  refBeamSegments.forEach(seg=>seg.mesh.visible=finalStructure||state.free);

  chartPanel.classList.toggle('visible',s>=3 && !(s===5&&finalStructure));
  chartPanel.setAttribute('aria-hidden',(s>=3 && !(s===5&&finalStructure))?'false':'true');
  if(s===3){chartKicker.textContent='探测器记录';chartTitle.textContent='Interferogram';chartMeta.textContent='Optical Path Difference / OPD';}
  if(s===4){chartKicker.textContent='同一组数据';chartTitle.textContent='Interferogram → Spectrum';chartMeta.textContent='OPD 域 → 波数域';}
  if(s===5){chartKicker.textContent='样品相对响应';chartTitle.textContent='FTIR Spectrum';chartMeta.textContent='4000 → 400 cm⁻¹';}
}
function setScene(n){
  const previousScene=state.scene;
  clearFocus(false);clearTimeout(hoverIntentTimer);pendingHoverSignature='';activeHoverSignature='';clearOutline();
  if(n!==5)state.exploded=false;
  state.scene=n;if(n===4&&previousScene!==4){state.transformStep=0;state.transformProgress=0;}state.free=false;document.body.classList.remove('free-mode','transform-cinematic','scene34-transition','system-exploded','scene-1','scene-2','scene-3','scene-4','scene-5');document.body.classList.add(`scene-${n}`);controls.enabled=false;
  if(previousScene===3&&n===4)document.body.classList.add('scene34-transition');
  $('#freeExplore').textContent='自由探索';
  $$('.scene-nav button').forEach(b=>b.classList.toggle('active',+b.dataset.scene===n));$('#sceneIndex').textContent=String(n).padStart(2,'0');deeperPanel.classList.remove('open');deeperPanel.setAttribute('aria-hidden','true');document.body.classList.remove('deeper-open');state.transformRunning=false;
  renderCopy();renderControls();updateVisibility();goCamera(n);
  if(n===2)setTimeout(()=>{if(state.scene===2&&!state.focusKey)goCamera('opd');},QUALITY.reducedMotion?0:650);
  if(n===3){state.scanRunning=false;state.scanStarted=false;setMirrorMm(-SCAN_MAX_MM,false);renderInterferogram();}
  if(n===4){renderTransformStart();runDataExtraction();}
  if(n===5)renderSpectrum();
}

// Chart helpers
function axisBase(xLabel='',yLabel=''){axes.innerHTML='';markers.innerHTML='';const ns='http://www.w3.org/2000/svg';for(const [x1,y1,x2,y2] of [[70,35,70,360],[70,360,860,360]]){const l=document.createElementNS(ns,'line');l.setAttribute('x1',x1);l.setAttribute('y1',y1);l.setAttribute('x2',x2);l.setAttribute('y2',y2);l.setAttribute('class','axis');axes.appendChild(l);}if(xLabel){const t=document.createElementNS(ns,'text');t.setAttribute('x',860);t.setAttribute('y',402);t.setAttribute('text-anchor','end');t.setAttribute('class','tick');t.textContent=xLabel;axes.appendChild(t);}if(yLabel){const t=document.createElementNS(ns,'text');t.setAttribute('x',24);t.setAttribute('y',28);t.setAttribute('class','tick');t.textContent=yLabel;axes.appendChild(t);}}
function pathFromData(xs,ys,xmin,xmax,ymin,ymax){let d='';for(let i=0;i<xs.length;i++){const x=70+(xs[i]-xmin)/(xmax-xmin)*790,y=360-(ys[i]-ymin)/(ymax-ymin)*300;d+=`${i?'L':'M'}${x.toFixed(2)},${y.toFixed(2)} `;}return d;}

const teachingBands=[
  {wn:760,amp:.22,width:38,label:'~760 cm⁻¹',assign:'可能与某些面外弯曲振动有关；需结合具体分子结构判断。'},
  {wn:1240,amp:.31,width:54,label:'~1240 cm⁻¹',assign:'该区域可能包含 C–O 等伸缩振动贡献；具体归属依化学环境而变。'},
  {wn:1460,amp:.24,width:48,label:'~1460 cm⁻¹',assign:'该区域常见多类弯曲振动；单峰不足以确定官能团。'},
  {wn:1715,amp:.62,width:38,label:'~1715 cm⁻¹',assign:'约 1715 cm⁻¹ 附近常见于某些羰基 C=O 伸缩振动吸收；实际峰位需结合结构、共轭与氢键等。'},
  {wn:2950,amp:.22,width:70,label:'~2950 cm⁻¹',assign:'约 2850–3000 cm⁻¹ 区域常见脂肪族 C–H 伸缩振动；具体归属需结合谱带组合。'}
];
function spectralComponents(mode=state.mode){if(mode==='single')return[{wn:state.wavenumber,amp:1}];if(mode==='multiple')return[{wn:760,amp:.45},{wn:1715,amp:.75},{wn:2950,amp:.55}];return teachingBands.map(p=>({wn:p.wn,amp:p.amp+.18}));}
function interferogramAt(deltaCm,mode=state.mode){let sum=0,norm=0;for(const c of spectralComponents(mode)){sum+=c.amp*Math.cos(2*Math.PI*c.wn*deltaCm);norm+=c.amp;}return norm?sum/norm:0;}
function buildInterferogram(mode=state.mode){const xs=[],ys=[];for(let i=0;i<SAMPLE_N;i++){const d=-MAX_OPD_CM+2*MAX_OPD_CM*i/(SAMPLE_N-1);xs.push(d);ys.push(interferogramAt(d,mode));}return{xs,ys};}
function renderInterferogram(){axisBase('Optical Path Difference δ / cm','I(δ)');const {xs,ys}=buildInterferogram();if(state.scene===3){const current=2*state.mirrorMm*DISPLAY_OPD_CM_PER_MM;const acquiredX=[],acquiredY=[];for(let i=0;i<xs.length;i++){if(xs[i]<=current+1e-9){acquiredX.push(xs[i]);acquiredY.push(ys[i]);}}curveB.setAttribute('d',pathFromData(xs,ys,-MAX_OPD_CM,MAX_OPD_CM,-1.08,1.08));curveB.classList.add('guide-curve');curveA.setAttribute('d',acquiredX.length>1?pathFromData(acquiredX,acquiredY,-MAX_OPD_CM,MAX_OPD_CM,-1.08,1.08):'');}else{curveA.setAttribute('d',pathFromData(xs,ys,-MAX_OPD_CM,MAX_OPD_CM,-1.08,1.08));curveB.setAttribute('d','');curveB.classList.remove('guide-curve');}const ns='http://www.w3.org/2000/svg';const line=document.createElementNS(ns,'line');line.setAttribute('x1','465');line.setAttribute('x2','465');line.setAttribute('y1','45');line.setAttribute('y2','360');line.setAttribute('class','marker-line');markers.appendChild(line);const tx=document.createElementNS(ns,'text');tx.setAttribute('x','476');tx.setAttribute('y','58');tx.setAttribute('class','marker-label');tx.textContent='ZPD';markers.appendChild(tx);if(state.mode==='broadband'){const cb=document.createElementNS(ns,'text');cb.setAttribute('x','476');cb.setAttribute('y','78');cb.setAttribute('class','marker-label subtle');cb.textContent='CENTERBURST';markers.appendChild(cb);}renderInterferogramCursor();}
function renderInterferogramCursor(){if(state.scene!==3)return;const old=markers.querySelector('.scan-cursor');if(old)old.remove();const deltaCm=2*state.mirrorMm*DISPLAY_OPD_CM_PER_MM;const x=70+(THREE.MathUtils.clamp(deltaCm,-MAX_OPD_CM,MAX_OPD_CM)+MAX_OPD_CM)/(2*MAX_OPD_CM)*790;const ns='http://www.w3.org/2000/svg';const l=document.createElementNS(ns,'line');l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1','48');l.setAttribute('y2','360');l.setAttribute('class','scan-cursor');markers.appendChild(l);}


function renderTransformLesson(){
  if(state.scene!==4)return;
  const ig=buildInterferogram('multiple');
  axisBase('Optical Path Difference δ / cm','I(δ)');
  curveA.setAttribute('d',pathFromData(ig.xs,ig.ys,-MAX_OPD_CM,MAX_OPD_CM,-1.08,1.08));
  curveA.style.opacity='1';curveB.setAttribute('d','');curveB.style.opacity='0';
  if(state.transformStep===0)return;
  if(state.transformStep===1){addTransformComponent(760,.9);addTransformPeakHint(760,'较慢周期 → 低波数');return;}
  if(state.transformStep===2){addTransformComponent(760,.28);addTransformComponent(2950,.92);addTransformPeakHint(2950,'更快周期 → 更高波数');return;}
  if(state.transformStep===3){renderFrequencyComparison();return;}
  renderRecoveredSpectrum(ig);
}
function addTransformPeakHint(wn,label){
  const ns='http://www.w3.org/2000/svg';const t=document.createElementNS(ns,'text');t.setAttribute('x','82');t.setAttribute('y','82');t.setAttribute('class','transform-hint');t.textContent=label;markers.appendChild(t);
}
function renderFrequencyComparison(){
  const ns='http://www.w3.org/2000/svg';axisBase('Wavenumber / cm⁻¹','找到的周期成分');curveA.setAttribute('d','');curveB.setAttribute('d','');
  for(const [wn,label] of [[760,'慢周期'],[2950,'快周期']]){const x=70+(wn-4000)/(400-4000)*790;const l=document.createElementNS(ns,'line');l.setAttribute('x1',x);l.setAttribute('x2',x);l.setAttribute('y1','350');l.setAttribute('y2',wn===760?'205':'115');l.setAttribute('class','recovered-stick');markers.appendChild(l);const t=document.createElementNS(ns,'text');t.setAttribute('x',x);t.setAttribute('y',wn===760?'190':'100');t.setAttribute('text-anchor','middle');t.setAttribute('class','transform-hint');t.textContent=`${label} · ${wn} cm⁻¹`;markers.appendChild(t);}
  for(const wn of [4000,3000,2000,1500,1000,400]){const x=70+(wn-4000)/(400-4000)*790;const t=document.createElementNS(ns,'text');t.setAttribute('x',x);t.setAttribute('y','382');t.setAttribute('text-anchor','middle');t.setAttribute('class','tick');t.textContent=wn;axes.appendChild(t);}
}
function renderRecoveredSpectrum(ig=buildInterferogram('multiple')){
  const recovered=dctSpectrum(ig);axisBase('Wavenumber / cm⁻¹','Relative spectral amplitude');const xs=recovered.map(d=>d.wn),ys=recovered.map(d=>d.amp);curveA.setAttribute('d','');curveB.setAttribute('d',pathFromData(xs,ys,4000,400,0,1.06));curveB.style.opacity='1';
  for(const wn of [4000,3000,2000,1500,1000,400]){const ns='http://www.w3.org/2000/svg';const x=70+(wn-4000)/(400-4000)*790;const t=document.createElementNS(ns,'text');t.setAttribute('x',x);t.setAttribute('y','382');t.setAttribute('text-anchor','middle');t.setAttribute('class','tick');t.textContent=wn;axes.appendChild(t);}
}
function advanceTransformLesson(){
  state.transformRunning=false;state.transformStep=(state.transformStep+1)%5;renderControls();
}

function dctSpectrum(interferogram){
  // direct cosine analysis on finite symmetric OPD window; enough for classroom-scale N
  const out=[]; const step=8; // 400..4000 in 8 cm^-1 increments
  for(let wn=400;wn<=4000;wn+=step){let re=0;for(let i=0;i<interferogram.xs.length;i++)re+=interferogram.ys[i]*Math.cos(2*Math.PI*wn*interferogram.xs[i]);out.push({wn,amp:Math.abs(re)/interferogram.xs.length});}
  const max=Math.max(...out.map(d=>d.amp),1e-9);out.forEach(d=>d.amp/=max);return out;
}
let lastRecoveredSpectrum=dctSpectrum(buildInterferogram('broadband'));
function renderTransformStart(){renderInterferogram();curveB.setAttribute('d','');curveA.style.opacity='1';curveB.style.opacity='0';}
function addTransformComponent(wn,opacity){
  const ns='http://www.w3.org/2000/svg';const ys=[];for(let i=0;i<SAMPLE_N;i++){const d=-MAX_OPD_CM+2*MAX_OPD_CM*i/(SAMPLE_N-1);ys.push(.62*Math.cos(2*Math.PI*wn*d));}
  const xs=[];for(let i=0;i<SAMPLE_N;i++)xs.push(-MAX_OPD_CM+2*MAX_OPD_CM*i/(SAMPLE_N-1));
  const path=document.createElementNS(ns,'path');path.setAttribute('d',pathFromData(xs,ys,-MAX_OPD_CM,MAX_OPD_CM,-1.08,1.08));path.setAttribute('class','transform-component');path.style.opacity=String(opacity);markers.appendChild(path);
  const t=document.createElementNS(ns,'text');t.setAttribute('x','82');t.setAttribute('y','58');t.setAttribute('class','marker-label subtle');t.textContent=`抽取一个周期成分 · ${wn} cm⁻¹`;markers.appendChild(t);
}
function renderTransformFrame(p){
  const ig=buildInterferogram('multiple'); if(p<.46){axisBase('Optical Path Difference δ / cm','I(δ)');curveA.setAttribute('d',pathFromData(ig.xs,ig.ys,-MAX_OPD_CM,MAX_OPD_CM,-1.08,1.08));curveA.style.opacity=String(1-p*.55);curveB.setAttribute('d','');if(p>.10){const wn=p<.28?760:2950;addTransformComponent(wn,Math.min(.65,(p-.10)*2.2));}return;}
  if(!lastRecoveredSpectrum||p<.48)lastRecoveredSpectrum=dctSpectrum(ig);
  axisBase('Wavenumber / cm⁻¹','Relative spectral amplitude');
  const xs=lastRecoveredSpectrum.map(d=>d.wn),ys=lastRecoveredSpectrum.map(d=>d.amp);const q=(p-.46)/.54;
  curveA.style.opacity=String(Math.max(0,1-q*1.3)); curveB.setAttribute('d',pathFromData(xs,ys,4000,400,0,1.06));curveB.style.opacity=String(Math.min(1,q*1.2));
  for(const wn of [4000,3000,2000,1500,1000,400]){const ns='http://www.w3.org/2000/svg';const x=70+(wn-4000)/(400-4000)*790;const t=document.createElementNS(ns,'text');t.setAttribute('x',x);t.setAttribute('y',382);t.setAttribute('text-anchor','middle');t.setAttribute('class','tick');t.textContent=wn;axes.appendChild(t);}
}

function sampleTransmittance(wn){let t=.96;for(const p of teachingBands)t-=p.amp*Math.exp(-.5*((wn-p.wn)/p.width)**2);return Math.max(.08,t);}
function renderSpectrum(){
  const abs=state.spectrumMode==='absorbance';axisBase('Wavenumber / cm⁻¹',abs?'Absorbance / A':'Transmittance / fraction');const xs=[],ys=[];for(let i=0;i<800;i++){const wn=4000-3600*i/799;const t=sampleTransmittance(wn);xs.push(wn);ys.push(abs?-Math.log10(t):t);}const ymax=abs?1.1:1.04,ymin=abs?0:.15;curveA.setAttribute('d',pathFromData(xs,ys,4000,400,ymin,ymax));curveB.setAttribute('d','');
  const ns='http://www.w3.org/2000/svg';for(const wn of [4000,3000,2000,1500,1000,400]){const x=70+(wn-4000)/(400-4000)*790;const t=document.createElementNS(ns,'text');t.setAttribute('x',x);t.setAttribute('y',382);t.setAttribute('text-anchor','middle');t.setAttribute('class','tick');t.textContent=wn;axes.appendChild(t);}
  teachingBands.forEach((p,idx)=>{const x=70+(p.wn-4000)/(400-4000)*790;const value=abs?-Math.log10(sampleTransmittance(p.wn)):sampleTransmittance(p.wn);const y=360-(value-ymin)/(ymax-ymin)*300;const c=document.createElementNS(ns,'circle');c.setAttribute('cx',x);c.setAttribute('cy',y);c.setAttribute('r','5');c.setAttribute('class','peak-marker');c.setAttribute('tabindex','0');c.dataset.peak=idx;markers.appendChild(c);c.addEventListener('click',()=>selectPeak(idx));c.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();selectPeak(idx);}});});
}
function selectPeak(idx){state.selectedPeak=idx;const p=teachingBands[idx];const el=$('#peakInfo');if(el)el.innerHTML=`<strong>${p.label}</strong><span>${p.assign}</span>`;$$('.peak-marker').forEach((m,i)=>m.classList.toggle('active',i===idx));}

function updatePhasePanel(){updateInterferenceWaves();if(state.scene!==3)return;const phaseEl=$('#phaseValue'),wf=$('#waveFixed'),wm=$('#waveMoving'),ws=$('#waveSum');if(!phaseEl||!wf||!wm||!ws)return;const deltaCm=2*state.mirrorMm*DISPLAY_OPD_CM_PER_MM;const wn=state.mode==='single'?state.wavenumber:1715;const phase=2*Math.PI*wn*deltaCm;const wrapped=Math.atan2(Math.sin(phase),Math.cos(phase));phaseEl.textContent=`${wrapped.toFixed(2)} rad`;function wavePath(phaseOffset,amp=18,base=34){let d='';for(let i=0;i<=120;i++){const x=i*3,y=base+amp*Math.sin(i/120*Math.PI*4+phaseOffset);d+=`${i?'L':'M'}${x.toFixed(1)},${y.toFixed(1)} `;}return d;}wf.setAttribute('d',wavePath(0,12,30));wm.setAttribute('d',wavePath(wrapped,12,58));const resultAmp=24*Math.abs(Math.cos(wrapped/2));ws.setAttribute('d',wavePath(wrapped/2,resultAmp,91));}

function updateBeamAnimation(){
  if(!beams.visible)return;
  const cycle=(state.beamClock%6.8)/6.8;const sequence=[0,.18,.45,.18,.45,.68,.83];
  beamSegments.forEach((s,i)=>{const local=(cycle-sequence[i]+1)%1;s.mat.uniforms.uReveal.value=Math.min(1,local/.16);});
  updateInterferenceWaves();
}

function updateLocalExplode(dt){
  const k=Math.min(1,dt*(QUALITY.reducedMotion?18:5.2));
  for(const [name,parts] of Object.entries(localExplodeSets)){
    const active=state.localExploded===name;
    for(const p of parts){const target=p.home.clone().add(active?p.offset:new THREE.Vector3());p.obj.position.lerp(target,k);}
  }
}
function updateFocusLighting(dt){
  const active=!!state.focusKey;const k=Math.min(1,dt*4.5);
  key.intensity=THREE.MathUtils.lerp(key.intensity,active?2.15:3.5,k);
  hemi.intensity=THREE.MathUtils.lerp(hemi.intensity,active?.82:1.15,k);
  rim.intensity=THREE.MathUtils.lerp(rim.intensity,active?.75:1.2,k);
  focusLight.intensity=THREE.MathUtils.lerp(focusLight.intensity,active?2.35:0,k);
  if(active&&interactiveRoots[state.focusKey]){const center=new THREE.Box3().setFromObject(interactiveRoots[state.focusKey]).getCenter(new THREE.Vector3());center.y+=1.1;center.z+=1.2;focusLight.position.lerp(center,k);}
}

function updateScenePhysics(dt){
  if(!state.paused){state.t+=dt;state.beamClock+=dt;}
  if(state.scene===1){const resonance=Math.exp(-Math.pow((state.wavenumber-2350)/260,2)),amp=.035+.23*resonance;O1.position.x=-1.25-amp*Math.sin(state.t*4.8);O2.position.x=1.25+amp*Math.sin(state.t*4.8);}
  if(state.scene===3&&state.scanRunning&&!state.paused){state.mirrorMm+=dt*.12;if(state.mirrorMm>=SCAN_MAX_MM){state.mirrorMm=SCAN_MAX_MM;state.scanRunning=false;}setMirrorMm(state.mirrorMm,false);if(!state.scanRunning)renderControls();}
  if(state.scene===4&&state.transformRunning&&!state.paused){state.transformProgress=Math.min(1,state.transformProgress+dt*(QUALITY.reducedMotion?1.8:.32));renderTransformFrame(state.transformProgress);if(state.transformProgress>=1){state.transformRunning=false;state.transformStep=4;renderControls();}}
  if(state.scene!==4){curveA.style.opacity='1';curveB.style.opacity='1';}
  const targetExploded=state.scene===5&&state.exploded;const k=Math.min(1,dt*2.4);
  source.position.x=THREE.MathUtils.lerp(source.position.x,targetExploded?-8.15:-6.2,k);
  fixed.group.position.z=THREE.MathUtils.lerp(fixed.group.position.z,targetExploded?-5.55:-4.1,k);
  const baseMovingX=4.3+state.mirrorMm*MM_TO_WORLD;moving.group.position.x=THREE.MathUtils.lerp(moving.group.position.x,targetExploded?6.1:baseMovingX,k);carriage.position.x=moving.group.position.x;
  sampleGroup.position.x=THREE.MathUtils.lerp(sampleGroup.position.x,targetExploded?4.25:3.7,k);sampleGroup.position.z=THREE.MathUtils.lerp(sampleGroup.position.z,targetExploded?4.65:3.3,k);
  detectorGroup.position.x=THREE.MathUtils.lerp(detectorGroup.position.x,targetExploded?7.75:6.1,k);detectorGroup.position.z=THREE.MathUtils.lerp(detectorGroup.position.z,targetExploded?4.65:3.3,k);
  updateLocalExplode(dt);
  updateFocusLighting(dt);
  updateBeamAnimation();
  updateComponentDemo(dt);
  updateOutlineMatrices();
}
function updateCamera(dt){if(camLerp<1){camLerp=Math.min(1,camLerp+dt*.52);const t=camLerp*camLerp*(3-2*camLerp),p=new THREE.Vector3(...camTo.pos),trg=new THREE.Vector3(...camTo.target);camera.position.lerpVectors(camFrom.pos,p,t);controls.target.lerpVectors(camFrom.target,trg,t);camera.fov=THREE.MathUtils.lerp(camFrom.fov,camTo.fov,t);camera.updateProjectionMatrix();}controls.update();updateScreenAnnotations();}

function projectWorldToPage(v){
  const p=v.clone().project(camera), r=canvas.getBoundingClientRect();
  return {x:r.left+(p.x*.5+.5)*r.width, y:r.top+(-p.y*.5+.5)*r.height};
}
function updateScreenAnnotations(){
  const el=$('#bsCallout'); if(!el || innerWidth<=760 || (state.scene!==2&&state.scene!==3)) return;
  const p=projectWorldToPage(new THREE.Vector3(0,2.35,0));
  el.style.left=`${Math.min(innerWidth-190,Math.max(18,p.x+26))}px`;
  el.style.top=`${Math.min(innerHeight-100,Math.max(90,p.y-28))}px`;
}
let extractionRAF=0;
function runDataExtraction(){
  cancelAnimationFrame(extractionRAF);
  const bridge=$('#dataBridge'); if(bridge)bridge.classList.remove('active');
  document.body.classList.add('transform-cinematic');
  const delay=QUALITY.reducedMotion?80:1250;
  setTimeout(()=>{document.body.classList.remove('transform-cinematic','scene34-transition');},delay);
}

$('#closeDeeper').onclick=()=>{deeperPanel.classList.remove('open');deeperPanel.setAttribute('aria-hidden','true');document.body.classList.remove('deeper-open');};
$('#pauseBtn').onclick=()=>state.paused=true;
$('#continueBtn').onclick=()=>state.paused=false;
$('#resetBtn').onclick=()=>{clearFocus(false);state.mirrorMm=0;state.t=0;state.beamClock=0;state.transformProgress=0;state.transformRunning=false;state.exploded=false;state.paused=false;setMirrorMm(0);setScene(state.scene);};
$('#freeExplore').onclick=()=>{
  clearFocus(false);clearTimeout(hoverIntentTimer);pendingHoverSignature='';activeHoverSignature='';clearOutline();state.free=!state.free;controls.enabled=state.free;document.body.classList.toggle('free-mode',state.free);
  if(state.free){state.scene=2;$('#freeExplore').textContent='退出探索';document.body.classList.remove('scene-1','scene-3','scene-4','scene-5');document.body.classList.add('scene-2');renderCopy();renderControls();updateVisibility();goCamera(2);}
  else setScene(2);
};
$$('.scene-nav button').forEach(b=>b.onclick=()=>setScene(+b.dataset.scene));
function resizeRenderer(){const w=Math.max(1,canvas.clientWidth||innerWidth),h=Math.max(1,canvas.clientHeight||innerHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);renderer.setPixelRatio(Math.min(devicePixelRatio,QUALITY.dpr));}
addEventListener('resize',resizeRenderer);
resizeRenderer();

let last=performance.now(), lastPaint=0;
function animate(now){if(QUALITY.safe && now-lastPaint<31){requestAnimationFrame(animate);return;}lastPaint=now;const dt=Math.min(.05,(now-last)/1000);last=now;updateScenePhysics(dt);updateCamera(dt);renderer.render(scene,camera);requestAnimationFrame(animate);}
/* V7 Scene 03→04: guided discovery over one shared, deterministic measurement. */
state.v7Step = 0;
const v7Measurement = { xs: [], components: [], total: [], broadband: false };
function v7RefreshMeasurement() {
  const base = state.v7Step < 1 ? [1000] : state.v7Step < 2 ? [1000, 3000] : [1000, 1700, 3000];
  const extra = (state.v7Step >= 4) ? [1150, 1325, 1500, 1850, 2100, 2350, 2600, 2800, 3200, 3500] : [];
  v7Measurement.broadband = state.v7Step >= 4;
  v7Measurement.xs = Array.from({length:SAMPLE_N}, (_,i)=>-MAX_OPD_CM + 2*MAX_OPD_CM*i/(SAMPLE_N-1));
  v7Measurement.components = [...base.map(wn=>({wn,amp:1,color:wn===1000?'#73d5d9':wn===1700?'#f0b66e':'#bd9cff'})), ...extra.map(wn=>({wn,amp:.16,color:'#88949c'}))];
  v7Measurement.total = v7Measurement.xs.map(delta=>v7Measurement.components.reduce((sum,c)=>sum+c.amp*Math.cos(2*Math.PI*c.wn*delta),0));
}
v7RefreshMeasurement();
const legacySpectralComponents = spectralComponents;
spectralComponents = function(mode=state.mode) {
  if ((state.scene===3 || state.scene===4) && v7Measurement.components.length) return v7Measurement.components;
  return legacySpectralComponents(mode);
};
const legacyRenderControls = renderControls;
renderControls = function() {
  if (state.scene!==3 && state.scene!==4) return legacyRenderControls();
  if (state.scene===3) {
    v7RefreshMeasurement();
    const labels = ['① 单一 1000 cm⁻¹：扫描生成 I(δ)','② 对比 3000 cm⁻¹：同一 OPD 范围，振荡更快','③ 引入 1700 cm⁻¹：分别观察三个 contribution','④ 数学叠加：I_total = I₁ + I₂ + I₃','⑤ 扩展到 broadband','⑥ 揭示 ZPD / centerburst'];
    const actions = ['比较 3000 cm⁻¹','引入 1700 cm⁻¹','播放数学叠加','扩展到 broadband','揭示 ZPD / centerburst','进入 Scene 04：反向解码'];
    const current = state.v7Step;
    interactionPanel.innerHTML = `<div class="control-label"><span>连续发现 · ${current+1} / 6</span><strong>${labels[current]}</strong></div><div class="scan-lab"><span>主横轴：Optical Path Difference δ / cm</span><strong>${current<3?'每个谱分量先独立产生 OPD-dependent contribution，再由探测器记录总信号。':current===3?'白色总线是 I₁ + I₂ + I₃，不是不同频率彼此“碰撞”。':current===4?'许多波数共同构成 broadband；先不急着解释中心峰。':'现在才揭示：δ = 0 是 ZPD，宽带贡献在那里同相叠加形成 centerburst。'}</strong><button id="v7Next" class="primary-action">${actions[current]}</button><small>保持 φ = 2πν̃δ；移动镜位移与 OPD 仍满足 Δδ = 2Δx。</small></div><div class="concept-cue"><b>当前分量</b><span>${v7Measurement.components.map(c=>c.wn+' cm⁻¹').join(' + ')}</span></div>${phaseSvg()}`;
    $('#v7Next').onclick=()=>{ if(current<5){state.v7Step=current+1; if(state.v7Step>=4)state.mode='broadband'; renderControls(); renderInterferogram(); updatePhasePanel();} else setScene(4); };
    updatePhasePanel();
  } else {
    const stepText=['先看同一条混合 interferogram：慢、中、快三种 OPD 空间频率同时存在。','慢周期对应 1000 cm⁻¹。','中速周期对应 1700 cm⁻¹。','最快周期对应 3000 cm⁻¹。','现在才显示 Fourier Transform：同一份数据被重新表达为 single-beam spectrum。'];
    const labels=['识别慢周期','识别中速周期','识别快周期','显示 Fourier Transform','重新解析'];
    interactionPanel.innerHTML=`<div class="transform-readout"><span>反向解码 · 步骤 ${Math.min(state.transformStep+1,5)} / 5</span><strong>Scene 03 最后生成的 interferogram</strong></div><div class="transform-lesson"><p>${stepText[state.transformStep]}</p></div><div class="concept-cue"><b>核心对应</b><span>慢 ↔ 1000 · 中 ↔ 1700 · 快 ↔ 3000 cm⁻¹</span></div><button id="decomposeBtn" class="primary-action">${labels[state.transformStep]}</button><button id="autoTransformBtn" class="quiet-action">直接显示完整解码</button>`;
    $('#decomposeBtn').onclick=()=>{state.transformStep=Math.min(4,state.transformStep+1);renderControls();renderTransformLesson();};
    $('#autoTransformBtn').onclick=()=>{state.transformStep=4;renderControls();renderTransformLesson();};
    renderTransformLesson();
  }
};
renderTransformLesson = function(){
  if(state.scene!==4)return;
  const ig={xs:v7Measurement.xs,ys:v7Measurement.total};
  axisBase('Optical Path Difference δ / cm','I(δ)');
  if(state.transformStep<4){curveA.setAttribute('d',pathFromData(ig.xs,ig.ys,-MAX_OPD_CM,MAX_OPD_CM,-4.2,4.2));curveB.setAttribute('d','');curveA.style.opacity='1';}
  else renderRecoveredSpectrum(ig);
};
renderTransformStart = function(){v7RefreshMeasurement();renderInterferogram();curveA.style.opacity='1';curveB.style.opacity='0';};

setMirrorMm(0);setScene(1);requestAnimationFrame(animate);
