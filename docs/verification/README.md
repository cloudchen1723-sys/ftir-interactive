# 最终整理与打包验收

本轮检查围绕目录整理、GitHub 文件准备及重新打包；教学逻辑、根入口加载的 JS/CSS 与全部参考数据内容保持原样。独立审核结论为 **PASS**，具体范围与限制见 [独立审核报告](INDEPENDENT_REVIEW.md)。下述 219 项浏览器检查是实现者记录；独立审核另完成了 28 项隔离离线检查，不将两者混计。

## 数值与打包

`node scripts/package-single-html.mjs` 和 `node scripts/validate.mjs` 通过。静态结果见 [static-results.json](static-results.json)：

- 10 个样本、47 个读谱特征；x 严格递减、x/y 点数相同、数值有限、y 明确为无量纲 k。
- 47 项特征最大值来自各自原始窗口，窄带符合相邻采样点的局部极大；读取顺序与特征 id 一致。
- 丙炔为 8 K 非晶固体，74670 点，20158 个负 k 采样值原样存在；苯乙烯单体为独立液体记录。
- 40 个入口 JS/CSS 文件存在并被完整打包；单文件 32 段内联脚本均可解析，15 个内嵌 JSON 文本与源文件逐字一致。
- 最新离线文件为 **9,060,509 字节（约 8.64 MiB）**，SHA-256：`608f7dbf358c1f03cda79cce461aa3f7c52a555ca1196263f0bb561c55144979`。

本脚本不重新运行生产转换器，不改写源数组。源 JCAMP/XLSX 的独立解码属于此前数据审查；其完整历史材料已归档，当前数据目录继续保留转换脚本与各验证报告。

## 浏览器与截图

使用现有本地 Chrome / Playwright，三个入口共 **219 项检查通过，0 页面/控制台异常**，结果见 [browser-results.json](browser-results.json)：

| 入口 | 实际检查 |
| --- | --- |
| 源码 HTTP，1280×720 | 首页进入后用 38 次 Space 正常推进完整主线至 09/b2；键盘进入实验室；全部 10 样本与弹窗操作 |
| 源码 HTTP，1024×768，reduced-motion | 直接定位末场再正常推进到末停点；键盘入口、全部 10 样本与弹窗操作 |
| 孤立 `file://`，1280×720，浏览器 offline | 临时目录只复制最新一个 HTML；末场入口、全部 10 样本与弹窗操作；只请求主 HTML 一次，无旁文件或外部运行资源请求 |

三个入口均核对全部样本的完整原始曲线与首个特征放大曲线：canvas 实际蓝线每一点与原始 x/k 的坐标投影误差低于 `1e-8` CSS 像素。核对 k 坐标、来源 URL、特征数量、真实区间最大值、下一处读谱顺序、丙炔相态温度与负基线。还检查 3D/俯视、CTA Enter、实验室 Space 隔离、Tab 焦点范围、Escape 焦点恢复、重复进入、Left 回退和 R 重播当前场景。

README 中四张图均由本轮实际当前页面生成并目检：首页、三维仪器、乙腈特征放大、丙炔全谱。首页与丙炔最终图使用 1280×900，仪器与乙腈使用 1280×720。丙炔条件说明较长，720 高视口的面板内容可能需要内部滚动；README 采用更高视口展示，未据此声称小窗口全部说明同时可见。最终截图的对象位置见 [screenshot-layout.json](screenshot-layout.json)。

可复现浏览器脚本（不属于课堂运行依赖）：

```powershell
$env:FTIR_PLAYWRIGHT_MODULE = '你的已有 Playwright 模块绝对路径/index.mjs'
$env:FTIR_CHROME_EXECUTABLE = '你的 Chrome 或 Chromium 可执行文件绝对路径'
node scripts/verify-browser.mjs
```

## 整理与未验证事项

归档 26 项、1080 个文件、101,525,770 字节。47 个参考数据文件的整理前后 SHA-256 全部相同，见 [cleanup-results.json](cleanup-results.json) 和 [整理范围](CLEANUP.md)。完整恢复 manifest、旧文件哈希及最终文件清单存放在项目外归档，不随课堂运行。

本轮没有重新做全部主线中间态的视觉矩阵、真实课堂投影/真人计时、所有手机尺寸、全部高级实验、WebGL 禁用或数据读取故障矩阵；没有测试远端 Git push 或 GitHub Pages 部署。npm 不在当前验收环境的 PATH 中，因此实际执行的是上述等价 Node 命令；package.json 的 npm 命令直接调用这些脚本。

已知源数据限制（旧两条 ASCII 的历史 hash 差异、液态苯乙烯低聚物温度未确认等）见 [数据 README](../../reference-data/README.md)，没有在整理中修饰或覆盖。
