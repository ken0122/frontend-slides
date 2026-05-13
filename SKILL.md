---
name: frontend-slides
description: 创建零依赖、动画丰富的HTML演示文稿，可从零开始或通过转换PPT/PPTX文件生成。用于解决方案汇报、售前/销售方案、客户提案、Pitch Deck、教学课件、会议演讲、内部汇报。特别适合销售和售前团队。帮助非设计师通过视觉探索（"所见即所选"）而非抽象选择来发现审美偏好。
trigger: 做PPT、生成PPT、生成演示文稿、生成胶片、创建幻灯片、HTML演示、汇报方案、解决方案PPT、pitch deck、方案汇报、PPT演示、胶片演示、演讲PPT、演讲稿、PPT转网页、pptx转html、PPT美化
methodology: 模式检测(A/B/C)→内容采集→风格探索(3预览)→生成演示→交付
quick_ref: |
  三大模式:
  - Mode A (新建): 内容采集→风格预览→生成
  - Mode B (PPT转换): 提取→确认→选风格→生成
  - Mode C (HTML增强): 读文件→保持视口→增强

  五大风格立场:
  - Trust & Professional: 金融/企业 (Swiss Modern, Paper & Ink)
  - Future & Depth: 科技/产品发布 (Dark Botanical, Electric Studio)
  - Efficiency & Speed: 数据仪表板 (Bento UI, Notebook Tabs)
  - Care & Resonance: 人文/品牌 (Pastel Geometry, Vintage Editorial)
  - Immersion & Expression: 创意/营销 (Neon Cyber, Creative Voltage)

  核心规则:
  - 每页=100vh,overflow:hidden,绝不滚动
  - 间距: 8/12/16/20/24/32/40 (8点网格)
  - 字体: clamp()响应式,最小12px,正文14-16px
  - 配色: 主色+互补色+类似色,无随机色

  关键文件:
  - references/html-architecture.md: HTML结构
  - references/viewport-and-base.css: 基础CSS
  - references/animation-patterns.md: 动画模式
  - references/ppt-extract.py: PPT提取
  - references/image-processing.py: 图片处理
  - references/pptx-mobile-fallback.md: 移动端PPTX生成
  - references/gov-company-intro-template.md: 政府汇报-公司介绍12页模板
  - STYLE_PRESETS.md: 12种预设风格
load_priority: L2
---

# Frontend Slides

创建零依赖、动画丰富的HTML演示文稿，完全在浏览器中运行。帮助非设计师通过视觉探索发现审美偏好，然后生成生产质量的幻灯片。

**参考文件:** 生成CSS、图片处理、PPT提取、HTML结构、编辑按钮或动画代码时，读取 `references/` 下对应文件（以及 STYLE_PRESETS.md 获取预设和CSS陷阱），确保输出正确完整。

---

## 执行原则

- **问答确认:** 一次性收集目的、页数、内容、图片、编辑需求；必要时逐步追问。
- **文件生成:** 将最终产物保存为本地 HTML 文件，并按需创建相邻资源目录。
- **PPT转换:** 使用 `references/ppt-extract.py` 的 `extract_pptx(user_pptx_path, output_dir)` 逻辑提取文字、图片和备注。
- **图片处理:** 使用 `references/image-processing.py` 的 Pillow helper 处理 logo、截图和大图，处理后另存新文件。
- **浏览器预览:** 如当前环境提供浏览器或本地预览能力，打开生成的 HTML 做视口和交互检查。
- **交付说明:** 回复中提供产物绝对路径、页数、风格、导航方式和可编辑方式；不要默认发布到外部服务。

---

## 🧠 核心设计哲学

### 1. 视觉风格 & 材质

**原则**: 形式服从功能。所有视觉决策（颜色、布局、材质）必须服务用户的心智模型和商业目标。

