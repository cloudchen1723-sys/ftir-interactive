# Reference Data Freeze

> 2026-10-10 实验室扩充：原有三条冻结光谱的源文件和 processed 数组保持不变。新增五条 PNNL 实测液态 k 谱，并以 `lab-catalog.json` 提供八样本、38 个独立教学区间。下文 A–F 是原冻结记录；新增来源、转换和读谱限制见 G。

> 同日烯烃 / 炔烃追加：当前目录为 **10 样本、47 特征**，新增苯乙烯单体（液态 k）与丙炔（8 K 非晶固体 k）。此前八样本的源与数组及 manifest 记录保持不变，详见 H。

冻结日期：2026-09-29。范围仅限未来 Scene 09 / Free Lab 使用的 Reference Data；本目录不替代 Scene 01-08 的 Teaching Model，也没有修改任何教学 Scene 或 UI。

## A. Dataset Manifest

| sample | final dataset | phase | measurement | x | y | range | original -> local | license / redistribution | why selected |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Acetone | PNNL Liquids n/k Dataset, sample PNNL543226 (2025) | liquid | 多光程透射吸光度测量合成；MIR 为 Bruker Vertex 70，2.0 cm^-1，128 scans，26 +/- 1 C | wavenumber / cm^-1 | imaginary refractive index k / dimensionless | 9997.904-400.182 cm^-1 | 3-column ASCII -> JSON | CC0 1.0；允许再发布，作者请求引用 | 真实液态机器可读数据，完整 provenance，合法解决原先 Acetone 液膜数字谱问题 |
| Ethanol | PNNL Liquids n/k Dataset, sample PNNL559831 (2025) | liquid | 多光程透射吸光度测量合成；MIR 为 Bruker Tensor 27，2.0 cm^-1，128 scans，26 +/- 1 C | wavenumber / cm^-1 | imaginary refractive index k / dimensionless | 9996.945-399.690 cm^-1 | 3-column ASCII -> JSON | CC0 1.0；允许再发布，作者请求引用 | 液态、高分辨率、公开原始 n/k；适合展示氢键 O-H 宽带与 C-O 区域 |
| Polystyrene | IARPA/PNNL Liquid Phase IR, “Styrene, oligomers”, PNNL513043 (2017) | liquid | composite optical constants；Bruker Tensor 27，2.0 cm^-1，128 scans | wavenumber / cm^-1 | imaginary refractive index k / dimensionless | 7797.490-399.690 cm^-1 | compound JCAMP-DX -> JSON | 原记录及 JCAMP `OWNER` 明示 Public domain；保留来源 | 有完整机器可读曲线和清楚测量 metadata；峰位与教学所需芳香族/指纹特征一致 |

机器可读清单见 `manifest.json`。原始文件保存在 `source/`，浏览器可读文件保存在 `processed/`。

### Polystyrene 的两种对象必须分开

- `processed/polystyrene.json`：普通实测 Reference Spectrum，样品是 PNNL 的液态 styrene oligomers，纵轴为 k。
- `srm-1921b.json`：NIST SRM 1921b 证书中的认证峰位与不确定度，仅用于波数标尺校准。它不是完整谱，更不是上述 PNNL 曲线的“认证版本”。

## B. Teaching Peaks

具体数值、来源 URL 和结构化标记见 `annotations.json`。

| sample | default value/region | assignment | from final dataset | Main Scene |
| --- | --- | --- | --- | --- |
| Acetone | 1715.43 cm^-1，显示为约 1715 | strong C=O stretching | 是，本数据最大值 | 是 |
| Ethanol | 3200-3600 cm^-1，数据最大值 3338.26 | hydrogen-bonded O-H stretching envelope | 是 | 是 |
| Ethanol | 1050.08 cm^-1，显示为约 1050 | mainly C-O stretching；液态中存在耦合贡献 | 是；原候选 1048 按最终数据改为约 1050 | 是 |
| Polystyrene | 3025.85 cm^-1，显示为约 3026 | aromatic C-H stretching | 是 | 是 |
| Polystyrene | 1601.64 / 1493.16 cm^-1，显示为 1602 / 1493 | aromatic ring skeletal features | 是 | 是，作为一组 |
| Polystyrene | 757.43 / 698.61 cm^-1，显示为 757 / 699 | monosubstituted aromatic C-H out-of-plane fingerprint evidence | 是 | 是，作为一组 |

