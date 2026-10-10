// Interpretation is independent of measured arrays. Ranges are teaching windows,
// not universal identification thresholds. observedCm1 is calculated elsewhere.
const niu = 'https://clas.niu.edu/clas/chembio/research/analytical-lab/ftir/ir-frequencies-table.shtml';
const ucla = 'https://webspectra.chem.ucla.edu/irtable.html';
const athabasca = 'https://www.athabascau.ca/science-and-technology/_documents/centre-for-science-files/labs/organic-chemistry/exp/6_ir_tutorial.pdf';
const acetoneModes = 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C67641&Mask=800';
const nitrileModes = 'https://webbook.nist.gov/cgi/cbook.cgi?ID=C75058&Mask=800';
const psModes = 'https://pubs.rsc.org/en/content/getauthorversionpdf/C4CP03516J';
const msu = 'https://www2.chemistry.msu.edu/faculty/reusch/VirtTxtJml/Spectrpy/InfraRed/irspec1.htm';
const propyneModes = 'https://science.gsfc.nasa.gov/691/cosmicice/reprints/Hudson-2021-2746.pdf';
const f = (id, labelZh, rangeCm1, explanationZh, assignmentUrl = niu, broad = false) => ({ id, labelZh, rangeCm1, broad, explanationZh, assignmentUrl });

