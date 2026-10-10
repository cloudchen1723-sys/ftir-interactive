# 最终目录整理记录

整理日期：2026-10-10。按用户授权，仅整理 `remix-ftir-interactive` 项目内的历史材料，不删除原始数据或历史实现。

## 外部归档

归档位置为工作区中的 `FTIR-archive/2026-10-10/project-cleanup/`，不属于待上传的项目目录。该目录保留 `manifest.json`，逐项记录原位置、归档位置、状态、文件数、字节数与 SHA-256；`pre-cleanup/` 保存被改写前的 README、package.json、.gitignore。

移出项目的 26 项包括：

- 旧入口与模板：`public/`、`src/`、`.aistudio/`、`.env.example`、`bun.lock`、`metadata.json`、`tsconfig.json`、`vite.config.ts`。
- 未被当前入口加载的原型：`continuity-prototype.html`、`continuity-prototype-model.js`、`continuity-prototype.js`、`continuity-prototype.css`、`optical-sequence.js`。当前仍加载的 `optical-sequence.css` 保留。
- 旧验收与输出：`.chrome-qa/`、`.edge-qa/`、`qa-screenshots/`、`output/`、`tmp/`、`review/`、`teaching/`、`VISUAL_REFACTOR_REPORT.md`、旧根目录 `FIVE_MINUTE_TEACHING_SCRIPT.md`。
- 历史脚本：`scripts/capture-all.js`、`scripts/phase15-qa.js`、`scripts/qa-runner.js`、`scripts/verify-v7.js`。

恢复时按 manifest 中 `archivePath` 移回 `originalPath`；先确认目标不存在，避免覆盖后续工作。原始目录结构在归档 `moved/` 下保留。

## 保留与补齐

根 `index.html` 及其全部本地 JS/CSS、`vendor/` 与已有许可、整个 `reference-data/`、当前单文件构建脚本、`AGENTS.md` 和 `DESIGN.md` 保留。源代码路径与教学逻辑没有重构；保护清单记录的所有参考数据文件在整理前后 SHA-256 相同。

最新五分钟讲稿、备课答疑和五分钟 PDF 复制到 `docs/teaching/`。补齐真实的无依赖 Node 服务器与校验脚本、Git 规则、中文 README、四张当前页面截图和上传指南；重新生成 `dist/FTIR课堂单文件版.html`。

本次未创建 Git commit、远端仓库或 push。既有历史审查报告已归档；本轮实现者检查不替代新的独立审查。