这些峰位通过未平滑的最终 k 数组在预先限定窗口内读取局部最大值。归属来自外部文献，不把自动峰值检测当作结构归属证据。

## C. Reference Details

- Acetone：1420.36、1362.99、1222.21、1092.52 cm^-1。主画面只保留 C=O；其余进入 Details，并对 1222/1093 的耦合归属使用“region”措辞。
- Ethanol：2974.26、2883.13、1455.55、1380.34、1090.58、881.34 cm^-1。O-H 与约 1050 cm^-1 保持主线，其余进入 Details。
- Polystyrene：3082.74、3060.56、2924.60、2850.84、1452.66、1029.35、906.89、841.80 cm^-1。SRM 认证值应在独立的“Calibration reference”层显示，不能覆盖普通谱实测位置。

## D. Data Processing Report

1. Acetone 与 Ethanol 原始数据从 PNNL DataHub DOI `10.25584/2997107` 的 CC0 归档取得；每个样品保存三列 ASCII 和官方 metadata PDF。
2. Polystyrene 从 NIST Chemistry WebBook 提供的 PNNL JCAMP-DX 记录取得；文件含独立 n 与 k 两个 block，本项目只选择 `YUNITS=absorption index` 的 k block。
3. `scripts/convert-reference-data.mjs` 对 PNNL ASCII 只选择第 1、3 列；对 JCAMP 只应用文件声明的 `XFACTOR`、`YFACTOR` 和 `DELTAX` 解码。
4. 未降采样、未平滑、未插值、未做基线校正、未归一化、未做单位转换、未把 k 转成 %T/A，也未生成任何 Gaussian/Lorentzian 峰。
5. PNNL 在发布源数据前做过多光程合成、频率校正及 NIR/MIR 合并；这是源数据的官方处理历史，不是本项目追加处理。
6. 验证内容：源文件 SHA-256；点数；x 严格降序；所有数值有限；JCAMP 声明点数一致；JSON 写入后逐点精确回读。结果见 `verification-report.json`。

转换命令：

```powershell
node reference-data/scripts/convert-reference-data.mjs
```

## E. Remaining Problems

- **License：** Acetone/Ethanol 已由 CC0 解决；Polystyrene 的单条 PNNL 记录明确标为 Public domain，但 NIST WebBook 站点总体仍有 compilation copyright，因此只能按该记录自身的 owner 声明再发布，不应批量复制其他 WebBook 数据。
- **Measurement condition：** Polystyrene JCAMP 未给出样品温度；这是未解决项。它还是液态 styrene oligomers，不代表普通室温固态 PS 薄膜。
- **Assignment uncertainty：** Ethanol 的约 1050 cm^-1 不是可视作完全孤立的单一正常模式；Details 中需保留“mainly / coupled”措辞。Acetone 1222、1093 与 Polystyrene 部分指纹峰也不应给出过度单一化的归属。
- **Data availability：** 三条完整数字曲线均已落盘。没有打包 SDBS 图片或峰表，也没有把 NIST SRM 证书中的示意图数字化。
- **Physical quantity：** 三条冻结曲线统一保留源数据的 k，而不是 %T 或 absorbance。未来 UI 若只能显示 %T/A，必须先增加正确的轴类型支持；不得仅为视觉统一改标签。
- **Representativeness：** Polystyrene 普通谱的数据相态是当前最重要的限制。若课程明确要求“常温固态 PS 薄膜 reference”，需要另行取得许可清楚的完整数字透射/ATR 数据后再替换普通谱；SRM 证书不能填补这个缺口。

## F. Ready / Not Ready

| sample | Scene 09 | Free Lab | condition |
| --- | --- | --- | --- |
| Acetone | Ready | Ready | 以液态 PNNL k 谱显示，轴必须标 `k`；Main Scene 用约 1715 cm^-1 |
| Ethanol | Ready | Ready | 以液态 PNNL k 谱显示；Main Scene 用 3200-3600 与约 1050 cm^-1 |
| Polystyrene | Ready with condition | Ready with condition | 明示“PNNL liquid styrene oligomers”；普通谱与 SRM 1921b 校准值保持两个对象；如产品语义要求固态薄膜，则在替换数据前视为 Not Ready |

这里的 Ready 只表示数据、许可、转换和 provenance 已足够进入实现；不代表已授权实现 Scene 09 或 Free Lab。

## Sources

