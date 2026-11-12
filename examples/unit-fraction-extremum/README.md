# 范例说明

一个已结案的案例（`CASE.md`），附出卷脚本 `build_worksheet.mjs`，可作 `scripts/paperkit.mjs` 的调用示例；卷子结构不作样板。

按发布边界，以下内容**不在公开仓库内**：

- 孩子作答的原始照片（未成年人素材，不公开）；
- `worksheet.html`、`worksheet.pdf`——出卷产物。

自行生成试卷：

1. 准备 KaTeX（一次下载，之后离线）：把发行包（`katex.min.js`、`katex.min.css`、`fonts/`）放到 `~/workspace/tools/katex/`，或用环境变量 `KATEX_DIR` 指向它。
2. 运行 `node build_worksheet.mjs`。构建先过几道检查（图谱落点、分值配平、答案分区），任何一道不过都会报错并指出是哪一题、哪个节点；通过后写出 `worksheet.html`，并用本机 Chromium 打印 `worksheet.pdf`（找不到浏览器时，用环境变量 `CHROME` 指定其路径）。
3. 逐页看渲染图。

读脚本的顺序：图谱（出卷目录）→ 参数（答案都从它们算出）→ 顺着卷面往下。
