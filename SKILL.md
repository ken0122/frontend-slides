---
name: frontend-slides
description: 创建、转换或美化浏览器原生HTML演示文稿；用于做PPT/生成PPT/HTML演示/演示文稿/胶片/幻灯片/解决方案汇报/售前或销售方案/客户提案/Pitch Deck/教学课件/会议演讲/内部汇报/PPT美化/PowerPoint或Keynote导出的PPTX转HTML/PPTM/POTX转网页PPT/移动端PPTX或PDF fallback。默认产物是零构建HTML slide deck，含100vh响应式页面、风格探索、键盘/滚轮/触控导航、进度条、可选浏览器内编辑和视口验证；用户明确只要原生PowerPoint/Keynote文件且不要HTML时不要使用。
---

# Frontend Slides

创建零依赖、动画丰富、可在浏览器中运行的 HTML 演示文稿。默认输出 HTML deck；只有用户明确要求“移动终端可查看的 PPTX/PDF”时才走 `references/pptx-mobile-fallback.md`。

`SKILL.md` 只保留路由、强制约束和执行门禁。视觉细节、售前模板、CSS 基础、PPT 提取、图片处理、验证和编辑按钮按需读取 reference，避免一次性加载全部材料。

## Load References On Demand

- 视觉方向、设计原则、趋势和感觉参考：`references/design-principles.md`
- 具体风格预设、色彩、CSS gotchas：`STYLE_PRESETS.md`
- 售前/解决方案默认大纲：`references/solution-sales-outline.md`
- HTML 骨架和运行时结构：`references/html-architecture.md`
- 强制视口基础 CSS：`references/viewport-and-base.css`
- 动画模式：`references/animation-patterns.md`
- PPT/PPTX 提取：`references/ppt-extraction.md` and `scripts/extract_pptx.py`
- 图片处理：`references/image-processing.md` and `scripts/process_image.py`
- 编辑按钮：`references/edit-button-implementation.md`
- 移动端 PPTX/PDF fallback：`references/pptx-mobile-fallback.md`
- 自动验证：`references/presentation-verification.md` and `scripts/verify_presentation.mjs`

## Execution Principles

- 先判断模式，再收集缺失信息；信息足够时直接执行。
- 最终产物保存到本地 HTML 文件，图片放相邻 `assets/` 或 `[name]-assets/`。
- 生成或修改 HTML 后运行 `node scripts/verify_presentation.mjs presentation.html`；失败则修复后重跑。
- 不默认发布到外部服务。
- 交付时说明绝对路径、页数、风格、图片/编辑能力、导航方式和验证结果。

## Mode Routing

### Mode A - New Deck

用户要从零做演示、PPT、胶片、课件、pitch deck、售前方案、客户提案、内部汇报或会议演讲。

Flow:

1. 收集目的、页数、内容成熟度、图片路径、是否需要浏览器内编辑。
2. 如果是售前/解决方案/投标/客户提案，读取 `references/solution-sales-outline.md`。
3. 如需风格选择，读取 `references/design-principles.md` 和 `STYLE_PRESETS.md`，生成 3 个风格预览或让用户直接选预设。
4. 生成 HTML deck，使用 `references/html-architecture.md` 和 `references/viewport-and-base.css`。
5. 运行验证并交付。

### Mode B - PPT/PPTX Conversion

用户提供 `.pptx`、`.pptm`、`.potx`、PowerPoint 文件或 Keynote 导出的 PPTX，并希望转换、美化或重建为网页演示。

Flow:

1. 运行：

```bash
python3 scripts/extract_pptx.py input.pptx --out output_dir --json-out output_dir/slides.json --pretty
```

2. 展示提取出的 slide 列表，请用户确认保留/删减/重排。
3. 读取 `references/ppt-extraction.md`、`references/html-architecture.md`、`references/viewport-and-base.css`。
4. 选择或应用风格，生成 HTML。保留文字、图片、顺序和演讲者备注意图。
5. 运行验证并交付。

### Mode C - Existing HTML Enhancement

用户提供已有 HTML 演示或 `presentation.html`，要求美化、修复手机溢出、增强导航、加编辑按钮或重设风格。

Flow:

1. 先读取现有 HTML，识别 slide 结构、导航、CSS、内容密度和资源路径。
2. 添加内容前检查当前页密度：文字最多 4-6 条要点或 2 段，图片最大 `min(50vh, 400px)`。
3. 若页已满，拆分成续页；不要让单页滚动。
4. 若要编辑能力，读取 `references/edit-button-implementation.md`。
5. 修改后运行验证并交付。

### Mobile PPTX/PDF Fallback

用户明确要求“移动终端可查看的 PPTX/PDF”“手机上直接打开”“微信里看”等时，读取 `references/pptx-mobile-fallback.md`。优先生成 PPTX；PDF 仅在当前环境具备可靠转换能力时生成。

