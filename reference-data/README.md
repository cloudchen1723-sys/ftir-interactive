# Reference Data Freeze

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
