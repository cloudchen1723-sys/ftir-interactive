/**
 * Master Film Timeline Configuration — Directorial Rebuild V2
 * Total Target Duration: ~5:35 (336 seconds @ 30 fps = 10080 frames)
 * Single source of truth for all scene transitions, act durations, camera keyframes,
 * bilingual subtitles, and procedural audio cues.
 */

export interface ActDefinition {
  id: string;
  actNumber: number;
  titleEn: string;
  titleZh: string;
  startFrame: number;
  endFrame: number;
  durationFrames: number;
  descriptionZh: string;
  descriptionEn: string;
}

export interface SubtitleCue {
  startFrame: number;
  endFrame: number;
  zh: string;
  en: string;
  emphasis?: boolean;
}

export const FILM_CONFIG = {
  fps: 30,
  width: 1920,
  height: 1080,
  totalFrames: 10080, // ~5 minutes 36 seconds @ 30 fps
} as const;

export const ACTS: ActDefinition[] = [
  {
    id: 'act1',
    actNumber: 1,
    titleEn: 'Molecules Move',
    titleZh: '第一幕 · 分子在运动',
    startFrame: 0,
    endFrame: 360,
    durationFrames: 360,
    descriptionZh: '微观弹簧与振动基底',
    descriptionEn: 'Microscopic springs and the baseline of thermal motion.',
  },
  {
    id: 'act2',
    actNumber: 2,
    titleEn: 'Movement Library & IR Coupling',
    titleZh: '第二幕 · 动作库与交变电场耦合',
    startFrame: 360,
    endFrame: 960,
    durationFrames: 600,
    descriptionZh: '动作库快速蒙太奇、CO₂偶极定则与交变电场E(t)能量共振注入',
    descriptionEn: 'Movement library montage, CO2 dipole rule, and E(t) field coupling.',
  },
  {
    id: 'act3',
    actNumber: 3,
    titleEn: 'Whole FTIR System',
    titleZh: '第三幕 · 整机全貌：跟着这束光',
    startFrame: 960,
    endFrame: 1380,
    durationFrames: 420,
    descriptionZh: '光源 → 干涉仪 → 样品 → 探测器 → 光谱编码',
    descriptionEn: 'Source, interferometer, sample, detector, and spectral encoding.',
  },
  {
    id: 'act4',
    actNumber: 4,
    titleEn: 'Michelson & Phasors',
    titleZh: '第四幕 · 核心：旋转相量与干涉相长相消',
    startFrame: 1380,
    endFrame: 4260,
    durationFrames: 2880,
    descriptionZh: '分束器、光程差δ=2x、相量时钟、相量矢量相加与连续强度调制',
    descriptionEn: 'Beamsplitter, OPD 2x, phasor clocks, phasor vector addition, and modulation.',
  },
  {
    id: 'act5',
    actNumber: 5,
    titleEn: 'Sample and Detector',
    titleZh: '第五幕 · 样品平谱条带与光变信号',
    startFrame: 4260,
    endFrame: 4980,
    durationFrames: 720,
    descriptionZh: '光束展开为并行强度条带、1715选择性衰减收拢、光(琥珀)转信号(青色)',
    descriptionEn: 'Beam opens into parallel spectral strands, attenuates, turns to cyan signal.',
  },
  {
    id: 'act6',
    actNumber: 6,
    titleEn: 'Interferogram and ZPD',
    titleZh: '第六幕 · 干涉图与零光程差强峰',
    startFrame: 4980,
    endFrame: 5880,
    durationFrames: 900,
    descriptionZh: '单频正弦 → 多频拍频 → ZPD 各波数同相相长中心强峰',
    descriptionEn: 'Monochromatic trace to beating, and constructive ZPD center burst.',
  },
  {
    id: 'act7',
    actNumber: 7,
    titleEn: 'Fourier Frequency Matching',
    titleZh: '第七幕 · 傅里叶变换：可视积分累加模型',
    startFrame: 5880,
    endFrame: 8460,
    durationFrames: 2580,
    descriptionZh: '四层结构：干涉图/探针/乘积正负片/累加器振荡抵消vs持续正向抬升成谱',
    descriptionEn: 'Visible accumulation model: ifg, probe, product ribbon, and running integral.',
  },
  {
    id: 'act8',
    actNumber: 8,
    titleEn: 'Background and Sample',
    titleZh: '第八幕 · 背景与样品两次测量',
    startFrame: 8460,
    endFrame: 9060,
    durationFrames: 600,
    descriptionZh: 'I_B 与 I_S 序贯测量，分别变换得到 B 和 S，比值 T = S/B',
    descriptionEn: 'Sequential I_B and I_S measurements ratioed to transmittance T = S/B.',
  },
  {
    id: 'act9',
    actNumber: 9,
    titleEn: 'Spectrum to Chemical Bond',
    titleZh: '第九幕 · 从谱图回归化学键振动',
    startFrame: 9060,
    endFrame: 9720,
    durationFrames: 660,
    descriptionZh: '1715 cm⁻¹ 吸收峰连续形变为 C=O 双键振动，一个峰是一条线索',
    descriptionEn: 'Transmittance dip at 1715 cm⁻¹ morphs directly into C=O bond oscillation.',
  },
  {
    id: 'act10',
    actNumber: 10,
    titleEn: 'Epilogue',
    titleZh: '第十幕 · 尾声：聆听物质的振动',
    startFrame: 9720,
    endFrame: 10080,
    durationFrames: 360,
    descriptionZh: '吸收带汇聚为特征指纹，闭环回溯，纯黑沉静定格',
    descriptionEn: 'Spectral fingerprint completes the circle of molecular motion.',
  },
];

