# FTIR 六分钟教学影片

[播放或下载双语影片](video/FTIR_final_bilingual.mp4)：360 秒，1920×1080，30 fps，H.264 视频与 AAC 双声道音乐。中英字幕已烧录；没有合成语音旁白。视频目录只放 MP4，避免播放器自动加载同名外部字幕。可编辑字幕保留在 [source/docs/full-preview-bilingual.srt](source/docs/full-preview-bilingual.srt)。

影片媒体于 2026-10-03 完成因果衔接修订，2026-10-07 整理到独立交付目录。本次在 2026-10-11 复制交付文件和当前源码快照，没有重渲染、重压缩或改写科学模型。MP4 为 120,308,318 bytes，SHA-256：`CE9926DAEC055EFFA6B18C3F8EF13737A4BFA33A006FA77214E3E21FA9FAF1DA`。所有打包文件的大小、哈希与原始文件修改时间见 [manifest.json](manifest.json)。

[源码及重现说明](source/README.md) 包含完整 `src/`、锁定依赖、原始协作规则与忽略规则、时间轴、字幕和制作记录。原始音乐的三个文件保留在 [source/music/](source/music/)，连续音乐工作资产为 `source/public/audio/music/ftir-preview-continuous.m4a`；[音乐方向](source/MUSIC_DIRECTION.md) 与 [连续混音审计](source/docs/full-preview-continuous-music-audit.json) 说明来源顺序、交叉淡化和客观检查。Part 3 虽以 `.mp3` 命名，实际是包含 AAC 音频与 H.264 视频的容器，按原文件保留。原始音乐与工作资产的再分发许可尚未在现有材料中明确，本包不新增许可声明。

原制作自审报告见 [因果衔接交付](source/docs/causal-continuity-full-delivery.md)、[播放审计](source/review/style-upgrade/causal-continuity-v2-playback-audit.json) 与 [字幕交付修正](source/docs/subtitle-delivery-fix.md)。原制作已完成数学、类型/构建、完整媒体解码检查；人工播放抽查覆盖 261.5 秒和 47 个解码画面，并非全六分钟逐秒人工审阅。自审不能代替首次观众理解验证，当前影片没有独立质量门槛 PASS；较早预览的独立视觉评分 8.88 FAIL 是历史结果。02:51 切回样品 A 的衔接仍较直接，片尾制作说明尚待精简。音乐审计为解码/电平检查，不代表人工听评或最终母带认证。

本次仅做归档打包和源码可用性检查，没有重复影片人工播放或重建网页。影片与课堂网页是两个独立入口；网页的生产 HTML、CSS、JavaScript 未因本包而修改。本包拟随既有 `cloudchen1723-sys/ftir-interactive` 仓库的 `main` 分支交付，尚未提交或推送。MP4 超过普通 Git 单文件限制，应由仓库交付步骤配置 Git LFS；本目录没有自行配置 Git。
