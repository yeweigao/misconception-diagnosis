# 范例说明

本目录是 SKILL.md 五步流程的第二案（`CASE.md`），含出卷脚本 `build_worksheet.mjs`——`scripts/paperkit.mjs` 的标准写法，新案例照它写。

按发布边界，以下内容**不在公开仓库内**：

- 孩子作答的原始照片（未成年人素材，不公开）；
- `worksheet.html`、`worksheet.pdf`——出卷产物。

自行生成试卷：

1. 准备 KaTeX（一次下载，之后离线）：把发行包（`katex.min.js`、`katex.min.css`、`fonts/`）放到 `~/workspace/tools/katex/`，或用环境变量 `KATEX_DIR` 指向它。
2. 运行 `node build_worksheet.mjs`。构建先过三道检查（图谱覆盖、分值配平、答案分区），任何一道不过都会报错并指出是哪一题、哪个节点；通过后写出 `worksheet.html`，并用本机 Chromium 打印 `worksheet.pdf`（找不到浏览器时，用环境变量 `CHROME` 指定其路径）。
3. 用仓库根目录的 `scripts/check_pdf.py worksheet.pdf` 检查逐页充实度，再逐页看渲染图。

读脚本的顺序：图谱（出卷目录）→ 参数（答案都从它们算出）→ 顺着卷面往下。