| 风格立场 | 适用场景 | 核心特征 |
|-----------|---------|---------|
| **Future & Depth** | 前沿探索、科技产品发布 | 毛玻璃+暗色模式，光晕和透明度分层 |
| **Efficiency & Speed** | 专业工具、数据仪表板 | 干净扁平+Bento UI，边界清晰，模块化 |
| **Trust & Professional** | 金融、正式汇报、企业方案 | 瑞士极简，大量留白，依赖排版和严格网格 |
| **Care & Resonance** | 人文、生活方式、品牌故事 | 低饱和自然色+极大圆角，超软散射阴影 |
| **Immersion & Expression** | 娱乐、叙事、创意展示 | 拟物材质+高对比度情感色彩，打破常规网格 |

**风格选择规则:**
- 解决方案/售前提案 → Trust & Professional (Swiss Modern) 或 Efficiency & Speed (Bento UI)
- 产品发布/科技展示 → Future & Depth (Dark Botanical / Electric Studio)
- 品牌故事/人文内容 → Care & Resonance (Pastel Geometry / Vintage Editorial)
- 创意提案/营销活动 → Immersion & Expression (Neon Cyber / Creative Voltage)

### 2. 空间 & 排版组织

- **密度层级**: 密度与重要性成反比。核心焦点区需要低密度/大边距。数据列表需要高密度/小边距。
- **排版系统**: 优先现代无衬线字体（Clash Display, Satoshi, DM Sans）。标题与正文之间建立显著的**字重**和**字号**对比。正文行高: `1.5` 或 `1.6`。
- **字号约束**: 最小可读: `12px`（仅注释）; 标准正文: `14px/16px`; 标题使用 `clamp()` 响应式缩放。

### 3. 可供性 & 韧性

处理多个同类组件（列表、导航、卡片组）时，**必须在同一容器内硬编码并渲染不同交互状态**，以穷尽展示组件的完整生命周期。

- **⚠️ 警告**: 不要仅依赖 Tailwind 的 `hover:` 伪类。必须直接改变特定项目的基础类，使状态在静态截图中**同时可见**！
- **示例**: 卡片组中，第一张默认状态，第二张用 `bg-white/10` 模拟悬停，第三张用 `border-cyan-400` 模拟选中。

### 4. 系统完整性约束

**所有设计决策必须映射到以下有限变量集（不允许奇数、小数或随机值）:**

| 系统 | 约束 |
|------|------|
| **色彩系统** | 主色定义品牌；**互补色**强引导；**类似色**软引导。无任意颜色 |
| **空间间距（8点网格）** | 间距和内边距限于: `8/12/16/20/24/32/40`（严格用于 gap 和 padding） |
| **圆角** | 基于风格选择，默认 `rounded-[12px]`。Care 风格可用 `rounded-[24px]` 或 `rounded-full` |
| **尺寸最小** | 最小点击区域 `44px`; 最小可读 `12px`; 标准正文 `14px/16px` |
| **阴影控制** | 必须用散射光如 `shadow-[0_10px_30px_rgba(0,0,0,0.08)]`，不用生硬阴影 |

### 5. 🌀 2026新兴设计趋势

选择1-2个主导趋势，根据内容主题有机整合：

#### 趋势一：幽灵代理 (Ghostly Agency)
**核心**: 代理式UX — 界面像半透明管家，在用户提问前准备好一切

| 设计策略 | 实现方式 | 适用场景 |
|---------|---------|---------|
| **预测性存在** | 渐进式内容揭示（`.reveal` 动画分阶段触发） | AI产品、自动化服务、智能助手 |
| **隐形管家** | 半透明元素+微妙浮动动画 | 后端系统、数据仪表板、设置界面 |
| **意图可视化** | 使用光晕/粒子暗示"思考中" | AI生成内容、智能推荐 |

```css
/* Ghostly Float */
@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-8px); } }
.ghostly-card { background: rgba(255,255,255,0.06); backdrop-filter: blur(12px); animation: float 4s ease-in-out infinite; }

/* Predictive Halo */
@keyframes pulse-glow { 0%, 100% { box-shadow: 0 0 20px rgba(0,212,255,0.3); } 50% { box-shadow: 0 0 40px rgba(0,212,255,0.6); } }
.agentic-hint { animation: pulse-glow 2s ease-in-out infinite; }
```

