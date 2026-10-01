# Presentation full-flow review

日期：2026-10-01

## 路由与节点

- N1–N2 继续使用已通过的 `presentation-pass1.js` / CSS。
- N3 保留 `presentation-optics.js` 的 Michelson、OPD、往返与单波数记录。
- N4 由同一舞台继续进入交流信号、多分量叠加、宽带、ZPD / centerburst；1000 / 1700 / 3000 cm⁻¹ 的权重为 1 / 0.6 / 0.4。
- N4 末态通过 `recordId`、原始 record 和 provenance 交给 N5；N5 使用完整 record 做 projection / transform，标识 Single-beam。
- N6 复用 `physics.js` 的独立 background / sample transform、同网格比值 T 与 A = −log10(T)。N7 复用 `meaning()` 回到特征区、整体谱形和结构线索边界。
- N6 现在有四个可停留状态：Background → Sample → T → A；step7 只显示一次 N7 meaning，step8 是闭环结束页，按钮会清理主线状态并真正回到 N1 初态。
- N3/N4 的 `A` 键启动或暂停同一个 `advance()` 自动状态机；离场与 Replay 清理计时器。N4 离散刻度为 −20 / 0 / 20 μm，宽带刻度为 −80 / 0 / 80 μm，返回 N3 时恢复 0 / 5 / 10。

## 控制与测试

已通过：

- `node --test tests/physics.test.cjs tests/optics.test.cjs tests/presentation-interferogram-model.test.cjs tests/presentation-optics-model.test.cjs`
- `node tests/presentation-optics.test.cjs`
- `node tests/presentation-flow.test.cjs`

端到端测试覆盖 N4 独立分量路径、N4→N5 record identity、N5→N6→N7 Space 单步推进；按钮路径也已在调试中走通。N4 的 Replay / Left、已有 N3 行为由 presentation-optics 测试覆盖。主页面 Auto 使用同一个 `advanceStory()` 状态推进；N3/N4 的 A 键使用同一个 `advance()` 状态推进。

## 科学检查

组件 record 共享 `n=32768`、`h=0.00000625` 的 OPD 网格；组件中心值分别为 1、0.6、0.4。N4 轴标注交流信号 / 相对单位，明确去掉恒定基线；宽带记录单独切换并只在最终停点标出 ZPD / centerburst。N5 不使用局部曲线或预画峰，N6 不对干涉图取比、不做独立归一化后取比。

## 截图与已知视觉债务

`capture.cjs` 已放在本目录，可在本地服务器 `127.0.0.1:4173` 可用时生成 1280×720 与 1024×768 的 N4/N5/N6/N7 截图。当前回合因服务进程与浏览器长任务限制未生成截图，故两种视口视觉验收仍标为未完成；最近一次扩展端到端流程测试超过 60 秒后被中止。视觉范围保持既有实现，未扩张设计；标题、图形和窄视口的细部仍需独立 reviewer 检查。
