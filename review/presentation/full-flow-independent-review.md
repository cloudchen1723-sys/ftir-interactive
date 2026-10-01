# N1–N7 基础流程独立审查

日期：2026-10-01  
结论：**CHANGES REQUESTED**

本审查只读生产代码，实际在 `http://127.0.0.1:4173/` 的浏览器入口推进了 N1→N2→N3→N4→N5→N6→N7；没有修改生产 HTML/CSS/JS。服务器已由已有进程占用 4173 端口。由于上游要求停止挂起的截图任务，本回合没有完成独立截图落盘，也没有把 1024×768 与 1280×720 的视觉检查标为通过。

## 阻塞问题

### 科学/叙事阻塞：旧 9 Scene 映射把 N6/N7 错位并复制到末页

`story.js:92` 的 dispatch 是 `[... fourier, reference, meaning, meaning]`。因此：

- 逻辑上的 N5 使用 scene 06（`fourier()`），这是可由 N4 handoff 进入的正确内容；
- scene 07 标题仍是“Fourier Transform 得到的已经是吸收光谱吗？”，但实际调用 `reference()`，页面已经在做 Background/Sample 与 T/A；
- scene 08 和 scene 09 都调用 `meaning()`。浏览器实际显示 scene 08 “怎样只留下样品造成的变化？”却已经是最终吸光度/分子线索图，下一步又重复同一 `meaning()`；scene 09 的“回到开场”按钮仍停留在 scene 09。

这不是单纯标题债务：五分钟七节点的 N6 “背景 → 样品 → T/A”与 N7 “完整谱形及证据边界”没有一一对应，N7 无法闭环回到开场。`visit()` 把步数硬限制到 8（`story.js:103`），而 `advanceStory()` 在末页只会再次访问 8（`story.js:84`），所以末页出口按钮在浏览器中无效。

### 控制阻塞：N6 的吸光度切换会退回“加入样品”状态

在 scene 07 的“比较比值”状态，浏览器能看到 `0.189 ÷ 0.948 = T 0.200` 和“看吸光度”。点击“看吸光度”后，页面回到“加入样品”标签/单光束图，`ratioSwitch` 消失；没有进入 A 图或显示 `A = −log₁₀T`。这使 N6 的关键公式无法通过主线控制完成。代码表面上 `story.js:252` 绑定了 `s.abs`，但实际 UI 状态退回 `measureStage===1`，需修复并以浏览器回归确认。

### 控制阻塞：N3/N4 独立舞台没有 A/Auto 行为

`presentation-optics.js:31` 的键盘处理只实现 Space、ArrowLeft/Right、R，没有 A；进入 N3/N4 时 `story.js:39` 因 `n3` 直接返回。因此主线在 N3/N4 按 A 不会启动/暂停自动推进，而 N5/N6 的“自动播放”按钮属于另一套 `story.js` timer。设计契约要求同一暂停时间轴，需补齐或明确此舞台的 A/Auto 状态并测试暂停、恢复、后台切换。

## 已验证且可保留的部分

- `index.html:50-65` 的加载顺序先加载 `physics.js`、`story-model.js`、N3/Presentation model、GSAP/shared timeline，再加载 `presentation-pass1.js`、`presentation-optics.js`、`story.js`；N1/N2 进入 Pass1，N3/N4 进入 `FTIRPresentationOptics`。
- N4→N5 handoff 在 `story.js:56` 保存原始 `record`、`recordId`、`provenance`；浏览器 N5 显示“沿用 N4 的同一条记录 · 宽带 · SIM-007”。`currentRecord()`（`story.js:44`）优先使用 handoff record。直接从旧 scene 导航 N5 时仍会退回 `M.lines.slice(0,s.count)`，这条旁路应在映射修复时限制或显式建立记录。
- `story-model.js` 的三条线为 1000/1700/3000 cm⁻¹、权重 1/.6/.4；N4 模型的 component records 共享 `N=32768`、`h=0.00000625`，`physics.lineRecord()` 对分量按权重相加，交流信号 provenance 明确为“理想零相位 · 交流信号”。相关模型和浏览器测试通过。
- N4 的浏览器状态确实展示了交流信号/相对单位、+1700、+3000、INTERFEROGRAM、宽带记录以及 ZPD/centerburst；N4 最后 handoff 到 N5 成功。
- N5 的候选匹配/累积/排列结果来自完整记录的 `projection()`/`transform()`，没有发现预画峰替代；当前纵轴中文为“恢复单光束响应 / 相对谱密度”，但页面没有直接显示英文 “Single-beam Spectrum”。建议在映射修复时补充明确标签。
- N6 数值本身在“比较比值”状态正确：浏览器显示 0.189 ÷ 0.948 = T 0.200；`physics.ratio()` 使用相同网格并计算 `A=-log10(T)`，科学单元测试通过。A 切换 UI 仍阻塞，不能宣称课堂验收通过。
- N7 文案包含合成数据说明、多个特征和整体谱形边界，也明确一个峰不能唯一确定分子；科学措辞方向正确。

## 测试证据

通过：