- PNNL DataHub, *PNNL Liquids Refractive Index (n/k) Dataset from 1 to 25 Micron*, DOI: https://doi.org/10.25584/2997107
- NIST WebBook / PNNL, *Styrene, oligomers*: https://webbook.nist.gov/cgi/cbook.cgi?ID=C9003536&Index=0&Type=IR-SPEC
- NIST SRM 1921b certificate: https://tsapps.nist.gov/srmext/certificates/1921b.pdf
- NIST acetone vibrational levels: https://webbook.nist.gov/cgi/cbook.cgi?ID=C67641&Mask=3FF0
- SDBS ethanol record No. 1300: https://sdbs.db.aist.go.jp/CompoundLanding.aspx?sdbsno=1300
- Polystyrene assignment reference (PCCP author manuscript): https://pubs.rsc.org/en/content/getauthorversionpdf/C4CP03516J

## G. 官能团读谱数据库（2026-10-10）

`lab-catalog.json` 是实验室 UI 的唯一目录。它不是模拟仪器数据：曲线读取 `processed/*.json` 中未经本项目平滑、降采样、插值、归一化或基线修正的实测 k 数组；解释是独立层。

| 新样本 / CAS | 原始 PNNL 记录 | 点数 | 原始 k 区间局部最大值（约 cm⁻¹） | 教学线索 |
| --- | --- | --- | --- | --- |
| 辛酸 / 124-07-2 | PNNL514789，Sigma ≥99%，lot MKBV8509V | 15345 | C=O 1711.56；C–O 相关区 1276.20；CH₂/CH₃ 变形区 1457.96 | 羧酸羰基 + 很宽 O–H 包络 + 长碳链；不是所有羧酸的固定峰位 |
| 乙酸甲酯 / 79-20-9 | PNNL514676，Sigma-Aldrich 99.5%，lot SHBG4345V | 15347 | C=O 1747.19；C–O 相关区 1246.79 / 1047.69；CH₃ 变形区 1371.17 | 酯羰基与 C–O 联合；不以羰基位置唯一鉴定 |
| 乙腈 / 75-05-8 | PNNL325466，Sigma-Aldrich 98%，lot 73496JM | 15345 | C≡N 2253.48；CH₃ 伸缩区 2944.37；变形区 1375.52；骨架区 917.98 | 腈窄带 + 甲基与骨架；气态文献频率不代替液态数据 |
| 叔丁胺 / 75-64-9 | PNNL520004，Aldrich ≥99.5%，lot SHBG8066V | 15345 | N–H 3350.85 / 3280.46；NH₂ 弯曲相关区 1601.17；CH₃ 变形区 1364.44 | 叔丁基连接的是 NH₂，属于伯胺；N–H 双带与弯曲区联合 |
| 正辛烷 / 111-65-9 | PNNL511797，Sigma-Aldrich ≥99%，lot SHBF6475V | 15345 | C–H 2925.57 / 2856.14；CH₂/CH₃ 变形区 1467.61 / 1378.41 | 认识烷基峰群，作为羰基 / O–H 样本的对照 |

这五条均为 IARPA/PNNL 2017 年液态光学常数记录，单条官方页面与原始 JCAMP `OWNER=Public domain` 明确允许该记录再发布。保留每条原始 n/k compound JCAMP、官方完整测量 metadata PDF 和下载出处 `*-provenance.json`；不泛化为复制 NIST 其他受限编译数据的许可。

测量为多光程透射吸光度谱合成并由发布者导出 n/k；液体样品为 26 ± 1 °C，2.0 cm⁻¹ 仪器分辨率、128 interferograms、Norton–Beer Medium、Mertz、4× zerofill。乙酸甲酯官方记录仪器为 Bruker Tensor 37，其他新增四条为 Tensor 27，按原文保留。约 0.482 cm⁻¹ 是补零后的取样网格，不是 0.482 cm⁻¹ 仪器分辨率。每条 source PDF 保留不同光程、供应商、批次、合成和频率校正历史。原始 PDF 的旧表述包含吸光度轴说明，但此处严格选择 JCAMP `YUNITS=absorption index`、`YLABEL=Imaginary refractive index` 的 k block；k 是无量纲光学常数，绝不重标为 A、%T 或吸收系数。

### 目录 schema