export const SUBTITLE_CUES: SubtitleCue[] = [
  // ================= ACT I: 分子在运动 (00:00 - 00:12, 0 - 360) =================
  {
    startFrame: 15,
    endFrame: 120,
    zh: '分子并不静止。原子一直在平衡位置附近运动。',
    en: 'Molecules are never at rest. Atoms oscillate continuously near equilibrium.',
  },
  {
    startFrame: 135,
    endFrame: 235,
    zh: '可以把化学键暂时想成一根微型弹簧。',
    en: 'A chemical bond can be modeled as a microscopic spring.',
  },
  {
    startFrame: 245,
    endFrame: 350,
    zh: '真实分子里的原子会协同运动，形成一组特定的振动模式。',
    en: 'In real molecules, atoms move collectively in characteristic normal modes.',
  },

  // ================= ACT II: 动作库与交变电场耦合 (00:12 - 00:32, 360 - 960) =================
  {
    startFrame: 370,
    endFrame: 510,
    zh: '伸缩、弯曲、剪式、摇摆……分子有自己的“动作库”。',
    en: 'Stretching, bending, scissoring, rocking: a movement library of matter.',
  },
  {
    startFrame: 520,
    endFrame: 660,
    zh: '二氧化碳的对称伸缩中，两端电荷对称抵消，总偶极矩没有变化：Δμ = 0。',
    en: 'In CO₂ symmetric stretching, opposing charges cancel: net dipole change Δμ = 0.',
  },
  {
    startFrame: 675,
    endFrame: 790,
    zh: '红外光带着交变电场。没有变化的偶极矩，电场便无法送入能量。',
    en: 'Infrared carries an alternating electric field. Without changing dipole, no energy transfers.',
  },
  {
    startFrame: 800,
    endFrame: 950,
    zh: '而不对称伸缩产生交变偶极矩。电场周期性推拉，振幅随能量注入不断增强。',
    en: 'Asymmetric stretching creates a dynamic dipole: resonant E(t) pushes pump energy into vibration.',
    emphasis: true,
  },

  // ================= ACT III: 整机全貌 (00:32 - 00:46, 960 - 1380) =================
  {
    startFrame: 975,
    endFrame: 1120,
    zh: '一台典型的透射式 FTIR，可以沿着这束光理解。',
    en: 'A transmission FTIR instrument can be understood by following this light beam.',
  },
  {
    startFrame: 1135,
    endFrame: 1280,
    zh: '宽带红外先进入迈克尔逊干涉仪，随后经过样品，到达探测器，最后由计算机处理。',
    en: 'Broadband IR enters the interferometer, passes the sample, reaches the detector, and is processed.',
  },
  {
    startFrame: 1295,
    endFrame: 1370,
    zh: '干涉仪负责光谱编码。',
    en: 'The interferometer encodes spectral wavenumbers into interference modulation.',
    emphasis: true,
  },

  // ================= ACT IV: 迈克尔逊干涉核心与相量 (00:46 - 02:22, 1380 - 4260) =================
  {
    startFrame: 1395,
    endFrame: 1590,
    zh: '分束后，两路光分别往返固定镜与移动镜，再回到分束器。',
    en: 'The split beams travel to their mirrors, return, and meet again at the beamsplitter.',
  },
  {
    startFrame: 1605,
    endFrame: 1860,
    zh: '两条示意臂在零光程差处等长；分束器把光送往固定镜和移动镜。',
    en: 'At zero path difference the schematic arms are equal; the splitter sends light to both mirrors.',
  },
  {
    startFrame: 1875,
    endFrame: 2160,
    zh: '移动镜移动 x，光往返一次多走 2x，光程差记为 δ = 2x。',
    en: 'Moving mirror shifts by x: round trip path difference is exactly δ = 2x.',
    emphasis: true,
  },
  {
    startFrame: 2180,
    endFrame: 2520,
    zh: '镜面回到零位时，光程差与相位自然回到零；同一位移驱动两个相量。',
    en: 'As the mirror returns to zero, path difference and phase return to zero; one displacement drives both phasors.',
  },
  {
    startFrame: 2540,
    endFrame: 2880,
    zh: '同一光程差下，3000 cm⁻¹ 的相位转速是 1000 cm⁻¹ 的三倍。',
    en: 'At the same optical path difference, 3000 cm⁻¹ advances three times as fast as 1000 cm⁻¹.',
  },
  {
    startFrame: 2900,
    endFrame: 3240,
    zh: '相位满足 φ = 2π ν̃ δ；δ 以 cm 计，ν̃ 以 cm⁻¹ 计。',
    en: 'Phase follows φ = 2π ν̃ δ, with δ in cm and wavenumber in cm⁻¹.',
    emphasis: true,
  },
  {
    startFrame: 3260,
    endFrame: 3660,
    zh: '先看一个波数：两条返回光路的电场在这里相遇。',
    en: 'For one wavenumber, the two returning fields meet here.',
  },
  {
    startFrame: 3680,
    endFrame: 4050,
    zh: '探测器响应随合成电场模平方变化。',
    en: 'Detector response follows the squared magnitude of the resultant field.',
  },
  {
    startFrame: 4070,
    endFrame: 4240,
    zh: '干涉仪就这样给不同波数留下了不同快慢的“调制节奏标签”。',
    en: 'The interferometer thus tags each wavenumber with a distinct modulation rhythm.',
    emphasis: true,
  },

  // ================= ACT V: 样品与探测器 (02:22 - 02:46, 4260 - 4980) =================
  {
    startFrame: 4280,
    endFrame: 4490,
    zh: '重聚后的调制光束穿过样品。将光束横向展开为各波数的强度平行条带。',
    en: 'The recombined beam enters the sample. Opening the beam into parallel spectral strands.',
  },
  {
    startFrame: 4505,
    endFrame: 4740,
    zh: '样品只选择性削弱特定波数条带的厚度，如 1715 cm⁻¹，而频率位置保持不变。',
    en: 'The sample selectively attenuates specific band amplitudes (e.g. 1715 cm⁻¹), keeping frequencies intact.',
    emphasis: true,
  },
  {
    startFrame: 4755,
    endFrame: 4960,
    zh: '各条带重新聚拢进入探测器。物理光终结，青色信号点诞生，记录合在一起的总强度。',
    en: 'Strands recombine into the beam: physical amber light terminates, and a cyan electrical signal is born.',
    emphasis: true,
  },

  // ================= ACT VI: 干涉图与零光程差 (02:46 - 03:16, 4980 - 5880) =================
  {
    startFrame: 5000,
    endFrame: 5240,
    zh: '如果只有一个波数，镜面扫描会留下规则的正弦调制。',
    en: 'A single monochromatic wavenumber traces a clean, periodic cosine waveform.',
  },
  {
    startFrame: 5260,
    endFrame: 5500,
    zh: '加入更多波数，探测器只看见它们叠加后的总信号。像麦克风录下一整个和弦。',
    en: 'With multiple wavenumbers, the detector sees their linear sum: a mixed acoustic chord.',
  },
  {
    startFrame: 5520,
    endFrame: 5720,
    zh: '当光程差来到零点，各个波数分量同时给出最大的同相贡献：cos(0) = 1。',
    en: 'At zero optical path difference, all spectral components contribute in phase: cos(0) = 1.',
  },
  {
    startFrame: 5735,
    endFrame: 5865,
    zh: '于是干涉图中央形成醒目的中心强峰：ZPD 零光程差。',
    en: 'All cosine components align constructively, creating the prominent ZPD center burst.',
    emphasis: true,
  },

  // ================= ACT VII: 傅里叶变换频率检测 (03:16 - 04:42, 5880 - 8460) =================
  {
    startFrame: 5895,
    endFrame: 6030,
    zh: '这是一条由三个余弦分量合成的教学干涉图。',
    en: 'This teaching interferogram is the sum of three cosine components.',
  },
  {
    startFrame: 6030,
    endFrame: 6150,
    zh: '选一个试探波数，生成同频的余弦探针。',
    en: 'Choose a test wavenumber and generate its cosine probe.',
  },
  {
    startFrame: 6150,
    endFrame: 6240,
    zh: '把信号和探针逐点相乘，保留每个乘积的正负号。',
    en: 'Multiply signal and probe sample by sample, keeping each sign.',
  },
  {
    startFrame: 6240,
    endFrame: 6540,
    zh: '失配的探针产生正负交替贡献；完整累加后，它们几乎抵消。',
    en: 'A mismatched probe gives alternating signs; their complete sum nearly cancels.',
  },
  {
    startFrame: 6540,
    endFrame: 6660,
    zh: '改变探针频率时先暂停累加。',
    en: 'Accumulation pauses while the probe frequency changes.',
  },
  {
    startFrame: 6660,
    endFrame: 7020,
    zh: '探针匹配 1750 cm⁻¹ 分量后，净系数回到它的振幅：1.000。',
    en: 'At 1750 cm⁻¹, the recovered coefficient equals its component amplitude: 1.000.',
    emphasis: true,
  },
  {
    startFrame: 7020,
    endFrame: 7140,
    zh: '把这个系数送到谱图中对应的波数位置。',
    en: 'Send the coefficient to its wavenumber position in the spectrum.',
  },
  {
    startFrame: 7140,
    endFrame: 7740,
    zh: '用同一干涉图检验 1000、3000 cm⁻¹，逐个恢复三个分量。',
    en: 'Project the same record at 1000 and 3000 cm⁻¹ to recover all three components.',
  },
  {
    startFrame: 7740,
    endFrame: 8040,
    zh: '扫描候选波数；每个谱点都是一次实际计算出的投影系数。',
    en: 'Sweep candidate wavenumbers; each spectrum point is a computed projection coefficient.',
  },
  {
    startFrame: 8040,
    endFrame: 8280,
    zh: '降低 1750 cm⁻¹ 分量的振幅，干涉图与恢复系数一起更新。',
    en: 'Lower the 1750 cm⁻¹ component amplitude; the record and recovered coefficient update together.',
  },
  {
    startFrame: 8280,
    endFrame: 8440,
    zh: '刚才的投影累加，可写成这条有限采样公式。',
    en: 'The projection we just accumulated can be written as this finite-sample formula.',
    emphasis: true,
  },

  // ================= ACT VIII: 背景与样品 (04:42 - 05:02, 8460 - 9060) =================
  {
    startFrame: 8480,
    endFrame: 8700,
    zh: '测样品之前，还会先采集一份背景。两者分别傅里叶变换得到 B(ν̃) 与 S(ν̃)。',
    en: 'Before the sample, an empty reference is recorded. Transforming both gives B(ν̃) and S(ν̃).',
  },
  {
    startFrame: 8715,
    endFrame: 9045,
    zh: '两者相除，大部分共同的光源与仪器响应被抵消。留下的相对变化主要来自样品：T = S / B。',
    en: 'Ratioing S(ν̃) / B(ν̃) cancels instrument response, isolating sample transmittance: T = S / B.',
    emphasis: true,
  },

  // ================= ACT IX: 谱图回归分子振动 (05:02 - 05:24, 9060 - 9720) =================
  {
    startFrame: 9080,
    endFrame: 9340,
    zh: '透过率谱上，约 1715 cm⁻¹ 处的强吸收带，常归属于羰基 C=O 的伸缩振动。',
    en: 'In the transmittance spectrum, the 1715 cm⁻¹ dip corresponds to carbonyl C=O stretching.',
  },
  {
    startFrame: 9360,
    endFrame: 9700,
    zh: '吸收凹谷原位变形回跳动的分子双键。一个峰是一条线索。',
    en: 'The absorption notch morphs directly into the oscillating bond. One peak is one clue.',
    emphasis: true,
  },

  // ================= ACT X: 尾声 (05:24 - 05:36, 9720 - 10080) =================
  {
    startFrame: 9740,
    endFrame: 9910,
    zh: '把许多吸收带放在一起，一张光谱才逐渐形成属于样品的特征图样。',
    en: 'Combined together, the absorption bands form a characteristic molecular fingerprint.',
  },
  {
    startFrame: 9920,
    endFrame: 10070,
    zh: '光没有直接画出分子的样子。它记录下了分子如何运动，以及哪些红外频率与这些运动发生了相互作用。',
    en: 'Light does not photograph molecules: it records how they vibrate, and which frequencies resonate.',
    emphasis: true,
  },
];
