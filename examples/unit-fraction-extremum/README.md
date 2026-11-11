# 范例说明

本目录是 SKILL.md 五步流程的第二案（CASE.md），含出卷脚本 `build_worksheet.mjs`（KaTeX 排版链）。

按发布边界，以下内容**不在公开仓库内**：

- 孩子作答的原始照片（未成年人素材，不公开）；
- `worksheet.pdf`——终版试卷成品。

需要自行生成试卷时：

1. 准备 KaTeX（一次下载，之后离线）：把 KaTeX 发行包放到本地任意位置，并把 `build_worksheet.mjs` 开头 import 的路径改到该位置的 `katex.min.js`；脚本生成的 HTML 还会按同一目录引用 `katex.min.css` 与 `fonts/`。
2. 运行 `node build_worksheet.mjs`，得到 `probe4.html`（图形由参数生成 SVG，答案由同一组参数算出）。
3. 用无头 Chromium 打印成 PDF：`chrome --headless --no-sandbox --print-to-pdf=worksheet.pdf --no-pdf-header-footer file://…/probe4.html`。
4. 用仓库根目录的 `scripts/check_pdf.py` 检查逐页充实度。