- `samples[]`：`id`、`labelZh`、`file`（相对本目录的 `processed/name.json`）、`familyZh`、`readingIntroZh`、`readingOrder`、`features`、`metadata`。
- 每项 `metadata` 保留整个 manifest record，并补入 processed 的完整 `measurementDetails`、`sourceDetails` 与 `processing`；原始 metadata 文件及 SHA-256 可追溯。
- `features[]`：`id`、`labelZh`、`rangeCm1:[low,high]`、`observedCm1`、`observedK`、`broad`、`explanationZh`、`assignmentUrl`、`assignmentSource`、`observedKind`。区间是学习窗口，不是物质鉴定阈值。
- `observedCm1` 是原始 k 数据在所选窗口的最大值。窄带须通过相邻点局部最大值检查；宽带只报告包络窗口最大值。UI 可以使用同一数组实时读取窗口最大值，不应把这些注释值插入曲线。

### 初学者读谱的边界

1. 先看波数位置与峰形，再提出可能归属，最后联合其他区间和完整指纹。官能团归属不能从峰高自动推断，也不能凭单峰确定物质身份。
2. **辛酸 2500–3300 cm⁻¹ 的宽 O–H 包络与强 C–H 伸缩重叠，窗口最大值为 2930.87 cm⁻¹；这不是纯 O–H 模式的峰位。** `broad=true` 与中文解释明确保留这个限制；应看宽包络与 C=O 的联合证据。
3. 指纹区常包含耦合模式，C–O 相关、CH₂/CH₃ 变形和环骨架均使用合格的区域措辞，不宣称一峰对应一根独立化学键。乙腈的模式表还标明部分组合带 / Fermi resonance 影响。
4. 八条谱纵轴统一为真实 k，吸收方向向上。不同分子的峰高不能直接当作同浓度或吸收强弱的简单比较；本项目没有规定光程，也没有 k→A/%T 转换。
5. `polystyrene` 原有数据依然是液态苯乙烯低聚物；目录名称和限制明示液态，不称其为固态薄膜，不与 SRM 1921b 校准峰表混用。

### 可复现命令与检查

```powershell
# 可选：重新从官方单条记录下载原始 JCAMP / metadata PDF；需要网络访问许可
& reference-data/scripts/download-lab-data.ps1

# 转换仅写新增五条 processed，追加新 manifest / annotations；生成完整八样本目录
node reference-data/scripts/build-lab-catalog.mjs
```

`scripts/lab-definitions.mjs` 只储存教学窗口与有来源支持的中文解释；不是谱生成器。`build-lab-catalog.mjs` 从原始 JCAMP 读取 k block，应用声明的 XFACTOR、YFACTOR、FIRSTX 与 DELTAX。逐条验证 OWNER / 相态 / CAS / 数量、打印 X 锚点与重建网格的一致性、严格降序、有限数值、实际窄带局部最大值、JSON 回读精确一致、源与 metadata / processed SHA-256，以及原有三条源和 processed 文件不变。重复运行产生相同数据文件和目录。

结果见 `lab-validation-report.json`：八样本、38 特征通过，原六个冻结数据文件 SHA-256 不变。原 `convert-reference-data.mjs` 和 `verification-report.json` 保留原三条冻结范围，新增检查另存。

**已有来源完整性差异：** 本轮发现原有丙酮 / 乙醇 ASCII 的实际 SHA-256 与旧 manifest 声明不一致（分别为实际 `b32b2794f86c3323d352b5ce98c300a2b3ca611649af633e6f721a80ece7f2ee`、`c91970018c8e8ff0e48f7371e2b928a65c1924c2aff4ffc7d07a0fb28f9e50b3`）。本轮没有写这两个源文件；它们的 x / k 全部点与保留的 processed 数组精确相等，三条 processed 的实际 SHA 均匹配旧 manifest，PS 原始 JCAMP 的 SHA 也匹配。报告同时保存旧声明与当前实际值，catalog metadata 也保留该校验结果。无法从现有证据确定旧源字节差异的原因；不把它归因为换行，也不静默修改旧 provenance。这里“原六个文件不变”仅指本轮前后不变，不能把两个旧源的历史 SHA 校验称为通过。

### 新增官方来源与归属依据

