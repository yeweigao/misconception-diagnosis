# 范例说明

一个已结案的案例（`CASE.md`），附出卷脚本 `build_worksheet.mjs`，可作 `scripts/paperkit.mjs` 长卷写法的调用示例（得分表、全卷连续题号、数轴与尺子）；卷子结构不作样板。

按发布边界，以下内容**不在公开仓库内**：

- `original-photo.jpg`——家长发来的孩子作答照片（未成年人素材，不公开）；
- `worksheet.html`、`worksheet.pdf`——出卷产物。

自行生成试卷：准备好 KaTeX（放在 `~/workspace/tools/katex/`，或用环境变量 `KATEX_DIR` 指向它），运行 `node build_worksheet.mjs`。构建会先过检：图谱落点、分值配平、答案分区、页面溢出，任何一项不过都会报错并说明原因。

读脚本的顺序：图谱（出卷目录）→ 参数（答案都从它们算出）→ 顺着卷面往下。
