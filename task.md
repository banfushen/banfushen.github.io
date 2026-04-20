# task.md

## Current tasks

### 1. 保留现有入口结构
- [x] 保留 blog 入口
- [x] 保留 simplefolio 入口
- [x] 保留 game 入口
- [x] 顶部菜单中三个入口都已可访问

### 2. 已完成的基础打通工作
- [x] `/simplefolio/` 路径已打通
- [x] `/game/` 路径已打通
- [x] `/game/` 已有占位页
- [x] blog / simplefolio / game 三个页面都可访问
- [x] 已整理 simplefolio 所需内容素材

### 3. 切换 `/simplefolio/` 实现路线
- [x] 明确 `/simplefolio/` 当前不再走“普通 NexT page 手工复刻”路线
- [x] 获取官方 simplefolio 仓库
- [x] 跑通官方 simplefolio 本地环境
- [x] 确认官方 simplefolio 的构建产物与输出方式

### 4. 评估 simplefolio 与当前仓库的集成方式
- [x] 判断官方 simplefolio 最适合如何接入当前 Hexo 仓库
- [x] 确定 `/simplefolio/` 最终是独立构建产物接入，还是以其他形式集成
- [x] 确认集成后不会影响 blog / game

### 5. 用官方 simplefolio 替换当前手工版 `/simplefolio/`
- [x] 停止把当前手工 landing page 作为最终版本
- [x] 用官方 simplefolio 底座替换 `/simplefolio/` 的页面实现
- [x] 确保 `/simplefolio/` 页面更接近官方 demo 的结构和节奏

### 6. 内容映射到官方 simplefolio
- [x] 把 `resume_simplefolio.md` 内容映射到官方 simplefolio 页面结构中
- [x] 替换 Hero 文案
- [x] 替换 About 内容
- [x] 替换 Projects 内容
- [x] 替换 Contact / CTA 内容
- [x] 保留 Blog / Game / GitHub / Contact 入口

### 7. Simplefolio 内容补全
- [x] 新增 Skills 区块
- [x] 新增 Career Snapshot 区块
- [x] 补充“服务器迁移”项目
- [x] 补充“数据库迁移”项目
- [x] 新增 Highlights / Achievements 区块
- [x] 强化“负责人 / 主导者”表达
- [x] 已决定不添加 Education 区块
- [x] 已增强 Contact 区块，仅保留 Email 联系；Blog / Game / GitHub 继续放在 footer 次级入口

### 8. Game 保持入口并明确改造方向
- [x] `/game/` 当前继续保留入口
- [x] 已决定 `game` 不再长期只做占位页
- [x] 已确定以 `brunosimon/folio-2019` 作为 `/game/` 的改造底座

### 9. `folio-2019` 基础准备
- [x] 已将 `brunosimon/folio-2019` 放入本地仓库
- [x] 已确认该项目是独立 Vite + Three.js 项目
- [x] 已确认其 license 为 MIT，可修改使用
- [x] 已初步确认该项目适合作为 `/game/` 的互动底座

### 10. `/game/` 改造方向确认
- [x] 已确认不建议把 `folio-2019` 原样直接上线
- [x] 已确认第一轮工作应优先做“去 Bruno 化”
- [x] 跑通 `folio-2019` 本地开发环境
- [x] 替换标题、meta、文案、跳转链接
- [x] 移除或替换 Bruno 相关品牌信息与外部推广内容
- [x] 移除或替换原项目中的分析脚本 / 埋点
- [x] 盘点需要保留、替换或删除的图片 / 音频 / 字体等资源
- [x] 已确认当前运行时核心资源主要集中在 `assets/`、`draco/`、`models/`、`sounds/`、`media/`
- [x] 已确认 `media/` 下项目图已替成你的内容素材
- [x] 已完成一轮 Bruno 原项目遗留资源清理，移除了未启用的旧项目地板纹理、distinction / trophy 相关模型、彩蛋资源、未使用分享图和部分冗余音频
- [x] 已移除 `EasterEggs` 等当前不需要的 Bruno 风格彩蛋接线
- [x] `/game/` 构建产物体积已从约 `27.66 MB` 降到约 `16.58 MB`
- [ ] 继续推进更深一层的“内容级去 Bruno 化”，包括场景内容、模型表达、交互主题和玩法语义的进一步替换
- [x] 已将入口引导层从 `threejs-journey` 语义切换为更贴近当前站点定位的 `interactive guide`
- [ ] Intro / Crossroads 的自有内容标识仍需重新设计，上一版大号场景标牌已回滚
- [x] 已移除原始 intro 字母与 `creative / dev` 相关资源接线和旧引导插画资源
- [x] 已完成一轮轻量内容替换，更新了 Intro 地面指引文案、桌面端操作提示和项目板副标题

### 11. `/game/` 集成到当前站点
- [x] 确定 `folio-2019` 构建产物接入 `/game/` 的目录方案
- [x] 让构建后的静态文件稳定服务于 `/game/`
- [x] 替换当前 `source/game/index.md` 占位页
- [x] 确认 `/`、`/simplefolio/`、`/game/` 三个入口互不影响

### 12. 验证
- [x] 确认 `/simplefolio/` 已基于官方 simplefolio 底座运行
- [x] 确认 `/simplefolio/` 的体验已接近官方 demo
- [x] 确认 blog / game 不受影响
- [x] 确认顶部菜单与入口跳转正常
- [x] 确认改造后的 `/game/` 可本地访问
- [x] 确认改造后的 `/game/` 路径资源加载正常
- [x] 已确认代码层存在 `viewport`、`resize`、`touch` 控制逻辑
- [x] 已确认 Bruno 遗留资源清理后 `http://127.0.0.1:4000/game/` 仍可正常访问
- [ ] 确认移动端和桌面端都可正常打开
- [ ] 仍待在真实浏览器中手动确认桌面端 / 移动端的交互体验与性能表现

## Existing reusable assets

- [x] `resume_summary.md`
- [x] `resume_simplefolio.md`
- [x] `simplefolio_homepage_outline.md`
- [x] `entry_and_path_decision.md`
- [x] `plan.md`

## Deprecated as final target

下面这些内容继续保留，但不再视为 `/simplefolio/` 的最终实现：

- [x] 当前手工版 `source/simplefolio/index.md`
- [x] 基于普通 NexT page 的 simplefolio landing page 尝试

这些现在只算过渡版本 / 探索版本。
