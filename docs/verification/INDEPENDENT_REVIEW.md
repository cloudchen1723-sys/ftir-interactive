# 独立审核：PASS

审核日期：2026-10-11（Asia/Shanghai）。Reviewer 未参与本轮实现；只修改本报告，独立脚本、日志、隔离 HTML 与临时截图保存在项目外 `../FTIR-archive/2026-10-10/project-cleanup/independent-review/`。本结论针对最终目录整理、交付文件、上传说明及限定离线页面复验，没有发现需要修改生产代码的问题。

## 独立静态核对

- 归档 manifest 的 **26 项、1,080 个文件、101,525,770 字节**逐文件核对存在性、文件数、大小和 SHA-256，全部相符。原路径均已移出；原位置在项目根内、恢复文件在归档 `moved/` 内，结构一致，没有越界路径。`pre-cleanup/` 的 README、package.json、.gitignore 存在；按清单恢复前须确认目标尚不存在。
- 当前 `reference-data/` 的 **47 个文件**与整理前保护清单一一对应，SHA-256 全部相同，包括原始来源、processed、catalog、注释与脚本；没有新增或遗漏文件。此项证明本轮整理未改数据，不意味着旧来源 manifest 中历史声明的 hash 差异已经修复。
- 当前 `index.html` 实际外链为 **29 个 JavaScript、11 个 CSS，共 40 个本地资源**，全部存在。已搜索当前运行 JS/CSS/入口，未发现对本轮移走的 `public/`、`src/`、旧 review、连续性原型或 `optical-sequence.js` 的运行引用；仍加载的 `optical-sequence.css` 保留。
- 离线 HTML 为 **9,060,509 字节**，SHA-256 为 `608f7dbf358c1f03cda79cce461aa3f7c52a555ca1196263f0bb561c55144979`。29 个原脚本、11 个 CSS、入口 inline bootstrap 与源文件一致；**32 段 inline script**均可解析，额外脚本为数据适配器及 OrbitControls 的 readiness 回调。**15 份内嵌 JSON**与源文件逐字相同，没有外链 script/CSS。
- 数据为 **10 样本、47 特征**，x/y 长度、有限性、递减波数网格和全部特征窗口的实测最大值核对通过。纵轴保留无量纲 k。NASA 丙炔保留 8 K、非晶固体身份与全部 **20,158 个负 k 点**；未重新进行全部论文、JCAMP 或 XLSX 科学来源审查。
- package.json 没有 dependencies/devDependencies，serve/build/validate 指向真实脚本。服务器、打包器和校验器使用 Node 内置模块；不依赖 React/Vite、API key 或 npm install。浏览器 QA 的 Playwright 与 Chrome 是可选验证工具，README 已说明。本轮独立核对脚本只写项目外报告；没有运行会重写实现者记录的 `validate.mjs`。
- `.gitignore` 明确保留成品 `dist/FTIR课堂单文件版.html`。`.gitattributes` 对 `vendor/**`、`reference-data/source/**`、`reference-data/processed/**` 设置 `-text`，因此原始 JDX/TXT/JSON 不经过 Git 换行转换；PDF/XLSX/ZIP 已有 binary 规则。无需将整个科学来源目录强制关闭 diff 才能保留字节。其他文本文件的 LF 规范化是已明示行为；本地整理的 47 个保护 hash 不应泛化为未来 checkout 所有文档 hash 永久不变。
- README 四张图片存在；README、上传指南与当前验收文档的 **25 个本地链接**无断链。源码、成品和当前文本资料的常见凭证/私钥/API 占位扫描未命中；未输出敏感值。README 明确区分 NASA、指定 PNNL/NIST 数据及第三方库的条款，没有将整个项目或全部数据授予 MIT。
- GitHub 指南针对既有 `https://github.com/cloudchen1723-sys/ftir-interactive.git` 的 `main`，先 checkout/clone 现有仓库、保留 `.git` 和提交历史再更新；没有新 init、force push 或 unrelated histories 步骤。当前项目没有 `.git`；本轮审核没有执行 commit、push 或远端部署。远端 branch 状态沿用实现者核实记录，独立审核未重新访问远端。

## 独立浏览器复验

使用本地 **Chrome 155.0.8059.40 headless / Playwright**。隔离目录内只有上述一个 HTML，浏览器 context 设置 offline，视口 **1280×720**。独立 **28 项检查通过、0 页面或控制台异常**；浏览器只请求主 HTML 一次，没有旁文件或外部运行资源请求。

- 首页可见并进入课堂；直接定位末场，再以 Space 推进到稳定末停点。此过程没有重走整套课程。
- 末尾 CTA 具备按钮语义和焦点；**Enter 与 Space**均能打开实验室；**Escape**关闭并恢复 CTA 焦点。
- 实际 3D canvas 已创建，文字 fallback 隐藏；俯视控件状态正确。独立截图目检确认仪器和必要控件可见。
- 样品选择器有 10 项。独立取样为**乙腈、苯乙烯单体、丙炔**，分别检查全谱、第一处学习特征及局部放大。实际 canvas 蓝线逐点投影与本地原始 x/k 一致，最大误差为 **0 CSS px**；全谱显示 4000–400 cm⁻¹ 范围，三条记录在该范围分别绘制 **7,467 / 7,467 / 58,076 点**，对应第一特征放大为 **249 / 197 / 2,655 点**。
- 三条谱的 k 轴身份正确；第一特征标记来自实测窗口最大值。丙炔显示 8 K 非晶固体条件、原始负基线不代表物理负吸收的说明，纵轴下界低于显示区间最小 k。
- 720 高度下，丙炔面板为 `overflow-y:auto`，clientHeight **545**、scrollHeight **587**。负基线说明可以滚动到视口内，来源详情能通过 Enter 展开，实际“下一处特征”控件可滚动访问并聚焦。文字、全谱和控件不需要同时挤入一屏；没有把更高 README 截图当作 720 下全部内容同时可见的证明。

已目检独立首页、3D、乙腈放大与丙炔滚动画面。临时截图没有覆盖 README 四张成品图。

## 实现者证据与明确限制

已核对 [实现者浏览器结果](browser-results.json) 的 **219 项结果均 pass、0 errors、0 failed**，并阅读对应 [浏览器脚本](../../scripts/verify-browser.mjs) 与 [验收范围说明](README.md)。其证据包含源码 HTTP 1280×720 完整主线的 38 次 Space、1024×768 reduced-motion、隔离离线版、全部 10 样本及弹窗操作。上述 219 项是实现者结果，不计为独立复验。

独立源码 HTTP 首次访问被环境报 `net::ERR_NETWORK_ACCESS_DENIED`；按要求提交升级权限的重跑请求后，该请求被用户中止。因此 **源码 HTTP 与 1024×768 reduced-motion 未独立重跑**；首次空 checks 记录未作为通过证据。之后限定 `file://` 离线复验在正常权限下完成，最终项目外 browser-audit.json 记录的是已完成的 28 项。

没有新增全课程中间态视觉矩阵、真人投影/计时、手机矩阵、全部高级实验、全部 47 特征逐处浏览器检查、WebGL 禁用/故障矩阵或远端上传验证。数据历史 hash 差异与低聚物温度未知等限制仍按 [数据 README](../../reference-data/README.md) 保留。

**结论：PASS。** 最终整理和单文件离线交付在上述范围内通过独立审核；未提出生产修改要求。
