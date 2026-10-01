# 3D 前奏桥接复核

## 已完成

- `story.js` 在 step 2 挂载 `FTIRPresentationInstrumentBridge`；step 3/4 继续挂载现有 `FTIRPresentationOptics`。
- bridge 使用独立 `pib-model-layer` 与 `pib-optics-layer`，不复制现有 N3/N4 二维 SVG。
- 三维前奏包含完整仪器、约 7 秒 source → Michelson → sample → detector 预览、迈克尔逊区域聚焦、俯视，以及渐变交接到原有 N3 首帧。
- `instrument.js` 提供相机 pose 插值所需 API、持久热点白名单和标签/偏移 API；本地 Three r128、OrbitControls 与许可文件已固定在 `vendor/`。
- 入口诊断确认首页可见 `.home-ref01-cta` 能进入 story，且无 pageerror；此前测试入口误点隐藏的 `button[data-view=story]`，已改为可见 CTA。

## 检查结果

- `node --check presentation-instrument-bridge.js`：通过。
- `node --check story.js`：通过。
- `node --check tests/presentation-instrument-bridge.test.cjs`：通过。
- `node tests/continuity-prototype-model.test.cjs`：通过。
- `node tests/presentation-optics-model.test.cjs`：通过。
- 浏览器诊断截图：`review/presentation-bridge-diagnostic-home.png`、`review/presentation-bridge-diagnostic-story.png`。

## 未完成验证

完整 bridge Playwright 测试与 S0/focus/top/handoff 关键帧截图本回合按要求未再次运行；之前失败原因是测试点击隐藏导航按钮并在浏览器过程上超时，已修正测试入口。三维关键帧截图应在下一次浏览器验收中补齐。