- PNNL/NIST dataset methods: [IARPA / PNNL Liquid Phase IR Spectra](https://webbook.nist.gov/chemistry/silmarils-liquids-n-k/), [2018 methods paper](https://doi.org/10.1177/0003702817742848)。
- [辛酸官方记录](https://webbook.nist.gov/cgi/cbook.cgi?Contrib=IARPA-IR-L&ID=C124072&Index=0&Type=IR-SPEC)、[乙酸甲酯官方记录](https://webbook.nist.gov/cgi/cbook.cgi?Contrib=IARPA-IR-L&ID=C79209&Index=0&Type=IR-SPEC)、[乙腈官方记录](https://webbook.nist.gov/cgi/cbook.cgi?Contrib=IARPA-IR-L&ID=C75058&Index=0&Type=IR-SPEC)、[叔丁胺官方记录](https://webbook.nist.gov/cgi/cbook.cgi?Contrib=IARPA-IR-L&ID=C75649&Index=0&Type=IR-SPEC)、[正辛烷官方记录](https://webbook.nist.gov/cgi/cbook.cgi?Contrib=IARPA-IR-L&ID=C111659&Index=0&Type=IR-SPEC)。每条具体 JCAMP index 与 PDF URL 记录在 provenance / manifest / processed 中。
- [Northern Illinois University 官能团相关表](https://clas.niu.edu/clas/chembio/research/analytical-lab/ftir/ir-frequencies-table.shtml)：羰基、O–H、N–H、C–O、烷基伸缩与变形的常见区间。
- [UCLA WebSpectra 教学表](https://webspectra.chem.ucla.edu/irtable.html)：宽羟基、伯胺双带与常见区间 / 环境变化。
- [Athabasca University IR tutorial](https://www.athabascau.ca/science-and-technology/_documents/centre-for-science-files/labs/organic-chemistry/exp/6_ir_tutorial.pdf)：乙酸酯 C–O 相关区间。
- [NIST 乙腈振动模式表](https://webbook.nist.gov/cgi/cbook.cgi?ID=C75058&Mask=800) 与 [丙酮模式表](https://webbook.nist.gov/cgi/cbook.cgi?ID=C67641&Mask=800)：只用于归属解释；不下载或复制模式表来充作实测曲线。

2025 年 CC0 归档经官方当前链接尝试下载但 Globus 未响应，因而本次采用许可与完整条件均可核对的 2017 年单条 PNNL 记录。没有下载 SDBS 谱图或受限数据，也没有造峰或用认证峰位表补成完整谱。

## H. 烯烃与炔烃追加（当前 10 样本 / 47 特征）

| 样本 | 来源与许可 | 相态 / 条件 | 点数 | 原数组区间最大值 cm⁻¹ |
| --- | --- | --- | --- | --- |
| 苯乙烯单体 / 100-42-5 | PNNL518689，2017，单条 JCAMP OWNER=Public domain | 液态，26 ± 1 °C；Sigma-Aldrich ≥99%，lot MKBV4061V，供应商加 4-tert-butylcatechol 稳定剂 | 15345 | C=C 1630.095；末端乙烯基面外 991.260 / 908.814；sp² C–H 重叠区 3027.335；芳环 1494.614 |
| 丙炔 / 74-99-7 | NASA Cosmic Ice Laboratory，Hudson et al. (2021)；NASA OCdb Data Redistribution / Open Access Data Policy，保留作者署名，不称 CC0 | 8 K 非晶固体；气相沉积、正入射透射 FTIR，作者由实验数据取得 n/k；原表注明温度与相态 | 74670 | ≡C–H 3280.737；较弱 C≡C 2124.000；C–H 弯曲区 1438.057；端炔弯曲区 646.891 |

苯乙烯原始 n/k JCAMP 与完整 PNNL PDF 保存于 source。它是末端乙烯基与苯环相连的**单体**，不得与原有的液态 styrene oligomers 混淆。≈3027 cm⁻¹ 所选区间有烯基 / 芳香 C–H 重叠，不能把窗口最大值全部归给末端烯基。低波数 ≈991 / 909 cm⁻¹ 两带需与 C=C 区联合读。归属支持：[MSU 官能团与烯烃取代模式说明](https://www2.chemistry.msu.edu/faculty/reusch/VirtTxtJml/Spectrpy/InfraRed/irspec1.htm)、[NIU 相关表](https://clas.niu.edu/clas/chembio/research/analytical-lab/ftir/ir-frequencies-table.shtml)、[Virginia Tech 原始研究中 styrene 乙烯基 ≈910 cm⁻¹ 用途](https://vtechworks.lib.vt.edu/items/d56cf39d-3335-4784-be68-4bf60b9c4d88)。

丙炔完整原始工作簿为 `source/C3Hx_optical_constants_2020-05-29.xlsx`，SHA-256 `88bdfb1d07546fc7344e02553907ea81403566fd53b4813a1e51d247d57b1edc`。使用 `C3H4 - propyne` sheet 第一组：A1=`Propyne at 8 K`、A2=`Amorphous form`，**C 列波数与 E 列 k，第 2–74671 行全数值**。没有读 80 K 晶体列，没有用另一 sheet，也没有改原表。完整源数组由读取脚本导出，逐点回读与原列一致。`measurement.sampleTemperatureK=8`、`phase=solid`、`phaseDetail=amorphous ice` 与中文 `conditionsZh` 可供 UI 显著显示；没有伪设室温摄氏温度。

NASA 原列 k 含 **20158 个负值**，最小值 `−0.05326035281` 位于 `515.813072 cm⁻¹`，最大值 `0.268752962583333`。这些是源文件的负基线 / 数值处理值，原样保留，不表示物理上的负吸收；本项目不推断其具体原因，不裁零、不归一化。全范围负值不能笼统称“少量 / 很小噪声”。参考曲线是作者**由实验透射数据进行光学常数分析**的结果，不是直接把原始透射读数重标为 k，也不是本项目合成谱。论文还报告非晶样本包含 ≈0.1% CO₂ 和 ≈1% 丙二烯的弱特征，本项目没有清除这些谱带。

[Hudson et al. Icarus 354 (2021), 114033](https://doi.org/10.1016/j.icarus.2020.114033) 的 Table 8 支持四个非晶丙炔教学区间；其归属是近似模式描述，不能把指纹峰说成完全孤立的一根键。论文记录 0.5 cm⁻¹ 仪器分辨率、200 scans、正入射透射测量、预冷 CsI 或 KBr 基底。约 0.0603 cm⁻¹ 的工作簿网格不等于仪器分辨率；该表没有单独给所选 block 的唯一膜厚与具体基底，相关字段明确 null / 未单独指定，不能代用论文的不同厚度实验范围当作一个确定膜厚。Thermo iS50 出现在论文的相态检查设备说明，所选工作簿没有另列光学常数采集仪器型号，保留这项区分。

### 来源与再分发

- 原始 workbook 官方下载：[NASA Cosmic Ice Lab C3 hydrocarbon optical constants](https://science.gsfc.nasa.gov/691/cosmicice/constants/C3_hydrocarbons/C3Hx_optical_constants_2020-05-29.xlsx)，官方[数据索引与引用要求](https://science.gsfc.nasa.gov/691/cosmicice/constants.html)。
- [NASA OCdb Terms of Use](https://ocdb.smce.nasa.gov/page/toc) 专门的 Data Redistribution 条款说明数据按 NASA Open Access Data Policy 发布；项目保留 NASA 数据来源与 Hudson 等署名，许可字段保留这个表述，不伪称 CC0，也不由此推导可以复制期刊论文全文。
- [PNNL 苯乙烯单体官方记录](https://webbook.nist.gov/cgi/cbook.cgi?Contrib=IARPA-IR-L&ID=C100425&Index=0&Type=IR-SPEC)，其原始文件 OWNER 明确 Public domain。
- 曾核对 [Zenodo 4110814](https://zenodo.org/records/4110814) 的 CC-BY4 数据，但论文是 1–2.6 µm 近红外反射实验，不含此处所需中红外基本振动区；该归档没有进入目录，也没有重标成中红外 / k 数据。

### 可复现导出

读取源工作簿使用 bundled Python/openpyxl（只读）：

```powershell
# 与前述 PNNL 记录下载脚本一同使用；下载 NASA 原表后不修改它
Invoke-WebRequest -Uri 'https://science.gsfc.nasa.gov/691/cosmicice/constants/C3_hydrocarbons/C3Hx_optical_constants_2020-05-29.xlsx' -OutFile 'reference-data/source/C3Hx_optical_constants_2020-05-29.xlsx'

# build 自动调用 extract-propyne-workbook.py，并核对源表标题、列、数值与顺序
node reference-data/scripts/build-lab-catalog.mjs
```

需要另一台机器的 Python 时设置 `FTIR_REFERENCE_PYTHON` 指向装有 openpyxl 的现有运行时。报告保存完整源文件 SHA、选择 sheet / 列 / 行范围、点数、区间真实局部最大值与数组回读结果；源 workbook 原样保留供独立复验。原八样本的 manifest records 和源 / processed 受脚本前后不变检查保护；原丙酮 / 乙醇历史 SHA 差异继续明确报告，不被这次新增覆盖。