### Do Not Use

不要用于以下任务：

- 用户明确只要原生 PowerPoint/Keynote 文件且不要 HTML。
- 只翻译、只总结、只读取 PPT 内容，不需要新演示。
- Word 文档、Excel、普通网站、dashboard、邮件、视频脚本、单独图片处理。

## Required Viewport Rules

所有 HTML 演示必须满足：

- 每张 `.slide` 恰好一个视口：`height: 100vh; height: 100dvh; overflow: hidden;`
- 绝不在单页内滚动；内容溢出时拆页、删减或缩短文案。
- 每页内容密度上限：
  - 标题页：1 标题 + 1 副标题 + 可选标签
  - 内容页：1 标题 + 4-6 条要点，或 1 标题 + 2 段文字
  - 功能网格：1 标题 + 最多 6 张卡片
  - 代码页：1 标题 + 8-10 行代码
  - 引用页：1 条引用，最多 3 行 + 署名
  - 图片页：1 标题 + 1 图片，图片最大 60vh
- 必须从 `references/viewport-and-base.css` 复制完整基础 CSS。
- 图片使用 `max-height: min(50vh, 400px)`；logo 使用 `max-height: min(30vh, 200px)`。
- 手机和短屏必须有显式 breakpoint：`max-width:768px`、`max-width:400px`、`max-height:600px`。
- viewport meta 包含 `maximum-scale=1.0,user-scalable=no`。

## Required HTML Runtime

每个 deck 必须包含：

- 语义化 slide：`<section class="slide">` + `.slide-content`
- 第一页初始 `class="slide visible"`
- `.reveal` 渐进式内容；默认可见，未激活页隐藏：`.slide:not(.visible) .reveal`
- `SlidePresentation` 或等价 JS runtime
- 键盘导航：方向键、空格、PageUp/PageDown
- 鼠标滚轮导航
- 触控或 pointer swipe
- 可见导航点，点击可跳转
- 进度条
- `IntersectionObserver` 更新 `.visible`
- `prefers-reduced-motion` fallback

常见空白页 bug：`.reveal { opacity: 0 }` 作为默认态，但第一页没有 `.visible` 或 observer 初始化失败。修复方式：第一页写 `class="slide visible"`；`.reveal` 默认可见；只对 `.slide:not(.visible) .reveal` 隐藏；用标准 `for` 循环 observe slides。

## Style Selection

如果用户没有指定风格：

- 解决方案/售前/投标：Swiss Modern、Electric Studio、Dark Botanical、Notebook Tabs。
- 科技/产品发布：Dark Botanical、Electric Studio。
- 教学/内部汇报：Notebook Tabs、Paper & Ink、Swiss Modern。
- 创意/营销：Creative Voltage、Neon Cyber、Split Pastel。

如需完整风格说明和趋势，读取 `references/design-principles.md`。如需具体 token、CSS 和 gotchas，读取 `STYLE_PRESETS.md`。CSS 负值陷阱：使用 `calc(-1 * clamp(...))`，不要写 `-clamp(...)`。

## Image Handling

若用户提供图片文件夹：

1. 列出图片文件。
2. 查看每张图，判断内容信号、形状、主色和可用性。
3. 提出含图片分配的大纲。
4. 处理图片时运行 `scripts/process_image.py`，不要覆盖原图。

示例：

```bash
python3 scripts/process_image.py resize input.png --out output-assets/input_resized.png --pretty
```

同一图片不要重复使用，logo 可在封面和结尾页各用一次。

## Delivery Gate

生成或修改 HTML 后必须运行：

```bash
node scripts/verify_presentation.mjs path/to/presentation.html
```

默认覆盖：

- `1920x1080`
- `1440x900`
- `375x667`
- `896x414`

验证内容包括首屏非空、每页无内部溢出、键盘/滚轮/导航点交互、`.reveal`、`.visible`、进度条、触控支持、`IntersectionObserver`、`prefers-reduced-motion` 和移动端 viewport lock。

交付说明包含：

- HTML 文件绝对路径
- 页数和风格
- 是否包含图片和浏览器内编辑
- 导航方式：方向键、空格、滚轮、触控、导航点
- 自定义入口：`:root` tokens、字体、`.reveal`
- 验证命令和结果；若 Playwright 不可用，明确验证缺口

## Eval Commands

维护 skill 时运行：

```bash
node scripts/eval_skill_recall.mjs --report-out eval/reports/recall-report.md
node scripts/eval_skill_load.mjs --report-out eval/reports/load-report.md
node scripts/eval_e2e.mjs --report-out eval/reports/e2e-report.md --json-out eval/reports/e2e-report.json
```
