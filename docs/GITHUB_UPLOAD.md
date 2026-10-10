# 更新现有 GitHub 仓库

目标是现有仓库 [cloudchen1723-sys/ftir-interactive](https://github.com/cloudchen1723-sys/ftir-interactive)，已核实默认分支为 `main`。当前目录已准备好最终源码、README、功能截图、来源与许可说明和离线 HTML；本目录目前没有 `.git`。应更新既有仓库并保留提交历史，不在本目录新建不相关的仓库。

无需上传项目外的历史归档。整理过程没有执行 Git 初始化、commit、push 或创建远端。

> 2026-10-11 打包更新：当前清理后的项目新增 `film/`，包含最终六分钟双语 MP4、完整影片源码与原始音乐。视频通过 Git LFS 保存；根 `.gitattributes` 只对 `film/video/FTIR_final_bilingual.mp4` 使用 LFS，并为影片快照保留原始字节。已准备独立的既有仓库 checkout，把当前项目覆盖复制进去，同时保留 checkout 的 `.git` 和远端独有的 tracked 材料。保留的旧 `tests/`、`review/`、原型等属于兼容与历史材料，不是当前课堂运行入口，也不回填到本地清理后的项目。本轮复制不删除这些未知旧项；下文同步步骤以这一保留原则为准。此说明记录打包与上传准备，不代表已经 commit 或 push。

## 1. 本地检查

在项目根目录打开终端：

```sh
node scripts/package-single-html.mjs
node scripts/validate.mjs
```

用浏览器打开 `dist/FTIR课堂单文件版.html` 确认课堂与真实样品库。`.gitignore` 已明确允许提交这一离线 HTML；临时构建、浏览器配置、环境文件和依赖目录会被忽略。

## 2. 取得现有仓库的工作副本

如果已有该仓库的本地 checkout，可直接使用它，先确认 remote 和分支：

```sh
git remote -v
git status --short
git switch main
git pull --ff-only
```

若 checkout 有尚未提交的工作，先妥善保存并检查，避免覆盖。若没有本地 checkout，在工作区另外克隆一个目录：

```sh
git clone https://github.com/cloudchen1723-sys/ftir-interactive.git ftir-interactive-update
cd ftir-interactive-update
git switch main
```

上述命令从包含最终项目文件夹的工作区运行；`ftir-interactive-update` 是另一个工作副本，应保持它的 `.git` 完整。不要把最终项目复制进仓库的子目录，应把文件复制到仓库根目录。

## 3. 同步最终文件并核对清理范围

将本项目根目录的最终文件与子目录复制到该 checkout 的根目录，包括隐藏的 `.gitignore` / `.gitattributes`；**保留 checkout 自身的 `.git`**。不要使用覆盖整个目录或删除 `.git` 的镜像同步命令。

单纯复制不会自动移除远端旧版本的 tracked 文件。本轮只上传当前文件，并保留 checkout 中远端独有的旧测试、review、原型和其他未知资料；不额外执行清理或删除。当前入口仍是根 `index.html`，离线入口是 `dist/FTIR课堂单文件版.html`。本地清理范围见 [整理记录](verification/CLEANUP.md)，该清单不作为本轮删除远端历史文件的授权。

提交前需要已安装 Git LFS，并在 checkout 中执行 `git lfs install`。精确的 MP4 LFS 规则已随 `.gitattributes` 提供，不要把以后所有网页媒体都纳入 LFS。其他用户安装 Git LFS 后正常 clone；已有 checkout 若只有视频指针，执行 `git lfs pull`。视频双语字幕已烧录，视频目录不放同名 SRT。

在更新工作副本中运行：

```sh
node scripts/package-single-html.mjs
node scripts/validate.mjs
git status --short
git diff --stat
git diff
```

确认保留了原仓库中仍需要的未知资料，离线 HTML、截图和说明齐全，删除范围只包含已确认的历史项；再提交并推送：

```sh
git add .
git diff --cached --stat
git commit -m "Update FTIR classroom, reference library and offline package"
git push origin main
```

不使用 force push，不使用 `--allow-unrelated-histories`，不重写已有提交。若推送提示远端有新提交，先检查并整合后再正常推送。Git 可能要求配置实际的 `user.name` 和 `user.email`；登录按 GitHub 提示完成，不把访问令牌写入 URL、源码或 README。

推送后，检查 README 的四张截图和 `dist/FTIR课堂单文件版.html` 都已出现。GitHub 文件预览不会直接执行 HTML；读者应下载该文件后在浏览器打开。

## 可选网页展示

若现有仓库已经使用 GitHub Pages，先确认其当前发布方式是否仍依赖旧 Vite workflow；新项目由根 `index.html` 静态运行、`npm run build` 生成离线单文件，可按实际部署方式调整。Pages 不影响保留现有 Git 历史，本次未执行部署或新建自动部署 workflow。