- `node tests/presentation-flow.test.cjs`
- `node tests/presentation-optics.test.cjs`
- `node tests/presentation-interferogram-model.test.cjs`
- `node tests/presentation-optics-model.test.cjs`
- `node tests/physics.test.cjs`、`optics.test.cjs`、`n3.test.cjs` 及其余相关模型测试

失败/限制：

- 直接执行 `npm test` 不可用，因为项目没有 `package.json`。
- 全量逐文件执行中 `tests/home.test.cjs` 有一项既存失败：`首页使用同一合成记录的正反变换，不写入测量状态`，报 `TypeError: Cannot read properties of null`；这不是本次 N1–N7 主线发现，但交付状态不能写成全量测试通过。
- 现有 `review/presentation/full-flow/capture.cjs` 因截图任务被中止；本回合没有生成独立 `review/presentation/full-flow/independent/` 截图，因此 1280×720、1024×768 遮挡/溢出和 console 视觉验收均为未完成。

## 分级结论

- 科学阻塞：N6/N7 与旧 9 Scene 映射错位、scene 08/09 重复、N6 A 切换不可达；应在下一轮修复后重新走完整链路。
- 控制阻塞：末页“回到开场”无效；N3/N4 的 A/Auto 缺失；N6 内部切换需修复。
- 可延后视觉债务：N4 宽带阶段画面仍保留固定 `0 5 10` OPD tick（`presentation-optics.js:19`），而旁白标注 `−80…80 μm`；这会误导读图，优先级低于上述流程阻塞但不能作为最终视觉通过依据。标题仍显示 `3 / 09` 也暴露旧场景编号，但应随七节点映射一起重整。

在上述阻塞修复、端到端复验以及两种视口截图/console 检查完成前，不能判定 PASS。

## 复验（2026-10-01，后续实现）

本次复验只读检查了更新后的 `story.js` 与 `presentation-optics.js`，并运行了可在短时完成的模型/科学测试。上次报告中的五项主要实现阻塞已有以下变化：

- **N6/N7 映射重复：已修复。** dispatch 现在是 `fourier, reference, meaning, closure`（`story.js:93`）；scene 08 使用 meaning，scene 09 使用 closure，不再让 scene 08/09 都画同一张 meaning 图。
- **末页出口：已修复。** `closure()` 绑定 `returnOpening` 到 `restartIntro()`（`story.js:258-262`），且 step 8 的推进也调用 `restartIntro()`（`story.js:84`）。
- **N6 A 切换：实现上已修复。** N6 有四个稳定状态 Background/Sample/T/A（`story.js:248`），`measureStage===3` 使用 `s.r.a` 并显示 `T … → A …`（`story.js:250-253`）；旧的易失 `ratioSwitch` 已移除。
- **N3/N4 A/Auto：实现上已补齐。** `presentation-optics.js:28,32` 增加了内部自动 timer 与 A 切换；`stop()` 清理 timer，`visibilitychange` 暂停。
- **N4 宽带刻度：实现上已修复。** `renderN4()` 根据宽带状态显示 `−80 0 80`，离散状态显示 `−20 0 20`（`presentation-optics.js:22-23`）。

仍有两个低于上述科学计算、但会造成课堂操作误导的残留：

1. `sceneMeta[6]` 的标题仍是“Fourier Transform 得到的已经是吸收光谱吗？”（`story.js:21`），但 scene 07 实际已进入 Background/Sample/T/A；应改成“为什么需要背景测量？”或等价标题。
2. `nextNames[7]` 仍写“回到开场”（`story.js:24`），但 step 7 的 `advanceStory()` 会先进入 scene 09 closure；只有 scene 09 的按钮才真正回到开场。应改成“查看闭环/回顾整条链”，避免用户点击后发现没有回到开场。

因此本轮仍判定 **CHANGES REQUESTED**，理由是上述标题与 N7 入口标签属于控制/叙事契约残留；上次列出的五个实现阻塞均已从静态代码中消失。`node tests/presentation-interferogram-model.test.cjs`、`presentation-optics-model.test.cjs` 与 `physics.test.cjs` 通过。`tests/presentation-flow.test.cjs` 本轮浏览器进程在 30 秒内无输出，已停止等待，不能作为本轮端到端复验通过证据。

本轮未重复启动截图任务。1280×720 与 1024×768 的视口遮挡/溢出、实际 console 日志仍属于**非阻塞视觉债务/未验收**；目前代码静态检查未发现新的严重遮挡证据。

## 最终文案复核（2026-10-01）

两处残留已修正：

- `sceneMeta[6]` 已改为“为什么需要 Background / Sample？”（`story.js:21`），与实际 N6 背景、样品、T、A 四状态一致。
- `nextNames[7]` 已改为“完成闭环”（`story.js:24`）；step 8 才显示“回到开场”（`story.js:102`），与实际路由一致。

据此，先前五项实现阻塞及两处残留文案均已从静态代码中修复，最终结论更新为 **PASS（代码/模型层面）**。1280×720、1024×768 截图、遮挡/溢出和 console 仍未在本轮实际浏览器中复验，保留为非阻塞视觉债务；端到端浏览器测试此前因 30 秒无输出而停止，因此 PASS 不包含新的端到端视觉证明。