export const definitions = [
  { id: 'acetone-pnnl-2025', slug: 'acetone', labelZh: '丙酮', familyZh: '酮', readingIntroZh: '先找羰基强带，再观察甲基；用多处证据理解酮的谱形。', features: [
    f('carbonyl', 'C=O 伸缩', [1680, 1750], '先看约 1700 cm⁻¹ 的强带：它支持羰基伸缩。再结合甲基区；仅凭这一带不能唯一认定丙酮。', acetoneModes),
    f('ch-stretch', '脂肪族 C–H 伸缩', [2850, 3020], '这里的一组较高波数峰支持甲基 C–H 伸缩。与羰基带一起读；C–H 在许多有机物中都出现。', acetoneModes),
    f('ch3-asym-bend', 'CH₃ 变形区', [1390, 1460], '观察约 1400 cm⁻¹ 的峰，可能主要含甲基非对称变形。再对照另一甲基变形区；真实振动可能含耦合。', acetoneModes),
    f('ch3-sym-bend', 'CH₃ 对称变形区', [1340, 1390], '这里的峰支持甲基对称变形。联合 C–H 伸缩和羰基读谱，不把一个指纹峰当作一种物质的身份证。', acetoneModes),
  ] },
  { id: 'ethanol-pnnl-2025', slug: 'ethanol', labelZh: '乙醇', familyZh: '醇', readingIntroZh: '先看宽 O–H 包络，再寻找 C–O 与烷基的辅助证据。', features: [
    f('oh-envelope', '氢键 O–H 宽带', [3200, 3600], '先看连续宽包络：液体中的氢键使 O–H 伸缩展宽。区间最大值只是包络位置；再看 C–O 区支持醇的判断。', ucla, true),
    f('co-region', '以 C–O 为主的指纹区', [1020, 1080], '这里的强带主要与 C–O 伸缩有关，也可能包含 C–C/O–H 耦合。与宽 O–H 联合观察，不能把它理解成完全孤立的一根键。', niu),
    f('ch-stretch', '脂肪族 C–H 伸缩', [2850, 3000], '一组较窄峰支持烷基 C–H 伸缩。它们说明碳氢骨架；是否含醇还需宽 O–H 与 C–O 共同支持。'),
    f('ch-bend', 'CH₂/CH₃ 变形区', [1430, 1480], '观察约 1450 cm⁻¹ 的峰：可能含 CH₂/CH₃ 变形，液体中有模式耦合。用它补充烷基证据，不单峰定结构。'),
    f('ch3-bend', 'CH₃ 变形区', [1350, 1400], '这一带可作为甲基变形的辅助线索。与 C–H 伸缩及相邻变形带一起比较，指纹区通常不是一峰对应一根键。'),
  ] },
  { id: 'polystyrene-pnnl-2017', slug: 'polystyrene', labelZh: '苯乙烯低聚物（液态）', familyZh: '芳香族', readingIntroZh: '样品是液态苯乙烯低聚物；先看芳香 C–H，再看环骨架和低波数指纹。', features: [
    f('aromatic-ch', '芳香 C–H 伸缩', [3000, 3050], '观察略高于 3000 cm⁻¹ 的峰：支持芳香 C–H 伸缩。再找环骨架和面外振动，不凭它判断所有芳香结构。', psModes),
    f('ring-high', '芳环骨架振动', [1585, 1615], '这处峰支持芳环骨架振动。与约 1490 cm⁻¹ 的另一环带一起看，形成比单峰更有力的芳香族线索。', psModes),
    f('ring-low', '芳环骨架辅助带', [1475, 1510], '观察这处环骨架特征，并与约 1600 cm⁻¹ 的峰配对。环振动有耦合，不宜简单描述为一条独立 C=C 键。', psModes),
    f('oop-high', '芳香 C–H 面外区', [735, 770], '低波数强峰可为单取代芳环的 C–H 面外振动提供指纹线索。要与约 700 cm⁻¹ 及上方环带联合验证。', psModes),
    f('oop-low', '芳香面外指纹辅助带', [680, 715], '与约 750 cm⁻¹ 的带一起读：这组面外振动支持单取代芳环指纹。液态低聚物谱不能当作固态薄膜的校准证书。', psModes),
    f('alkyl-ch', '骨架 C–H 伸缩', [2850, 2970], '这里还可见脂肪族 C–H 伸缩，反映低聚物的碳氢骨架。与芳香 C–H 对比，认识一个样品可同时有多类振动。', niu),
  ] },
  { id: 'octanoic-acid-pnnl-2017', slug: 'octanoic-acid', labelZh: '辛酸', familyZh: '羧酸', name: 'Octanoic acid', cas: '124-07-2', supplier: 'Sigma', purity: '≥99%', lot: 'MKBV8509V', pathLengthsUm: [1.1,4.8,5.1,15.4,36.4,97,201,502,1058], readingIntroZh: '先联合羰基与宽 O–H 包络，再看长烷基链；该样本不代表所有羧酸的固定峰位。', features: [
    f('carbonyl', '羧酸 C=O 伸缩', [1680, 1740], '先看强羰基带：这一区域符合羧酸 C=O 伸缩。再找宽 O–H 包络；羰基位置也随氢键和结构改变，不能单峰区分所有羧酸。'),
    f('acid-oh-envelope', '羧酸 O–H 宽包络（重叠）', [2500, 3300], '观察宽包络而非单一尖峰：羧酸 O–H 与 C–H 伸缩重叠；区间最大值不等于纯 O–H 峰位。结合羰基带判断，不能把最大值直接命名为 O–H 模式。', niu, true),
    f('ch-stretch', '长链 C–H 伸缩', [2850, 3000], '宽背景上的窄峰主要支持烷基 C–H 伸缩。辛酸同时有长碳链和羧酸；窄峰与宽 O–H 包络可能重叠。'),
    f('co-region', 'C–O 相关指纹区', [1200, 1320], '这一指纹区可含羧酸 C–O 伸缩及其他耦合贡献。先用羰基与宽 O–H 建立线索，再把这里作为辅助证据。'),
    f('ch-bend', '烷基 CH₂/CH₃ 变形区', [1430, 1485], '这处峰可含长链 CH₂ 和甲基变形。与 C–H 伸缩一起支持烷基骨架，不能据此区分羧酸与酯。'),
  ] },
  { id: 'methyl-acetate-pnnl-2017', slug: 'methyl-acetate', labelZh: '乙酸甲酯', familyZh: '酯', name: 'Methyl acetate', cas: '79-20-9', supplier: 'Sigma-Aldrich', purity: '99.5%', lot: 'SHBG4345V', pathLengthsUm: [2.6,4,11.9,14.5,36.1,51.5,99.6,200,503,1037], readingIntroZh: '先读羰基，再看 C–O 指纹和甲基；与酮和羧酸比较多处证据。', features: [
    f('carbonyl', '酯 C=O 伸缩', [1710, 1770], '这处强带支持酯羰基伸缩。酯与酮的常见区间有所不同，但会受结构影响；再用 C–O 区验证，不能只看一个峰。'),
    f('co-acetate', '乙酸酯 C–O 相关强带', [1190, 1280], '这里的强带与乙酸酯 C–O 相关振动相符，可能混有骨架耦合。与羰基联合读谱，比只按羰基峰位命名更稳妥。', athabasca),
    f('co-fingerprint', 'C–O 相关指纹辅助区', [1000, 1080], '这一低波数区可能含 C–O 与其他骨架耦合贡献。把它视为辅助指纹，联合较高波数 C–O 带和羰基，不作一峰一键归属。'),
    f('ch-stretch', '甲基 C–H 伸缩', [2850, 3020], '观察几处窄峰，支持甲基 C–H 伸缩。很多有机物都出现这些峰；酯的线索还需羰基和 C–O 一起给出。'),
    f('ch3-bend', 'CH₃ 变形区', [1350, 1400], '这里的带可支持甲基变形。与甲基伸缩和羰基比较，指纹区中的振动常有耦合，不能据单峰认定乙酸甲酯。'),
  ] },
  { id: 'acetonitrile-pnnl-2017', slug: 'acetonitrile', labelZh: '乙腈', familyZh: '腈', name: 'Acetonitrile', cas: '75-05-8', supplier: 'Sigma-Aldrich', purity: '98%', lot: '73496JM', pathLengthsUm: [1.8,3.3,15.7,35.9,39.9,108,197,509,522,1211], readingIntroZh: '先找约 2250 cm⁻¹ 的窄带，再与甲基及指纹证据一起读。', features: [
    f('nitrile', 'C≡N 伸缩', [2220, 2280], '先看这处窄带：它支持腈基 C≡N 伸缩。NIST 模式表支持此归属，但气态频率不能直接代替这里的液态实测位置。', nitrileModes),
    f('ch-stretch', '甲基 C–H 伸缩', [2900, 3040], '这里的峰支持甲基伸缩；腈旁的甲基环境会影响位置。与 C≡N 带一起看，不按是否超过 3000 cm⁻¹ 单独认定芳香族。', nitrileModes),
    f('ch3-bend', '甲基变形区', [1350, 1410], '这一区域可含甲基对称变形以及组合带影响。联合甲基伸缩和腈带；NIST 对部分模式注明耦合，不能给每峰绝对单一归属。', nitrileModes),
    f('cc-region', 'C–C 相关骨架振动', [890, 945], '指纹区这处带与 C–C 伸缩相关模式相符。它只补充骨架证据；先用腈带建立官能团线索，不能仅凭这里鉴定乙腈。', nitrileModes),
  ] },
  { id: 'tert-butylamine-pnnl-2017', slug: 'tert-butylamine', labelZh: '叔丁胺', familyZh: '伯胺', name: 'tert-Butylamine', cas: '75-64-9', supplier: 'Aldrich', purity: '≥99.5%', lot: 'SHBG8066V', pathLengthsUm: [0.748,0.951,3.81,11.3,15.9,38.7,55.5,107,206,508,1042], readingIntroZh: '叔丁胺的胺基是 NH₂，属于伯胺；先看 N–H 双带，再核对弯曲与烷基。', features: [
    f('nh-high', 'NH₂ 伸缩：较高波数带', [3330, 3450], '观察 N–H 区较高波数的一处带。伯胺 NH₂ 常有两条伸缩带；再与较低波数 N–H 带联合观察，别被“叔丁”名称误认为叔胺。', ucla),
    f('nh-low', 'NH₂ 伸缩：较低波数带', [3200, 3330], '与较高波数的 N–H 带配对阅读，支持 NH₂ 伸缩。液态氢键可改变位置与带宽；双带也要结合 N–H 弯曲区验证。', niu),
    f('nh-bend', 'NH₂ 弯曲相关区', [1550, 1650], '这处指纹带可含 NH₂ 弯曲，模式可能耦合。与高波数 N–H 双带一起支持伯胺线索，不单凭它区分所有含氮化合物。'),
    f('ch-stretch', '烷基 C–H 伸缩', [2850, 3020], '一组窄峰支持叔丁基的 C–H 伸缩。先与上方 N–H 区分，再把两者结合，理解同一分子可含不同官能团证据。'),
    f('ch3-bend', 'CH₃ 变形区', [1340, 1405], '这里可含叔丁基甲基变形。它为烷基骨架提供辅助信息，不能代替 N–H 双带来判断胺的类型。'),
  ] },
  { id: 'octane-pnnl-2017', slug: 'octane', labelZh: '正辛烷', familyZh: '烷烃', name: 'Octane', cas: '111-65-9', supplier: 'Sigma-Aldrich', purity: '≥99%', lot: 'SHBF6475V', pathLengthsUm: [1.8,7.6,15,40,110,197,505,1009], readingIntroZh: '先看 C–H 峰群，再看 CH₂/CH₃ 变形；作为含羰基和 O–H 样本的对照。', features: [
    f('ch-stretch-high', 'C–H 伸缩峰群：高波数侧', [2900, 3000], '这组窄峰主要支持烷基 C–H 伸缩。和较低波数侧一起看，先认识峰群，再用变形区补充骨架信息。'),
    f('ch-stretch-low', 'C–H 伸缩峰群：低波数侧', [2835, 2900], '低波数侧也有 C–H 伸缩贡献，不能把整组峰只命名为一个模式。结合 CH₂/CH₃ 变形，并与含羰基样本比较。'),
    f('ch2-bend', 'CH₂/CH₃ 变形区', [1430, 1485], '这一区域可含 CH₂ 剪式及甲基变形。与伸缩峰群联合支持烷基骨架；这些振动并非正辛烷独有。'),
    f('ch3-bend', 'CH₃ 变形区', [1350, 1400], '这里的带可支持链端甲基变形。把它作为辅助线索，完整指纹和多处比较才能提高结构判断的可信度。'),
  ] },
  { id: 'styrene-pnnl-2017', slug: 'styrene', labelZh: '苯乙烯单体（液态）', familyZh: '末端烯烃 / 芳香族', name: 'Styrene', cas: '100-42-5', supplier: 'Sigma-Aldrich', purity: '≥99%', lot: 'MKBV4061V', pathLengthsUm: [3.95,8.71,15.1,29.9,35.5,54,98.2,202,537,1017], preparation: 'Vendor added 4-tert-butylcatechol as stabilizer.', readingIntroZh: '先看末端乙烯基的成对面外带，再核对 C=C 与芳环；这是单体，不是液态低聚物谱。', features: [
    f('vinyl-cc', '乙烯基 C=C 伸缩区', [1615, 1650], '这里的带支持与苯环共轭的乙烯基 C=C 伸缩。位置会受共轭影响；先与末端 =CH₂ 面外带联合，不单凭这一带认定烯烃。', niu),
    f('vinyl-oop-high', '末端 =CH₂ 面外带：高波数侧', [975, 1010], '约 990 cm⁻¹ 的带可与约 910 cm⁻¹ 的带成对支持末端乙烯基。指纹区可能耦合；要联合 C=C 和 =C–H 区域读谱。', msu),
    f('vinyl-oop-low', '末端 =CH₂ 面外带：低波数侧', [890, 935], '与约 990 cm⁻¹ 的带一起观察，支持 R–CH=CH₂ 的面外振动组合。不能把一个低波数指纹峰当作唯一物质鉴定。', msu),
    f('sp2-ch', 'sp² C–H 伸缩区（烯基 / 芳香重叠）', [3000, 3120], '一组峰支持 sp² C–H 伸缩；苯乙烯同时含烯基和芳环，二者可重叠。不要把本区最大值全部归给烯基，需再看低波数组合。', msu),
    f('aromatic-ring', '芳环骨架辅助带', [1475, 1510], '这里的芳环骨架带说明同一单体还有苯环。与乙烯基特征分开联合观察，不能把苯乙烯与聚苯乙烯低聚物视作同一个样品。', msu),
  ] },
  { id: 'propyne-nasa-2021-8k', slug: 'propyne', parser: 'nasa-propyne-workbook', labelZh: '丙炔（8 K 非晶固体）', familyZh: '端炔', name: 'Propyne', cas: '74-99-7', readingIntroZh: '这是 8 K 非晶丙炔的实测 k 谱；先看端炔 ≡C–H，再读较弱的 C≡C 与弯曲带。', features: [
    f('terminal-ch', '端炔 ≡C–H 伸缩', [3233, 3333], '先看约 3280 cm⁻¹ 的端炔 C–H 带。这里是 8 K 非晶固体，位置和宽度不代表室温气体或液体；再结合 C≡C 与弯曲区。', propyneModes),
    f('triple-stretch', 'C≡C 伸缩（较弱）', [2112, 2136], '这处较弱带与论文给出的 C≡C 伸缩相符。三键伸缩可因对称性而很弱或不活跃，不能从缺少强峰否定炔键；本样本须与端炔 C–H 联合判断。', propyneModes),
    f('ch-bend', 'C–H 弯曲相关区', [1414, 1462], '这里的带可含丙炔 C–H 弯曲贡献，论文归属为近似模式描述。与端炔伸缩和 C≡C 一起读，指纹区通常包含耦合。', propyneModes),
    f('terminal-bend', '端炔 H–C≡C 弯曲区', [590, 720], '低波数这一带支持端炔 C–H 弯曲。先对照高波数 ≡C–H 伸缩，再联合较弱 C≡C；非晶固体的带形不可套成所有端炔的固定规则。', propyneModes),
  ] },
];