#### 趋势二：粗砺真实 (The Grain of Truth)
**核心**: 不完美&有机 — 反秩序审美，有瑕疵的真实感

| 设计策略 | 实现方式 | 适用场景 |
|---------|---------|---------|
| **数字褶皱** | SVG噪点纹理叠加（`<feTurbulence>`） | 创意品牌、独立工作室、手作品牌 |
| **有机排版** | 轻微旋转（`rotate(-1deg~2deg)`），非严格对齐 | 艺术展览、音乐活动、个人作品集 |
| **触觉质感** | 颗粒感背景+不规则边框 | 生活方式、食品、时尚 |

```css
/* Grain Texture Background */
.grain-overlay { background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' /%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.08'/%3E%3C/svg%3E"); }

/* Organic Shape */
.organic-shape { border-radius: 48% 52% 50% 50% / 50% 48% 52% 50%; transform: rotate(-1.5deg); }
```

#### 趋势三：阈限多模态 (Liminal Multimodality)
**核心**: 多模态无缝 — 体验在语音、手势、眼动追踪和触控之间流转

| 设计策略 | 实现方式 | 适用场景 |
|---------|---------|---------|
| **感官流** | 波形动画暗示语音交互 | 语音助手、播客、音频产品 |
| **空间暗示** | 3D透视+视差滚动 | AR/VR、空间计算、元宇宙 |
| **多模态图标** | 声波、手势轮廓、眼动路径的视觉元素 | 跨设备体验、无缝协作工具 |

#### 趋势四：情感主权 (Emotional Sovereignty)
**核心**: 超个性化伦理 — 为"共鸣"而非"留存"而设计

| 设计策略 | 实现方式 | 适用场景 |
|---------|---------|---------|
| **透明解释** | "为什么推荐"的工具提示 | 医疗、教育、金融、AI推荐 |
| **用户确认** | 清晰的"接受/拒绝"选项 | 隐私设置、数据收集、个性化选项 |
| **个性化视觉** | 基于内容主题的动态颜色调整 | 个人仪表板、学习平台、健康应用 |

### 趋势应用决策树

```
AI/自动化产品 → Ghostly Agency + Emotional Sovereignty
创意/艺术内容 → Grain of Truth + Immersion & Expression
科技/前沿发布 → Ghostly Agency + Liminal Multimodality
人文/生活方式 → Grain of Truth + Care & Resonance
企业/专业方案 → Emotional Sovereignty + Trust & Professional
```

**⚠️ 注意:** 每场演示最多应用 **2个趋势**，避免视觉混乱。趋势服务内容——永远不为趋势而用趋势。

---

## CRITICAL: 视口适配要求

**所有演示文稿的强制要求。** 每张幻灯片在任何屏幕尺寸下都必须在视口中完全可见，无需滚动。

### 黄金法则

- 每张幻灯片 = 恰好一个视口高度（`100vh` / `100dvh`）。
- 内容溢出？→ 拆分多页或减少内容。绝不在单页内滚动。

### 每页内容密度限制

| 幻灯片类型 | 最大内容量 |
|-----------|----------|
| 标题页 | 1标题 + 1副标题 + 可选标签 |
| 内容页 | 1标题 + 4–6条要点 OR 1标题 + 2段文字 |
| 功能网格 | 1标题 + 最多6张卡片（2×3 或 3×2） |
| 代码页 | 1标题 + 8–10行代码 |
| 引用页 | 1引用（最多3行）+ 署名 |
| 图片页 | 1标题 + 1图片（最大60vh高度） |

**必需基础CSS:** 每个演示文稿都必须包含完整的基础样式。**从 [references/viewport-and-base.css](references/viewport-and-base.css) 复制。**

### 溢出预防清单

