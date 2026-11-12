# 案例说明：三处分数比较错题 · 把两条式子接成一条链

本目录是 `misconception-diagnosis` 的一次完整实跑（2026-11-12），完整分析、拆题、图谱、每题预测与 QA 见 `CASE.md`。

**证据边界**：三处红圈是家长标出的做错的地方；讲解后才出现的订正是提示后写的，不算独立首答，不进推理链、也不印进卷面。断在哪条边仍由卷面探针判定。

**版本提示**：本卷按 21:20 版 `SKILL.md` 出卷；上游 22:07 又更新（读/猜/记、孩子档案、每题预测、计分可选、`check_pdf.py` 删除、`paperkit` 默认不计分）。本卷已适配 `full: 100`、补了「每题工作与预测」表，充实度用同算法临时脚本量。同一张照片另有一份 22:07 版案例 `examples/fraction-compare-order/`，猜测方向不同，可对照。

按发布边界，以下**不进公开仓库**（仓库根 `.gitignore` 已排除整个 `/examples`）：

- `original-photo.jpg`：孩子作答照片；
- `worksheet.pdf` / `worksheet.html`：出卷产物；
- `render/`：逐页 QA 渲染图。

重跑：

```bash
node build_worksheet.mjs        # 需本地 KaTeX（~/workspace/tools/katex/，或 KATEX_DIR）与本机 Chromium
pdftoppm -r 100 -png worksheet.pdf render/final
```

`paperkit.mjs` 会在构建时把住总分、图谱覆盖、答案分区与页面溢出；本题总分 100（12/12/22/16/22/10/6），6 页（学生卷 4 + 家长页 2）。
