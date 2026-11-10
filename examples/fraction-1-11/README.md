# 范例说明

本目录是 SKILL.md 五步流程的完整一案（CASE.md），含出卷脚本 `build_worksheet.py`。

按发布边界，以下两件**不在公开仓库内**：

- `original-photo.jpg`——家长发来的孩子作答照片（未成年人素材，不公开）；
- `worksheet.pdf`——终版试卷成品。需要时运行 `build_worksheet.py` 自行生成：先把 Noto Sans SC 与 Noto Serif SC 字体放入同目录的 `fonts/` 子目录（脚本从自身目录找字体；注意可变字体须先实例化到常规字重，默认实例是 Thin）。