生成前检查: (1) 每个 `.slide` 有 `height: 100vh; height: 100dvh; overflow: hidden;` (2) 所有字号和间距用 `clamp()` 或视口单位 (3) 内容容器有 `max-height` (4) 图片 `max-height: min(50vh, 400px)` (5) 网格用 `auto-fit` + `minmax()` (6) 高度断点 700/600/500 (7) 不用固定像素高度 (8) 每页内容在密度限制内。

### 内容溢出时

**做:** 拆分多页；减少要点（最多5–6条）；缩短文字；更小的代码片段；"续"页。**不做:** 缩小字体到不可读；移除内边距；允许滚动；强行塞满。

---

## Phase 0: 模式检测

- **Mode A — 新建演示:** 用户要从零做 → Phase 1（内容采集）
- **Mode B — PPT转换:** 用户有 .ppt/.pptx → Phase 4（PPT提取）
- **Mode C — HTML增强:** 读取现有文件，增强；**始终保持视口适配**

### Mode C: 修改规则

添加内容前：检查当前页是否符合密度限制。**图片:** 最大 `min(50vh, 400px)`；若页已满 → 拆分为两页。**文字:** 每页最多4–6条要点或2段文字；若超 → 拆分或续页。任何修改后：验证 `.slide` 有 `overflow: hidden`，新元素用 `clamp()`，新图片有视口max-height，密度合规。若修改导致溢出 → **自动拆分**并告知用户。

---

## 解决方案 PPT — 售前/销售专用

当目的是 **解决方案汇报/售前方案/投标演示**，使用此默认大纲（10–20页）：(1) 封面 (2) 议程 (3) 背景与目标 (4) 痛点与挑战 (5) 解决方案概述 (6–8) 能力/产品价值 (9) 案例 (10) 实施/路线图 (11) 下一步及联系方式。根据实际调整；尊重内容密度。**风格:** 优先选择 **Swiss Modern**、**Electric Studio**、**Dark Botanical**、**Notebook Tabs**。除非明确要求，避免过于花哨的风格。

---

## Phase 1: 内容采集（新建演示）

一次性收集信息。若需逐步询问，按顺序进行并在进入 Phase 2 前记录所有答案。

### Step 1.1: 上下文 + 图片

一次性询问：

1. **目的:** 这个演示做什么用？— 解决方案PPT | Pitch Deck | 教学课件 | 会议演讲 | 内部汇报
2. **长度:** 大约多少页？— 短（5–10） | 中（10–20） | 长（20+）
3. **内容:** 内容准备好了吗？— 全部准备好了 | 有粗略笔记 | 只有主题
4. **图片:** 无图片 | 有图片文件夹（告知路径） | 其他
5. **编辑:** 生成后需要浏览器内编辑文字吗？— 需要 | 不需要

记住编辑选择——它控制 Phase 3 是否包含编辑按钮（见 [references/edit-button-implementation.md](references/edit-button-implementation.md)）。

**获取内容:** 若用户"全部准备好了" → 请他们分享（粘贴文字、要点或文件路径）。若"有粗略笔记"或"只有主题" → 帮助构建大纲，然后索要或起草逐页内容。进入 Phase 2 前必须有具体的标题和正文内容。

### Step 1.2: 图片评估（若用户提供了图片）

若无图片 → 跳过图片管线；使用文字+CSS视觉。若有文件夹: (1) 列出图片文件 (2) 读取/查看每张 (3) 标记可用/不可用及原因；记录内容信号、形状、主色 (4) 提出含图片分配的幻灯片大纲 (5) 请用户确认大纲："看起来不错" | "调整图片" | "调整大纲"。协同设计：可用图片从一开始就塑造大纲。Logo在预览中：若存在可用logo，在3个风格预览中嵌入（base64），让用户在每种风格中看到自己的品牌。

---

## Phase 2: 风格探索

**选项A — 引导式:** 询问情绪（印象深刻/自信 | 兴奋/充满活力 | 冷静/专注 | 灵感/感动；最多2个）。生成 **3个风格预览** 保存到临时预览目录（style-a.html, style-b.html, style-c.html）：单一标题页，自包含，~50–100行。按情绪选3个预设。**绝不使用:** 白色上的紫色渐变、Inter/Roboto、标准蓝色、可预测的英雄式设计。**使用:** 独特字体（Clash Display, Satoshi, Cormorant Garamond, DM Sans）、协调的颜色、有氛围的背景、标志性动画。展示预览；用户选 Style A/B/C 或"混合元素"。

