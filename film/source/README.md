# FTIR 影片源码快照

2026-10-11 从现有影片项目复制。`src/`、配置、`package.json`、`package-lock.json`、`.gitignore`、`AGENTS.md`、制作文档、原始音乐和所需连续音乐资产保留原字节；本 README 是打包时新增的操作说明。`manifest.json` 位于上层目录，记录各文件 SHA-256、大小及原始修改时间。

最终六分钟组合注册名是 **`FTIRFullPreview`**，入口 `src/remotion/index.ts` → `Root.tsx` → `FTIRFullPreview.tsx`，使用 `fullPreviewTimeline.ts`：10,800 帧、30 fps、1920×1080、360 秒。原 `npm run render` 仍指向较短的 `FTIRFilm`；`FTIRFilmOriginal` 是历史版本。复现六分钟影片须使用下方明确的组合名称。包中的源码及数学没有重新设计。

在本目录使用兼容锁定依赖的 Node.js/npm；本次检查使用 Node.js 24.19.0 及原项目已安装依赖。首次安装：

```sh
npm ci
npm run lint
```

`npm run lint` 实际执行 `tsc --noEmit`。启动网页预览可执行 `npm run dev`；Remotion Studio 可执行 `npm run studio` 并选择 `FTIRFullPreview`。渲染入口不调用生成式 API，**不需要 Gemini/OpenAI API key**，也不需要创建 `.env`。原依赖表仍含历史 AI Studio 模板依赖，未为打包而删改。

使用本机已安装的 Chrome/Chromium，在下面命令中替换浏览器可执行文件路径；PowerShell 与多数 shell 都可使用这条命令：

```sh
npx remotion render src/remotion/index.ts FTIRFullPreview out/FTIR_final_bilingual.mp4 --browser-executable="C:/Program Files/Google/Chrome/Application/chrome.exe" --config=review/absorption-render.config.ts --concurrency=1 --codec=h264 --crf=18 --pixel-format=yuv420p
```

低内存配置保留原来的 FFmpeg CPU 线程限制。`out/` 会由渲染产生；渲染的成片具有相同源码内容和时间轴，但浏览器、字体、依赖与编码环境可能影响像素及文件哈希，不保证与交付 MP4 二进制一致。验证已交付 MP4 应使用上层 manifest 的哈希。

原 `.gitignore` 按原字节保留：忽略 `node_modules/`、`build/`、`dist/`、覆盖率、日志和 `.env*`（模板例外），**没有忽略 `out/` 或 `review/`**。本包未包含任何环境文件、安装目录、浏览器缓存、WAV、历史预览、其他混音或构建输出。生成的新渲染/检查输出请留在本地，不要随源码上传。

数学验证：

```sh
npx tsx scripts/validate-fourier-teaching.ts
npx tsx scripts/validate-michelson-teaching.ts
npx tsx scripts/validate-narrative-teaching.ts
npx tsx scripts/validate-opening-reconstruction.ts
```

它们检查全记录有符号投影、镜位移/OPD/相位、非负探测功率、样品衰减和 A/B 顺序扫描的教学约束；不能用数值测试证明观众理解或动态版式。

完整时间轴已经保存在源码中，无需先运行生成脚本。`node scripts/build-full-preview.mjs` 会从 `docs/narration_draft.srt` 与 `docs/narration_en.json` 重写 `fullPreviewTimeline.ts` 和 `docs/full-preview-bilingual.srt`，保留当前记录段的观察停留锚点。旁白原稿使用暂定后半段时长；生成器将前 171 秒保留、后半段压入剩余 189 秒。只有有意编辑字幕或重建时间轴时才运行，并审查生成 diff；本次未运行该写入脚本。

内容交接：约 02:22–02:42 比较开场样品 A/B 的相同固定总响应与不同扫描记录；**02:51 明确返回样品 A**。之后 1750 cm⁻¹ 衰减、完整记录与 Fourier 输入使用 `NARRATIVE_SAMPLE_RECORD`，恢复权重为 0.55 / 0.55 / 0.35（1000 / 1750 / 3000 cm⁻¹）。约 04:56 切换到连续谱示意，背景/样品分别恢复后取比，随后将同一示意透过率转成 `A = −log₁₀(T)`。这些是理想化合成教学模型，不是仪器实测或物质鉴定证据。

当前最终交付事实以 `docs/causal-continuity-full-delivery.md` 和 `docs/subtitle-delivery-fix.md` 为准。其余 review/contract/quality-gate 文档保留制作历史，包含旧入口和旧预览路径；这些路径中的媒体和缓存未打包，旧结果不能证明当前最终版通过全部人工验收。原始 `AGENTS.md` 的协作原则也保留在本目录。
