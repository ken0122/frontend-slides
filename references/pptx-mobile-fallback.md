# PPTX Mobile Fallback

> 当用户要求「移动终端可查看的PPTX或PDF格式」时的标准操作流程。

## 核心原则

优先生成 PPTX：移动端 Office/WPS/Google Slides 支持稳定，分享和二次编辑成本低。PDF 只有在当前环境已具备可靠 HTML 渲染与转换能力时再生成，并且必须做视觉检查。

## 标准方案：python-pptx

```bash
python3 -m pip install python-pptx
```

然后编写生成脚本，关键参数：

```python
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from pptx.enum.text import PP_ALIGN
from pptx.enum.shapes import MSO_SHAPE

prs = Presentation()
prs.slide_width = Inches(13.333)   # 16:9 宽屏
prs.slide_height = Inches(7.5)
```

### 关键模式

1. **暗色背景**：`slide.background.fill.solid()` + 深色 RGB
2. **卡片组件**：`MSO_SHAPE.ROUNDED_RECTANGLE` + 半透明填充 + 细边框
3. **表格**：`shapes.add_table()` 用于对比数据
4. **数字徽章**：`MSO_SHAPE.OVAL` 用于编号圆圈
5. **阶段标签**：`MSO_SHAPE.ROUNDED_RECTANGLE` 小尺寸 + 彩色填充

### 注意事项

- PPTX 比 PDF 更好：WPS/Office/Google Slides 均可打开，移动端原生支持
- 文件大小通常 50-60KB（12页），轻量可发送

## 防重复规则

- 若用户同时要 HTML 和移动端格式 → 先生成 HTML，再用同一套内容生成 PPTX
- 不要在 PPTX 生成脚本中重复定义内容——要么从 HTML 提取，要么共用一套数据变量
- HTML 和 PPTX 内容必须一致，避免两个版本说法不同