**选项B — 直接:** 询问"选哪个预设？"并展示预设列表（从 STYLE_PRESETS.md）。用户按名称选 → 跳到 Phase 3。

**情绪→预设映射:**
- 印象深刻/自信 → Bold Signal, Electric Studio, Dark Botanical
- 兴奋/充满活力 → Creative Voltage, Neon Cyber, Split Pastel
- 冷静/专注 → Notebook Tabs, Paper & Ink, Swiss Modern
- 灵感/感动 → Dark Botanical, Vintage Editorial, Pastel Geometry

**预设完整列表（详见 STYLE_PRESETS.md）:** Bold Signal | Electric Studio | Creative Voltage | Dark Botanical | Notebook Tabs | Pastel Geometry | Split Pastel | Vintage Editorial | Neon Cyber | Terminal Green | Swiss Modern | Paper & Ink

---

## Phase 3: 生成演示文稿

使用 Phase 1 内容和 Phase 2 风格。若没有图片，生成纯文字+CSS视觉。若有图片：**图片管线** — 生成前处理。

**图片处理:** 详见 [references/image-processing.py](references/image-processing.py)，包含 `crop_circle`, `resize_max`, `add_padding`。依赖: `pip install Pillow`。同一图片不可重复使用（logo除外：标题页+结尾页可各放一次）；当图片与风格冲突时添加CSS边框/发光。处理后图片另存为新文件名（如 `logo_round.png`, `screenshot_processed.png`）；绝不覆盖原文件。HTML中用相对路径引用（如 `assets/logo_round.png`）。

**图片CSS:** `.slide-image` max-height min(50vh, 400px); `.screenshot` border+shadow; `.logo` max-height min(30vh, 200px)。边框/阴影根据风格主色调调整。位置：标题页=logo居中；功能页=截图在侧，文字在另一侧；满版或内联根据需要。

**HTML架构:** 遵循 [references/html-architecture.md](references/html-architecture.md)。包含必需视口基础CSS、主题变量（所有排版/间距用clamp()）、`.slide` + `.slide-content`、响应式断点、`.reveal` + `.visible` 动画。

**必需JS:** 实现 SlidePresentation: 键盘（方向键、空格）、触控/滑动、鼠标滚轮；进度条和导航点（点击跳转）；Intersection Observer 在幻灯片进入视口时添加 `.visible` 触发 `.reveal` 动画。可选：光标拖尾、粒子、视差、倾斜、内联编辑。

**编辑按钮（仅用户选择"需要"时）:** 见 [references/edit-button-implementation.md](references/edit-button-implementation.md)。使用JS hover延迟（非CSS ~ sibling）；热区+E键+点击切换。

**文件结构:** 单个: `presentation.html` + `assets/`。多个: `[name].html` + `[name]-assets/`。

**代码质量:** 清晰的区块注释；语义化HTML；键盘导航；必要时ARIA；减少动效选项。**CSS陷阱:** 使用 `calc(-1 * clamp(...))`，绝不用 `-clamp()`。见 STYLE_PRESETS.md "CSS Gotchas"。视口：始终遵守密度和溢出规则。

---

## Phase 4: PPT转换

1. **提取:** 运行 [references/ppt-extract.py](references/ppt-extract.py) 的逻辑: `extract_pptx(user_pptx_path, output_dir)`。依赖: `pip install python-pptx`。使用 output_dir 使图片保存到 `output_dir/assets/`。返回 slides_data（每页: title, content[], images[], notes）。
2. **确认:** 展示提取的幻灯片列表；请用户确认后进入风格选择。
3. **选风格:** Phase 2（风格探索），结合提取的内容。
4. **生成:** 在步骤1的同一 output_dir 中构建HTML演示文稿。转换为所选风格；保留文字、图片（从assets/引用）、幻灯片顺序、演讲者备注（作为HTML注释或单独文件）。

---

## Phase 5: 交付

1. 清理临时预览目录（如存在）。
2. 将 HTML 保存到本地路径；若包含图片或资源，使用相邻 `assets/` 或 `[name]-assets/` 目录。
3. 如当前环境支持浏览器预览，打开生成的 HTML，检查首屏非空、导航可用、视口无滚动、移动端断点可用。
4. 在回复正文中写入:
   - 文件本地绝对路径
   - 风格、页数、是否包含图片/编辑能力
   - 导航方式（方向键、空格、滚轮、导航点）
   - 自定义方式（`:root`、字体、`.reveal`）
   - 如有内联编辑：悬停左上角或按E编辑；Ctrl+S保存
5. **移动端格式**: 当用户要求「移动终端可查看的PPTX/PDF」时，优先使用 `python-pptx` 生成 PPTX 文件；PDF 仅在当前环境具备可靠渲染/转换能力时再生成。见 [references/pptx-mobile-fallback.md](references/pptx-mobile-fallback.md)。

---

## 风格效果 → 感觉参考

- **戏剧/电影感:** 慢渐隐、缩放过渡、暗色+聚光、视差、满版。
- **科技/未来感:** 霓虹发光、粒子、网格、等宽字体点缀、青色/洋红调色。
- **俏皮/友好:** 弹跳缓动、大圆角、粉彩/明亮、浮动动画。
- **专业/企业:** 微妙快速动画（200–300ms）、干净无衬线、海军蓝/石板色、最少装饰。
- **平静/极简:** 缓慢微妙运动、大量留白、柔和调色、衬线字体、内容聚焦。
- **编辑风格:** 强排版层级、引用块、图文交织、衬线标题+无衬线正文。

**动画模式（入场、背景、交互）:** 见 [references/animation-patterns.md](references/animation-patterns.md)。

---

## 故障排除

- **字体不加载:** 检查 Fontshare/Google URL；CSS中字体名称。
- **动画不触发:** Intersection Observer；.visible 类。
- **🔴 页面空白（只有背景无内容）:** 这是最常见的 bug。根因：`.reveal{opacity:0}` 是默认态，但第一张 slide 没加 `class="visible"`，或者 IntersectionObserver 初始化失败（如 `S.forEach(s=>s)` 返回 `undefined` 导致 `.observe(undefined)`）。**标准修复**：① 第一页 HTML 写 `class="slide visible"`；② CSS 反转逻辑：`.reveal{opacity:1}` 默认可见，`.slide:not(.visible) .reveal{opacity:0}` 仅对未激活页隐藏；③ JS 用标准 `for` 循环逐个 `observe()`，不用链式写法。
- **滚轮吸附:** html上 scroll-snap-type；每个 .slide 上 scroll-snap-align。
- **移动端:** 仅靠 `clamp()` 不够——必须加显式 breakpoint。三档策略：
  - `@media(max-width:768px)`: 字号用固定 rem（`--ts:1.55rem; --bs:0.85rem`），grid 强制 `1fr`，layout 改为 `flex-direction:column`
  - `@media(max-width:400px)`: 小屏再缩小一档，logo 网格从 4 列降为 3 列
  - `@media(max-height:600px)`: 短屏环境隐藏导航点、进一步缩字号
  - viewport meta 必须含 `maximum-scale=1.0,user-scalable=no`
- **性能:** 少用 will-change；优先 transform/opacity；节流 scroll/mousemove。

---

## 示例流程

**新建演示:** 用户想要pitch/解决方案 → 询问目的、长度、内容、图片、编辑 → (如有图片) 评估、大纲、确认 → 询问情绪 → 3个预览 → 用户选风格 → (如有图片) 运行Pillow操作 → 生成HTML → 交付文件。

**PPT转换:** 用户有.pptx → 运行ppt-extract.py提取 → 展示提取列表确认 → Phase 2选风格 → 生成HTML → 交付。
